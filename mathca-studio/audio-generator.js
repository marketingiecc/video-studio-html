const fs = require('fs');
const crypto = require('crypto');
const os = require('os');
const path = require('path');
const { spawn } = require('child_process');
const { pipeline } = require('stream/promises');
const { MsEdgeTTS, OUTPUT_FORMAT } = require('msedge-tts');
const bundledFfmpegPath = require('ffmpeg-static');
const { getProjectDuration, mixProjectAudio } = require('./audio-mixer');

const DEFAULT_VOICE = 'vi-VN-HoaiMyNeural';
const OUTPUT_FORMAT_MP3 = OUTPUT_FORMAT.AUDIO_24KHZ_96KBITRATE_MONO_MP3;
const DEFAULT_TTS_ATTEMPTS = 5;
const VIENEU_PREFIX = 'vieneu:';
const VIENEU_CIRCUIT_THRESHOLD = 3;

function isVieneuVoice(voice) {
  return typeof voice === 'string' && voice.startsWith(VIENEU_PREFIX);
}

function getVieneuVoiceName(voice) {
  let name = voice.slice(VIENEU_PREFIX.length);
  if (name.includes('—')) {
    name = name.split('—')[0];
  } else if (name.includes(',')) {
    name = name.split(',').pop();
  }
  name = name.replace(/^⭐\s*/, '').trim();
  return name.trim();
}

function getVoiceSegmentCacheKey({ text, voice, rate, pitch, volume }) {
  return crypto
    .createHash('sha256')
    .update(JSON.stringify({
      text: String(text || '').trim(),
      voice,
      rate,
      pitch,
      volume,
      outputFormat: OUTPUT_FORMAT_MP3,
    }))
    .digest('hex');
}

function getVoiceProfile(voice) {
  // VieNeu voices don't use Edge TTS prosody — return neutral profile
  if (isVieneuVoice(voice)) {
    return { rate: '+0%', pitch: '+0Hz', volume: '+0%' };
  }
  return {
    rate: voice.includes('NamMinh') ? '+15%' : '+18%',
    pitch: voice.includes('NamMinh') ? '+2Hz' : '+4Hz',
    volume: '+0%',
  };
}

function isReusableVoiceSegment(filePath) {
  try {
    return fs.statSync(filePath).size > 1024;
  } catch {
    return false;
  }
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
      if (code === 0) {
        resolve({ stdout, stderr });
        return;
      }
      reject(new Error(`${command} exited with code ${code}: ${stderr || stdout}`));
    });
  });
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function escapeSpeechText(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

async function synthesizeSceneToFile({ text, voice, targetPath, attempts, timeoutMs, onRetry }) {
  let lastError = null;
  const profile = getVoiceProfile(voice);

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    const tts = new MsEdgeTTS();
    try {
      await tts.setMetadata(voice, OUTPUT_FORMAT_MP3);
      const { audioStream } = tts.toStream(escapeSpeechText(text), profile);

      const timeout = setTimeout(() => {
        audioStream.destroy(new Error(`Edge TTS quá thời gian chờ ${Math.round(timeoutMs / 1000)} giây.`));
      }, timeoutMs);

      try {
        await pipeline(audioStream, fs.createWriteStream(targetPath));
      } finally {
        clearTimeout(timeout);
      }

      if (!isReusableVoiceSegment(targetPath)) {
        throw new Error('Edge TTS trả về file âm thanh rỗng hoặc không hoàn chỉnh.');
      }
      return;
    } catch (error) {
      lastError = error;
      if (fs.existsSync(targetPath)) fs.rmSync(targetPath, { force: true });
      if (attempt < attempts) {
        onRetry(attempt + 1, error);
        await delay(Math.min(8000, 900 * (2 ** (attempt - 1))));
      }
    } finally {
      tts.close();
    }
  }

  throw new Error(`Edge TTS thất bại sau ${attempts} lần thử: ${lastError?.message || 'lỗi không xác định'}`);
}

/**
 * Synthesize via VieNeu MCP client. Output is WAV from MCP → convert to MP3 via FFmpeg.
 * WAV is always written INSIDE the MCP output root to avoid path traversal errors.
 */
async function synthesizeSceneToFileVieNeu({ text, voice, targetPath, mcpClient, ffmpegPath, timeoutMs }) {
  const vieneuName = getVieneuVoiceName(voice);
  const outputRoot = mcpClient._outputRoot || path.join(__dirname, 'public', 'assets', 'voice-segments');
  fs.mkdirSync(outputRoot, { recursive: true });

  // Generate a unique filename inside the output root
  const wavFileName = `vieneu-${process.pid}-${Date.now()}.wav`;
  const wavPath = path.join(outputRoot, wavFileName);

  const result = await mcpClient.synthesize({
    text,
    voice: vieneuName,
    outputPath: wavFileName,
  });

  // VieNeu outputs WAV — find it
  const resolvedWav = result.outputPath ? path.resolve(outputRoot, result.outputPath) : wavPath;
  if (!fs.existsSync(resolvedWav)) {
    throw new Error(`VieNeu output WAV not found at ${resolvedWav}`);
  }

  const ffmpeg = ffmpegPath || bundledFfmpegPath || 'ffmpeg';
  await runProcess(ffmpeg, [
    '-hide_banner', '-loglevel', 'error', '-y',
    '-i', resolvedWav,
    '-ar', '48000', '-ac', '2', '-c:a', 'libmp3lame', '-b:a', '192k',
    targetPath,
  ]);

  // Clean up WAV
  if (fs.existsSync(resolvedWav)) fs.rmSync(resolvedWav, { force: true });

  if (!isReusableVoiceSegment(targetPath)) {
    throw new Error('VieNeu TTS trả về file âm thanh rỗng hoặc không hoàn chỉnh.');
  }
}

async function synthesizeSceneFiles(projectData, tempDir, onProgress = () => {}, options = {}) {
  const scenes = Array.isArray(projectData?.scenes) ? projectData.scenes : [];
  const voice = projectData?.metadata?.voice || DEFAULT_VOICE;
  const attempts = Math.max(1, Number(options.ttsAttempts) || DEFAULT_TTS_ATTEMPTS);
  const timeoutMs = Math.max(10000, Number(options.ttsTimeoutMs) || 90000);
  const sceneCacheDir = options.sceneCacheDir || path.join(tempDir, 'voice-segments');
  const profile = getVoiceProfile(voice);
  const mcpClient = options.mcpClient || null;
  const ffmpegPath = options.ffmpegPath || bundledFfmpegPath || 'ffmpeg';
  const useVieneu = isVieneuVoice(voice) && mcpClient;
  let vieneuConsecutiveFails = 0;
  const results = [];
  fs.mkdirSync(sceneCacheDir, { recursive: true });

  for (let index = 0; index < scenes.length; index += 1) {
    const scene = scenes[index];
    const text = String(scene.voiceText || '').trim();
    if (!text) continue;

    const targetPath = path.join(tempDir, `scene-${String(index + 1).padStart(2, '0')}.mp3`);
    const cacheKey = getVoiceSegmentCacheKey({ text, voice, ...profile });
    const cachePath = path.join(sceneCacheDir, `${cacheKey}.mp3`);
    if (isReusableVoiceSegment(cachePath)) {
      fs.copyFileSync(cachePath, targetPath);
      onProgress(`Đang dùng lại giọng đọc cảnh ${index + 1}/${scenes.length}...`);
    } else if (useVieneu && vieneuConsecutiveFails < VIENEU_CIRCUIT_THRESHOLD) {
      // Try VieNeu first, fallback to Edge on failure
      try {
        onProgress(`Đang tạo giọng đọc VieNeu cảnh ${index + 1}/${scenes.length}...`);
        await synthesizeSceneToFileVieNeu({
          text,
          voice,
          targetPath,
          mcpClient,
          ffmpegPath,
          timeoutMs,
        });
        vieneuConsecutiveFails = 0;
        const pendingCachePath = `${cachePath}.${process.pid}.${Date.now()}.tmp`;
        fs.copyFileSync(targetPath, pendingCachePath);
        fs.renameSync(pendingCachePath, cachePath);
      } catch (vieneuError) {
        vieneuConsecutiveFails += 1;
        console.warn(`[Audio] VieNeu failed scene ${index + 1}: ${vieneuError.message}`);
        if (vieneuConsecutiveFails >= VIENEU_CIRCUIT_THRESHOLD) {
          onProgress(`VieNeu circuit-breaker: fallback sang Edge TTS cho các cảnh còn lại.`);
        } else {
          onProgress(`VieNeu lỗi cảnh ${index + 1}, fallback sang Edge TTS...`);
        }
        // Fallback to Edge TTS with the default voice
        await synthesizeSceneToFile({
          text,
          voice: DEFAULT_VOICE,
          targetPath,
          attempts,
          timeoutMs,
          onRetry(nextAttempt, error) {
            onProgress(`Edge TTS retry cảnh ${index + 1} lần ${nextAttempt}/${attempts}...`);
            console.warn(`[Audio] Retry scene ${index + 1}: ${error.message}`);
          },
        });
        // NOTE: Do not cache Edge fallback under VieNeu cache key
      }
    } else {
      onProgress(`Đang tạo giọng đọc cảnh ${index + 1}/${scenes.length}...`);
      const edgeVoice = isVieneuVoice(voice) ? DEFAULT_VOICE : voice;
      await synthesizeSceneToFile({
        text,
        voice: edgeVoice,
        targetPath,
        attempts,
        timeoutMs,
        onRetry(nextAttempt, error) {
          onProgress(
            `Kết nối TTS bị gián đoạn ở cảnh ${index + 1}. Đang thử lại lần ${nextAttempt}/${attempts}...`,
          );
          console.warn(`[Audio] Retry scene ${index + 1}: ${error.message}`);
        },
      });
      if (!isVieneuVoice(voice)) {
        const pendingCachePath = `${cachePath}.${process.pid}.${Date.now()}.tmp`;
        fs.copyFileSync(targetPath, pendingCachePath);
        fs.renameSync(pendingCachePath, cachePath);
      }
    }

    results.push({
      filePath: targetPath,
      startTime: Math.max(0, Number(scene.startTime) || 0),
      sceneIndex: index,
    });
  }

  return results;
}

function buildVoiceoverArgs(sceneFiles, duration, outputPath) {
  const args = ['-hide_banner', '-loglevel', 'error', '-y'];
  sceneFiles.forEach((sceneFile) => {
    args.push('-i', sceneFile.filePath);
  });

  const filterParts = [];
  const mixLabels = [];
  sceneFiles.forEach((sceneFile, index) => {
    const delayMs = Math.max(0, Math.round(sceneFile.startTime * 1000));
    const label = `voice${index}`;
    filterParts.push(
      `[${index}:a]aresample=48000,` +
        `aformat=sample_fmts=fltp:sample_rates=48000:channel_layouts=stereo,` +
        `adelay=${delayMs}|${delayMs},volume=1[${label}]`,
    );
    mixLabels.push(`[${label}]`);
  });

  if (mixLabels.length === 0) {
    filterParts.push(`anullsrc=r=48000:cl=stereo:d=${duration}[voice_master]`);
  } else {
    filterParts.push(
      `${mixLabels.join('')}amix=inputs=${mixLabels.length}:duration=longest:normalize=0,` +
        `alimiter=limit=0.891251:attack=5:release=50,` +
        `apad=pad_dur=${duration},atrim=duration=${duration}[voice_master]`,
    );
  }

  args.push(
    '-filter_complex',
    filterParts.join(';'),
    '-map',
    '[voice_master]',
    '-t',
    String(duration),
    '-ar',
    '48000',
    '-ac',
    '2',
    '-c:a',
    'libmp3lame',
    '-b:a',
    '192k',
    outputPath,
  );

  return args;
}

async function generateVoiceover(projectData, outputFile, options = {}) {
  if (!projectData || !Array.isArray(projectData.scenes)) {
    throw new Error('Dữ liệu dự án phải có trường scenes dạng mảng.');
  }

  const onProgress = options.onProgress || (() => {});
  const ffmpegPath = options.ffmpegPath || process.env.FFMPEG_PATH || bundledFfmpegPath || 'ffmpeg';
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'mathca-audio-'));
  const outputDir = path.dirname(outputFile);
  fs.mkdirSync(outputDir, { recursive: true });
  const pendingOutput = path.join(outputDir, `.voice-${process.pid}-${Date.now()}.mp3`);

  try {
    const duration = getProjectDuration(projectData);
    const sceneFiles = await synthesizeSceneFiles(projectData, tempDir, onProgress, {
      ...options,
      sceneCacheDir: options.sceneCacheDir || path.join(outputDir, 'voice-segments'),
    });
    onProgress('Đang ghép Voiceover ở 48 kHz stereo...');
    const ffmpegArgs = buildVoiceoverArgs(sceneFiles, duration, pendingOutput);
    await runProcess(ffmpegPath, ffmpegArgs, { cwd: tempDir });

    const stat = fs.statSync(pendingOutput);
    if (stat.size === 0) {
      throw new Error('FFmpeg đã tạo file âm thanh rỗng.');
    }

    fs.copyFileSync(pendingOutput, outputFile);
    return {
      duration,
      bytes: stat.size,
      sceneCount: sceneFiles.length,
      voice: projectData?.metadata?.voice || DEFAULT_VOICE,
      sampleRate: 48000,
      channels: 2,
    };
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
    if (fs.existsSync(pendingOutput)) fs.rmSync(pendingOutput, { force: true });
  }
}

async function generateProjectAudio(projectData, outputFile, options = {}) {
  if (!projectData || !Array.isArray(projectData.scenes)) {
    throw new Error('Dữ liệu dự án phải có trường scenes dạng mảng.');
  }

  const onProgress = options.onProgress || (() => {});
  const ffmpegPath = options.ffmpegPath || process.env.FFMPEG_PATH || bundledFfmpegPath || 'ffmpeg';
  const outputDir = path.dirname(outputFile);
  fs.mkdirSync(outputDir, { recursive: true });
  const temporaryVoiceFile = path.join(outputDir, `.voice-source-${process.pid}-${Date.now()}.mp3`);
  const voiceOutputFile = options.voiceOutputFile || temporaryVoiceFile;
  const pendingMaster = path.join(outputDir, `.master-${process.pid}-${Date.now()}.mp3`);
  const reuseVoice = Boolean(options.reuseVoice && fs.existsSync(voiceOutputFile));

  try {
    const voiceResult = reuseVoice
      ? {
          duration: getProjectDuration(projectData),
          bytes: fs.statSync(voiceOutputFile).size,
          sceneCount: projectData.scenes.filter((scene) => String(scene.voiceText || '').trim()).length,
          voice: projectData?.metadata?.voice || DEFAULT_VOICE,
          sampleRate: 48000,
          channels: 2,
          cached: true,
        }
      : await generateVoiceover(projectData, voiceOutputFile, { ...options, ffmpegPath, onProgress });

    const masterResult = await mixProjectAudio({
      voiceFile: voiceOutputFile,
      projectData,
      outputFile: pendingMaster,
      resolveAsset: options.resolveAsset,
      ffmpegPath,
      onProgress,
    });
    fs.copyFileSync(pendingMaster, outputFile);
    return {
      duration: masterResult.duration,
      bytes: masterResult.bytes,
      sceneCount: voiceResult.sceneCount,
      voice: voiceResult.voice,
      sampleRate: masterResult.sampleRate,
      channels: masterResult.channels,
      voiceBytes: voiceResult.bytes,
      bgmIncluded: Boolean(masterResult.plan.bgm.enabled),
      sfxCount: masterResult.plan.sfx.length,
    };
  } finally {
    if (!options.voiceOutputFile && fs.existsSync(temporaryVoiceFile)) {
      fs.rmSync(temporaryVoiceFile, { force: true });
    }
    if (fs.existsSync(pendingMaster)) fs.rmSync(pendingMaster, { force: true });
  }
}

module.exports = {
  buildVoiceoverArgs,
  escapeSpeechText,
  generateProjectAudio,
  generateVoiceover,
  getProjectDuration,
  getVoiceSegmentCacheKey,
  isReusableVoiceSegment,
};
