const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const { createApp } = require('../server');
const { generateCompleteHtmlComposition } = require('../public/js/composition-generator');

const fixturePath = path.join(__dirname, 'fixtures', 'MathCA_Lop3_5PhepTinhNangCao.json');
const fixtureProject = JSON.parse(fs.readFileSync(fixturePath, 'utf8'));

async function withServer(run) {
  const server = createApp().listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  const address = server.address();
  try {
    await run(`http://127.0.0.1:${address.port}`);
  } finally {
    await new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
  }
}

test('advanced grade-3 import fixture keeps its original schema', () => {
  assert.equal(fixtureProject.scenes.length, 8);
  assert.equal(fixtureProject.metadata.duration, 29.5);
  assert.equal(fixtureProject.metadata.voice, 'vi-VN-HoaiMyNeural');
  assert.equal(typeof fixtureProject.html_template, 'string');
  assert.ok(fixtureProject.html_template.includes('data-composition-id="main"'));
  assert.deepEqual(Object.keys(fixtureProject.scenes[0]), [
    'id',
    'name',
    'startTime',
    'endTime',
    'voiceText',
    'elements',
  ]);
});

test('template projects render from html_template without mutating imported JSON', () => {
  const before = structuredClone(fixtureProject);
  const html = generateCompleteHtmlComposition(fixtureProject, { audioFile: 'voiceover-e2e.mp3' });

  assert.deepEqual(fixtureProject, before);
  assert.match(html, /MathCA - 5 phép tính nâng cao lớp 3/);
  assert.match(html, /id="scene-q5"/);
  assert.match(html, /src="assets\/voiceover-e2e\.mp3"/);
  assert.match(html, /src="assets\/gsap\.min\.js"/);
  assert.doesNotMatch(html, /cdnjs\.cloudflare\.com\/ajax\/libs\/gsap/);
});

test('project save API round-trips the imported JSON without runtime fields', async () => {
  const filename = `e2e-import-preserve-${process.pid}`;
  const savedPath = path.join(__dirname, '..', 'projects', `${filename}.json`);

  try {
    await withServer(async (baseUrl) => {
      const response = await fetch(`${baseUrl}/api/projects/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename, data: fixtureProject }),
      });
      const payload = await response.json();
      assert.equal(response.status, 200);
      assert.equal(payload.success, true);
    });

    const saved = JSON.parse(fs.readFileSync(savedPath, 'utf8'));
    assert.deepEqual(saved, fixtureProject);
    assert.equal(saved.metadata.audioFile, undefined);
  } finally {
    fs.rmSync(savedPath, { force: true });
  }
});

test('studio runtime separates generated audio and preview state from project JSON', () => {
  const appSource = fs.readFileSync(path.join(__dirname, '..', 'public', 'js', 'app.js'), 'utf8');
  const indexHtml = fs.readFileSync(path.join(__dirname, '..', 'public', 'index.html'), 'utf8');

  assert.match(appSource, /let runtimeAudioFile = null/);
  assert.match(appSource, /sourceProjectSnapshot = cloneJson\(data\)/);
  assert.match(appSource, /await refreshProjectPreview\(\)/);
  assert.doesNotMatch(appSource, /currentProject\.metadata\.audioFile = payload\.audioFile/);
  assert.doesNotMatch(appSource, /scene\.id = scene\.id \|\|/);
  assert.match(indexHtml, /id="composition-preview-frame"/);
  assert.match(indexHtml, /id="preview-status"/);
});
