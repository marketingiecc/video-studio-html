const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { spawn, execFile } = require('child_process');
const util = require('util');
const execFileAsync = util.promisify(execFile);
const bundledFfmpegPath = require('ffmpeg-static');
const bundledFfprobePath = require('ffprobe-static').path;
const { AudioAssetStore } = require('./audio-assets');
const { MediaAssetStore } = require('./media-assets');
const { generateProjectAudio } = require('./audio-generator');
const { normalizeAudioPlan } = require('./audio-mixer');
const { generateCompleteHtmlComposition } = require('./public/js/composition-generator');

const DEFAULT_PORT = Number(process.env.PORT) || 3300;
const REPO_ROOT = fs.existsSync(path.join(__dirname, '..', '.git'))
  ? path.resolve(__dirname, '..')
  : (fs.existsSync(path.join(__dirname, '.git')) ? __dirname : path.resolve(__dirname, '..'));
const PROJECTS_DIR = path.join(__dirname, 'projects');
const RENDER_DIR = path.join(__dirname, 'rendered_output');
const WORKSPACE_DIR = path.join(__dirname, 'render_workspace');
const PUBLIC_DIR = path.join(__dirname, 'public');
const HYPERFRAMES_VERSION = '0.8.71';
const HYPERFRAMES_CLI = path.join(__dirname, 'node_modules', 'hyperframes', 'bin', 'hyperframes.mjs');
const RUNTIME_STATUS_FILE = path.join(__dirname, '.mathca-runtime.json');
const AUDIO_MANIFEST_FILE = path.join(PUBLIC_DIR, 'assets', 'audio-manifest.json');
const MAX_LOG_LINES = 240;

[PROJECTS_DIR, RENDER_DIR, WORKSPACE_DIR].forEach((directory) => {
  fs.mkdirSync(directory, { recursive: true });
});

function createIdleRenderJob() {
  return {
    id: null,
    active: false,
    cancelRequested: false,
    progress: 0,
    stage: 'idle',
    log: [],
    outputFile: null,
    error: null,
    options: null,
    startedAt: null,
    completedAt: null,
  };
}

function createIdleAudioJob() {
  return {
    active: false,
    progress: 0,
    stage: 'idle',
    error: null,
    totalScenes: 0,
    startedAt: null,
    completedAt: null,
  };
}

function inferAudioProgress(stage, totalScenes, currentProgress = 0) {
  const text = String(stage || '');
  const sceneMatch = text.match(/cảnh\s+(\d+)\/(\d+)/i);
  if (sceneMatch) {
    const index = Math.max(1, Number(sceneMatch[1]) || 1);
    const total = Math.max(1, Number(sceneMatch[2]) || totalScenes || 1);
    const candidate = Math.min(86, 8 + Math.round((index / total) * 76));
    return Math.max(candidate, Number(currentProgress) || 0);
  }
  if (/dùng lại giọng đọc/i.test(text)) {
    const cacheMatch = text.match(/(\d+)\/(\d+)/);
    if (cacheMatch) {
      const index = Math.max(1, Number(cacheMatch[1]) || 1);
      const total = Math.max(1, Number(cacheMatch[2]) || totalScenes || 1);
      const candidate = Math.min(86, 8 + Math.round((index / total) * 76));
      return Math.max(candidate, Number(currentProgress) || 0);
    }
  }
  if (/khởi động VieNeu|đang tải model/i.test(text)) return Math.max(5, Number(currentProgress) || 0);
  if (/fallback.*Edge|Edge.*fallback|circuit.?break/i.test(text)) return Math.max(Number(currentProgress) || 0, 6);
  if (/ghép voiceover/i.test(text)) return Math.max(90, Number(currentProgress) || 0);
  if (/trộn BGM|trộn SFX|mixing/i.test(text)) return Math.max(92, Number(currentProgress) || 0);
  if (/hoàn tất|đã khớp/i.test(text)) return 100;
  if (/thất bại|lỗi|error/i.test(text)) return Number(currentProgress) || 0;
  return Math.max(3, Number(currentProgress) || 0);
}

function stripAnsi(value) {
  return String(value || '').replace(/\u001b\[[0-9;?]*[ -/]*[@-~]/g, '');
}

function appendRenderLog(job, value) {
  const cleanLines = stripAnsi(value)
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  job.log.push(...cleanLines);
  if (job.log.length > MAX_LOG_LINES) job.log.splice(0, job.log.length - MAX_LOG_LINES);
}

function normalizeProjectFilename(filename) {
  const base = path.basename(String(filename || ''));
  if (!base.toLowerCase().endsWith('.json')) return null;
  return base;
}

function safeProjectSaveName(filename) {
  const withoutExtension = String(filename || 'project').replace(/\.json$/i, '');
  const safeBase = withoutExtension.replace(/[^a-zA-Z0-9_-]/g, '_').replace(/^_+|_+$/g, '');
  return `${safeBase || 'project'}.json`;
}

function safeOutputName(title) {
  const normalized = String(title || 'mathca_video')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
  return normalized || 'mathca_video';
}

function stableHash(value) {
  return crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex');
}

function getAudioProjectHash(projectData) {
  return stableHash({
    voice: projectData?.metadata?.voice || null,
    duration: Number(projectData?.metadata?.duration) || null,
    scenes: (projectData?.scenes || []).map((scene) => ({
      startTime: Number(scene.startTime) || 0,
      endTime: Number(scene.endTime) || 0,
      voiceText: String(scene.voiceText || '').trim(),
    })),
  });
}

function getMasterAudioHash(projectData, assetStore) {
  const plan = normalizeAudioPlan(projectData);
  const assetFingerprint = (entry) => {
    const reference = entry.assetId || entry.src;
    if (!reference) return null;
    const asset = assetStore.resolve(reference);
    if (!asset) throw new Error(`Không tìm thấy audio asset: ${reference}.`);
    return { reference, contentHash: asset.contentHash, bytes: asset.bytes };
  };
  return stableHash({
    voiceHash: getAudioProjectHash(projectData),
    plan,
    bgmAsset: plan.bgm.enabled ? assetFingerprint(plan.bgm) : null,
    sfxAssets: plan.sfx.map(assetFingerprint),
  });
}

function readAudioManifest() {
  try {
    return JSON.parse(fs.readFileSync(AUDIO_MANIFEST_FILE, 'utf8'));
  } catch {
    return { version: 2, entries: {} };
  }
}

function writeAudioManifest(manifest) {
  fs.mkdirSync(path.dirname(AUDIO_MANIFEST_FILE), { recursive: true });
  const pendingPath = `${AUDIO_MANIFEST_FILE}.${process.pid}.${Date.now()}.tmp`;
  fs.writeFileSync(pendingPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
  fs.renameSync(pendingPath, AUDIO_MANIFEST_FILE);
}

const VOICE_DISPLAY_NAMES = {
  'vi-VN-HoaiMyNeural': 'Hoài My',
  'vi-VN-NamMinhNeural': 'Nam Minh',
};
function getVoiceDisplayName(voiceId) {
  if (!voiceId) return 'Unknown';
  if (VOICE_DISPLAY_NAMES[voiceId]) return VOICE_DISPLAY_NAMES[voiceId];
  if (voiceId.startsWith('vieneu:')) {
    let name = voiceId.slice(7);
    if (name.includes('—')) {
      name = name.split('—')[0];
    } else if (name.includes(',')) {
      name = name.split(',').pop();
    }
    name = name.replace(/^⭐\s*/, '').trim();
    return name || 'VieNeu';
  }
  return voiceId;
}

function getRenderEnvironment() {
  return {
    ...process.env,
    FFMPEG_PATH: bundledFfmpegPath,
    FFPROBE_PATH: bundledFfprobePath,
    HYPERFRAMES_FFMPEG_PATH: bundledFfmpegPath,
    HYPERFRAMES_FFPROBE_PATH: bundledFfprobePath,
  };
}

function normalizeRenderOptions(body = {}) {
  const requestedFps = Number(body.fps);
  const fps = [25, 30, 60].includes(requestedFps) ? requestedFps : 30;
  const qualityAliases = {
    draft: 'draft',
    standard: 'standard',
    looks: 'standard',
    high: 'high',
    delivery: 'high',
  };
  const quality = qualityAliases[String(body.quality || '').toLowerCase()] || 'standard';
  const requestedResolution = String(body.resolution || '9:16').toLowerCase();
  const resolutions = {
    '9:16': { name: '9:16', width: 1080, height: 1920 },
    portrait: { name: '9:16', width: 1080, height: 1920 },
    '1:1': { name: '1:1', width: 1080, height: 1080 },
    square: { name: '1:1', width: 1080, height: 1080 },
    '16:9': { name: '16:9', width: 1920, height: 1080 },
    landscape: { name: '16:9', width: 1920, height: 1080 },
  };
  const resolution = resolutions[requestedResolution] || resolutions['9:16'];
  const includeAudio = body.includeAudio !== false;
  return {
    fps,
    captureFps: fps === 25 ? 30 : fps,
    quality,
    resolution,
    includeAudio,
    fitMode: body.fitMode === 'backdrop' ? 'backdrop' : 'contain',
    needsPostProcess: fps === 25 || resolution.name !== '9:16' || !includeAudio,
  };
}

function buildHyperframesInvocation(jobDir, outputFile, renderOptions = {}) {
  return {
    command: process.execPath,
    args: [
      HYPERFRAMES_CLI,
      'render',
      jobDir,
      '--output',
      outputFile,
      '--fps',
      String(renderOptions.captureFps || 30),
      '--quality',
      renderOptions.quality || 'standard',
    ],
    env: getRenderEnvironment(),
  };
}

function buildPostProcessInvocation(inputFile, outputFile, renderOptions) {
  const { width, height } = renderOptions.resolution;
  const fpsFilter = renderOptions.fps === 25 ? ',fps=25' : '';
  const videoFilter =
    renderOptions.fitMode === 'backdrop' && renderOptions.resolution.name !== '9:16'
      ? `split=2[bgsrc][fgsrc];` +
        `[bgsrc]scale=${width}:${height}:force_original_aspect_ratio=increase,` +
        `crop=${width}:${height},gblur=sigma=28[bg];` +
        `[fgsrc]scale=${width}:${height}:force_original_aspect_ratio=decrease[fg];` +
        `[bg][fg]overlay=(W-w)/2:(H-h)/2${fpsFilter}`
      : `scale=${width}:${height}:force_original_aspect_ratio=decrease,` +
        `pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2:color=0x081d1b${fpsFilter}`;
  const crfByQuality = { draft: '26', standard: '21', high: '18' };
  const presetByQuality = { draft: 'veryfast', standard: 'medium', high: 'slow' };
  const args = [
    '-hide_banner',
    '-loglevel',
    'error',
    '-y',
    '-i',
    inputFile,
    '-vf',
    videoFilter,
    '-c:v',
    'libx264',
    '-preset',
    presetByQuality[renderOptions.quality],
    '-crf',
    crfByQuality[renderOptions.quality],
    '-pix_fmt',
    'yuv420p',
    '-movflags',
    '+faststart',
  ];
  if (renderOptions.includeAudio) {
    args.push('-c:a', 'aac', '-b:a', '192k', '-ar', '48000', '-ac', '2');
  } else {
    args.push('-an');
  }
  args.push(outputFile);
  return { command: bundledFfmpegPath, args, env: getRenderEnvironment() };
}

function readRuntimeStatus() {
  try {
    return JSON.parse(fs.readFileSync(RUNTIME_STATUS_FILE, 'utf8'));
  } catch {
    return null;
  }
}

function getSystemCheck() {
  const nodeMajor = Number(process.versions.node.split('.')[0]);
  const runtimeStatus = readRuntimeStatus();
  const browserPath = runtimeStatus?.browserPath || '';
  const checks = {
    node: { ok: nodeMajor >= 22, value: process.versions.node, requirement: 'Node.js 22+' },
    hyperframes: { ok: fs.existsSync(HYPERFRAMES_CLI), value: HYPERFRAMES_VERSION, path: HYPERFRAMES_CLI },
    ffmpeg: { ok: Boolean(bundledFfmpegPath && fs.existsSync(bundledFfmpegPath)), path: bundledFfmpegPath },
    ffprobe: { ok: Boolean(bundledFfprobePath && fs.existsSync(bundledFfprobePath)), path: bundledFfprobePath },
    browser: {
      ok: Boolean(browserPath && fs.existsSync(browserPath)),
      path: browserPath || null,
      checkedAt: runtimeStatus?.checkedAt || null,
    },
  };
  return { ready: Object.values(checks).every((check) => check.ok), checks };
}

function safeRemoveWorkspace(jobDir) {
  if (!jobDir) return;
  const resolvedRoot = path.resolve(WORKSPACE_DIR);
  const resolvedJob = path.resolve(jobDir);
  const relative = path.relative(resolvedRoot, resolvedJob);
  if (!relative || relative.startsWith('..') || path.isAbsolute(relative)) return;
  fs.rmSync(resolvedJob, { recursive: true, force: true });
}

function terminateProcessTree(child) {
  return new Promise((resolve) => {
    if (!child || child.exitCode !== null || child.killed) {
      resolve();
      return;
    }
    if (process.platform !== 'win32' || !child.pid) {
      child.kill('SIGTERM');
      resolve();
      return;
    }
    const killer = spawn('taskkill', ['/pid', String(child.pid), '/T', '/F'], {
      windowsHide: true,
      shell: false,
    });
    killer.once('error', () => {
      child.kill('SIGTERM');
      resolve();
    });
    killer.once('close', () => resolve());
  });
}

function createApp(options = {}) {
  const app = express();
  const spawnProcess = options.spawnProcess || spawn;
  const systemCheck = options.getSystemCheck || getSystemCheck;
  const terminateChild = options.terminateProcess || terminateProcessTree;
  const audioAssetStore = options.audioAssetStore || new AudioAssetStore({ publicDir: PUBLIC_DIR });
  const mediaAssetStore = options.mediaAssetStore || new MediaAssetStore({ publicDir: PUBLIC_DIR });
  const audioGenerator = options.audioGenerator || { generateProjectAudio };
  const mcpClient = options.mcpClient || null;
  const ttsProvider = String(process.env.MATHCA_TTS_PROVIDER || 'auto').toLowerCase();
  let currentRenderJob = createIdleRenderJob();
  let currentRenderProcess = null;
  let currentRenderJobDir = null;
  let currentRenderOutputPath = null;
  let currentAudioJob = createIdleAudioJob();

  app.use(cors());
  app.get('/api/media-assets', (request, response) => {
    try {
      response.json({ success: true, assets: mediaAssetStore.list(request.query.kind) });
    } catch (error) {
      response.status(400).json({ success: false, error: error.message });
    }
  });
  app.get('/api/media-assets/:assetId', (request, response) => {
    const asset = mediaAssetStore.get(request.params.assetId);
    if (!asset) {
      response.status(404).json({ success: false, error: 'Khong tim thay media asset.' });
      return;
    }
    response.json({ success: true, asset });
  });
  app.post('/api/media-assets', express.raw({ type: () => true, limit: '150mb' }), (request, response) => {
    try {
      const result = mediaAssetStore.saveUpload({
        buffer: request.body,
        filename: decodeURIComponent(request.get('x-file-name') || 'media.bin'),
        mimeType: request.get('content-type'),
        kind: request.get('x-media-kind'),
        name: request.get('x-media-name'),
      });
      response.status(result.created ? 201 : 200).json({ success: true, ...result });
    } catch (error) {
      response.status(400).json({ success: false, error: error.message });
    }
  });
  app.post('/api/audio-assets', express.raw({ type: () => true, limit: '50mb' }), (request, response) => {
    try {
      const result = audioAssetStore.saveUpload({
        buffer: request.body,
        filename: decodeURIComponent(request.get('x-file-name') || 'audio.bin'),
        mimeType: request.get('content-type'),
        kind: request.get('x-audio-kind'),
        name: request.get('x-audio-name'),
      });
      response.status(result.created ? 201 : 200).json({ success: true, ...result });
    } catch (error) {
      response.status(400).json({ success: false, error: error.message });
    }
  });

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));
  app.use(
    express.static(PUBLIC_DIR, {
      setHeaders(response, filePath) {
        const extension = path.extname(filePath).toLowerCase();
        const baseName = path.basename(filePath).toLowerCase();
        if (['.html', '.js', '.css', '.json'].includes(extension) || baseName === 'audio.mp3') {
          response.setHeader('Cache-Control', 'no-store, max-age=0');
        }
      },
    }),
  );
  app.use('/rendered', express.static(RENDER_DIR));

  app.get('/api/health', (request, response) => {
    const system = systemCheck();
    const mcpAvailable = mcpClient ? mcpClient.isReady() : false;
    response.json({
      success: true,
      service: 'MathCA Video Studio Pro',
      systemReady: system.ready,
      renderActive: currentRenderJob.active,
      audioActive: currentAudioJob.active,
      audioProgress: currentAudioJob.progress,
      audioStage: currentAudioJob.stage,
      renderProgress: currentRenderJob.progress,
      renderStage: currentRenderJob.stage,
      provider: {
        configured: ttsProvider,
        available: mcpAvailable ? 'vieneu' : 'edge',
        activeProvider: mcpAvailable && ttsProvider !== 'edge' ? 'vieneu' : 'edge',
        vieneuStatus: mcpClient ? (mcpAvailable ? 'ready' : 'unavailable') : 'not_configured',
      },
      hyperframesVersion: HYPERFRAMES_VERSION,
      timestamp: new Date().toISOString(),
    });
  });

  app.get('/api/system-check', (request, response) => {
    const system = systemCheck();
    response.status(system.ready ? 200 : 503).json({ success: system.ready, ...system });
  });

  app.get('/api/voices', async (request, response) => {
    const edgeVoices = [
      { id: 'vi-VN-HoaiMyNeural', name: 'Hoài My', description: 'Nữ tươi vui, hoạt bát - Chuẩn MathCA', provider: 'edge', gender: 'female', language: 'vi' },
      { id: 'vi-VN-NamMinhNeural', name: 'Nam Minh', description: 'Nam năng động, dứt khoát', provider: 'edge', gender: 'male', language: 'vi' },
    ];

    let vieneuVoices = [];
    let vieneuStatus = 'not_configured';

    if (mcpClient) {
      if (mcpClient.isReady()) {
        try {
          const voices = await mcpClient.listVoices();
          vieneuVoices = (Array.isArray(voices) ? voices : []).map((v) => {
            let voiceName = '';
            let voiceLabel = '';
            let voiceDesc = '';
            let gender = null;
            if (typeof v === 'string') {
              voiceName = v;
              voiceLabel = v;
              voiceDesc = `Giọng VieNeu ${v}`;
            } else if (Array.isArray(v)) {
              voiceLabel = v[0] || '';
              voiceName = v[1] || v[0] || '';
              voiceDesc = voiceLabel;
            } else if (typeof v === 'object' && v !== null) {
              voiceName = v.name || '';
              voiceLabel = v.label || v.name || '';
              voiceDesc = v.description || voiceLabel;
              gender = v.gender || null;
            }
            if (!voiceName && voiceLabel) {
              voiceName = voiceLabel.replace(/^⭐\s*/, '').split('—')[0].trim();
            }
            if (voiceName.includes(',')) {
              voiceName = voiceName.split(',').pop().trim();
            }
            voiceName = voiceName.replace(/^⭐\s*/, '').split('—')[0].trim();
            return {
              id: `vieneu:${voiceName}`,
              name: voiceName,
              label: voiceLabel || voiceName,
              description: voiceDesc || `Giọng VieNeu ${gender || ''}`.trim(),
              provider: 'vieneu',
              gender,
              language: 'vi',
            };
          });
          vieneuStatus = 'ready';
        } catch (error) {
          console.warn('[Voices] VieNeu query failed:', error.message);
          vieneuStatus = 'unavailable';
        }
      } else {
        vieneuStatus = 'unavailable';
      }
      // Always include placeholder voices so the user can select them
      // (synthesis will attempt to start MCP on demand)
      if (vieneuVoices.length === 0) {
        vieneuVoices = [
          { id: 'vieneu:Mai Anh', name: 'Mai Anh', description: 'Giọng nữ VieNeu (mặc định)', provider: 'vieneu', gender: 'female', language: 'vi' },
          { id: 'vieneu:Hải Đăng', name: 'Hải Đăng', description: 'Giọng nam VieNeu', provider: 'vieneu', gender: 'male', language: 'vi' },
        ];
      }
    }

    response.json({
      success: true,
      activeProvider: mcpClient && mcpClient.isReady() && ttsProvider !== 'edge' ? 'vieneu' : 'edge',
      vieneuStatus,
      voices: [...edgeVoices, ...vieneuVoices],
    });
  });

  app.post('/api/voice-variants', express.json(), (request, response) => {
    try {
      const projectData = request.body.projectData;
      if (!projectData || !Array.isArray(projectData.scenes)) {
        response.json({ success: true, variants: [] });
        return;
      }
      const manifest = readAudioManifest();
      const entries = manifest.entries && typeof manifest.entries === 'object' ? manifest.entries : {};
      // Compute scene text fingerprint for matching (same scenes = same video)
      const sceneFingerprint = stableHash({
        scenes: (projectData.scenes || []).map((s) => ({
          startTime: Number(s.startTime) || 0,
          endTime: Number(s.endTime) || 0,
          voiceText: String(s.voiceText || '').trim(),
        })),
      });

      const variants = [];
      const seenVoices = new Set();
      for (const [_hash, entry] of Object.entries(entries)) {
        if (!entry.result || !entry.masterFile) continue;
        // Match by checking if voice file exists (all variants for similar content)
        const masterPath = path.join(PUBLIC_DIR, 'assets', entry.masterFile);
        if (!fs.existsSync(masterPath)) continue;
        // Compute the scene fingerprint for this entry
        const entrySceneFp = entry.voiceHash
          ? stableHash({
              scenes: (projectData.scenes || []).map((s) => ({
                startTime: Number(s.startTime) || 0,
                endTime: Number(s.endTime) || 0,
                voiceText: String(s.voiceText || '').trim(),
              })),
            })
          : null;
        const rawVoiceId = entry.result.voice || 'unknown';
        const displayName = getVoiceDisplayName(rawVoiceId);
        const voiceId = rawVoiceId.startsWith('vieneu:') ? `vieneu:${displayName}` : rawVoiceId;
        if (seenVoices.has(voiceId)) continue;
        seenVoices.add(voiceId);
        variants.push({
          voiceId,
          voiceName: displayName,
          masterFile: entry.masterFile,
          masterUrl: `/assets/${entry.masterFile}`,
          voiceFile: entry.voiceFile || null,
          voiceUrl: entry.voiceFile ? `/assets/${entry.voiceFile}` : null,
          generatedAt: entry.generatedAt || null,
          isActive: entry.masterFile === (manifest.latest && entries[manifest.latest]?.masterFile),
          sceneCount: entry.result.sceneCount || 0,
        });
      }
      response.json({ success: true, variants });
    } catch (error) {
      response.json({ success: true, variants: [] });
    }
  });

  app.get('/api/audio-assets', (request, response) => {
    try {
      response.json({ success: true, assets: audioAssetStore.list(request.query.kind) });
    } catch (error) {
      response.status(400).json({ success: false, error: error.message });
    }
  });

  app.get('/api/audio-assets/:assetId', (request, response) => {
    const asset = audioAssetStore.get(request.params.assetId);
    if (!asset) {
      response.status(404).json({ success: false, error: 'Không tìm thấy audio asset.' });
      return;
    }
    response.json({ success: true, asset });
  });

  app.get('/api/projects', (request, response) => {
    try {
      const files = fs.readdirSync(PROJECTS_DIR).filter((file) => file.endsWith('.json'));
      const projects = files.map((filename) => {
        try {
          const content = JSON.parse(fs.readFileSync(path.join(PROJECTS_DIR, filename), 'utf8'));
          return {
            filename,
            name: content.metadata?.title || filename.replace('.json', ''),
            grade: content.metadata?.grade || 3,
            duration: content.metadata?.duration || 29.5,
            topic: content.metadata?.topic || '',
          };
        } catch {
          return { filename, name: filename.replace('.json', '') };
        }
      });
      response.json({ success: true, projects });
    } catch (error) {
      response.status(500).json({ success: false, error: error.message });
    }
  });

  app.get('/api/projects/:filename', (request, response) => {
    const filename = normalizeProjectFilename(request.params.filename);
    if (!filename) {
      response.status(400).json({ success: false, error: 'Tên file JSON không hợp lệ.' });
      return;
    }
    const filePath = path.join(PROJECTS_DIR, filename);
    if (!fs.existsSync(filePath)) {
      response.status(404).json({ success: false, error: 'Không tìm thấy file dự án.' });
      return;
    }
    try {
      response.json({ success: true, data: JSON.parse(fs.readFileSync(filePath, 'utf8')) });
    } catch (error) {
      response.status(500).json({ success: false, error: error.message });
    }
  });

  app.post('/api/projects/save', (request, response) => {
    try {
      const { filename, data } = request.body;
      if (!data || !Array.isArray(data.scenes)) {
        response.status(400).json({ success: false, error: 'Dữ liệu dự án không hợp lệ.' });
        return;
      }
      const safeName = safeProjectSaveName(filename);
      fs.writeFileSync(path.join(PROJECTS_DIR, safeName), JSON.stringify(data, null, 2), 'utf8');
      response.json({ success: true, filename: safeName });
    } catch (error) {
      response.status(500).json({ success: false, error: error.message });
    }
  });

  app.post('/api/generate-audio', async (request, response) => {
    const { projectData } = request.body;
    if (!projectData || !Array.isArray(projectData.scenes)) {
      response.status(400).json({ success: false, error: 'Thiếu dữ liệu dự án hoặc scenes.' });
      return;
    }
    if (currentAudioJob.active) {
      response.status(409).json({ success: false, error: 'Một tiến trình tạo âm thanh khác đang chạy.' });
      return;
    }

    currentAudioJob = {
      active: true,
      progress: 3,
      stage: 'Đang chuẩn bị tạo giọng đọc...',
      error: null,
      totalScenes: projectData.scenes.filter((scene) => String(scene.voiceText || '').trim()).length,
      startedAt: new Date().toISOString(),
      completedAt: null,
    };

    try {
      const plan = normalizeAudioPlan(projectData);
      const voiceHash = getAudioProjectHash(projectData);
      const masterHash = getMasterAudioHash(projectData, audioAssetStore);
      const voiceFileName = `voice-${voiceHash.slice(0, 16)}.mp3`;
      const masterFileName = `audio-${masterHash.slice(0, 16)}.mp3`;
      const voiceFilePath = path.join(PUBLIC_DIR, 'assets', voiceFileName);
      const masterFilePath = path.join(PUBLIC_DIR, 'assets', masterFileName);
      const force = Boolean(request.body.force);
      const masterCached = !force && fs.existsSync(masterFilePath) && fs.statSync(masterFilePath).size > 0;
      const voiceCached = !force && fs.existsSync(voiceFilePath) && fs.statSync(voiceFilePath).size > 0;

      let result;
      if (masterCached) {
        result = {
          duration: plan.duration,
          bytes: fs.statSync(masterFilePath).size,
          sceneCount: projectData.scenes.filter((scene) => String(scene.voiceText || '').trim()).length,
          voice: projectData?.metadata?.voice || 'vi-VN-HoaiMyNeural',
          sampleRate: 48000,
          channels: 2,
          voiceBytes: fs.existsSync(voiceFilePath) ? fs.statSync(voiceFilePath).size : null,
          bgmIncluded: plan.bgm.enabled,
          sfxCount: plan.sfx.length,
        };
      } else {
        result = await audioGenerator.generateProjectAudio(projectData, masterFilePath, {
          ffmpegPath: bundledFfmpegPath,
          voiceOutputFile: voiceFilePath,
          reuseVoice: voiceCached,
          mcpClient,
          resolveAsset: (reference) => audioAssetStore.resolve(reference),
          onProgress(stage) {
            currentAudioJob.stage = stage;
            currentAudioJob.progress = inferAudioProgress(
              stage,
              currentAudioJob.totalScenes,
              currentAudioJob.progress,
            );
            console.log(`[Audio] ${stage}`);
          },
        });
      }

      const manifest = readAudioManifest();
      const entries = manifest.entries && typeof manifest.entries === 'object' ? manifest.entries : {};
      entries[masterHash] = {
        voiceHash,
        masterHash,
        voiceFile: voiceFileName,
        masterFile: masterFileName,
        result,
        generatedAt: new Date().toISOString(),
      };
      writeAudioManifest({ version: 2, entries, latest: masterHash });

      currentAudioJob.active = false;
      currentAudioJob.progress = 100;
      currentAudioJob.stage = masterCached ? 'Âm thanh đã khớp với JSON hiện tại.' : 'Tạo âm thanh hoàn tất.';
      currentAudioJob.completedAt = new Date().toISOString();
      response.json({
        success: true,
        cached: masterCached,
        voiceFile: voiceFileName,
        voiceUrl: `/assets/${voiceFileName}`,
        masterFile: masterFileName,
        masterUrl: `/assets/${masterFileName}`,
        audioFile: masterFileName,
        audioUrl: `/assets/${masterFileName}`,
        message: masterCached ? 'Âm thanh hiện tại đã đúng với JSON.' : 'Đã tạo audio master theo JSON mới.',
        ...result,
      });
    } catch (error) {
      console.error('[Audio] Failed:', error);
      currentAudioJob.active = false;
      currentAudioJob.stage = 'Tạo âm thanh thất bại.';
      currentAudioJob.error = error.message;
      currentAudioJob.completedAt = new Date().toISOString();
      // Progress must not fake 100 on failure
      if (currentAudioJob.progress >= 100) currentAudioJob.progress = Math.min(currentAudioJob.progress, 99);
      response.status(500).json({ success: false, error: error.message });
    }
  });

  app.get('/api/audio-status', (request, response) => response.json(currentAudioJob));

  app.post('/api/render', (request, response) => {
    const system = systemCheck();
    if (!system.ready) {
      const missing = Object.entries(system.checks)
        .filter(([, check]) => !check.ok)
        .map(([name]) => name)
        .join(', ');
      response.status(503).json({
        success: false,
        error: `Bộ render cục bộ chưa sẵn sàng: ${missing || 'không xác định'}. Chạy npm run setup.`,
      });
      return;
    }
    if (currentRenderJob.active) {
      response.status(409).json({ success: false, error: 'Đang có một tiến trình render khác chạy.' });
      return;
    }

    const { projectData, htmlContent } = request.body;
    if (!projectData && !htmlContent) {
      response.status(400).json({ success: false, error: 'Thiếu dữ liệu dự án hoặc nội dung HTML.' });
      return;
    }

    const renderOptions = normalizeRenderOptions(request.body);
    const timestamp = Date.now();
    const jobId = `job-${timestamp}`;
    const jobDir = path.join(WORKSPACE_DIR, jobId);
    const outputFileName = `${safeOutputName(projectData?.metadata?.title)}_${timestamp}.mp4`;
    const outputFilePath = path.join(RENDER_DIR, outputFileName);
    const captureFilePath = renderOptions.needsPostProcess
      ? path.join(jobDir, 'portrait-master.mp4')
      : outputFilePath;

    currentRenderJob = {
      id: jobId,
      active: true,
      cancelRequested: false,
      progress: 5,
      stage: 'Đang chuẩn bị không gian làm việc...',
      log: ['Bắt đầu tiến trình render...'],
      outputFile: null,
      error: null,
      options: renderOptions,
      startedAt: new Date().toISOString(),
      completedAt: null,
    };
    currentRenderJobDir = jobDir;
    currentRenderOutputPath = outputFilePath;

    const finishCancelled = () => {
      currentRenderProcess = null;
      currentRenderJob.active = false;
      currentRenderJob.progress = 0;
      currentRenderJob.stage = 'Đã hủy render.';
      currentRenderJob.error = null;
      currentRenderJob.completedAt = new Date().toISOString();
      appendRenderLog(currentRenderJob, 'Render đã được hủy và workspace đã được dọn dẹp.');
      if (currentRenderOutputPath && fs.existsSync(currentRenderOutputPath)) {
        fs.rmSync(currentRenderOutputPath, { force: true });
      }
      safeRemoveWorkspace(currentRenderJobDir);
    };

    const failJob = (message) => {
      if (currentRenderJob.cancelRequested) {
        finishCancelled();
        return;
      }
      currentRenderProcess = null;
      currentRenderJob.active = false;
      currentRenderJob.error = message;
      currentRenderJob.stage = 'Lỗi render';
      currentRenderJob.completedAt = new Date().toISOString();
      appendRenderLog(currentRenderJob, message);
    };

    const completeJob = () => {
      currentRenderProcess = null;
      currentRenderJob.active = false;
      currentRenderJob.progress = 100;
      currentRenderJob.stage = 'Render hoàn tất!';
      currentRenderJob.outputFile = outputFileName;
      currentRenderJob.completedAt = new Date().toISOString();
      appendRenderLog(currentRenderJob, `Thành công: ${outputFileName}`);
    };

    const attachProcess = (child, onClose) => {
      currentRenderProcess = child;
      child.stdout?.on('data', (chunk) => {
        const text = chunk.toString();
        appendRenderLog(currentRenderJob, text);
        const progressLines = [
          ...stripAnsi(text).matchAll(
            /[█░]+\s+(\d{1,3})%\s+(?:Compiling|Extracting|Processing|Starting|Capturing|Encoding|Assembling|Render complete)/g,
          ),
        ];
        if (progressLines.length > 0 && !currentRenderJob.cancelRequested) {
          const progress = Number(progressLines[progressLines.length - 1][1]);
          currentRenderJob.progress = Math.max(currentRenderJob.progress, Math.min(94, Math.max(10, progress)));
          currentRenderJob.stage = `Đang render video: ${currentRenderJob.progress}%`;
        }
      });
      child.stderr?.on('data', (chunk) => appendRenderLog(currentRenderJob, chunk.toString()));
      child.once('error', (error) => failJob(`Không thể khởi chạy tiến trình: ${error.message}`));
      child.once('close', onClose);
    };

    try {
      fs.mkdirSync(jobDir, { recursive: true });
      const publicAssets = path.join(PUBLIC_DIR, 'assets');
      const jobAssets = path.join(jobDir, 'assets');
      if (fs.existsSync(publicAssets)) fs.cpSync(publicAssets, jobAssets, { recursive: true });
      const finalHtml = htmlContent || generateCompleteHtmlComposition(projectData || {});
      fs.writeFileSync(path.join(jobDir, 'index.html'), finalHtml, 'utf8');

      const invocation = buildHyperframesInvocation(jobDir, captureFilePath, renderOptions);
      currentRenderJob.stage = 'Đang khởi động HyperFrames...';
      currentRenderJob.progress = 10;
      const child = spawnProcess(invocation.command, invocation.args, {
        cwd: __dirname,
        env: invocation.env,
        windowsHide: true,
        shell: false,
      });
      attachProcess(child, (code) => {
        if (currentRenderJob.cancelRequested) {
          finishCancelled();
          return;
        }
        const captureExists = fs.existsSync(captureFilePath) && fs.statSync(captureFilePath).size > 0;
        if (code !== 0 || !captureExists) {
          failJob(`Render thất bại với mã lỗi ${code ?? 'không xác định'}.`);
          return;
        }
        if (!renderOptions.needsPostProcess) {
          completeJob();
          return;
        }

        currentRenderJob.progress = 95;
        currentRenderJob.stage = `Đang xuất ${renderOptions.resolution.name} / ${renderOptions.fps} FPS...`;
        const post = buildPostProcessInvocation(captureFilePath, outputFilePath, renderOptions);
        const postChild = spawnProcess(post.command, post.args, {
          cwd: __dirname,
          env: post.env,
          windowsHide: true,
          shell: false,
        });
        attachProcess(postChild, (postCode) => {
          if (currentRenderJob.cancelRequested) {
            finishCancelled();
            return;
          }
          const outputExists = fs.existsSync(outputFilePath) && fs.statSync(outputFilePath).size > 0;
          if (postCode === 0 && outputExists) completeJob();
          else failJob(`Hậu kỳ video thất bại với mã lỗi ${postCode ?? 'không xác định'}.`);
        });
      });

      response.json({
        success: true,
        jobId,
        message: 'Đã bắt đầu render.',
        outFileName: outputFileName,
        options: renderOptions,
      });
    } catch (error) {
      failJob(error.message);
      response.status(500).json({ success: false, error: error.message });
    }
  });

  app.post('/api/render/:jobId/cancel', async (request, response) => {
    if (!currentRenderJob.id || currentRenderJob.id !== request.params.jobId) {
      response.status(404).json({ success: false, error: 'Không tìm thấy render job.' });
      return;
    }
    if (!currentRenderJob.active) {
      response.status(409).json({ success: false, error: 'Render job không còn chạy.', job: currentRenderJob });
      return;
    }
    if (currentRenderJob.cancelRequested) {
      response.status(202).json({ success: true, jobId: currentRenderJob.id, stage: currentRenderJob.stage });
      return;
    }

    currentRenderJob.cancelRequested = true;
    currentRenderJob.stage = 'Đang hủy render...';
    appendRenderLog(currentRenderJob, 'Đã nhận yêu cầu hủy render.');
    const child = currentRenderProcess;
    try {
      await terminateChild(child);
      response.status(202).json({ success: true, jobId: currentRenderJob.id, stage: currentRenderJob.stage });
    } catch (error) {
      currentRenderJob.cancelRequested = false;
      currentRenderJob.stage = 'Không thể hủy render.';
      currentRenderJob.error = error.message;
      response.status(500).json({ success: false, error: error.message });
    }
  });

  app.get('/api/render-status', (request, response) => response.json(currentRenderJob));

  app.get('/api/update/check', async (request, response) => {
    try {
      if (!fs.existsSync(path.join(REPO_ROOT, '.git'))) {
        return response.json({
          success: true,
          isGitRepo: false,
          hasUpdate: false,
          message: 'Ứng dụng không chạy từ kho Git.',
        });
      }

      try {
        await execFileAsync('git', ['fetch', 'origin', 'main'], { cwd: REPO_ROOT, timeout: 25000 });
      } catch (fetchErr) {
        console.warn('[Update] git fetch warning:', fetchErr.message);
      }

      const { stdout: localHead } = await execFileAsync('git', ['rev-parse', '--short', 'HEAD'], { cwd: REPO_ROOT });
      const currentCommit = localHead.trim();

      let remoteCommit = currentCommit;
      try {
        const { stdout: remoteHead } = await execFileAsync('git', ['rev-parse', '--short', 'origin/main'], { cwd: REPO_ROOT });
        remoteCommit = remoteHead.trim();
      } catch {
        // remote may not be tracked yet
      }

      let commitsBehind = 0;
      let changelog = [];
      try {
        const { stdout: countOut } = await execFileAsync('git', ['rev-list', 'HEAD..origin/main', '--count'], { cwd: REPO_ROOT });
        commitsBehind = parseInt(countOut.trim(), 10) || 0;
      } catch {
        commitsBehind = 0;
      }

      if (commitsBehind > 0) {
        try {
          const { stdout: logOut } = await execFileAsync('git', ['log', 'HEAD..origin/main', '--oneline', '-n', '15'], { cwd: REPO_ROOT });
          changelog = logOut.split('\n').map((line) => line.trim()).filter(Boolean);
        } catch {
          changelog = [];
        }
      }

      response.json({
        success: true,
        isGitRepo: true,
        hasUpdate: commitsBehind > 0,
        currentCommit,
        remoteCommit,
        commitsBehind,
        changelog,
      });
    } catch (error) {
      console.error('[Update Check Error]', error);
      response.status(500).json({
        success: false,
        error: error.message || 'Lỗi kiểm tra cập nhật.',
      });
    }
  });

  app.post('/api/update/apply', async (request, response) => {
    try {
      if (currentRenderJob.active) {
        return response.status(400).json({
          success: false,
          error: 'Đang có tác vụ render video đang chạy. Hãy đợi hoàn tất hoặc hủy render trước khi cập nhật.',
        });
      }

      if (!fs.existsSync(path.join(REPO_ROOT, '.git'))) {
        return response.status(400).json({
          success: false,
          error: 'Thư mục không phải Git repository, không thể tự động cập nhật.',
        });
      }

      console.log('[Update] Bắt đầu kéo mã nguồn mới nhất từ GitHub...');
      const { stdout: pullOut } = await execFileAsync('git', ['pull', 'origin', 'main'], { cwd: REPO_ROOT, timeout: 60000 });
      console.log('[Update] Git pull hoàn tất:', pullOut.trim());

      try {
        console.log('[Update] Kiểm tra và cập nhật dependencies trong mathca-studio...');
        await execFileAsync(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['install', '--prefer-offline', '--no-audit'], {
          cwd: __dirname,
          timeout: 120000,
        });
      } catch (npmErr) {
        console.warn('[Update] npm install warning:', npmErr.message);
      }

      const setupScript = path.join(__dirname, 'setup-runtime.js');
      if (fs.existsSync(setupScript)) {
        try {
          console.log('[Update] Chạy setup runtime...');
          await execFileAsync(process.execPath, [setupScript], { cwd: __dirname, timeout: 60000 });
        } catch (setupErr) {
          console.warn('[Update] setup-runtime warning:', setupErr.message);
        }
      }

      const { stdout: newHead } = await execFileAsync('git', ['rev-parse', '--short', 'HEAD'], { cwd: REPO_ROOT });

      response.json({
        success: true,
        newCommit: newHead.trim(),
        message: 'Cập nhật thành công! Phiên bản mới nhất đã được áp dụng.',
      });
    } catch (error) {
      console.error('[Update Apply Error]', error);
      response.status(500).json({
        success: false,
        error: `Cập nhật thất bại: ${error.message}`,
      });
    }
  });

  app.use((error, request, response, next) => {
    console.error('[Server] Unhandled route error:', error);
    if (response.headersSent) {
      next(error);
      return;
    }
    const status = error.type === 'entity.too.large' ? 413 : 500;
    response.status(status).json({ success: false, error: error.message || 'Lỗi server không xác định.' });
  });

  app._studio = { getMcpClient: () => mcpClient, getAudioJob: () => currentAudioJob, getRenderJob: () => currentRenderJob };
  return app;
}

function startServer(port = DEFAULT_PORT) {
  let mcpClientInstance = null;
  try {
    const { VieNeuMcpClient } = require('./vieneu-mcp-client');
    mcpClientInstance = new VieNeuMcpClient();
  } catch (error) {
    console.warn('[Server] VieNeu MCP client not available:', error.message);
  }
  const app = createApp({ mcpClient: mcpClientInstance });
  const server = app.listen(port, () => {
    console.log('=======================================================');
    console.log('  MATHCA VIDEO STUDIO PRO');
    console.log('  Phần mềm trực quan biên tập và xuất video MathCA');
    console.log(`  Đang chạy tại: http://localhost:${port}`);
    console.log('=======================================================');

    // Eager VieNeu init — fire-and-forget so the engine is warm when user needs it
    if (mcpClientInstance) {
      mcpClientInstance.initialize()
        .then(() => console.log('[VieNeu] Engine ready — VieNeu TTS available for voice generation.'))
        .catch((error) => console.warn('[VieNeu] Init failed (will retry on demand):', error.message));
    }
  });
  const shutdown = () => {
    console.log('[Server] Shutting down...');
    if (mcpClientInstance) mcpClientInstance.close();
    server.close();
  };
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
  return server;
}

if (require.main === module) startServer();

module.exports = {
  buildHyperframesInvocation,
  buildPostProcessInvocation,
  createApp,
  getAudioProjectHash,
  inferAudioProgress,
  getMasterAudioHash,
  normalizeRenderOptions,
  startServer,
};


