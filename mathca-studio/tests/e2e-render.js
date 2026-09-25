const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { generateCompleteHtmlComposition } = require('../public/js/composition-generator');

const root = path.join(__dirname, '..');
const fixture = JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures', 'MathCA_Lop3_5PhepTinhNangCao.json'), 'utf8'));
const artifactsDir = path.join(__dirname, 'artifacts');
const runtime = JSON.parse(fs.readFileSync(path.join(root, '.mathca-runtime.json'), 'utf8'));
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
  const audio = await jsonFetch(`${baseUrl}/api/generate-audio`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ projectData: fixture }),
  });
  assert(audio.audioFile, 'Audio generation did not return a file.');

  const htmlContent = generateCompleteHtmlComposition(fixture, { audioFile: audio.audioFile });
  const start = await jsonFetch(`${baseUrl}/api/render`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ projectData: fixture, htmlContent }),
  });

  const deadline = Date.now() + 10 * 60 * 1000;
  let status;
  while (Date.now() < deadline) {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    status = await jsonFetch(`${baseUrl}/api/render-status`);
    process.stdout.write(`\r${String(status.progress || 0).padStart(3)}% ${status.stage || ''}`);
    if (!status.active) break;
  }
  process.stdout.write('\n');

  assert(status && !status.active, 'Render did not finish before timeout.');
  assert(!status.error, `Render failed: ${status.error}`);
  assert(status.progress === 100 && status.outputFile, 'Render did not produce an output file.');

  const outputPath = path.join(root, 'rendered_output', status.outputFile);
  assert(fs.existsSync(outputPath), 'Rendered MP4 file is missing.');
  const sizeBytes = fs.statSync(outputPath).size;
  assert(sizeBytes > 100000, `Rendered MP4 is unexpectedly small: ${sizeBytes} bytes.`);

  const probe = spawnSync(runtime.ffprobePath, [
    '-v', 'error',
    '-show_entries', 'format=duration',
    '-of', 'default=noprint_wrappers=1:nokey=1',
    outputPath,
  ], { encoding: 'utf8' });
  assert(probe.status === 0, `FFprobe failed: ${probe.stderr}`);
  const duration = Number(probe.stdout.trim());
  assert(Number.isFinite(duration) && Math.abs(duration - fixture.metadata.duration) < 1, `Unexpected duration: ${duration}`);

  const report = {
    passed: true,
    checkedAt: new Date().toISOString(),
    jobId: start.jobId,
    audioFile: audio.audioFile,
    outputFile: status.outputFile,
    outputPath,
    sizeBytes,
    duration,
    logTail: Array.isArray(status.log) ? status.log.slice(-8) : [],
  };
  fs.writeFileSync(path.join(artifactsDir, 'e2e-render-report.json'), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
})().catch((error) => {
  console.error(error.stack || error.message);
  process.exitCode = 1;
});
