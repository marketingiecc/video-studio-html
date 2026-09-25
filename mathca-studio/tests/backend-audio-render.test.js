const assert = require('node:assert/strict');
const { EventEmitter } = require('node:events');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { PassThrough } = require('node:stream');
const { spawnSync } = require('node:child_process');
const test = require('node:test');
const bundledFfmpegPath = require('ffmpeg-static');
const bundledFfprobePath = require('ffprobe-static').path;
const { AudioAssetStore, contentHash } = require('../audio-assets');
const { MediaAssetStore } = require('../media-assets');
const {
  SAMPLE_RATE,
  buildAudioMixArgs,
  equalPowerPan,
  mixProjectAudio,
  normalizeAudioPlan,
} = require('../audio-mixer');
const {
  buildHyperframesInvocation,
  buildPostProcessInvocation,
  createApp,
  normalizeRenderOptions,
} = require('../server');

const root = path.join(__dirname, '..');

async function withServer(app, run) {
  const server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  const address = server.address();
  try {
    await run(`http://127.0.0.1:${address.port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

function createTemporaryMediaStore() {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'mathca-media-test-'));
  const publicDir = path.join(tempDir, 'public');
  fs.mkdirSync(publicDir, { recursive: true });
  return { tempDir, store: new MediaAssetStore({ publicDir }) };
}

function createTemporaryAssetStore() {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'mathca-assets-test-'));
  const publicDir = path.join(tempDir, 'public');
  fs.mkdirSync(publicDir, { recursive: true });
  return {
    tempDir,
    store: new AudioAssetStore({ publicDir }),
  };
}

test('audio asset store deduplicates uploads by SHA-256 and persists relative paths', () => {
  const { tempDir, store } = createTemporaryAssetStore();
  try {
    const buffer = Buffer.from('RIFF-test-audio-payload');
    const first = store.saveUpload({
      buffer,
      filename: 'effect.wav',
      mimeType: 'audio/wav',
      kind: 'sfx',
      name: 'Effect',
    });
    const second = store.saveUpload({
      buffer,
      filename: 'duplicate.wav',
      mimeType: 'audio/wav',
      kind: 'sfx',
    });

    assert.equal(first.created, true);
    assert.equal(second.created, false);
    assert.equal(first.asset.assetId, `sha256-${contentHash(buffer)}`);
    assert.equal(first.asset.src.startsWith('assets/audio-library/user/'), true);
    assert.equal(path.isAbsolute(first.asset.src), false);
    assert.equal(store.list('sfx').length, 1);
    assert.equal(fs.existsSync(store.resolve(first.asset.assetId).absolutePath), true);
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});

test('audio asset API lists, uploads and resolves without multipart dependencies', async () => {
  const { tempDir, store } = createTemporaryAssetStore();
  const app = createApp({ audioAssetStore: store });
  try {
    await withServer(app, async (baseUrl) => {
      const buffer = Buffer.from('RIFF-api-test-payload');
      const uploadResponse = await fetch(`${baseUrl}/api/audio-assets`, {
        method: 'POST',
        headers: {
          'content-type': 'audio/wav',
          'x-file-name': 'api%20effect.wav',
          'x-audio-kind': 'sfx',
        },
        body: buffer,
      });
      const uploaded = await uploadResponse.json();
      assert.equal(uploadResponse.status, 201);
      assert.equal(uploaded.success, true);
      assert.equal(uploaded.asset.filename, 'api effect.wav');
      assert.equal(uploaded.asset.name, 'api effect');

      const list = await fetch(`${baseUrl}/api/audio-assets?kind=sfx`).then((response) => response.json());
      assert.equal(list.assets.length, 1);
      assert.equal(list.assets[0].assetId, uploaded.asset.assetId);

      const resolved = await fetch(
        `${baseUrl}/api/audio-assets/${encodeURIComponent(uploaded.asset.assetId)}`,
      ).then((response) => response.json());
      assert.equal(resolved.success, true);
      assert.equal(resolved.asset.src, uploaded.asset.src);
    });
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});

test('media asset API persists image/video library uploads', async () => {
  const { tempDir, store } = createTemporaryMediaStore();
  const app = createApp({ mediaAssetStore: store });
  try {
    await withServer(app, async (baseUrl) => {
      const uploadResponse = await fetch(`${baseUrl}/api/media-assets`, {
        method: 'POST',
        headers: {
          'content-type': 'image/png',
          'x-file-name': 'mathca%20card.png',
          'x-media-kind': 'image',
        },
        body: Buffer.from('png-test-payload'),
      });
      const uploaded = await uploadResponse.json();
      assert.equal(uploadResponse.status, 201);
      assert.equal(uploaded.asset.kind, 'image');
      assert.equal(uploaded.asset.filename, 'mathca card.png');
      assert.equal(uploaded.asset.src.startsWith('assets/media-library/user/'), true);

      const listed = await fetch(`${baseUrl}/api/media-assets?kind=image`).then((response) => response.json());
      assert.equal(listed.assets.length, 1);
      assert.equal(listed.assets[0].assetId, uploaded.asset.assetId);
    });
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});

test('audio plan defaults legacy projects without mutating scene schema', () => {
  const project = {
    metadata: { duration: 8 },
    scenes: [{ startTime: 0, endTime: 8, voiceText: 'Xin chào.' }],
  };
  const snapshot = structuredClone(project);
  const plan = normalizeAudioPlan(project);

  assert.deepEqual(project, snapshot);
  assert.equal(plan.duration, 8);
  assert.equal(plan.bgm.enabled, false);
  assert.equal(plan.bgm.volume, 0.3);
  assert.equal(plan.sfxMasterVolume, 0.5);
  assert.deepEqual(plan.sfx, []);
});

test('mixer graph uses stereo 48 kHz, explicit gain/fades/ducking/pan and normalize=0', () => {
  const plan = {
    duration: 5,
    bgm: {
      enabled: true,
      filePath: 'bgm.wav',
      volume: 0.3,
      startTime: 0,
      endTime: 5,
      loop: true,
      fadeIn: 0.8,
      fadeOut: 1.2,
      ducking: { enabled: true, underVoiceDb: -12, attack: 0.12, release: 0.35 },
    },
    sfxMasterVolume: 0.5,
    sfx: [{ filePath: 'pop.wav', startTime: 1, duration: 0.5, volume: 0.42, pan: -0.25 }],
  };
  const args = buildAudioMixArgs({ voiceFile: 'voice.mp3', plan, outputFile: 'master.mp3' });
  const graph = args[args.indexOf('-filter_complex') + 1];

  assert.match(graph, /sample_rates=48000:channel_layouts=stereo/);
  assert.match(graph, /sidechaincompress=/);
  assert.match(graph, /afade=t=in/);
  assert.match(graph, /afade=t=out/);
  assert.match(graph, /pan=stereo/);
  assert.match(graph, /amix=inputs=3:duration=longest:normalize=0/);
  assert.match(graph, /alimiter=limit=0\.891251/);
  assert.equal(args[args.indexOf('-ar') + 1], String(SAMPLE_RATE));
  assert.equal(args[args.indexOf('-ac') + 1], '2');

  const centered = equalPowerPan(0);
  assert.ok(Math.abs(centered.left - centered.right) < 0.000001);
});

test('real FFmpeg mix produces 48 kHz stereo master from bundled assets', async () => {
  const outputDir = fs.mkdtempSync(path.join(os.tmpdir(), 'mathca-mix-test-'));
  const outputFile = path.join(outputDir, 'master.mp3');
  const store = new AudioAssetStore({ publicDir: path.join(root, 'public') });
  const project = {
    metadata: { duration: 2 },
    scenes: [],
    audio: {
      bgm: {
        enabled: true,
        assetId: 'bgm-happy-math-01',
        volume: 0.2,
        startTime: 0,
        endTime: 2,
        loop: true,
        fadeIn: 0.1,
        fadeOut: 0.2,
        ducking: { enabled: false },
      },
      sfxMasterVolume: 0.5,
      sfx: [
        {
          id: 'click-test',
          src: 'preset:click',
          startTime: 0.6,
          duration: 0.18,
          volume: 0.42,
          pan: 0.4,
        },
      ],
    },
  };

  try {
    const result = await mixProjectAudio({
      voiceFile: null,
      projectData: project,
      outputFile,
      resolveAsset: (reference) => store.resolve(reference),
      ffmpegPath: bundledFfmpegPath,
    });
    assert.equal(result.sampleRate, 48000);
    assert.equal(result.channels, 2);
    assert.ok(fs.statSync(outputFile).size > 1000);

    const probe = spawnSync(
      bundledFfprobePath,
      [
        '-v',
        'error',
        '-select_streams',
        'a:0',
        '-show_entries',
        'stream=sample_rate,channels',
        '-of',
        'json',
        outputFile,
      ],
      { encoding: 'utf8' },
    );
    assert.equal(probe.status, 0, probe.stderr);
    const stream = JSON.parse(probe.stdout).streams[0];
    assert.equal(stream.sample_rate, '48000');
    assert.equal(stream.channels, 2);
  } finally {
    fs.rmSync(outputDir, { recursive: true, force: true });
  }
});

test('render options map UI presets to portable HyperFrames and FFmpeg invocations', () => {
  const options = normalizeRenderOptions({
    fps: 25,
    quality: 'delivery',
    resolution: '16:9',
    includeAudio: false,
  });
  assert.equal(options.fps, 25);
  assert.equal(options.captureFps, 30);
  assert.equal(options.quality, 'high');
  assert.equal(options.resolution.width, 1920);
  assert.equal(options.needsPostProcess, true);

  const hyperframes = buildHyperframesInvocation('job', 'portrait.mp4', options);
  assert.equal(hyperframes.command, process.execPath);
  assert.deepEqual(hyperframes.args.slice(-4), ['--fps', '30', '--quality', 'high']);

  const post = buildPostProcessInvocation('portrait.mp4', 'landscape.mp4', options);
  assert.equal(post.command, bundledFfmpegPath);
  assert.ok(post.args.includes('scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2:color=0x081d1b,fps=25'));
  assert.ok(post.args.includes('-an'));

  const backdrop = buildPostProcessInvocation(
    'portrait.mp4',
    'square.mp4',
    normalizeRenderOptions({ resolution: '1:1', fitMode: 'backdrop' }),
  );
  const backdropFilter = backdrop.args[backdrop.args.indexOf('-vf') + 1];
  assert.match(backdropFilter, /split=2\[bgsrc\]\[fgsrc\]/);
  assert.match(backdropFilter, /gblur=sigma=28/);
  assert.match(backdropFilter, /overlay=\(W-w\)\/2:\(H-h\)\/2/);
});

test('render cancel endpoint terminates the owned child and cleans job state', async () => {
  let child;
  let terminationCalls = 0;
  const spawnProcess = () => {
    child = new EventEmitter();
    child.stdout = new PassThrough();
    child.stderr = new PassThrough();
    child.exitCode = null;
    child.killed = false;
    return child;
  };
  const terminateProcess = async (target) => {
    terminationCalls += 1;
    assert.equal(target, child);
    target.exitCode = 1;
    target.killed = true;
    target.emit('close', 1);
  };
  const app = createApp({
    spawnProcess,
    terminateProcess,
    getSystemCheck: () => ({ ready: true, checks: {} }),
  });

  await withServer(app, async (baseUrl) => {
    const startResponse = await fetch(`${baseUrl}/api/render`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ htmlContent: '<!doctype html><html><body></body></html>' }),
    });
    const started = await startResponse.json();
    assert.equal(started.success, true);

    const cancelResponse = await fetch(`${baseUrl}/api/render/${started.jobId}/cancel`, {
      method: 'POST',
    });
    assert.equal(cancelResponse.status, 202);
    assert.equal(terminationCalls, 1);

    const status = await fetch(`${baseUrl}/api/render-status`).then((response) => response.json());
    assert.equal(status.active, false);
    assert.equal(status.cancelRequested, true);
    assert.equal(status.stage, 'Đã hủy render.');
    assert.equal(status.error, null);
  });
});


