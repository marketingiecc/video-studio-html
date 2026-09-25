const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { generateCompleteHtmlComposition } = require('../public/js/composition-generator');

const root = path.join(__dirname, '..');
const fixturePath = 'C:\\Users\\lexua\\Downloads\\MathCA_Lop3_5PhepTinhNangCao.json';
const fixture = JSON.parse(fs.readFileSync(fixturePath, 'utf8'));
const runtime = JSON.parse(fs.readFileSync(path.join(root, '.mathca-runtime.json'), 'utf8'));
const artifactsDir = path.join(__dirname, 'artifacts');
fs.mkdirSync(artifactsDir, { recursive: true });

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function jsonFetch(url, options) {
  const response = await fetch(url, options);
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.error || `HTTP ${response.status}`);
  return payload;
}

(async () => {
  const baseUrl = 'http://localhost:3300';
  const project = structuredClone(fixture);
  project.audio = {
    bgm: {
      enabled: true,
      src: 'assets/audio-library/bgm/happy-math.wav',
      assetId: 'bgm-happy-math-01',
      name: 'Happy Math',
      volume: 0.3,
      startTime: 0,
      endTime: 29.5,
      loop: true,
      fadeIn: 0.8,
      fadeOut: 1.2,
      ducking: {
        enabled: true,
        underVoiceDb: -12,
        attack: 0.12,
        release: 0.35,
      },
    },
    sfxMasterVolume: 0.5,
    sfx: [
      {
        id: 'sfx-pop-e2e',
        src: 'preset:pop',
        assetId: 'preset-pop',
        name: 'Pop',
        startTime: 6.1,
        duration: 0.35,
        volume: 0.42,
        pan: -0.08,
      },
    ],
  };

  const audio = await jsonFetch(`${baseUrl}/api/generate-audio`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ projectData: project }),
  });
  assert(audio.voiceFile && audio.masterFile, 'Audio API did not return separate voice/master files.');
  assert(audio.voiceFile !== audio.masterFile, 'Voice and master audio files must be distinct.');
  assert(audio.sampleRate === 48000 && audio.channels === 2, 'Audio master is not stereo 48 kHz.');
  assert(audio.bgmIncluded === true && audio.sfxCount === 1, 'BGM/SFX were not included in the master mix.');

  const htmlContent = generateCompleteHtmlComposition(project, { audioFile: audio.masterFile });
  const start = await jsonFetch(`${baseUrl}/api/render`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      projectData: project,
      htmlContent,
      fps: 25,
      quality: 'draft',
      resolution: 'square',
      includeAudio: true,
      fitMode: 'contain',
    }),
  });

  const deadline = Date.now() + 12 * 60 * 1000;
  let status;
  while (Date.now() < deadline) {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    status = await jsonFetch(`${baseUrl}/api/render-status`);
    process.stdout.write(`\r${String(status.progress || 0).padStart(3)}% ${status.stage || ''}`);
    if (!status.active) break;
  }
  process.stdout.write('\n');

  assert(status && !status.active, 'Audio render did not finish before timeout.');
  assert(!status.error, `Audio render failed: ${status.error}`);
  assert(status.progress === 100 && status.outputFile, 'Audio render did not produce an output file.');

  const outputPath = path.join(root, 'rendered_output', status.outputFile);
  assert(fs.existsSync(outputPath), 'Rendered MP4 is missing.');
  const sizeBytes = fs.statSync(outputPath).size;
  assert(sizeBytes > 100000, `Rendered MP4 is unexpectedly small: ${sizeBytes} bytes.`);

  const probe = spawnSync(runtime.ffprobePath, [
    '-v', 'error',
    '-show_entries', 'format=duration:stream=index,codec_type,width,height,r_frame_rate,sample_rate,channels',
    '-of', 'json',
    outputPath,
  ], { encoding: 'utf8' });
  assert(probe.status === 0, `FFprobe failed: ${probe.stderr}`);
  const media = JSON.parse(probe.stdout);
  const video = media.streams.find((stream) => stream.codec_type === 'video');
  const renderedAudio = media.streams.find((stream) => stream.codec_type === 'audio');
  const duration = Number(media.format.duration);
  assert(video?.width === 1080 && video?.height === 1080, `Unexpected output size: ${video?.width}x${video?.height}`);
  assert(video?.r_frame_rate === '25/1', `Unexpected frame rate: ${video?.r_frame_rate}`);
  assert(renderedAudio?.sample_rate === '48000' && renderedAudio?.channels === 2, 'Rendered MP4 audio is not stereo 48 kHz.');
  assert(Number.isFinite(duration) && Math.abs(duration - project.metadata.duration) < 1, `Unexpected duration: ${duration}`);

  const workspacePath = path.join(root, 'render_workspace', start.jobId);
  assert(fs.existsSync(path.join(workspacePath, 'index.html')), 'Render workspace composition is missing.');

  const report = {
    passed: true,
    checkedAt: new Date().toISOString(),
    fixturePath,
    audio: {
      voiceFile: audio.voiceFile,
      masterFile: audio.masterFile,
      sampleRate: audio.sampleRate,
      channels: audio.channels,
      bgmIncluded: audio.bgmIncluded,
      sfxCount: audio.sfxCount,
    },
    render: {
      jobId: start.jobId,
      outputFile: status.outputFile,
      outputPath,
      workspacePath,
      sizeBytes,
      duration,
      width: video.width,
      height: video.height,
      frameRate: video.r_frame_rate,
      sampleRate: renderedAudio.sample_rate,
      channels: renderedAudio.channels,
      options: status.options,
      logTail: Array.isArray(status.log) ? status.log.slice(-12) : [],
    },
  };
  fs.writeFileSync(path.join(artifactsDir, 'e2e-audio-render-report.json'), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
})().catch(async (error) => {
  console.error(error.stack || error.message);
  try {
    const status = await fetch('http://localhost:3300/api/render-status').then((response) => response.json());
    if (status?.active && status.id) {
      await fetch(`http://localhost:3300/api/render/${encodeURIComponent(status.id)}/cancel`, { method: 'POST' });
    }
  } catch {}
  process.exitCode = 1;
});
