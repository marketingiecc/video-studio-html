const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const { createApp, getAudioProjectHash } = require('../server');
const { generateCompleteHtmlComposition } = require('../public/js/composition-generator');
const { escapeSpeechText } = require('../audio-generator');

const projectPath = path.join(__dirname, '..', 'projects', 'meo_nhan_11_lop_3.json');
const sampleProject = JSON.parse(fs.readFileSync(projectPath, 'utf8'));

async function withServer(run) {
  const server = createApp().listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  const address = server.address();
  const baseUrl = `http://127.0.0.1:${address.port}`;
  try {
    await run(baseUrl);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

test('health and preset APIs are available', async () => {
  await withServer(async (baseUrl) => {
    const health = await fetch(`${baseUrl}/api/health`).then((response) => response.json());
    assert.equal(health.success, true);
    assert.equal(health.service, 'MathCA Video Studio Pro');
    assert.equal(typeof health.systemReady, 'boolean');

    const preset = await fetch(`${baseUrl}/api/projects/meo_nhan_11_lop_3.json`).then((response) => response.json());
    assert.equal(preset.success, true);
    assert.ok(Array.isArray(preset.data.scenes));
    assert.ok(preset.data.scenes.length > 0);
  });
});

test('speech text escapes XML-sensitive math symbols', () => {
  assert.equal(escapeSpeechText('3 < 5 & 7 > 2'), '3 &lt; 5 &amp; 7 &gt; 2');
});

test('audio hash changes when narration changes', () => {
  const first = structuredClone(sampleProject);
  const second = structuredClone(sampleProject);
  second.scenes[0].voiceText = `${second.scenes[0].voiceText} Nội dung mới.`;
  assert.notEqual(getAudioProjectHash(first), getAudioProjectHash(second));
  assert.equal(getAudioProjectHash(first), getAudioProjectHash(structuredClone(first)));
});

test('system check reports all bundled render dependencies', async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/system-check`);
    const system = await response.json();
    assert.ok([200, 503].includes(response.status));
    assert.equal(typeof system.ready, 'boolean');
    assert.equal(system.checks.node.ok, true);
    assert.equal(system.checks.hyperframes.ok, true);
    assert.equal(system.checks.ffmpeg.ok, true);
    assert.equal(system.checks.ffprobe.ok, true);
    assert.equal(typeof system.checks.browser.ok, 'boolean');
  });
});

test('project API rejects path traversal', async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/projects/%2e%2e%2fserver.js`);
    assert.ok([400, 404].includes(response.status));
  });
});

test('composition generator includes editable data, audio and one timeline', () => {
  const project = structuredClone(sampleProject);
  project.metadata.audioFile = 'audio-test.mp3';
  const html = generateCompleteHtmlComposition(project);

  assert.match(html, /data-composition-id="main"/);
  assert.match(html, /assets\/audio-test\.mp3/);
  assert.match(html, /data-hf-id="hook-title-1"/);
  assert.match(html, /id="elem-cta-btn"/);
  assert.equal((html.match(/gsap\.timeline\(\{ paused: true \}\)/g) || []).length, 1);
  assert.equal((html.match(/window\.__timelines\["main"\]/g) || []).length, 1);
});

test('render pipeline uses only local portable binaries', () => {
  const serverSource = fs.readFileSync(path.join(__dirname, '..', 'server.js'), 'utf8');
  const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8'));

  assert.equal(packageJson.dependencies.hyperframes, '0.8.71');
  assert.ok(packageJson.dependencies['ffmpeg-static']);
  assert.ok(packageJson.dependencies['ffprobe-static']);
  assert.match(serverSource, /command: process\.execPath/);
  assert.match(serverSource, /HYPERFRAMES_FFMPEG_PATH/);
  assert.match(serverSource, /HYPERFRAMES_FFPROBE_PATH/);
  assert.doesNotMatch(serverSource, /cmd\.exe|npx\.cmd/);
  assert.match(serverSource, /\['\.html', '\.js', '\.css', '\.json'\]/);
});

test('studio page exposes audio, render and selection controls', () => {
  const indexHtml = fs.readFileSync(path.join(__dirname, '..', 'public', 'index.html'), 'utf8');
  const appJs = fs.readFileSync(path.join(__dirname, '..', 'public', 'js', 'app.js'), 'utf8');

  for (const id of ['server-status', 'btn-generate-audio', 'audio-status', 'btn-select-output-folder', 'output-folder-status', 'render-output-location', 'btn-render-trigger', 'btn-check-update', 'modal-update']) {
    assert.match(indexHtml, new RegExp(`id="${id}"`));
  }
  assert.match(appJs, /compositionRoot\.addEventListener\('mousedown'/);
  assert.match(appJs, /fetch\('\/api\/generate-audio'/);
  assert.match(appJs, /fetch\('\/api\/render'/);
  assert.match(appJs, /fetch\('\/api\/update\/check'\)/);
  assert.match(appJs, /showDirectoryPicker/);
  assert.match(appJs, /getFileHandle\(outputFile/);
  assert.match(appJs, /setInterval\(\(\) => checkServerHealth\(\), 5000\)/);
  assert.match(appJs, /Dev Server đã dừng/);
});

test('update check API reports git status and commits', async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/update/check`);
    const data = await response.json();
    assert.equal(response.status, 200);
    assert.equal(data.success, true);
    assert.equal(typeof data.hasUpdate, 'boolean');
    if (data.isGitRepo) {
      assert.ok(data.currentCommit);
    }
  });
});

