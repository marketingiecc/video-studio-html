const fs = require('node:fs');
const path = require('node:path');
const puppeteer = require('puppeteer-core');

const root = path.join(__dirname, '..');
const fixturePath = 'C:\\Users\\lexua\\Downloads\\MathCA_Lop3_5PhepTinhNangCao.json';
const runtime = JSON.parse(fs.readFileSync(path.join(root, '.mathca-runtime.json'), 'utf8'));
const artifactsDir = path.join(__dirname, 'artifacts');
fs.mkdirSync(artifactsDir, { recursive: true });

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

(async () => {
  const browser = await puppeteer.launch({
    executablePath: runtime.browserPath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--autoplay-policy=no-user-gesture-required'],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
  const consoleErrors = [];
  const pageErrors = [];
  page.on('console', (message) => { if (message.type() === 'error') consoleErrors.push(message.text()); });
  page.on('pageerror', (error) => pageErrors.push(error.message));

  try {
    await page.goto('http://localhost:3300', { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForSelector('#scene-list-container .scene-card', { timeout: 30000 });
    const input = await page.$('#file-input-json');
    await input.uploadFile(fixturePath);
    await page.waitForFunction(() => {
      try {
        const project = JSON.parse(document.getElementById('raw-json-editor').value);
        return project.scenes?.length === 8
          && typeof project.html_template === 'string'
          && document.getElementById('audio-status')?.textContent.includes('Voiceover sẵn sàng: 8 cảnh')
          && Boolean(document.getElementById('composition-preview-frame')?.contentWindow?.__timelines?.main);
      } catch { return false; }
    }, { timeout: 120000 });

    const initial = await page.evaluate(() => {
      const project = JSON.parse(document.getElementById('raw-json-editor').value);
      const surface = document.getElementById('canvas-pan-surface');
      const stage = document.querySelector('.stage-viewport-container');
      return {
        elementCount: project.scenes[0].elements.length,
        layerRows: document.querySelectorAll('#elements-track .element-layer-track').length,
        layerLabels: document.querySelectorAll('#element-layer-labels .element-layer-label').length,
        surfaceWidth: surface.offsetWidth,
        surfaceHeight: surface.offsetHeight,
        stageClientHeight: stage.clientHeight,
      };
    });
    assert(initial.layerRows === initial.elementCount && initial.layerLabels === initial.elementCount, 'Timeline did not create one row per element.');

    await page.$eval('#preview-zoom', (control) => {
      control.value = '220';
      control.dispatchEvent(new Event('input', { bubbles: true }));
    });
    await page.waitForFunction((width) => document.getElementById('canvas-pan-surface').offsetWidth > width, {}, initial.surfaceWidth);
    const zoom = await page.evaluate(() => {
      const surface = document.getElementById('canvas-pan-surface');
      const stage = document.querySelector('.stage-viewport-container');
      stage.scrollTop = Math.max(1, (surface.offsetHeight - stage.clientHeight) / 2);
      stage.scrollLeft = Math.max(0, (surface.offsetWidth - stage.clientWidth) / 2);
      return {
        output: document.getElementById('preview-zoom-output').textContent,
        surfaceWidth: surface.offsetWidth,
        surfaceHeight: surface.offsetHeight,
        scrollTop: stage.scrollTop,
        scrollHeight: stage.scrollHeight,
        clientHeight: stage.clientHeight,
      };
    });
    assert(zoom.surfaceWidth > initial.surfaceWidth && zoom.scrollHeight > zoom.clientHeight && zoom.scrollTop > 0, 'Preview zoom/scroll is not operational.');
    await page.click('#btn-preview-fit');

    await page.click('#btn-add-text');
    await page.waitForFunction((count) => {
      const project = JSON.parse(document.getElementById('raw-json-editor').value);
      return project.scenes[0].elements.length === count + 1
        && document.querySelectorAll('#elements-track .element-layer-track').length === count + 1;
    }, {}, initial.elementCount);
    const addedText = await page.evaluate(() => {
      const project = JSON.parse(document.getElementById('raw-json-editor').value);
      return project.scenes[0].elements.at(-1);
    });
    assert(addedText.type === 'text', 'Add Text did not create a timeline layer.');

    const reorder = await page.evaluate(() => {
      const labels = [...document.querySelectorAll('#element-layer-labels .element-layer-label')];
      const source = labels.at(-1);
      const target = labels[0];
      const sourceId = source.dataset.elementLayerId;
      const targetId = target.dataset.elementLayerId;
      const transfer = new DataTransfer();
      source.dispatchEvent(new DragEvent('dragstart', { bubbles: true, dataTransfer: transfer }));
      target.dispatchEvent(new DragEvent('dragover', { bubbles: true, dataTransfer: transfer }));
      target.dispatchEvent(new DragEvent('drop', { bubbles: true, dataTransfer: transfer }));
      return { sourceId, targetId };
    });
    await page.waitForFunction((sourceId) => {
      const project = JSON.parse(document.getElementById('raw-json-editor').value);
      return project.scenes[0].elements.at(-1).id === sourceId;
    }, {}, reorder.sourceId);
    await page.waitForFunction(({ sourceId, targetId }) => {
      const frame = document.getElementById('composition-preview-frame');
      const source = frame?.contentDocument?.querySelector(`[data-element-id="${sourceId}"]`);
      const target = frame?.contentDocument?.querySelector(`[data-element-id="${targetId}"]`);
      if (!source || !target) return false;
      const frameWindow = frame.contentWindow;
      return Number(frameWindow.getComputedStyle(source).zIndex) > Number(frameWindow.getComputedStyle(target).zIndex);
    }, {}, reorder);

    await page.click('#btn-open-media-library');
    await page.waitForFunction(() => document.querySelectorAll('#media-library-list .media-asset-card').length >= 2);
    const imageAssets = await page.$$eval('#media-library-list .media-asset-card strong', (items) => items.map((item) => item.textContent.trim()));
    assert(imageAssets.includes('Logo MathCA') && imageAssets.includes('Mascot Cu Con'), 'Bundled image library is incomplete.');
    await page.evaluate(() => {
      const card = [...document.querySelectorAll('#media-library-list .media-asset-card')]
        .find((item) => item.querySelector('strong')?.textContent.trim() === 'Mascot Cu Con');
      const transfer = new DataTransfer();
      card.dispatchEvent(new DragEvent('dragstart', { bubbles: true, dataTransfer: transfer }));
      const timeline = document.getElementById('timeline-track');
      timeline.dispatchEvent(new DragEvent('dragover', { bubbles: true, dataTransfer: transfer }));
      timeline.dispatchEvent(new DragEvent('drop', { bubbles: true, dataTransfer: transfer }));
    });
    await page.waitForFunction(() => {
      const project = JSON.parse(document.getElementById('raw-json-editor').value);
      return project.scenes[0].elements.some((element) => element.assetId === 'image-mathca-mascot');
    });

    await page.click('#btn-open-media-library');
    await page.click('.media-library-tab[data-media-kind="video"]');
    await page.waitForFunction(() => [...document.querySelectorAll('#media-library-list .media-asset-card strong')]
      .some((item) => item.textContent.trim() === 'MathCA Logo Loop'));
    await page.evaluate(() => {
      const card = [...document.querySelectorAll('#media-library-list .media-asset-card')]
        .find((item) => item.querySelector('strong')?.textContent.trim() === 'MathCA Logo Loop');
      card.querySelector('.media-asset-actions button').click();
    });
    await page.waitForFunction(() => {
      const project = JSON.parse(document.getElementById('raw-json-editor').value);
      return project.scenes[0].elements.some((element) => element.type === 'video' && element.assetId === 'video-mathca-logo-loop');
    });
    await page.waitForFunction(() => {
      const frame = document.getElementById('composition-preview-frame');
      return document.getElementById('preview-status')?.textContent.includes('sẵn sàng chỉnh sửa')
        && Boolean(frame?.contentDocument?.querySelector('video[src*="mathca-logo-loop.mp4"]'));
    }, { timeout: 30000 });
    const videoPreview = true;

    await page.click('#btn-open-media-library');
    await page.click('.media-library-tab[data-media-kind="audio"]');
    await page.waitForFunction(() => [...document.querySelectorAll('#media-library-list .media-asset-card strong')]
      .some((item) => item.textContent.trim() === 'Happy Math'));
    await page.evaluate(() => {
      const card = [...document.querySelectorAll('#media-library-list .media-asset-card')]
        .find((item) => item.querySelector('strong')?.textContent.trim() === 'Happy Math');
      card.querySelector('.media-asset-actions button').click();
    });
    await page.waitForFunction(() => JSON.parse(document.getElementById('raw-json-editor').value).audio?.bgm?.assetId === 'bgm-happy-math-01');

    await page.click('#btn-open-media-library');
    await page.click('.media-library-tab[data-media-kind="audio"]');
    await page.waitForFunction(() => [...document.querySelectorAll('#media-library-list .media-asset-card strong')]
      .some((item) => item.textContent.trim() === 'Pop'));
    await page.evaluate(() => {
      const card = [...document.querySelectorAll('#media-library-list .media-asset-card')]
        .find((item) => item.querySelector('strong')?.textContent.trim() === 'Pop');
      const transfer = new DataTransfer();
      card.dispatchEvent(new DragEvent('dragstart', { bubbles: true, dataTransfer: transfer }));
      const timeline = document.getElementById('timeline-track');
      timeline.dispatchEvent(new DragEvent('dragover', { bubbles: true, dataTransfer: transfer }));
      timeline.dispatchEvent(new DragEvent('drop', { bubbles: true, dataTransfer: transfer }));
    });
    await page.waitForFunction(() => JSON.parse(document.getElementById('raw-json-editor').value).audio?.sfx?.some((clip) => clip.assetId === 'preset-pop'));

    await page.setViewport({ width: 1366, height: 650, deviceScaleFactor: 1 });
    await page.click('.inspector-tab[data-inspector-tab="properties"]');
    const inspectorScroll = await page.evaluate(() => {
      const inspector = document.getElementById('inspector-content');
      inspector.scrollTop = inspector.scrollHeight;
      return { scrollTop: inspector.scrollTop, scrollHeight: inspector.scrollHeight, clientHeight: inspector.clientHeight, parentHeight: inspector.parentElement.clientHeight, workspaceHeight: document.querySelector('.studio-workspace').clientHeight, viewportHeight: window.innerHeight, computedHeight: getComputedStyle(inspector).height, computedMaxHeight: getComputedStyle(inspector).maxHeight, display: getComputedStyle(inspector).display };
    });
    assert(inspectorScroll.scrollHeight > inspectorScroll.clientHeight && inspectorScroll.scrollTop > 0, 'Right inspector is not scrollable.');

    const final = await page.evaluate(() => {
      const project = JSON.parse(document.getElementById('raw-json-editor').value);
      const scene = project.scenes[0];
      return {
        elementCount: scene.elements.length,
        layerRows: document.querySelectorAll('#elements-track .element-layer-track').length,
        topLayerId: scene.elements.at(-1).id,
        bgmAssetId: project.audio.bgm.assetId,
        sfxAssetIds: project.audio.sfx.map((clip) => clip.assetId),
        hasImage: scene.elements.some((element) => element.assetId === 'image-mathca-mascot'),
        hasVideo: scene.elements.some((element) => element.assetId === 'video-mathca-logo-loop'),
        hasBlob: JSON.stringify(project).includes('blob:'),
      };
    });
    assert(final.layerRows === final.elementCount, 'Dynamic layer rows are not synchronized after media additions.');
    assert(final.hasImage && final.hasVideo && !final.hasBlob, 'Media assets were not persisted safely.');

    await page.screenshot({ path: path.join(artifactsDir, 'e2e-media-layers.png'), fullPage: false });
    assert(consoleErrors.length === 0, `Console errors: ${consoleErrors.join(' | ')}`);
    assert(pageErrors.length === 0, `Page errors: ${pageErrors.join(' | ')}`);

    const report = {
      passed: true,
      checkedAt: new Date().toISOString(),
      fixturePath,
      initial,
      zoom,
      addedText,
      reorder,
      imageAssets,
      videoPreview,
      inspectorScroll,
      final,
      consoleErrors,
      pageErrors,
    };
    fs.writeFileSync(path.join(artifactsDir, 'e2e-media-layers-report.json'), JSON.stringify(report, null, 2));
    console.log(JSON.stringify(report, null, 2));
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error.stack || error.message);
  process.exitCode = 1;
});





