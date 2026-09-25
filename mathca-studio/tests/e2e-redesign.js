const fs = require('node:fs');
const path = require('node:path');
const puppeteer = require('puppeteer-core');

const root = path.join(__dirname, '..');
const requestedFixture = 'C:\\Users\\lexua\\Downloads\\MathCA_Lop3_5PhepTinhNangCao.json';
const fixturePath = fs.existsSync(requestedFixture)
  ? requestedFixture
  : path.join(__dirname, 'fixtures', 'MathCA_Lop3_5PhepTinhNangCao.json');
const runtime = JSON.parse(fs.readFileSync(path.join(root, '.mathca-runtime.json'), 'utf8'));
const artifactsDir = path.join(__dirname, 'artifacts');
fs.mkdirSync(artifactsDir, { recursive: true });

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function getRenderStatus() {
  const response = await fetch('http://localhost:3300/api/render-status', { cache: 'no-store' });
  if (!response.ok) throw new Error(`Render status HTTP ${response.status}`);
  return response.json();
}

async function waitForRender(predicate, timeoutMs, label) {
  const deadline = Date.now() + timeoutMs;
  let latest = null;
  while (Date.now() < deadline) {
    latest = await getRenderStatus();
    if (predicate(latest)) return latest;
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error(`${label}: ${JSON.stringify(latest)}`);
}

async function setControl(page, id, value, eventName = 'change') {
  await page.evaluate(({ controlId, nextValue, emittedEvent }) => {
    const control = document.getElementById(controlId);
    if (!control) throw new Error(`Missing control ${controlId}`);
    if (control.type === 'checkbox') control.checked = Boolean(nextValue);
    else control.value = String(nextValue);
    control.dispatchEvent(new Event(emittedEvent, { bubbles: true }));
    if (emittedEvent === 'input') control.dispatchEvent(new Event('change', { bubbles: true }));
  }, { controlId: id, nextValue: value, emittedEvent: eventName });
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
  const dialogs = [];
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => pageErrors.push(error.message));
  page.on('dialog', async (dialog) => {
    dialogs.push(dialog.message());
    await dialog.dismiss();
  });

  try {
    await page.goto('http://localhost:3300', { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForSelector('#scene-list-container .scene-card', { timeout: 30000 });
    await page.$eval('#file-input-json', (input) => { input.value = ''; });
    const input = await page.$('#file-input-json');
    await input.uploadFile(fixturePath);

    await page.waitForFunction(
      () => document.querySelectorAll('#scene-list-container .scene-card').length === 8,
      { timeout: 30000 },
    );
    await page.waitForFunction(() => {
      try {
        const project = JSON.parse(document.getElementById('raw-json-editor').value);
        return project.scenes?.length === 8
          && typeof project.html_template === 'string'
          && project.html_template.length > 10000
          && document.getElementById('audio-status')?.textContent.includes('Voiceover sẵn sàng: 8 cảnh');
      } catch {
        return false;
      }
    }, { timeout: 120000 });
    await page.waitForFunction(() => {
      const frame = document.getElementById('composition-preview-frame');
      return document.getElementById('preview-status')?.textContent.includes('sẵn sàng chỉnh sửa')
        && Boolean(frame?.contentWindow?.__timelines?.main);
    }, { timeout: 30000 });

    const shell = await page.evaluate(() => ({
      premiumTopbar: document.querySelector('.premium-topbar') !== null,
      premiumTimeline: document.querySelector('.premium-timeline') !== null,
      timelineTrackCount: document.querySelectorAll('#scene-track, #voice-track, #bgm-track, #sfx-track, #elements-track').length,
      sceneClips: document.querySelectorAll('#scene-track .timeline-clip.scene').length,
      voiceClips: document.querySelectorAll('#voice-track .timeline-clip.voice').length,
      iframeReady: Boolean(document.getElementById('composition-preview-frame')?.contentWindow?.__timelines?.main),
      htmlTemplatePreserved: (JSON.parse(document.getElementById('raw-json-editor').value).html_template || '').length > 10000,
    }));
    assert(shell.premiumTopbar && shell.premiumTimeline, 'Premium shell is not active.');
    assert(shell.timelineTrackCount === 5, 'The five-track timeline is incomplete.');
    assert(shell.sceneClips === 8 && shell.voiceClips === 8, 'Scene/voice timeline clips are incomplete.');
    assert(shell.iframeReady && shell.htmlTemplatePreserved, 'Original HTML template preview is not preserved.');

    await page.click('#rail-audio');
    await page.waitForFunction(() => document.getElementById('audio-inspector-panel')?.classList.contains('active'));
    await page.click('#btn-open-audio-library');
    await page.waitForFunction(() => document.querySelectorAll('#audio-library-list .audio-asset-row').length > 0);
    const libraryNames = await page.$$eval('#audio-library-list .audio-asset-row strong', (items) => items.map((item) => item.textContent.trim()));
    assert(libraryNames.includes('Happy Math'), 'Happy Math is missing from the audio library.');
    await page.evaluate(() => {
      const row = [...document.querySelectorAll('#audio-library-list .audio-asset-row')]
        .find((item) => item.querySelector('strong')?.textContent.trim() === 'Happy Math');
      row?.querySelector('.choose-library-asset')?.click();
    });
    await page.waitForFunction(() => document.getElementById('bgm-name')?.textContent === 'Happy Math');

    await setControl(page, 'bgm-volume', 30, 'input');
    await setControl(page, 'bgm-start', 0);
    await setControl(page, 'bgm-end', 29.5);
    await setControl(page, 'bgm-fade-in', 0.8);
    await setControl(page, 'bgm-fade-out', 1.2);
    await setControl(page, 'bgm-loop', true);
    await setControl(page, 'bgm-ducking', true);
    await setControl(page, 'bgm-duck-db', -12, 'input');
    await setControl(page, 'sfx-master-volume', 50, 'input');

    await page.evaluate(() => {
      const audio = document.getElementById('audio-preview-element');
      audio.currentTime = 6.1;
      audio.dispatchEvent(new Event('timeupdate'));
    });
    await page.evaluate(() => {
      const pop = [...document.querySelectorAll('#sfx-presets .sfx-preset')]
        .find((button) => button.textContent.trim() === 'Pop');
      pop?.click();
    });
    await page.waitForFunction(() => document.querySelectorAll('#sfx-track .timeline-clip.sfx').length === 1);
    await setControl(page, 'sfx-clip-volume', 42, 'input');
    await setControl(page, 'sfx-clip-pan', -8, 'input');

    const beforeNudge = await page.evaluate(() => JSON.parse(document.getElementById('raw-json-editor').value).audio.sfx[0].startTime);
    await page.click('#btn-sfx-nudge-right');
    const afterNudge = await page.evaluate(() => JSON.parse(document.getElementById('raw-json-editor').value).audio.sfx[0].startTime);
    assert(afterNudge > beforeNudge, 'SFX nudge did not move the clip.');
    await page.click('#btn-undo');
    const afterUndo = await page.evaluate(() => JSON.parse(document.getElementById('raw-json-editor').value).audio.sfx[0].startTime);
    assert(Math.abs(afterUndo - beforeNudge) < 0.02, 'Undo did not restore the SFX position.');
    await page.click('#btn-redo');
    const afterRedo = await page.evaluate(() => JSON.parse(document.getElementById('raw-json-editor').value).audio.sfx[0].startTime);
    assert(Math.abs(afterRedo - afterNudge) < 0.02, 'Redo did not restore the SFX move.');

    const audioProject = await page.evaluate(() => JSON.parse(document.getElementById('raw-json-editor').value));
    assert(audioProject.audio.bgm.enabled === true, 'BGM was not enabled.');
    assert(audioProject.audio.bgm.assetId === 'bgm-happy-math-01', 'BGM asset id is not durable.');
    assert(audioProject.audio.bgm.src === 'assets/audio-library/bgm/happy-math.wav', 'BGM source is not project-relative.');
    assert(audioProject.audio.sfx[0].assetId === 'preset-pop', 'SFX asset id does not match the library manifest.');
    assert(audioProject.audio.sfx[0].src === 'preset:pop', 'SFX preset source is incorrect.');
    assert(!JSON.stringify(audioProject).includes('blob:'), 'A blob URL leaked into project JSON.');
    assert(audioProject.html_template && audioProject.html_template.length > 10000, 'Audio editing removed html_template.');

    await new Promise((resolve) => setTimeout(resolve, 7000));
    const autosave = await page.evaluate(() => {
      const draft = JSON.parse(localStorage.getItem('mathca-studio.autosave.v1') || 'null');
      return {
        state: document.getElementById('save-state')?.textContent || '',
        hasDraft: Boolean(draft?.project?.audio?.bgm?.assetId),
        assetId: draft?.project?.audio?.bgm?.assetId || null,
      };
    });
    assert(autosave.state.includes('tu luu') || autosave.state.includes('tự lưu'), 'Autosave state did not update.');
    assert(autosave.hasDraft && autosave.assetId === 'bgm-happy-math-01', 'Autosave did not persist the audio project draft.');

    await page.click('#btn-play-pause');
    await new Promise((resolve) => setTimeout(resolve, 900));
    const playback = await page.evaluate(() => {
      const frame = document.getElementById('composition-preview-frame');
      const bgm = document.getElementById('bgm-preview-element');
      const voice = document.getElementById('audio-preview-element');
      return {
        bgmElements: document.querySelectorAll('#bgm-preview-element').length,
        bgmSrc: bgm?.currentSrc || bgm?.src || '',
        bgmPaused: bgm?.paused ?? true,
        voiceSrc: voice?.currentSrc || voice?.src || '',
        iframeAudioMuted: [...(frame?.contentDocument?.querySelectorAll('audio') || [])].every((item) => item.muted),
      };
    });
    await page.click('#btn-play-pause');
    assert(playback.bgmElements === 1, 'BGM preview was duplicated.');
    assert(playback.bgmSrc.includes('happy-math.wav'), 'BGM preview is not using the durable asset.');
    assert(/voice-[a-f0-9]{16}\.mp3/.test(playback.voiceSrc), 'Voice preview is not separated from the master mix.');
    assert(playback.iframeAudioMuted, 'Iframe audio is not muted, causing duplicate playback.');

    const responsive = [];
    for (const viewport of [
      { width: 1366, height: 768, name: '1366x768' },
      { width: 1440, height: 900, name: '1440x900' },
      { width: 1920, height: 1080, name: '1920x1080' },
    ]) {
      await page.setViewport({ width: viewport.width, height: viewport.height, deviceScaleFactor: 1 });
      await new Promise((resolve) => setTimeout(resolve, 250));
      const metrics = await page.evaluate(() => ({
        viewportWidth: window.innerWidth,
        scrollWidth: document.documentElement.scrollWidth,
        canvasVisible: document.querySelector('.stage-viewport-container')?.getBoundingClientRect().width > 100,
        inspectorVisible: document.querySelector('.studio-inspector')?.getBoundingClientRect().width > 100,
        tracksVisible: [...document.querySelectorAll('.editor-track, .element-layer-track')].filter((item) => item.getBoundingClientRect().height > 0).length,
        elementRows: document.querySelectorAll('.element-layer-track').length,
      }));
      responsive.push({ ...viewport, ...metrics });
      assert(metrics.scrollWidth <= metrics.viewportWidth + 2, `Horizontal overflow at ${viewport.name}.`);
      assert(metrics.canvasVisible && metrics.inspectorVisible && metrics.elementRows > 0 && metrics.tracksVisible === 4 + metrics.elementRows, `Core workspace or dynamic layer rows are hidden at ${viewport.name}.`);
      await page.screenshot({ path: path.join(artifactsDir, `premium-${viewport.name}.png`), fullPage: false });
    }

    await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
    await page.click('#btn-render-trigger');
    await page.waitForFunction(() => document.getElementById('modal-render-progress')?.classList.contains('active'));
    await page.click('.render-preset[data-resolution="square"]');
    await setControl(page, 'render-fps', 25);
    await setControl(page, 'render-quality', 'draft');
    const renderConfig = await page.evaluate(() => ({
      presets: document.querySelectorAll('.render-preset').length,
      activeResolution: document.querySelector('.render-preset.active')?.dataset.resolution,
      fps: document.getElementById('render-fps').value,
      quality: document.getElementById('render-quality').value,
      summary: document.getElementById('render-audio-summary').textContent,
    }));
    assert(renderConfig.presets === 3 && renderConfig.activeResolution === 'square', 'Render presets are not selectable.');
    assert(renderConfig.fps === '25' && renderConfig.quality === 'draft', 'Render configuration was not applied.');
    assert(renderConfig.summary.includes('BGM 30%') && renderConfig.summary.includes('1 SFX'), 'Render audio summary is incorrect.');

    await page.click('#btn-start-render');
    const firstJob = await waitForRender((status) => status.active && status.id, 180000, 'First render did not start');
    await page.click('#modal-render-progress .btn-close-modal');
    const modalStayedOpen = await page.$eval('#modal-render-progress', (modal) => modal.classList.contains('active'));
    assert(modalStayedOpen, 'Active render modal closed without cancellation.');
    await page.click('#btn-cancel-render');
    const firstCancelled = await waitForRender(
      (status) => !status.active && /huy|hủy/i.test(status.stage || ''),
      60000,
      'First render did not cancel',
    );

    await page.click('#btn-start-render');
    const secondJob = await waitForRender(
      (status) => status.active && status.id && status.id !== firstJob.id,
      180000,
      'Render retry did not start',
    );
    await page.click('#btn-cancel-render');
    const secondCancelled = await waitForRender(
      (status) => !status.active && /huy|hủy/i.test(status.stage || ''),
      60000,
      'Retried render did not cancel',
    );

    const finalState = await page.evaluate(() => ({
      sceneCount: document.querySelectorAll('#scene-track .timeline-clip.scene').length,
      voiceCount: document.querySelectorAll('#voice-track .timeline-clip.voice').length,
      bgmCount: document.querySelectorAll('#bgm-track .timeline-clip.bgm').length,
      sfxCount: document.querySelectorAll('#sfx-track .timeline-clip.sfx').length,
      elementTrackCount: document.querySelectorAll('#elements-track .timeline-clip.element').length,
      audioStatus: document.getElementById('audio-status')?.textContent || '',
      renderStage: document.getElementById('render-stage-text')?.textContent || '',
    }));

    assert(consoleErrors.length === 0, `Console errors: ${consoleErrors.join(' | ')}`);
    assert(pageErrors.length === 0, `Page errors: ${pageErrors.join(' | ')}`);
    assert(dialogs.length === 0, `Unexpected dialogs: ${dialogs.join(' | ')}`);

    const report = {
      passed: true,
      checkedAt: new Date().toISOString(),
      fixturePath,
      shell,
      libraryNames,
      audio: {
        bgm: audioProject.audio.bgm,
        sfxMasterVolume: audioProject.audio.sfxMasterVolume,
        sfx: audioProject.audio.sfx,
        noBlobUrls: !JSON.stringify(audioProject.audio).includes('blob:'),
      },
      history: { beforeNudge, afterNudge, afterUndo, afterRedo },
      autosave,
      playback,
      responsive,
      render: {
        config: renderConfig,
        firstJob: { id: firstJob.id, cancelledStage: firstCancelled.stage },
        secondJob: { id: secondJob.id, cancelledStage: secondCancelled.stage },
      },
      finalState,
      consoleErrors,
      pageErrors,
      dialogs,
    };
    fs.writeFileSync(path.join(artifactsDir, 'e2e-redesign-report.json'), JSON.stringify(report, null, 2));
    console.log(JSON.stringify(report, null, 2));
  } finally {
    const status = await getRenderStatus().catch(() => null);
    if (status?.active && status.id) {
      await fetch(`http://localhost:3300/api/render/${encodeURIComponent(status.id)}/cancel`, { method: 'POST' }).catch(() => {});
    }
    await browser.close();
  }
})().catch((error) => {
  console.error(error.stack || error.message);
  process.exitCode = 1;
});





