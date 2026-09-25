const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const bundledFfmpegPath = require('ffmpeg-static');

const SAMPLE_RATE = 48000;

function clamp(value, minimum, maximum, fallback) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return fallback;
  return Math.min(maximum, Math.max(minimum, numeric));
}

function getProjectDuration(projectData) {
  const metadataDuration = Number(projectData?.metadata?.duration) || 0;
  const lastSceneEnd = Math.max(
    0,
    ...(Array.isArray(projectData?.scenes) ? projectData.scenes : []).map(
      (scene) => Number(scene.endTime) || 0,
    ),
  );
  return Math.max(0.5, metadataDuration, lastSceneEnd);
}

function normalizeAudioPlan(projectData) {
  const duration = getProjectDuration(projectData);
  const source = projectData?.audio && typeof projectData.audio === 'object' ? projectData.audio : {};
  const bgmSource = source.bgm && typeof source.bgm === 'object' ? source.bgm : {};
  const bgmStart = clamp(bgmSource.startTime, 0, duration, 0);
  const bgmEnd = clamp(bgmSource.endTime, bgmStart, duration, duration);

  const bgm = {
    enabled: Boolean(bgmSource.enabled && (bgmSource.assetId || bgmSource.src)),
    assetId: bgmSource.assetId ? String(bgmSource.assetId) : null,
    src: bgmSource.src ? String(bgmSource.src) : null,
    name: String(bgmSource.name || 'BGM'),
    volume: clamp(bgmSource.volume, 0, 2, 0.3),
    startTime: bgmStart,
    endTime: bgmEnd,
    loop: bgmSource.loop !== false,
    fadeIn: clamp(bgmSource.fadeIn, 0, Math.max(0, bgmEnd - bgmStart), 0),
    fadeOut: clamp(bgmSource.fadeOut, 0, Math.max(0, bgmEnd - bgmStart), 0),
    ducking: {
      enabled: bgmSource.ducking?.enabled !== false,
      underVoiceDb: clamp(bgmSource.ducking?.underVoiceDb, -30, 0, -12),
      attack: clamp(bgmSource.ducking?.attack, 0.01, 2, 0.12),
      release: clamp(bgmSource.ducking?.release, 0.01, 5, 0.35),
    },
  };

  const sfxMasterVolume = clamp(source.sfxMasterVolume, 0, 2, 0.5);
  const sfx = (Array.isArray(source.sfx) ? source.sfx : [])
    .map((clip, index) => ({
      id: String(clip?.id || `sfx-${index + 1}`),
      assetId: clip?.assetId ? String(clip.assetId) : null,
      src: clip?.src ? String(clip.src) : null,
      name: String(clip?.name || `SFX ${index + 1}`),
      startTime: clamp(clip?.startTime, 0, duration, 0),
      duration: clamp(clip?.duration, 0.01, duration, 1),
      volume: clamp(clip?.volume, 0, 2, 0.42),
      pan: clamp(clip?.pan, -1, 1, 0),
    }))
    .filter((clip) => clip.assetId || clip.src);

  const voiceSegments = (Array.isArray(projectData?.scenes) ? projectData.scenes : [])
    .filter((scene) => String(scene?.voiceText || '').trim())
    .map((scene) => ({
      startTime: clamp(scene.startTime, 0, duration, 0),
      endTime: clamp(scene.endTime, 0, duration, 0),
    }));

  return { duration, bgm, sfxMasterVolume, sfx, voiceSegments };
}

function equalPowerPan(pan) {
  const angle = ((clamp(pan, -1, 1, 0) + 1) * Math.PI) / 4;
  return { left: Math.cos(angle), right: Math.sin(angle) };
}

function resolvePlanAssets(plan, resolveAsset) {
  const resolveReference = (entry) => {
    const reference = entry.assetId || entry.src;
    const resolved = reference && resolveAsset ? resolveAsset(reference) : null;
    if (!resolved?.absolutePath) {
      throw new Error(`Không tìm thấy audio asset: ${reference || entry.name}.`);
    }
    return { ...entry, filePath: resolved.absolutePath, contentHash: resolved.contentHash || null };
  };

  return {
    ...plan,
    bgm: plan.bgm.enabled ? resolveReference(plan.bgm) : plan.bgm,
    sfx: plan.sfx.map(resolveReference),
  };
}

function formatNumber(value) {
  return Number(value).toFixed(4).replace(/0+$/, '').replace(/\.$/, '');
}

function buildAudioMixArgs({ voiceFile, plan, outputFile }) {
  const args = ['-hide_banner', '-loglevel', 'error', '-y'];
  const inputs = [];
  if (voiceFile) inputs.push({ role: 'voice', filePath: voiceFile });
  if (plan.bgm.enabled) inputs.push({ role: 'bgm', filePath: plan.bgm.filePath, loop: plan.bgm.loop });
  plan.sfx.forEach((clip) => inputs.push({ role: 'sfx', filePath: clip.filePath, clip }));

  inputs.forEach((input) => {
    if (input.loop) args.push('-stream_loop', '-1');
    args.push('-i', input.filePath);
  });

  const filters = [];
  const mixLabels = [];
  let inputIndex = 0;
  let voiceSidechainLabel = null;
  if (voiceFile) {
    const needsSidechain = plan.bgm.enabled && plan.bgm.ducking.enabled;
    const base = `[${inputIndex}:a]aresample=${SAMPLE_RATE},aformat=sample_fmts=fltp:sample_rates=${SAMPLE_RATE}:channel_layouts=stereo,volume=1`;
    if (needsSidechain) {
      filters.push(`${base},asplit=2[voice_mix][voice_sidechain]`);
      mixLabels.push('[voice_mix]');
      voiceSidechainLabel = '[voice_sidechain]';
    } else {
      filters.push(`${base}[voice]`);
      mixLabels.push('[voice]');
    }
    inputIndex += 1;
  }

  if (plan.bgm.enabled) {
    const clipDuration = Math.max(0.01, plan.bgm.endTime - plan.bgm.startTime);
    const fadeOutStart = Math.max(0, clipDuration - plan.bgm.fadeOut);
    const bgmFilters = [
      `aresample=${SAMPLE_RATE}`,
      `aformat=sample_fmts=fltp:sample_rates=${SAMPLE_RATE}:channel_layouts=stereo`,
      `atrim=duration=${formatNumber(clipDuration)}`,
      'asetpts=PTS-STARTPTS',
      `volume=${formatNumber(plan.bgm.volume)}`,
    ];
    if (plan.bgm.fadeIn > 0) {
      bgmFilters.push(`afade=t=in:st=0:d=${formatNumber(plan.bgm.fadeIn)}`);
    }
    if (plan.bgm.fadeOut > 0) {
      bgmFilters.push(
        `afade=t=out:st=${formatNumber(fadeOutStart)}:d=${formatNumber(plan.bgm.fadeOut)}`,
      );
    }
    const delayMs = Math.round(plan.bgm.startTime * 1000);
    bgmFilters.push(`adelay=${delayMs}|${delayMs}`);
    filters.push(`[${inputIndex}:a]${bgmFilters.join(',')}[bgm_pre]`);
    if (voiceSidechainLabel) {
      const ratio = clamp(Math.abs(plan.bgm.ducking.underVoiceDb) / 1.5, 2, 20, 8);
      filters.push(
        `[bgm_pre]${voiceSidechainLabel}sidechaincompress=threshold=0.02:ratio=${formatNumber(ratio)}:` +
          `attack=${Math.round(plan.bgm.ducking.attack * 1000)}:` +
          `release=${Math.round(plan.bgm.ducking.release * 1000)}[bgm]`,
      );
    } else {
      filters.push('[bgm_pre]anull[bgm]');
    }
    mixLabels.push('[bgm]');
    inputIndex += 1;
  }

  plan.sfx.forEach((clip) => {
    const gain = plan.sfxMasterVolume * clip.volume;
    const pan = equalPowerPan(clip.pan);
    const delayMs = Math.round(clip.startTime * 1000);
    const label = `sfx_${inputIndex}`;
    filters.push(
      `[${inputIndex}:a]aresample=${SAMPLE_RATE},` +
        `aformat=sample_fmts=fltp:sample_rates=${SAMPLE_RATE}:channel_layouts=stereo,` +
        `atrim=duration=${formatNumber(clip.duration)},asetpts=PTS-STARTPTS,` +
        `volume=${formatNumber(gain)},` +
        `pan=stereo|c0=${formatNumber(pan.left)}*c0|c1=${formatNumber(pan.right)}*c1,` +
        `adelay=${delayMs}|${delayMs}[${label}]`,
    );
    mixLabels.push(`[${label}]`);
    inputIndex += 1;
  });

  if (mixLabels.length === 0) {
    filters.push(`anullsrc=r=${SAMPLE_RATE}:cl=stereo:d=${formatNumber(plan.duration)}[master]`);
  } else {
    filters.push(
      `${mixLabels.join('')}amix=inputs=${mixLabels.length}:duration=longest:normalize=0,` +
        `alimiter=limit=0.891251:attack=5:release=50,` +
        `apad=pad_dur=${formatNumber(plan.duration)},atrim=duration=${formatNumber(plan.duration)}[master]`,
    );
  }

  args.push(
    '-filter_complex',
    filters.join(';'),
    '-map',
    '[master]',
    '-ar',
    String(SAMPLE_RATE),
    '-ac',
    '2',
    '-c:a',
    'libmp3lame',
    '-b:a',
    '192k',
    outputFile,
  );
  return args;
}

function runProcess(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: options.cwd,
      windowsHide: true,
      shell: false,
    });
    let stdout = '';
    let stderr = '';
    child.stdout?.on('data', (chunk) => {
      stdout += chunk.toString();
    });
    child.stderr?.on('data', (chunk) => {
      stderr += chunk.toString();
    });
    child.on('error', reject);
    child.on('close', (code) => {
      if (code === 0) resolve({ stdout, stderr });
      else reject(new Error(`${path.basename(command)} exited with code ${code}: ${stderr || stdout}`));
    });
  });
}

async function mixProjectAudio({ voiceFile, projectData, outputFile, resolveAsset, ffmpegPath, onProgress }) {
  const normalizedPlan = normalizeAudioPlan(projectData);
  const plan = resolvePlanAssets(normalizedPlan, resolveAsset);
  fs.mkdirSync(path.dirname(outputFile), { recursive: true });
  onProgress?.('Đang mix Voiceover, BGM và SFX ở 48 kHz stereo...');
  const args = buildAudioMixArgs({ voiceFile, plan, outputFile });
  await runProcess(ffmpegPath || process.env.FFMPEG_PATH || bundledFfmpegPath || 'ffmpeg', args, {
    cwd: path.dirname(outputFile),
  });
  const stat = fs.statSync(outputFile);
  if (stat.size === 0) throw new Error('FFmpeg đã tạo master audio rỗng.');
  return { duration: plan.duration, bytes: stat.size, sampleRate: SAMPLE_RATE, channels: 2, plan };
}

module.exports = {
  SAMPLE_RATE,
  buildAudioMixArgs,
  equalPowerPan,
  getProjectDuration,
  mixProjectAudio,
  normalizeAudioPlan,
  resolvePlanAssets,
};
