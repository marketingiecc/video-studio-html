const fs = require('node:fs');
const path = require('node:path');
const puppeteer = require('puppeteer-core');

const root = path.join(__dirname, '..');
const fixturePath = path.join(__dirname, 'fixtures', 'MathCA_Lop3_5PhepTinhNangCao.json');
const fixture = JSON.parse(fs.readFileSync(fixturePath, 'utf8'));
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
  await page.setViewport({ width: 1680, height: 1050, deviceScaleFactor: 1 });
  const consoleErrors = [];
  const pageErrors = [];
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => pageErrors.push(error.message));

  try {
    await page.goto('http://localhost:3300', { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForSelector('#scene-list-container .scene-card', { timeout: 30000 });

    const fallbackBeforeImport = await page.evaluate(() => ({
      templateMode: document.getElementById('composition-root').classList.contains('template-preview-active'),
      sceneElements: document.querySelectorAll('#scene-render-area .scene-elem').length,
      renderEnabled: !document.getElementById('btn-render-trigger').disabled,
    }));
    assert(!fallbackBeforeImport.templateMode, 'Preset không có html_template phải tiếp tục dùng canvas gốc.');
    assert(fallbackBeforeImport.sceneElements > 0, 'Canvas gốc không render được element preset.');
    assert(fallbackBeforeImport.renderEnabled, 'Nút render phải sẵn sàng trước import.');

    const input = await page.$('#file-input-json');
    assert(input, 'Không tìm thấy input import JSON.');
    await input.uploadFile(fixturePath);

    await page.waitForFunction(
      () => document.querySelectorAll('#scene-list-container .scene-card').length === 8,
      { timeout: 30000 },
    );
    await page.waitForFunction(
      () => document.getElementById('preview-status')?.textContent.includes('sẵn sàng chỉnh sửa'),
      { timeout: 30000 },
    );
    await page.waitForFunction(
      () => document.getElementById('audio-status')?.textContent.includes('Voiceover sẵn sàng'),
      { timeout: 120000 },
    );
    await page.waitForFunction(
      () => document.getElementById('preview-status')?.textContent.includes('sẵn sàng chỉnh sửa'),
      { timeout: 30000 },
    );

    const result = await page.evaluate((expectedTemplate) => {
      const rawProject = JSON.parse(document.getElementById('raw-json-editor').value);
      const frame = document.getElementById('composition-preview-frame');
      const frameDoc = frame.contentDocument;
      const frameWindow = frame.contentWindow;
      const audio = document.getElementById('audio-preview-element');
      const boundElements = frameDoc.querySelectorAll('[data-element-id]').length;

      audio.currentTime = 15.6;
      audio.dispatchEvent(new Event('timeupdate'));

      return {
        sceneCount: document.querySelectorAll('#scene-list-container .scene-card').length,
        activeSceneText: document.querySelector('#scene-list-container .scene-card.active')?.textContent || '',
        previewStatus: document.getElementById('preview-status')?.textContent || '',
        audioStatus: document.getElementById('audio-status')?.textContent || '',
        audioSrc: audio.currentSrc || audio.src,
        renderEnabled: !document.getElementById('btn-render-trigger').disabled,
        generateAudioEnabled: !document.getElementById('btn-generate-audio').disabled,
        rawTopKeys: Object.keys(rawProject),
        rawFirstSceneKeys: Object.keys(rawProject.scenes[0]),
        rawHasAudioFile: Object.prototype.hasOwnProperty.call(rawProject.metadata || {}, 'audioFile'),
        rawTemplateMatches: rawProject.html_template === expectedTemplate,
        frameTitle: frameDoc.title,
        frameHasComposition: Boolean(frameDoc.querySelector('[data-composition-id="main"]')),
        frameHasSceneQ5: Boolean(frameDoc.getElementById('scene-q5')),
        frameGsapSrc: frameDoc.querySelector('script[src*="gsap"]')?.getAttribute('src') || '',
        frameTimelineReady: Boolean(frameWindow.__timelines?.main),
        frameAudioMuted: [...frameDoc.querySelectorAll('audio')].every((item) => item.muted),
        boundElements,
        timelineTime: frameWindow.__timelines?.main?.time?.() ?? null,
      };
    }, fixture.html_template);

    assert(result.sceneCount === 8, 'Import không hiển thị đủ 8 cảnh.');
    assert(result.activeSceneText.includes('Câu 5'), 'Timeline không đồng bộ cảnh tại mốc 15.6 giây.');
    assert(result.previewStatus.includes('sẵn sàng chỉnh sửa'), 'Preview HTML gốc chưa sẵn sàng.');
    assert(result.audioStatus.includes('Voiceover sẵn sàng: 8 cảnh'), 'Voiceover không tạo đủ 8 cảnh.');
    assert(/voice-[a-f0-9]{16}\.mp3/.test(result.audioSrc), 'Audio preview chưa dùng file voiceover theo hash.');
    assert(result.renderEnabled && result.generateAudioEnabled, 'Các nút lõi chưa được mở lại sau import.');
    assert(JSON.stringify(result.rawTopKeys) === JSON.stringify(Object.keys(fixture)), 'Top-level JSON bị thay đổi.');
    assert(JSON.stringify(result.rawFirstSceneKeys) === JSON.stringify(Object.keys(fixture.scenes[0])), 'Schema scene bị thay đổi.');
    assert(!result.rawHasAudioFile, 'Studio đã chèn metadata.audioFile vào JSON gốc.');
    assert(result.rawTemplateMatches, 'html_template trong JSON bị ghi đè.');
    assert(result.frameHasComposition && result.frameHasSceneQ5, 'Iframe preview không dựng đúng HTML gốc.');
    assert(result.frameGsapSrc === 'assets/gsap.min.js', 'Preview chưa chuyển GSAP sang asset cục bộ.');
    assert(result.frameTimelineReady, 'Timeline HTML gốc chưa được đăng ký.');
    assert(result.frameAudioMuted, 'Iframe preview phát audio trùng với player chính.');
    assert(result.boundElements >= 20, 'Chưa liên kết đủ element preview với Inspector.');
    assert(Math.abs(result.timelineTime - 15.6) < 0.2, 'Playhead preview HTML không đồng bộ audio.');

    const editResult = await page.evaluate(() => {
      const frame = document.getElementById('composition-preview-frame');
      const frameDoc = frame.contentDocument;
      const target = frameDoc.querySelector('[data-element-id="q5-tip"]');
      const input = document.getElementById('prop-text-content');
      const originalText = target.textContent;
      target.dispatchEvent(new frame.contentWindow.MouseEvent('mousedown', { bubbles: true, clientX: 300, clientY: 650 }));
      frame.contentWindow.dispatchEvent(new frame.contentWindow.MouseEvent('mouseup', { bubbles: true }));
      const inspectorSelected = document.getElementById('prop-name').value;
      input.value = `${originalText} [E2E]`;
      input.dispatchEvent(new Event('input', { bubbles: true }));
      const projectAfterEdit = JSON.parse(document.getElementById('raw-json-editor').value);
      const previewTextAfterEdit = target.textContent;
      input.value = originalText;
      input.dispatchEvent(new Event('input', { bubbles: true }));
      return {
        inspectorSelected,
        previewTextAfterEdit,
        jsonTextAfterEdit: projectAfterEdit.scenes[5].elements.find((element) => element.id === 'q5-tip')?.text,
        templateStillPresent: typeof projectAfterEdit.html_template === 'string' && projectAfterEdit.html_template.length > 10000,
      };
    });
    assert(editResult.inspectorSelected, 'Không chọn được element trong preview HTML gốc.');
    assert(editResult.previewTextAfterEdit.endsWith('[E2E]'), 'Inspector không cập nhật trực tiếp preview.');
    assert(editResult.jsonTextAfterEdit.endsWith('[E2E]'), 'Inspector không cập nhật đúng field JSON.');
    assert(editResult.templateStillPresent, 'Chỉnh sửa Inspector đã làm mất html_template.');

    await page.click('#btn-duplicate-elem');
    await page.waitForFunction(() => {
      const project = JSON.parse(document.getElementById('raw-json-editor').value);
      return project.scenes[5].elements.length === 4
        && document.getElementById('preview-status')?.textContent.includes('sẵn sàng chỉnh sửa');
    }, { timeout: 30000 });
    const duplicateResult = await page.evaluate(() => {
      const project = JSON.parse(document.getElementById('raw-json-editor').value);
      const clone = project.scenes[5].elements[3];
      const previewDoc = document.getElementById('composition-preview-frame').contentDocument;
      return {
        cloneId: clone.id,
        cloneVisible: [...previewDoc.querySelectorAll('[data-element-id]')].some((node) => node.dataset.elementId === clone.id),
        selectedName: document.getElementById('prop-name').value,
      };
    });
    assert(duplicateResult.cloneVisible, 'Nhân bản không xuất hiện trong preview template.');
    assert(duplicateResult.selectedName.includes('Bản sao'), 'Inspector không chọn bản sao mới.');

    page.once('dialog', (dialog) => dialog.accept());
    await page.click('#btn-delete-elem');
    await page.waitForFunction(() => {
      const project = JSON.parse(document.getElementById('raw-json-editor').value);
      return project.scenes[5].elements.length === 3
        && document.getElementById('preview-status')?.textContent.includes('sẵn sàng chỉnh sửa');
    }, { timeout: 30000 });
    const cloneStillVisible = await page.evaluate((cloneId) => {
      const previewDoc = document.getElementById('composition-preview-frame').contentDocument;
      return [...previewDoc.querySelectorAll('[data-element-id]')].some((node) => node.dataset.elementId === cloneId);
    }, duplicateResult.cloneId);
    assert(!cloneStillVisible, 'Xóa element chưa cập nhật preview template.');

    await page.screenshot({
      path: path.join(artifactsDir, 'e2e-import-preview.png'),
      fullPage: true,
    });

    const report = {
      passed: true,
      checkedAt: new Date().toISOString(),
      fixture: path.basename(fixturePath),
      fallbackBeforeImport,
      result,
      editResult,
      duplicateResult,
      consoleErrors,
      pageErrors,
    };
    fs.writeFileSync(path.join(artifactsDir, 'e2e-import-report.json'), JSON.stringify(report, null, 2));
    assert(consoleErrors.length === 0, `Console errors: ${consoleErrors.join(' | ')}`);
    assert(pageErrors.length === 0, `Page errors: ${pageErrors.join(' | ')}`);
    console.log(JSON.stringify(report, null, 2));
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error.stack || error.message);
  process.exitCode = 1;
});




