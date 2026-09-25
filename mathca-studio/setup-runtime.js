const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT_DIR = __dirname;
const STATUS_FILE = path.join(ROOT_DIR, '.mathca-runtime.json');
const HYPERFRAMES_CLI = path.join(ROOT_DIR, 'node_modules', 'hyperframes', 'bin', 'hyperframes.mjs');
const ffmpegPath = require('ffmpeg-static');
const ffprobePath = require('ffprobe-static').path;

function fail(message) {
  console.error(`[LOI] ${message}`);
  process.exit(1);
}

function runHyperframes(args) {
  return spawnSync(process.execPath, [HYPERFRAMES_CLI, ...args], {
    cwd: ROOT_DIR,
    encoding: 'utf8',
    windowsHide: true,
    env: {
      ...process.env,
      FFMPEG_PATH: ffmpegPath,
      FFPROBE_PATH: ffprobePath,
      HYPERFRAMES_FFMPEG_PATH: ffmpegPath,
      HYPERFRAMES_FFPROBE_PATH: ffprobePath,
    },
  });
}

function parseBrowserPath(result) {
  if (result.status !== 0) return null;
  const lines = String(result.stdout || '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  const candidate = [...lines].reverse().find((line) => path.isAbsolute(line) && fs.existsSync(line));
  return candidate || null;
}

function main() {
  const nodeMajor = Number(process.versions.node.split('.')[0]);
  if (nodeMajor < 22) fail(`Can Node.js 22 tro len. Phien ban hien tai: ${process.versions.node}`);
  if (!fs.existsSync(HYPERFRAMES_CLI)) fail('Thieu HyperFrames cuc bo. Hay chay npm install.');
  if (!ffmpegPath || !fs.existsSync(ffmpegPath)) fail('Khong tim thay FFmpeg di kem ung dung.');
  if (!ffprobePath || !fs.existsSync(ffprobePath)) fail('Khong tim thay FFprobe di kem ung dung.');

  console.log('[INFO] Dang kiem tra trinh duyet render HyperFrames...');
  let browserPath = parseBrowserPath(runHyperframes(['browser', 'path']));
  if (!browserPath) {
    console.log('[INFO] Lan chay dau: dang tai trinh duyet render. Vui long giu ket noi Internet...');
    const ensureResult = runHyperframes(['browser', 'ensure']);
    if (ensureResult.status !== 0) {
      fail(String(ensureResult.stderr || ensureResult.stdout || 'Khong the cai trinh duyet render.').trim());
    }
    browserPath = parseBrowserPath(runHyperframes(['browser', 'path']));
  }

  if (!browserPath) fail('HyperFrames khong tra ve duong dan trinh duyet hop le.');

  fs.writeFileSync(
    STATUS_FILE,
    JSON.stringify(
      {
        ready: true,
        checkedAt: new Date().toISOString(),
        nodeVersion: process.versions.node,
        hyperframesVersion: require('./node_modules/hyperframes/package.json').version,
        ffmpegPath,
        ffprobePath,
        browserPath,
      },
      null,
      2,
    ),
  );

  console.log('[OK] Bo render cuc bo da san sang.');
}

main();
