/**
 * MathCA Video Studio Pro - Complete Studio Client Engine
 * Features:
 * - Direct Canvas Element Selection & Precise Bounding Box with 8 Handles
 * - Drag-to-Move Positioning with Realtime Inspector Sync
 * - Add Text, Add Logo, Upload Images (PNG/JPG/SVG)
 * - Duplicate Element (Ctrl+D), Delete Element (Del/Backspace), Arrow Key Nudges
 * - 4 Diverse Content Presets (Speed Math, Word Problem, Speed Quiz, Comparison)
 * - Live GSAP Animation Engine on Preview & HyperFrames HTML Export
 */

// Global App State
let currentProject = null;
let originalCoords = new Map();
let currentSceneIndex = 0;
let selectedElementId = null;
let activeDomElem = null;
let activeIsGlobal = false;
let scaleFactor = 0.45;
let previewFitScale = 0.45;
let previewZoomFactor = 1;
let isPlaying = false;
let playAnimFrameId = null;
let renderPollInterval = null;
let audioGenerationPromise = null;
let audioStatusPollInterval = null;
let serverOnline = false;
let selectedOutputDirectoryHandle = null;
let renderCompletionHandled = false;
let healthCheckInFlight = null;
let sourceProjectSnapshot = null;
let runtimeAudioFile = null;
let previewFrameReady = false;
let previewLoadSequence = 0;
let runtimeAudioState = null;
let audioTouched = false;
let audioMixDirty = false;
let selectedSfxId = null;
let bgmRuntimeUrl = null;
let currentPlayheadTime = 0;
let previousTickTime = 0;
let renderJobId = null;
let renderConfig = { fps: 30, quality: 'looks', resolution: 'portrait', includeAudio: true };
let premiumHistory = [];
let premiumRedo = [];
let premiumHistorySnapshot = null;
let autosaveTimer = null;
let projectLoadRevision = 0;
let libraryKind = 'bgm';

// DOM Cache
const canvasScaler = document.getElementById('canvas-scaler');
const canvasPanSurface = document.getElementById('canvas-pan-surface');
const compositionRoot = document.getElementById('composition-root');
const sceneRenderArea = document.getElementById('scene-render-area');
const interactiveOverlay = document.getElementById('interactive-overlay');
const activeSelectionBox = document.getElementById('active-selection-box');
const sceneListContainer = document.getElementById('scene-list-container');
const rawJsonEditor = document.getElementById('raw-json-editor');
const audioEl = document.getElementById('audio-preview-element');
const btnAudioToggle = document.getElementById('btn-audio-toggle');
const btnGenerateAudio = document.getElementById('btn-generate-audio');
const audioStatus = document.getElementById('audio-status');
const studioJobProgress = document.getElementById('studio-job-progress');
const studioJobProgressLabel = document.getElementById('studio-job-progress-label');
const studioJobProgressPercent = document.getElementById('studio-job-progress-percent');
const studioJobProgressBar = document.getElementById('studio-job-progress-bar');
const serverStatus = document.getElementById('server-status');
const btnRenderTrigger = document.getElementById('btn-render-trigger');
const btnSelectOutputFolder = document.getElementById('btn-select-output-folder');
const outputFolderStatus = document.getElementById('output-folder-status');
const previewFrame = document.getElementById('composition-preview-frame');
const previewStatus = document.getElementById('preview-status');

// Playback Elements
const btnPlayPause = document.getElementById('btn-play-pause');
const playIcon = document.getElementById('play-icon');
const timeDisplay = document.getElementById('time-display');
const timelineTrack = document.getElementById('timeline-track');
const timelineFill = document.getElementById('timeline-fill');
const timelineScrubber = document.getElementById('timeline-scrubber');

// Inspector Elements
const noSelectionHint = document.getElementById('no-selection-hint');
const elementEditorForm = document.getElementById('element-editor-form');
const selectedTypeBadge = document.getElementById('selected-type-badge');
const propName = document.getElementById('prop-name');
const propPosX = document.getElementById('prop-pos-x');
const propPosY = document.getElementById('prop-pos-y');
const propFontSize = document.getElementById('prop-font-size');
const propWidth = document.getElementById('prop-width');
const propTextContent = document.getElementById('prop-text-content');

// Animation Controls
const propAnimType = document.getElementById('prop-anim-type');
const propAnimLoop = document.getElementById('prop-anim-loop');
const propAnimDuration = document.getElementById('prop-anim-duration');
const propAnimDelay = document.getElementById('prop-anim-delay');
const btnPreviewAnim = document.getElementById('btn-preview-anim');
const btnPlaySceneAnim = document.getElementById('btn-play-scene-anim');

// Action Buttons
const btnAlignCenter = document.getElementById('btn-align-center');
const btnResetPos = document.getElementById('btn-reset-pos');

// Toolbar Buttons
const btnAddText = document.getElementById('btn-add-text');
const btnAddLogo = document.getElementById('btn-add-logo');
const btnUploadImage = document.getElementById('btn-upload-image');
const btnDuplicateElem = document.getElementById('btn-duplicate-elem');
const btnDeleteElem = document.getElementById('btn-delete-elem');
const btnPresetTemplates = document.getElementById('btn-preset-templates');

// Hidden File Inputs
const fileInputJson = document.getElementById('file-input-json');
const inputUploadImage = document.getElementById('input-upload-image');
const inputUploadLogo = document.getElementById('input-upload-logo');

// Modals
const modalPasteJson = document.getElementById('modal-paste-json');
const pasteJsonTextarea = document.getElementById('paste-json-textarea');
const modalRenderProgress = document.getElementById('modal-render-progress');
const renderStageText = document.getElementById('render-stage-text');
const renderProgressBar = document.getElementById('render-progress-bar');
const renderPercentText = document.getElementById('render-percent-text');
const renderSuccessBox = document.getElementById('render-success-box');
const btnDownloadVideo = document.getElementById('btn-download-video');
const renderOutputLocation = document.getElementById('render-output-location');
const modalChooseLogo = document.getElementById('modal-choose-logo');
const modalPresets = document.getElementById('modal-presets');

/**
 * 1. Initialize Application
 */
window.addEventListener('DOMContentLoaded', async () => {
  initAutoScaling();
  initTabNavigation();
  initModals();
  initTimeline();
  initInspectorEvents();
  initActionButtons();
  initCanvasToolbar();
  initKeyboardShortcuts();
  initSettingsEvents();
  initAudioControls();
  initTimelineVoicePicker();
  initPremiumStudio();
  initUpdateManager();
  await checkServerHealth();
  window.setInterval(() => checkServerHealth(), 5000);

  // Load initial project (meo_nhan_11_lop_3.json)
  await loadPresetProject('meo_nhan_11_lop_3.json', { regenerateAudio: true });
});

/**
 * Responsive Canvas Scaler (Scale to fit viewport height/width)
 */
function initAutoScaling() {
  const stageContainer = document.querySelector('.stage-viewport-container');
  const zoomInput = document.getElementById('preview-zoom');
  const zoomOutput = document.getElementById('preview-zoom-output');

  function applyPreviewZoom(preserveCenter = true) {
    if (!stageContainer || !canvasPanSurface || !canvasScaler) return;
    const previousWidth = Math.max(1, canvasPanSurface.offsetWidth);
    const previousHeight = Math.max(1, canvasPanSurface.offsetHeight);
    const centerX = stageContainer.scrollLeft + stageContainer.clientWidth / 2;
    const centerY = stageContainer.scrollTop + stageContainer.clientHeight / 2;
    const ratioX = centerX / previousWidth;
    const ratioY = centerY / previousHeight;

    scaleFactor = Math.max(0.08, previewFitScale * previewZoomFactor);
    canvasPanSurface.style.width = `${Math.round(1080 * scaleFactor)}px`;
    canvasPanSurface.style.height = `${Math.round(1920 * scaleFactor)}px`;
    canvasScaler.style.transform = `scale(${scaleFactor})`;
    if (zoomInput) zoomInput.value = String(Math.round(previewZoomFactor * 100));
    if (zoomOutput) zoomOutput.textContent = previewZoomFactor === 1 ? `Fit ${Math.round(scaleFactor * 100)}%` : `${Math.round(scaleFactor * 100)}%`;

    if (preserveCenter) {
      requestAnimationFrame(() => {
        stageContainer.scrollLeft = Math.max(0, ratioX * canvasPanSurface.offsetWidth - stageContainer.clientWidth / 2);
        stageContainer.scrollTop = Math.max(0, ratioY * canvasPanSurface.offsetHeight - stageContainer.clientHeight / 2);
      });
    }
    updateSelectionBox();
  }

  function updateFitScale() {
    if (!stageContainer) return;
    const availH = Math.max(120, stageContainer.clientHeight - 28);
    const availW = Math.max(120, stageContainer.clientWidth - 28);
    previewFitScale = Math.min(availH / 1920, availW / 1080);
    applyPreviewZoom(false);
  }

  function setZoomFactor(value) {
    previewZoomFactor = Math.max(0.5, Math.min(2.2, Number(value) || 1));
    applyPreviewZoom(true);
  }

  zoomInput?.addEventListener('input', (event) => setZoomFactor(Number(event.target.value) / 100));
  document.getElementById('btn-preview-zoom-out')?.addEventListener('click', () => setZoomFactor(previewZoomFactor - 0.1));
  document.getElementById('btn-preview-zoom-in')?.addEventListener('click', () => setZoomFactor(previewZoomFactor + 0.1));
  document.getElementById('btn-preview-fit')?.addEventListener('click', () => setZoomFactor(1));
  stageContainer?.addEventListener('wheel', (event) => {
    if (!event.ctrlKey && !event.metaKey) return;
    event.preventDefault();
    setZoomFactor(previewZoomFactor + (event.deltaY < 0 ? 0.1 : -0.1));
  }, { passive: false });

  window.addEventListener('resize', updateFitScale);
  setTimeout(updateFitScale, 50);
}

/**
 * Tab Navigation (Kịch bản / Mã JSON / Cài đặt)
 */
function initTabNavigation() {
  const tabs = document.querySelectorAll('.tab-btn');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.tab-pane').forEach(p => p.style.display = 'none');
      
      tab.classList.add('active');
      const targetId = tab.dataset.tab;
      const targetPane = document.getElementById(targetId);
      if (targetPane) targetPane.style.display = targetId === 'tab-json' ? 'block' : 'flex';

      if (targetId === 'tab-json') {
        syncJsonEditor();
      }
    });
  });

  document.getElementById('btn-apply-json').addEventListener('click', async () => {
    try {
      const parsed = JSON.parse(rawJsonEditor.value);
      if (!parsed.scenes || !Array.isArray(parsed.scenes)) {
        throw new Error('Dữ liệu JSON phải có trường "scenes" dạng mảng!');
      }
      await loadProjectData(parsed, { regenerateAudio: true, source: 'JSON editor' });
      showToast('Đã cập nhật dự án từ JSON thành công! ✨');
    } catch (err) {
      alert('Lỗi cú pháp JSON: ' + err.message);
    }
  });
}

function cloneJson(value) {
  return JSON.parse(JSON.stringify(value));
}

function clampNumber(value, min, max, fallback) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
}

function normalizeAudioState(audio, duration) {
  const source = audio && typeof audio === 'object' ? cloneJson(audio) : {};
  const bgm = source.bgm && typeof source.bgm === 'object' ? source.bgm : {};
  const ducking = bgm.ducking && typeof bgm.ducking === 'object' ? bgm.ducking : {};
  return {
    bgm: {
      enabled: Boolean(bgm.enabled),
      src: String(bgm.src || ''),
      assetId: bgm.assetId || null,
      name: String(bgm.name || 'Chưa chọn nhạc'),
      volume: clampNumber(bgm.volume, 0, 1, 0.3),
      startTime: clampNumber(bgm.startTime, 0, duration, 0),
      endTime: clampNumber(bgm.endTime, 0.1, duration, duration),
      loop: bgm.loop !== false,
      fadeIn: clampNumber(bgm.fadeIn, 0, duration, 0.8),
      fadeOut: clampNumber(bgm.fadeOut, 0, duration, 1.2),
      ducking: {
        enabled: ducking.enabled !== false,
        underVoiceDb: clampNumber(ducking.underVoiceDb, -24, -3, -12),
        attack: clampNumber(ducking.attack, 0.01, 2, 0.12),
        release: clampNumber(ducking.release, 0.01, 4, 0.35),
      },
    },
    sfxMasterVolume: clampNumber(source.sfxMasterVolume, 0, 1, 0.5),
    sfx: Array.isArray(source.sfx)
      ? source.sfx.map((clip, index) => ({
          id: String(clip.id || `sfx-${index + 1}`),
          src: String(clip.src || ''),
          assetId: clip.assetId || null,
          name: String(clip.name || `SFX ${index + 1}`),
          startTime: clampNumber(clip.startTime, 0, duration, 0),
          duration: clampNumber(clip.duration, 0.05, duration, 0.9),
          volume: clampNumber(clip.volume, 0, 1, 0.42),
          pan: clampNumber(clip.pan, -1, 1, 0),
        }))
      : [],
  };
}

function ensureRuntimeAudioState() {
  const duration = getProjectDuration();
  if (!runtimeAudioState) runtimeAudioState = normalizeAudioState(currentProject?.audio, duration);
  runtimeAudioState.bgm.endTime = Math.min(duration, Math.max(runtimeAudioState.bgm.startTime + 0.1, runtimeAudioState.bgm.endTime || duration));
  return runtimeAudioState;
}

function persistRuntimeAudio() {
  if (!currentProject) return;
  currentProject.audio = cloneJson(ensureRuntimeAudioState());
  audioTouched = true;
  audioMixDirty = true;
  markProjectDirty();
  syncJsonEditor();
}

function snapshotProjectState() {
  if (!currentProject) return null;
  return JSON.stringify({ project: currentProject, audio: ensureRuntimeAudioState(), sceneIndex: currentSceneIndex, selectedSfxId });
}

function restoreProjectState(snapshot) {
  if (!snapshot) return;
  const state = JSON.parse(snapshot);
  currentProject = state.project;
  runtimeAudioState = state.audio;
  currentSceneIndex = Math.min(state.sceneIndex || 0, Math.max(0, currentProject.scenes.length - 1));
  selectedSfxId = state.selectedSfxId || null;
  recordOriginalPositions();
  buildSidebarScenes();
  refreshProjectPreview();
  syncSettingsUI();
  syncJsonEditor();
  renderPremiumAudioUI();
  renderPremiumTimeline();
  markProjectDirty('Đã hoàn tác thay đổi');
}

function pushPremiumHistory(before) {
  if (!before) return;
  const current = snapshotProjectState();
  if (before === current) return;
  premiumHistory.push(before);
  if (premiumHistory.length > 60) premiumHistory.shift();
  premiumRedo = [];
  updateHistoryButtons();
}

function premiumUndo() {
  const previous = premiumHistory.pop();
  if (!previous) return;
  premiumRedo.push(snapshotProjectState());
  restoreProjectState(previous);
  updateHistoryButtons();
}

function premiumRedoAction() {
  const next = premiumRedo.pop();
  if (!next) return;
  premiumHistory.push(snapshotProjectState());
  restoreProjectState(next);
  updateHistoryButtons();
}

function updateHistoryButtons() {
  const undo = document.getElementById('btn-undo');
  const redo = document.getElementById('btn-redo');
  if (undo) undo.disabled = premiumHistory.length === 0;
  if (redo) redo.disabled = premiumRedo.length === 0;
}

function markProjectDirty(message) {
  const saveState = document.getElementById('save-state');
  if (saveState) saveState.textContent = message || 'Chưa lưu';
  clearTimeout(autosaveTimer);
  autosaveTimer = setTimeout(() => {
    try {
      localStorage.setItem('mathca-studio.autosave.v1', JSON.stringify({
        savedAt: new Date().toISOString(),
        project: currentProject,
      }));
      if (saveState) saveState.textContent = 'Đã tự lưu bản nháp';
    } catch (error) {
      if (saveState) saveState.textContent = 'Chưa thể tự lưu';
      console.warn('Autosave unavailable:', error);
    }
  }, 6500);
}

function selectedRuntimeSfx() {
  return ensureRuntimeAudioState().sfx.find((clip) => clip.id === selectedSfxId) || null;
}

function currentScene() {
  return currentProject?.scenes?.[currentSceneIndex] || null;
}

function withProjectCommand(label, mutation) {
  const before = snapshotProjectState();
  mutation();
  pushPremiumHistory(before);
  markProjectDirty(label);
  syncJsonEditor();
  renderPremiumAudioUI();
  renderPremiumTimeline();
}

function hasHtmlTemplate(project = currentProject) {
  return typeof project?.html_template === 'string' && project.html_template.trim().length > 0;
}

function getProjectDuration(project = currentProject) {
  return Math.max(
    0.5,
    Number(project?.metadata?.duration) || 0,
    ...(project?.scenes || []).map((scene) => Number(scene.endTime) || 0),
  );
}

function setPreviewStatus(state, message) {
  if (!previewStatus) return;
  previewStatus.dataset.state = state;
  previewStatus.innerText = message;
}

function normalizedText(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function findElementByText(root, text) {
  const expected = normalizedText(text);
  if (!root || !expected) return null;
  return [...root.querySelectorAll('*')].find((node) => {
    if (node.children.length > 0) return false;
    return normalizedText(node.textContent) === expected;
  }) || null;
}

function findTemplateDomElement(doc, element, scene) {
  if (!doc || !element) return null;
  if (element.id) {
    const exact = doc.getElementById(element.id);
    if (exact) return exact;
  }

  const globalAliases = {
    'elem-header-brand': '.header-wrapper',
    'elem-mascot-wrapper': '#mascot-wrapper',
    'elem-cta-btn': '#cta-btn',
  };
  if (element.id && globalAliases[element.id]) {
    const alias = doc.querySelector(globalAliases[element.id]);
    if (alias) return alias;
  }

  const sceneRoot = scene?.id ? doc.getElementById(scene.id) : null;
  return findElementByText(sceneRoot || doc.body, element.text);
}

function elementChanged(current, original, key) {
  if (!original) return current[key] !== undefined;
  return JSON.stringify(current[key]) !== JSON.stringify(original[key]);
}

function applyElementChanges(domElement, element, originalElement) {
  if (!domElement || !element) return;
  if (['x', 'y'].some((key) => elementChanged(element, originalElement, key))) {
    domElement.style.position = 'absolute';
  }
  if (elementChanged(element, originalElement, 'x')) domElement.style.left = `${Number(element.x) || 0}px`;
  if (elementChanged(element, originalElement, 'y')) domElement.style.top = `${Number(element.y) || 0}px`;
  if (elementChanged(element, originalElement, 'width')) domElement.style.width = element.width ? `${Number(element.width)}px` : '';
  if (elementChanged(element, originalElement, 'height')) domElement.style.height = element.height ? `${Number(element.height)}px` : '';
  if (elementChanged(element, originalElement, 'fontSize')) domElement.style.fontSize = element.fontSize ? `${Number(element.fontSize)}px` : '';
  if (elementChanged(element, originalElement, 'color')) domElement.style.color = element.color || '';
  if (elementChanged(element, originalElement, 'bgColor')) domElement.style.background = element.bgColor || '';
  if (elementChanged(element, originalElement, 'text') && !['image', 'video'].includes(element.type)) domElement.textContent = element.text || '';
  if (elementChanged(element, originalElement, 'src') && ['image', 'video'].includes(element.type)) {
    const media = domElement.matches(element.type) ? domElement : domElement.querySelector(element.type);
    if (media) media.src = element.src || '';
  }
}

function applyProjectEditsToTemplate(doc) {
  if (!doc || !currentProject || !sourceProjectSnapshot) return;

  (currentProject.scenes || []).forEach((scene, sceneIndex) => {
    const sourceScene = sourceProjectSnapshot.scenes?.find((candidate) => candidate.id && candidate.id === scene.id)
      || sourceProjectSnapshot.scenes?.[sceneIndex];
    const sceneRoot = scene.id ? doc.getElementById(scene.id) : null;

    (scene.elements || []).forEach((element, elementIndex) => {
      const originalElement = sourceScene?.elements?.find((candidate) => candidate.id && candidate.id === element.id)
        || sourceScene?.elements?.[elementIndex];
      let domElement = findTemplateDomElement(doc, element, scene);
      if (!domElement && sceneRoot) {
        domElement = doc.createElement(element.type === 'image' ? 'img' : element.type === 'video' ? 'video' : 'div');
        if (element.id) domElement.id = element.id;
        if (['image', 'video'].includes(element.type)) domElement.src = element.src || '';
        else domElement.textContent = element.text || '';
        if (element.type === 'video') {
          domElement.muted = true;
          domElement.loop = true;
          domElement.autoplay = true;
          domElement.playsInline = true;
        }
        sceneRoot.appendChild(domElement);
      }
      applyElementChanges(domElement, element, originalElement);
      if (domElement) domElement.style.zIndex = String(100 + elementIndex);
    });

    if (sceneRoot) {
      (scene.elements || []).forEach((element) => {
        const domElement = findTemplateDomElement(doc, element, scene);
        if (domElement) sceneRoot.appendChild(domElement);
      });
    }

    (sourceScene?.elements || []).forEach((originalElement) => {
      if (!originalElement.id) return;
      const stillExists = (scene.elements || []).some((element) => element.id === originalElement.id);
      if (!stillExists) findTemplateDomElement(doc, originalElement, sourceScene)?.remove();
    });
  });

  (currentProject.globalElements || []).forEach((element, elementIndex) => {
    const originalElement = sourceProjectSnapshot.globalElements?.find((candidate) => candidate.id && candidate.id === element.id)
      || sourceProjectSnapshot.globalElements?.[elementIndex];
    applyElementChanges(findTemplateDomElement(doc, element), element, originalElement);
  });
}

function serializeHtmlDocument(doc) {
  return `<!doctype html>\n${doc.documentElement.outerHTML}`;
}

function buildRuntimeCompositionHtml({ preview = false } = {}) {
  const generated = generateCompleteHtmlComposition(currentProject, { audioFile: runtimeAudioFile });
  if (!hasHtmlTemplate()) return generated;

  const doc = new DOMParser().parseFromString(generated, 'text/html');
  applyProjectEditsToTemplate(doc);
  if (preview) {
    const base = doc.createElement('base');
    base.dataset.studioPreviewBase = 'true';
    base.href = `${window.location.origin}/`;
    doc.head.prepend(base);
  }
  return serializeHtmlDocument(doc);
}

function findRenderedElementById(elementId) {
  const previewDoc = getPreviewDocument();
  const previewMatch = previewDoc
    ? [...previewDoc.querySelectorAll('[data-element-id]')].find((node) => node.dataset.elementId === elementId)
      || previewDoc.getElementById(elementId)
    : null;
  return previewMatch || document.getElementById(elementId);
}

async function rerenderProjectCanvas() {
  if (hasHtmlTemplate()) await refreshProjectPreview();
  else renderActiveScene(false);
  renderPremiumTimeline();
}

function getPreviewDocument() {
  try {
    return previewFrame?.contentDocument || null;
  } catch {
    return null;
  }
}

function getTemplateTimeline() {
  const frameWindow = previewFrame?.contentWindow;
  return frameWindow?.__timelines?.main || null;
}

function seekTemplatePreview(time) {
  if (!previewFrameReady) return;
  const timeline = getTemplateTimeline();
  if (timeline?.pause && timeline?.time) {
    timeline.pause();
    timeline.time(Math.max(0, Number(time) || 0), false);
  }
}

function bindTemplatePreviewElements() {
  const doc = getPreviewDocument();
  if (!doc) return;

  doc.querySelectorAll('audio, video').forEach((audio) => {
    audio.pause();
    audio.muted = true;
  });

  (currentProject?.scenes || []).forEach((scene) => {
    (scene.elements || []).forEach((element) => {
      if (!element.id) return;
      const domElement = findTemplateDomElement(doc, element, scene);
      if (!domElement) return;
      domElement.classList.add('scene-elem');
      domElement.dataset.elementId = element.id;
      domElement.dataset.elementScope = 'scene';
      domElement.style.cursor = 'move';
    });
  });

  (currentProject?.globalElements || []).forEach((element) => {
    if (!element.id) return;
    const domElement = findTemplateDomElement(doc, element);
    if (!domElement) return;
    domElement.classList.add('scene-elem');
    domElement.dataset.elementId = element.id;
    domElement.dataset.elementScope = 'global';
    domElement.style.cursor = 'move';
  });

  doc.addEventListener('mousedown', handleCompositionMouseDown);
}

async function refreshProjectPreview() {
  if (!previewFrame || !hasHtmlTemplate()) {
    previewFrameReady = false;
    compositionRoot.classList.remove('template-preview-active');
    if (previewFrame) previewFrame.removeAttribute('srcdoc');
    setPreviewStatus('ready', 'Preview canvas');
    renderActiveScene(false);
    return;
  }

  const sequence = ++previewLoadSequence;
  previewFrameReady = false;
  compositionRoot.classList.add('template-preview-active');
  setPreviewStatus('working', 'Đang dựng preview HTML gốc...');

  await new Promise((resolve) => {
    const timeout = window.setTimeout(resolve, 5000);
    previewFrame.onload = () => {
      window.clearTimeout(timeout);
      resolve();
    };
    previewFrame.srcdoc = buildRuntimeCompositionHtml({ preview: true });
  });

  if (sequence !== previewLoadSequence) return;
  previewFrameReady = true;
  bindTemplatePreviewElements();
  seekTemplatePreview(currentProject?.scenes?.[currentSceneIndex]?.startTime || 0);
  setPreviewStatus('ready', 'HTML gốc • sẵn sàng chỉnh sửa');
}

function recordOriginalPositions() {
  originalCoords.clear();
  if (currentProject && currentProject.scenes) {
    currentProject.scenes.forEach(scene => {
      if (scene.elements) {
        scene.elements.forEach(elem => {
          originalCoords.set(elem.id, JSON.parse(JSON.stringify(elem)));
        });
      }
    });
  }
  if (currentProject && currentProject.globalElements) {
    currentProject.globalElements.forEach(elem => {
      originalCoords.set(elem.id, JSON.parse(JSON.stringify(elem)));
    });
  }
}

/**
 * Left Sidebar Scene Cards
 */
function buildSidebarScenes() {
  sceneListContainer.innerHTML = '';
  if (!currentProject || !currentProject.scenes) return;

  currentProject.scenes.forEach((scene, idx) => {
    const card = document.createElement('div');
    card.className = `scene-card ${idx === currentSceneIndex ? 'active' : ''}`;
    
    let pillClass = 'math';
    if (scene.id && scene.id.includes('hook')) pillClass = 'hook';
    else if (scene.id && scene.id.includes('buoc')) pillClass = 'step';
    else if (scene.id && scene.id.includes('thuthach')) pillClass = 'quiz';

    card.innerHTML = `
      <div class="scene-card-header">
        <span class="scene-badge-pill ${pillClass}">Cảnh ${idx + 1}</span>
        <span class="scene-time-tag">${formatTime(scene.startTime)} - ${formatTime(scene.endTime)}</span>
      </div>
      <div class="scene-card-title">${scene.name || 'Phân cảnh ' + (idx + 1)}</div>
      <div class="scene-voice-snippet">🎙️ "${scene.voiceText || ''}"</div>
    `;

    card.addEventListener('click', () => {
      currentSceneIndex = idx;
      updateSidebarActiveCard();
      renderActiveScene(false);
      
      if (audioEl) {
        audioEl.currentTime = scene.startTime;
        updateScrubberUI(scene.startTime);
      }
    });

    sceneListContainer.appendChild(card);
  });
}

function updateSidebarActiveCard() {
  const cards = sceneListContainer.querySelectorAll('.scene-card');
  cards.forEach((card, idx) => {
    if (idx === currentSceneIndex) card.classList.add('active');
    else card.classList.remove('active');
  });
}

/**
 * 2. Render Active Scene & Bind Direct Element Interaction
 */
function renderActiveScene(playAnimation = false, previewTime = null) {
  sceneRenderArea.innerHTML = '';
  deselectElement();

  const scene = currentProject?.scenes?.[currentSceneIndex];
  if (!scene) return;
  if (hasHtmlTemplate()) {
    seekTemplatePreview(previewTime ?? scene.startTime ?? 0);
    return;
  }

  // Render Scene Elements
  if (scene.elements) {
    scene.elements.forEach(elem => {
      const domElem = createDomElement(elem, scene);
      sceneRenderArea.appendChild(domElem);

    });
  }

  // Bind Global Elements
  bindGlobalElements();

  // Play GSAP scene animations if requested
  if (playAnimation && typeof gsap !== 'undefined') {
    playCurrentSceneAnimations();
  }
}

/**
 * Creates visual HTML DOM element inside 9:16 Canvas
 */
function createDomElement(elem, scene) {
  const el = document.createElement('div');
  el.id = elem.id;
  el.className = 'scene-elem';
  el.dataset.elementId = elem.id;
  el.dataset.elementScope = 'scene';
  el.style.position = 'absolute';
  el.style.zIndex = String(100 + Math.max(0, scene?.elements?.indexOf(elem) ?? 0));
  el.style.left = (elem.x || 0) + 'px';
  el.style.top = (elem.y || 0) + 'px';
  if (elem.width) el.style.width = elem.width + 'px';
  if (elem.height) el.style.height = elem.height + 'px';
  else if (elem.type === 'image' && elem.width) el.style.height = elem.width + 'px';
  if (elem.fontSize) el.style.fontSize = elem.fontSize + 'px';
  if (elem.color) el.style.color = elem.color;

  switch (elem.type) {
    case 'badge':
      el.style.background = elem.bgColor || '#ffbd05';
      el.style.color = elem.color || '#1a1c1c';
      el.style.fontWeight = '900';
      el.style.padding = '12px 36px';
      el.style.borderRadius = '9999px';
      el.style.letterSpacing = '0.04em';
      el.style.boxShadow = '0 8px 20px rgba(0,0,0,0.12)';
      el.style.display = 'inline-flex';
      el.style.alignItems = 'center';
      el.style.gap = '10px';
      el.innerText = elem.text || '';
      break;

    case 'text':
      el.style.fontWeight = '900';
      el.style.lineHeight = '1.1';
      el.style.textShadow = '0 6px 20px rgba(0,0,0,0.15)';
      el.innerText = elem.text || '';
      break;

    case 'card':
      el.style.background = '#f8fcfb';
      el.style.border = '2.5px solid #c9eee9';
      el.style.borderRadius = '28px';
      el.style.padding = '22px 28px';
      el.style.boxShadow = '0 10px 24px rgba(18, 171, 160, 0.12)';
      el.style.fontSize = (elem.fontSize || 32) + 'px';
      el.style.fontWeight = '800';
      el.style.color = elem.color || '#006a63';
      el.style.textAlign = 'center';
      el.innerText = elem.text || '';
      break;

    case 'equation':
      el.style.display = 'flex';
      el.style.alignItems = 'center';
      el.style.fontWeight = '900';
      el.style.fontSize = (elem.fontSize || 76) + 'px';
      el.style.color = elem.color || '#1a1c1c';
      el.style.background = '#e6f7f6';
      el.style.border = '3px solid #12aba0';
      el.style.borderRadius = '24px';
      el.style.padding = '18px 28px';
      el.innerText = elem.text || '';
      break;

    case 'slots':
      el.style.display = 'flex';
      el.style.alignItems = 'center';
      el.style.gap = '20px';
      const parts = (elem.text || "3 ? 5").split(" ");
      const p1 = parts[0] || "3";
      const p2 = parts[1] || "?";
      const p3 = parts[2] || "5";
      el.innerHTML = `
        <div style="width: 180px; height: 180px; background:#e6f7f6; border: 4px solid #12aba0; border-radius: 28px; display:flex; align-items:center; justify-content:center; font-size: 88px; font-weight:900; color:#006a63;">${p1}</div>
        <div style="width: 180px; height: 180px; background:${p2 === '?' ? '#fff8e1' : '#fff2cc'}; border: 4px dashed ${p2 === '?' ? '#ffbd05' : '#12aba0'}; border-radius: 28px; display:flex; align-items:center; justify-content:center; font-size: 88px; font-weight:900; color:${p2 === '?' ? '#b78103' : '#006a63'};">${p2}</div>
        <div style="width: 180px; height: 180px; background:#e6f7f6; border: 4px solid #12aba0; border-radius: 28px; display:flex; align-items:center; justify-content:center; font-size: 88px; font-weight:900; color:#006a63;">${p3}</div>
      `;
      break;

    case 'pill':
      el.style.background = 'linear-gradient(135deg, #12aba0, #006a63)';
      el.style.color = '#ffffff';
      el.style.padding = '14px 40px';
      el.style.borderRadius = '9999px';
      el.style.fontSize = (elem.fontSize || 48) + 'px';
      el.style.fontWeight = '900';
      el.style.display = 'inline-flex';
      el.style.alignItems = 'center';
      el.style.gap = '16px';
      el.style.boxShadow = '0 10px 24px rgba(0, 106, 99, 0.3)';
      el.innerText = elem.text || '';
      break;

    case 'image':
      el.style.display = 'flex';
      el.style.alignItems = 'center';
      el.style.justifyContent = 'center';
      el.innerHTML = `<img src="${elem.src}" style="width: 100%; height: 100%; object-fit: contain; filter: drop-shadow(0 10px 20px rgba(0,0,0,0.12)); pointer-events: none;" alt="${elem.name || 'image'}" />`;
      break;

    case 'video':
      el.style.display = 'flex';
      el.style.alignItems = 'center';
      el.style.justifyContent = 'center';
      el.style.overflow = 'hidden';
      el.style.borderRadius = '24px';
      el.innerHTML = `<video src="${elem.src}" muted loop autoplay playsinline preload="auto" style="width:100%;height:100%;object-fit:cover;pointer-events:none"></video>`;
      break;

    default:
      el.innerText = elem.text || '';
      break;
  }

  return el;
}

/**
 * Apply editable coordinates/styles to global elements without duplicate listeners.
 */
function bindGlobalElements() {
  if (!currentProject || !currentProject.globalElements) return;

  currentProject.globalElements.forEach((elem) => {
    const domElem = document.getElementById(elem.id);
    if (!domElem) return;

    domElem.dataset.elementId = elem.id;
    domElem.dataset.elementScope = 'global';
    domElem.classList.add('scene-elem');
    domElem.style.position = 'absolute';
    domElem.style.right = 'auto';
    domElem.style.bottom = 'auto';
    if (elem.y !== undefined) domElem.style.top = `${elem.y}px`;
    if (elem.x !== undefined) domElem.style.left = `${elem.x}px`;
    if (elem.width) domElem.style.width = `${elem.width}px`;
    if (elem.fontSize) domElem.style.fontSize = `${elem.fontSize}px`;
    if (elem.color) domElem.style.color = elem.color;
    if (elem.bgColor && elem.id === 'elem-cta-btn') domElem.style.background = elem.bgColor;
    if (elem.text && elem.id === 'elem-cta-btn') domElem.innerText = elem.text;
  });
}

function findElementById(elementId, scope) {
  if (scope === 'global') {
    return currentProject?.globalElements?.find((element) => element.id === elementId) || null;
  }
  return currentProject?.scenes?.[currentSceneIndex]?.elements?.find((element) => element.id === elementId) || null;
}

// Event delegation keeps selection working in both the canvas and imported HTML preview.
function handleCompositionMouseDown(event) {
  const target = event.target.closest?.('.scene-elem');
  const isFrameElement = target?.ownerDocument !== document;
  if (!target || (!isFrameElement && !compositionRoot.contains(target))) {
    deselectElement();
    return;
  }

  const scope = target.dataset.elementScope || 'scene';
  const element = findElementById(target.dataset.elementId || target.id, scope);
  if (!element) return;

  event.preventDefault();
  event.stopPropagation();
  selectElement(element, target, scope === 'global');
  startDragging(event, element, target, scope === 'global');
}

compositionRoot.addEventListener('mousedown', handleCompositionMouseDown);

/**
 * 3. Precise Bounding Box Calculations & Drag Engine
 */
function selectElement(elem, domElem, isGlobal = false) {
  selectedElementId = elem.id;
  activeDomElem = domElem;
  activeIsGlobal = isGlobal;

  if (typeof gsap !== 'undefined') {
    gsap.killTweensOf(domElem);
    gsap.set(domElem, { x: 0, y: 0, scale: 1, rotation: 0, opacity: 1, clearProps: 'filter' });
  }
  document.querySelectorAll('.scene-elem.is-selected').forEach((node) => node.classList.remove('is-selected'));
  getPreviewDocument()?.querySelectorAll('.scene-elem.is-selected').forEach((node) => node.classList.remove('is-selected'));
  domElem.classList.add('is-selected');

  updateSelectionBox();
  updateInspectorUI(elem, domElem, isGlobal);
}

function deselectElement() {
  selectedElementId = null;
  if (activeDomElem) activeDomElem.classList.remove('is-selected');
  activeDomElem = null;
  if (activeSelectionBox) activeSelectionBox.style.display = 'none';
  updateInspectorUI(null);
}

function updateSelectionBox() {
  if (!selectedElementId || !activeDomElem || !activeSelectionBox) {
    if (activeSelectionBox) activeSelectionBox.style.display = 'none';
    return;
  }

  const rootRect = compositionRoot.getBoundingClientRect();
  const elementRect = activeDomElem.getBoundingClientRect();
  const isFrameElement = activeDomElem.ownerDocument !== document;
  const renderedScale = rootRect.width / 1080 || scaleFactor || 1;
  const absX = isFrameElement ? elementRect.left : (elementRect.left - rootRect.left) / renderedScale;
  const absY = isFrameElement ? elementRect.top : (elementRect.top - rootRect.top) / renderedScale;
  const width = isFrameElement ? elementRect.width : elementRect.width / renderedScale;
  const height = isFrameElement ? elementRect.height : elementRect.height / renderedScale;

  activeSelectionBox.style.display = 'block';
  activeSelectionBox.style.left = `${absX - 4}px`;
  activeSelectionBox.style.top = `${absY - 4}px`;
  activeSelectionBox.style.width = `${width + 8}px`;
  activeSelectionBox.style.height = `${height + 8}px`;
}

function startDragging(e, elem, domElem, isGlobal) {
  const historyBeforeDrag = snapshotProjectState();
  const startMouseX = e.clientX;
  const startMouseY = e.clientY;
  const startElemX = elem.x || domElem.offsetLeft || 0;
  const startElemY = elem.y || domElem.offsetTop || 0;
  const eventWindow = domElem.ownerDocument?.defaultView || window;
  const pointerScale = domElem.ownerDocument === document ? scaleFactor : 1;

  function onMouseMove(moveEvt) {
    const dx = (moveEvt.clientX - startMouseX) / pointerScale;
    const dy = (moveEvt.clientY - startMouseY) / pointerScale;

    const newX = Math.round(startElemX + dx);
    const newY = Math.round(startElemY + dy);

    elem.x = newX;
    elem.y = newY;

    domElem.style.position = 'absolute';
    domElem.style.left = newX + 'px';
    domElem.style.top = newY + 'px';

    updateSelectionBox();

    propPosX.value = newX;
    propPosY.value = newY;
  }

  function onMouseUp() {
    eventWindow.removeEventListener('mousemove', onMouseMove);
    eventWindow.removeEventListener('mouseup', onMouseUp);
    syncJsonEditor();
    pushPremiumHistory(historyBeforeDrag);
    markProjectDirty('Đã di chuyển đối tượng');
  }

  eventWindow.addEventListener('mousemove', onMouseMove);
  eventWindow.addEventListener('mouseup', onMouseUp);
}

/**
 * 4. Inspector Panel Synchronization
 */
function updateInspectorUI(elem, domElem, isGlobal) {
  if (!elem) {
    noSelectionHint.style.display = 'block';
    elementEditorForm.style.display = 'none';
    selectedTypeBadge.innerText = 'CHƯA CHỌN';
    return;
  }

  noSelectionHint.style.display = 'none';
  elementEditorForm.style.display = 'flex';
  selectedTypeBadge.innerText = (elem.type || 'ELEMENT').toUpperCase();

  propName.value = elem.name || elem.id;
  propPosX.value = elem.x !== undefined ? elem.x : domElem?.offsetLeft || 0;
  propPosY.value = elem.y !== undefined ? elem.y : domElem?.offsetTop || 0;
  propFontSize.value = elem.fontSize || '';
  propWidth.value = elem.width || domElem?.offsetWidth || '';
  propTextContent.value = elem.text || '';
  const canEditText = elem.type !== 'image' && !['elem-header-brand', 'elem-mascot-wrapper'].includes(elem.id);
  propTextContent.disabled = !canEditText;
  propTextContent.placeholder = canEditText ? '' : 'Đối tượng này không có nội dung chữ trực tiếp.';

  const anim = elem.animation || {};
  propAnimType.value = anim.type || 'pop-punch';
  propAnimLoop.value = anim.loop || 'none';
  propAnimDuration.value = anim.duration !== undefined ? anim.duration : 0.45;
  propAnimDelay.value = anim.delay !== undefined ? anim.delay : 0.2;
}

function initInspectorEvents() {
  function getSelectedElementObj() {
    if (!selectedElementId) return null;
    const scene = currentProject?.scenes?.[currentSceneIndex];
    if (scene && scene.elements) {
      const el = scene.elements.find(e => e.id === selectedElementId);
      if (el) return { elem: el, isGlobal: false };
    }
    if (currentProject?.globalElements) {
      const gEl = currentProject.globalElements.find(e => e.id === selectedElementId);
      if (gEl) return { elem: gEl, isGlobal: true };
    }
    return null;
  }

  // Update Pos X
  propPosX.addEventListener('input', () => {
    const obj = getSelectedElementObj();
    if (!obj) return;
    obj.elem.x = parseInt(propPosX.value, 10) || 0;
    if (activeDomElem) activeDomElem.style.left = obj.elem.x + 'px';
    updateSelectionBox();
    syncJsonEditor();
  });

  // Update Pos Y
  propPosY.addEventListener('input', () => {
    const obj = getSelectedElementObj();
    if (!obj) return;
    obj.elem.y = parseInt(propPosY.value, 10) || 0;
    if (activeDomElem) activeDomElem.style.top = obj.elem.y + 'px';
    updateSelectionBox();
    syncJsonEditor();
  });

  // Update Font Size
  propFontSize.addEventListener('input', () => {
    const obj = getSelectedElementObj();
    if (!obj) return;
    const val = parseInt(propFontSize.value, 10);
    if (val > 0) {
      obj.elem.fontSize = val;
      if (activeDomElem) activeDomElem.style.fontSize = val + 'px';
    }
    updateSelectionBox();
    syncJsonEditor();
  });

  // Update Width
  propWidth.addEventListener('input', () => {
    const obj = getSelectedElementObj();
    if (!obj) return;
    const val = parseInt(propWidth.value, 10);
    if (val > 0) {
      obj.elem.width = val;
      if (activeDomElem) activeDomElem.style.width = val + 'px';
    } else {
      delete obj.elem.width;
      if (activeDomElem) activeDomElem.style.width = '';
    }
    updateSelectionBox();
    syncJsonEditor();
  });

  // Update Text Content
  propTextContent.addEventListener('input', () => {
    const obj = getSelectedElementObj();
    if (!obj || propTextContent.disabled) return;
    const val = propTextContent.value;
    obj.elem.text = val;
    if (activeDomElem) activeDomElem.innerText = val;
    updateSelectionBox();
    syncJsonEditor();
  });

  // Animation type change
  propAnimType.addEventListener('change', () => {
    const obj = getSelectedElementObj();
    if (!obj) return;
    obj.elem.animation = obj.elem.animation || {};
    obj.elem.animation.type = propAnimType.value;
    syncJsonEditor();
  });

  // Animation loop change
  propAnimLoop.addEventListener('change', () => {
    const obj = getSelectedElementObj();
    if (!obj) return;
    obj.elem.animation = obj.elem.animation || {};
    obj.elem.animation.loop = propAnimLoop.value;
    syncJsonEditor();
  });

  // Animation duration change
  propAnimDuration.addEventListener('input', () => {
    const obj = getSelectedElementObj();
    if (!obj) return;
    obj.elem.animation = obj.elem.animation || {};
    obj.elem.animation.duration = parseFloat(propAnimDuration.value) || 0.45;
    syncJsonEditor();
  });

  // Animation delay change
  propAnimDelay.addEventListener('input', () => {
    const obj = getSelectedElementObj();
    if (!obj) return;
    obj.elem.animation = obj.elem.animation || {};
    obj.elem.animation.delay = parseFloat(propAnimDelay.value) || 0.2;
    syncJsonEditor();
  });

  // Test Animation Button
  btnPreviewAnim.addEventListener('click', () => {
    const obj = getSelectedElementObj();
    if (!obj || !activeDomElem || typeof gsap === 'undefined') return;
    playElementAnimation(activeDomElem, obj.elem.animation);
    showToast(`Đang chạy thử hiệu ứng "${obj.elem.animation?.type || 'pop-punch'}"! ⚡`);
  });

  // Play Entire Scene Animation Button
  btnPlaySceneAnim.addEventListener('click', () => {
    playCurrentSceneAnimations();
    showToast('Đang chạy hoạt ảnh toàn bộ phân cảnh! 🎬');
  });

  // Center Horizontally Button
  btnAlignCenter.addEventListener('click', () => {
    const obj = getSelectedElementObj();
    if (!obj || !activeDomElem) return;
    const w = activeDomElem.offsetWidth || 300;

    if (obj.isGlobal) {
      obj.elem.x = Math.round((1080 - w) / 2);
    } else {
      obj.elem.x = Math.round((940 - w) / 2);
    }
    propPosX.value = obj.elem.x;
    activeDomElem.style.left = obj.elem.x + 'px';
    updateSelectionBox();
    syncJsonEditor();
    showToast('Đã căn giữa ngang đối tượng!');
  });

  // Reset Position Button
  btnResetPos.addEventListener('click', () => {
    const obj = getSelectedElementObj();
    if (!obj) return;
    const orig = originalCoords.get(obj.elem.id);
    if (orig) {
      obj.elem.x = orig.x;
      obj.elem.y = orig.y;
      obj.elem.fontSize = orig.fontSize;
      obj.elem.width = orig.width;
      obj.elem.text = orig.text;
      obj.elem.animation = JSON.parse(JSON.stringify(orig.animation || {}));

      updateInspectorUI(obj.elem, activeDomElem, obj.isGlobal);
      if (activeDomElem) {
        activeDomElem.style.left = orig.x + 'px';
        activeDomElem.style.top = orig.y + 'px';
        if (orig.fontSize) activeDomElem.style.fontSize = orig.fontSize + 'px';
        if (orig.width) activeDomElem.style.width = orig.width + 'px';
        if (orig.text) activeDomElem.innerText = orig.text;
      }
      updateSelectionBox();
      showToast('Đã khôi phục vị trí mặc định!');
    }
  });
}

/**
 * 5. Canvas Toolbar & Features (Add Text, Add Logo, Duplicate, Delete, Presets)
 */
function initCanvasToolbar() {
  // 1. Add Text
  btnAddText.addEventListener('click', async () => {
    const scene = currentProject?.scenes?.[currentSceneIndex];
    if (!scene) return;

    const newId = `text-${Date.now()}`;
    const newElem = {
      id: newId,
      name: "Dòng chữ mới",
      type: "text",
      x: 100,
      y: 200 + (scene.elements.length * 50) % 400,
      fontSize: 54,
      text: "Văn bản MathCA mới ✨",
      color: "#006a63",
      animation: { type: "pop-punch", duration: 0.45, delay: 0.2 }
    };

    scene.elements.push(newElem);
    syncJsonEditor();
    await rerenderProjectCanvas();
    const dom = findRenderedElementById(newId);
    if (dom) selectElement(newElem, dom, false);
    showToast('Đã thêm dòng chữ mới! Bạn có thể kéo di chuyển hoặc sửa.');
  });

  // 2. Add / Choose Logo
  btnAddLogo.addEventListener('click', () => {
    modalChooseLogo.classList.add('active');
  });

  document.getElementById('opt-logo-main').addEventListener('click', () => {
    addLogoToScene('assets/logo.png', 'Logo MathCA Chuẩn', 260, 95);
    modalChooseLogo.classList.remove('active');
  });

  document.getElementById('opt-logo-mascot').addEventListener('click', () => {
    addLogoToScene('assets/mascot.png', 'Mascot Cú Con', 180, 200);
    modalChooseLogo.classList.remove('active');
  });

  document.getElementById('btn-trigger-upload-logo').addEventListener('click', () => {
    inputUploadLogo.click();
  });

  inputUploadLogo.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      addLogoToScene(evt.target.result, file.name.replace(/\.[^/.]+$/, ''), 240, 100);
      modalChooseLogo.classList.remove('active');
    };
    reader.readAsDataURL(file);
  });

  async function addLogoToScene(src, name, w, h) {
    const scene = currentProject?.scenes?.[currentSceneIndex];
    if (!scene) return;

    const newId = `logo-${Date.now()}`;
    const newElem = {
      id: newId,
      name: name || "Logo MathCA",
      type: "image",
      src: src,
      x: 340,
      y: 100,
      width: w || 240,
      height: h || 100,
      animation: { type: "pop-punch", duration: 0.4, delay: 0.1 }
    };

    scene.elements.push(newElem);
    await rerenderProjectCanvas();
    const dom = findRenderedElementById(newId);
    if (dom) selectElement(newElem, dom, false);
    showToast(`Đã chèn "${name}" vào phân cảnh!`);
  }

  // 3. Upload Image
  btnUploadImage.addEventListener('click', () => {
    inputUploadImage.click();
  });

  inputUploadImage.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (evt) => {
      const scene = currentProject?.scenes?.[currentSceneIndex];
      if (!scene) return;

      const newId = `img-${Date.now()}`;
      const newElem = {
        id: newId,
        name: file.name.replace(/\.[^/.]+$/, ''),
        type: "image",
        src: evt.target.result,
        x: 200,
        y: 350,
        width: 320,
        animation: { type: "pop-punch", duration: 0.45, delay: 0.2 }
      };

      scene.elements.push(newElem);
      syncJsonEditor();
      await rerenderProjectCanvas();
      const dom = findRenderedElementById(newId);
      if (dom) selectElement(newElem, dom, false);
      showToast(`Đã tải ảnh "${file.name}" vào cảnh thành công!`);
    };
    reader.readAsDataURL(file);
  });

  // 4. Duplicate Element
  btnDuplicateElem.addEventListener('click', duplicateSelectedElement);

  // 5. Delete Element
  btnDeleteElem.addEventListener('click', deleteSelectedElement);

  // 6. Template Presets
  btnPresetTemplates.addEventListener('click', () => {
    modalPresets.classList.add('active');
  });

  document.querySelectorAll('#modal-presets .preset-card').forEach(card => {
    card.addEventListener('click', async () => {
      const presetKey = card.dataset.preset;
      let filename = 'meo_nhan_11_lop_3.json';
      if (presetKey === 'word_problem') filename = 'so_do_tong_hieu_lop_4.json';
      else if (presetKey === 'speed_quiz') filename = 'do_vui_5_giay_lop_3.json';
      else if (presetKey === 'comparison') filename = 'so_sanh_cach_giai_lop_3.json';

      modalPresets.classList.remove('active');
      await loadPresetProject(filename, { regenerateAudio: true });
      showToast(`Đã nạp mẫu kịch bản "${card.querySelector('.preset-title').innerText}"! 🎉`);
    });
  });
}

async function duplicateSelectedElement() {
  if (!selectedElementId) {
    alert('Vui lòng chọn 1 đối tượng trên màn hình preview trước khi nhân bản!');
    return;
  }
  const scene = currentProject?.scenes?.[currentSceneIndex];
  if (!scene || !scene.elements) return;

  const idx = scene.elements.findIndex(e => e.id === selectedElementId);
  if (idx === -1) {
    alert('Không thể nhân bản đối tượng toàn cục (Header / Mascot).');
    return;
  }

  const orig = scene.elements[idx];
  const clone = JSON.parse(JSON.stringify(orig));
  clone.id = `${orig.type || 'elem'}-${Date.now()}`;
  clone.name = (orig.name || 'Đối tượng') + ' (Bản sao)';
  clone.x = (orig.x || 0) + 30;
  clone.y = (orig.y || 0) + 30;

  scene.elements.push(clone);
  syncJsonEditor();
  await rerenderProjectCanvas();
  const dom = findRenderedElementById(clone.id);
  if (dom) selectElement(clone, dom, false);
  showToast(`Đã nhân bản "${clone.name}"!`);
}

async function deleteSelectedElement() {
  if (!selectedElementId) {
    alert('Vui lòng chọn 1 đối tượng trên màn hình preview để xóa!');
    return;
  }
  const scene = currentProject?.scenes?.[currentSceneIndex];
  if (!scene || !scene.elements) return;

  const idx = scene.elements.findIndex(e => e.id === selectedElementId);
  if (idx === -1) {
    alert('Không thể xóa đối tượng toàn cục!');
    return;
  }

  if (confirm(`Bạn có chắc muốn xóa đối tượng "${scene.elements[idx].name || selectedElementId}"?`)) {
    scene.elements.splice(idx, 1);
    syncJsonEditor();
    deselectElement();
    await rerenderProjectCanvas();
    showToast('Đã xóa đối tượng thành công.');
  }
}

/**
 * Keyboard Shortcuts (Ctrl+D to duplicate, Delete to remove, Arrows to fine-tune)
 */
function initKeyboardShortcuts() {
  window.addEventListener('keydown', (e) => {
    // If typing in input or textarea, ignore shortcuts
    const tag = e.target.tagName.toLowerCase();
    if (tag === 'input' || tag === 'textarea' || tag === 'select') return;

    // Ctrl + D -> Duplicate
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'd') {
      e.preventDefault();
      duplicateSelectedElement();
      return;
    }

    // Delete / Backspace -> Delete
    if (e.key === 'Delete' || e.key === 'Backspace') {
      if (selectedElementId) {
        e.preventDefault();
        deleteSelectedElement();
        return;
      }
    }

    // Arrow keys -> Nudge position
    if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
      if (!selectedElementId || !activeDomElem) return;
      e.preventDefault();

      const step = e.shiftKey ? 10 : 1;
      const scene = currentProject?.scenes?.[currentSceneIndex];
      let elem = scene?.elements?.find(el => el.id === selectedElementId);
      if (!elem && currentProject?.globalElements) {
        elem = currentProject.globalElements.find(el => el.id === selectedElementId);
      }
      if (!elem) return;

      if (e.key === 'ArrowLeft') elem.x = (elem.x || 0) - step;
      if (e.key === 'ArrowRight') elem.x = (elem.x || 0) + step;
      if (e.key === 'ArrowUp') elem.y = (elem.y || 0) - step;
      if (e.key === 'ArrowDown') elem.y = (elem.y || 0) + step;

      activeDomElem.style.left = elem.x + 'px';
      activeDomElem.style.top = elem.y + 'px';
      propPosX.value = elem.x;
      propPosY.value = elem.y;

      updateSelectionBox();
      syncJsonEditor();
    }
  });
}

/**
 * 6. GSAP Animation Engine
 */
function playElementAnimation(domElem, animConfig = {}) {
  if (!domElem || typeof gsap === 'undefined') return;

  gsap.killTweensOf(domElem);
  gsap.set(domElem, { clearProps: 'transform,opacity,filter' });

  const type = animConfig.type || 'pop-punch';
  const dur = animConfig.duration || 0.45;
  const del = animConfig.delay || 0.1;

  let tl = gsap.timeline({ delay: del });

  switch (type) {
    case 'pop-punch':
      tl.fromTo(domElem, 
        { scale: 0.25, opacity: 0 }, 
        { scale: 1, opacity: 1, duration: dur, ease: 'back.out(2.4)' }
      );
      break;

    case 'drop-bounce':
      tl.fromTo(domElem, 
        { y: -260, opacity: 0 }, 
        { y: 0, opacity: 1, duration: dur + 0.15, ease: 'bounce.out' }
      );
      break;

    case 'zoom-hero':
      tl.fromTo(domElem, 
        { scale: 0.05, opacity: 0 }, 
        { scale: 1, opacity: 1, duration: dur, ease: 'back.out(3.2)' }
      );
      break;

    case 'slide-up':
      tl.fromTo(domElem, 
        { y: 160, opacity: 0 }, 
        { y: 0, opacity: 1, duration: dur, ease: 'power3.out' }
      );
      break;

    case 'slide-left':
      tl.fromTo(domElem, 
        { x: -220, opacity: 0 }, 
        { x: 0, opacity: 1, duration: dur, ease: 'power3.out' }
      );
      break;

    case 'slide-right':
      tl.fromTo(domElem, 
        { x: 220, opacity: 0 }, 
        { x: 0, opacity: 1, duration: dur, ease: 'power3.out' }
      );
      break;

    case 'elastic-pop':
      tl.fromTo(domElem, 
        { scale: 0.1, opacity: 0 }, 
        { scale: 1, opacity: 1, duration: dur + 0.2, ease: 'elastic.out(1, 0.35)' }
      );
      break;

    case 'fade-in':
      tl.fromTo(domElem, 
        { opacity: 0 }, 
        { opacity: 1, duration: dur, ease: 'power2.out' }
      );
      break;

    default:
      tl.fromTo(domElem, { opacity: 0 }, { opacity: 1, duration: dur });
      break;
  }

  // Loop / Emphasis
  if (animConfig.loop && animConfig.loop !== 'none') {
    tl.add(() => {
      switch (animConfig.loop) {
        case 'pulse':
          gsap.to(domElem, { scale: 1.08, duration: 0.28, yoyo: true, repeat: -1, ease: 'sine.inOut' });
          break;
        case 'float':
          gsap.to(domElem, { y: '-=16', duration: 0.7, yoyo: true, repeat: -1, ease: 'sine.inOut' });
          break;
        case 'wiggle':
          gsap.to(domElem, { rotation: 4, duration: 0.14, yoyo: true, repeat: -1, ease: 'sine.inOut' });
          break;
        case 'glow':
          gsap.to(domElem, { filter: 'drop-shadow(0 0 20px #ffbd05)', duration: 0.45, yoyo: true, repeat: -1, ease: 'sine.inOut' });
          break;
      }
    });
  }
}

function playCurrentSceneAnimations() {
  const scene = currentProject?.scenes?.[currentSceneIndex];
  if (!scene || !scene.elements) return;
  if (hasHtmlTemplate()) {
    const timeline = getTemplateTimeline();
    if (timeline?.pause && timeline?.tweenTo) {
      const start = Number(scene.startTime) || 0;
      timeline.pause();
      timeline.time(start, false);
      timeline.tweenTo(Number(scene.endTime) || start + 1, { ease: 'none' });
    }
    return;
  }
  if (typeof gsap === 'undefined') return;

  scene.elements.forEach(elem => {
    const dom = document.getElementById(elem.id);
    if (dom) {
      playElementAnimation(dom, elem.animation);
    }
  });

  const mascot = document.getElementById('elem-mascot-wrapper');
  if (mascot) {
    gsap.killTweensOf(mascot);
    gsap.fromTo(mascot, { y: 20 }, { y: 0, duration: 0.5, ease: 'back.out(2)' });
  }
}

/**
 * 7. Timeline Playback & Audio Synchronization
 */
function initTimeline() {
  btnPlayPause.addEventListener('click', togglePlayPause);
  audioEl?.addEventListener('timeupdate', () => {
    if (!audioEl || !Number.isFinite(audioEl.currentTime)) return;
    currentPlayheadTime = audioEl.currentTime;
    updateScrubberUI(currentPlayheadTime);
    syncSceneWithTime(currentPlayheadTime);
    seekTemplatePreview(currentPlayheadTime);
    syncBgmPreviewWithPlayhead();
  });
  audioEl?.addEventListener('ended', () => stopPremiumPlayback(true));
  timelineTrack.addEventListener('click', (event) => {
    const rect = timelineTrack.getBoundingClientRect();
    const targetTime = Math.max(0, Math.min(getProjectDuration(), (event.clientX - rect.left) / rect.width * getProjectDuration()));
    seekPremiumPlayback(targetTime);
  });
}

function seekPremiumPlayback(time) {
  currentPlayheadTime = Math.max(0, Math.min(getProjectDuration(), Number(time) || 0));
  if (audioEl?.duration && Number.isFinite(audioEl.duration)) audioEl.currentTime = Math.min(currentPlayheadTime, audioEl.duration);
  updateScrubberUI(currentPlayheadTime);
  syncSceneWithTime(currentPlayheadTime);
  seekTemplatePreview(currentPlayheadTime);
  syncBgmPreviewWithPlayhead();
}

function togglePlayPause() {
  if (isPlaying) {
    stopPremiumPlayback(false);
    return;
  }
  isPlaying = true;
  previousTickTime = performance.now();
  playIcon.innerText = '⏸';
  if (audioEl?.src) {
    try { audioEl.currentTime = currentPlayheadTime; } catch {}
    audioEl.play().catch(() => {});
  }
  syncBgmPreviewWithPlayhead();
  playCurrentSceneAnimations();
  startAnimLoop(previousTickTime);
}

function stopPremiumPlayback(resetToStart) {
  isPlaying = false;
  playIcon.innerText = '▶';
  audioEl?.pause();
  getBgmPreviewElement()?.pause();
  cancelAnimationFrame(playAnimFrameId);
  if (resetToStart) seekPremiumPlayback(0);
}

function startAnimLoop(now) {
  if (!isPlaying) return;
  const previousTime = currentPlayheadTime;
  if (audioEl && !audioEl.paused && Number.isFinite(audioEl.currentTime)) currentPlayheadTime = audioEl.currentTime;
  else {
    const delta = Math.min(.1, Math.max(0, ((now || performance.now()) - previousTickTime) / 1000));
    currentPlayheadTime += delta;
  }
  previousTickTime = now || performance.now();
  if (currentPlayheadTime >= getProjectDuration()) {
    stopPremiumPlayback(true);
    return;
  }
  ensureRuntimeAudioState().sfx.forEach((clip) => {
    if (clip.startTime > previousTime && clip.startTime <= currentPlayheadTime && clip.src.startsWith('preset:')) previewPresetSfx(clip.src.split(':')[1], clip.volume, clip.pan);
  });
  updateScrubberUI(currentPlayheadTime);
  syncSceneWithTime(currentPlayheadTime);
  seekTemplatePreview(currentPlayheadTime);
  syncBgmPreviewWithPlayhead();
  playAnimFrameId = requestAnimationFrame(startAnimLoop);
}

function updateScrubberUI(time) {
  const dur = getProjectDuration();
  currentPlayheadTime = Math.max(0, Math.min(dur, Number(time) || 0));
  const pct = Math.min(100, currentPlayheadTime / dur * 100);
  timelineFill.style.width = pct + '%';
  timelineScrubber.style.left = pct + '%';
  timeDisplay.innerText = `${formatTime(currentPlayheadTime)} / ${formatTime(dur)}`;
  updateBgmPreviewGain();
}

function syncSceneWithTime(time) {
  if (!currentProject?.scenes) return;
  const matchIdx = currentProject.scenes.findIndex(s => time >= s.startTime && time < s.endTime);
  if (matchIdx !== -1 && matchIdx !== currentSceneIndex) {
    currentSceneIndex = matchIdx;
    updateSidebarActiveCard();
    renderActiveScene(true, time);
  }
}

/**
 * 8. Header Action Buttons & Modals
 */
function initActionButtons() {
  document.getElementById('btn-open-file').addEventListener('click', () => fileInputJson.click());
  fileInputJson.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const json = JSON.parse(event.target.result);
        await loadProjectData(json, { regenerateAudio: true, source: file.name });
        showToast(`Đã nạp file "${file.name}" và tạo lại âm thanh thành công!`);
      } catch (err) {
        alert('File JSON không hợp lệ: ' + err.message);
      }
    };
    reader.readAsText(file);
  });

  document.getElementById('btn-paste-json').addEventListener('click', () => {
    modalPasteJson.classList.add('active');
    pasteJsonTextarea.value = '';
    pasteJsonTextarea.focus();
  });

  document.getElementById('btn-confirm-paste-json').addEventListener('click', async () => {
    const raw = pasteJsonTextarea.value.trim();
    if (!raw) return;
    try {
      const json = JSON.parse(raw);
      await loadProjectData(json, { regenerateAudio: true, source: 'JSON từ ChatGPT' });
      modalPasteJson.classList.remove('active');
      showToast('Đã nạp kịch bản JSON từ ChatGPT thành công! 🎉');
    } catch (err) {
      alert('Lỗi phân tích JSON: ' + err.message);
    }
  });

  document.getElementById('btn-save-project').addEventListener('click', async () => {
    const filename = (currentProject?.metadata?.title || 'mathca_project')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '_');
    
    const blob = new Blob([JSON.stringify(currentProject, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.json`;
    a.click();
    URL.revokeObjectURL(url);

    try {
      await fetch('/api/projects/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename, data: currentProject })
      });
    } catch (e) {
      console.warn('Server save optional warning:', e);
    }

    const saveState = document.getElementById('save-state');
    if (saveState) saveState.textContent = 'Đã lưu';
    showToast('Đã lưu file dự án thành công!');
  });

  document.getElementById('btn-export-html').addEventListener('click', () => {
    const html = buildRuntimeCompositionHtml();
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'index.html';
    a.click();
    URL.revokeObjectURL(url);
    showToast('Đã xuất mã nguồn HyperFrames index.html!');
  });

  btnSelectOutputFolder?.addEventListener('click', chooseOutputDirectory);
  btnRenderTrigger.addEventListener('click', () => { updateRenderAudioSummary(); modalRenderProgress.classList.add('active'); });

  const btnCopyLan = document.getElementById('btn-copy-lan');
  btnCopyLan?.addEventListener('click', async () => {
    const label = document.getElementById('lan-btn-label');
    const rawLan = btnCopyLan.dataset.lanUrl;
    const url = rawLan || (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? `${window.location.protocol}//192.168.1.24:${window.location.port || 3300}` : window.location.origin);
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
      } else {
        const temp = document.createElement('textarea');
        temp.value = url;
        document.body.appendChild(temp);
        temp.select();
        document.execCommand('copy');
        document.body.removeChild(temp);
      }
      if (label) label.textContent = 'Đã chép link!';
      showToast(`Đã sao chép link mạng LAN: ${url} 🎉`);
      setTimeout(() => { if (label) label.textContent = 'Mạng LAN'; }, 3000);
    } catch {
      prompt('Link truy cập qua mạng LAN:', url);
    }
  });
}

async function loadPresetProject(filename, options = {}) {
  try {
    const response = await fetch(`/api/projects/${encodeURIComponent(filename)}`);
    const payload = await response.json();
    if (!response.ok || !payload.success) {
      throw new Error(payload.error || `Không thể nạp preset ${filename}.`);
    }
    await loadProjectData(payload.data, {
      regenerateAudio: options.regenerateAudio === true,
      source: filename,
    });
  } catch (error) {
    console.warn('Failed to load project from server:', error);
    showToast(`Không thể nạp dự án: ${error.message}`, 'error');
  }
}

async function loadProjectData(data, options = {}) {
  const loadRevision = ++projectLoadRevision;
  if (!data?.scenes || !Array.isArray(data.scenes)) {
    throw new Error('Dữ liệu không đúng cấu trúc (thiếu scenes)!');
  }

  currentProject = cloneJson(data);
  sourceProjectSnapshot = cloneJson(data);
  runtimeAudioFile = currentProject.metadata?.audioFile || null;
  audioTouched = Object.prototype.hasOwnProperty.call(data, 'audio');
  audioMixDirty = false;
  runtimeAudioState = normalizeAudioState(data.audio, getProjectDuration(currentProject));
  selectedSfxId = null;
  premiumHistory = [];
  premiumRedo = [];
  currentPlayheadTime = 0;

  currentSceneIndex = 0;
  if (audioEl) {
    audioEl.pause();
    audioEl.currentTime = 0;
  }
  isPlaying = false;
  playIcon.innerText = '▶';
  recordOriginalPositions();
  buildSidebarScenes();
  await refreshProjectPreview();
  syncSettingsUI();
  syncJsonEditor();
  updateScrubberUI(0);
  renderPremiumAudioUI();
  renderPremiumTimeline();
  updateHistoryButtons();
  const saveState = document.getElementById('save-state');
  if (saveState) saveState.textContent = 'Đã nạp';

  let audioReady = false;
  if (options.regenerateAudio) {
    if (audioGenerationPromise) await audioGenerationPromise;
    if (loadRevision === projectLoadRevision) {
      audioReady = await regenerateAudioForCurrentProject(options.source || 'JSON mới');
    }
    if (!audioReady) {
      showToast('Đã nạp JSON và Preview; Voiceover chưa sẵn sàng. Bấm "Tạo lại Voiceover" để thử lại.', 'info');
    }
  }
  return { loaded: true, audioReady };
}

function initSettingsEvents() {
  const titleInput = document.getElementById('setting-title');
  const gradeInput = document.getElementById('setting-grade');
  const voiceInput = document.getElementById('setting-voice');

  titleInput?.addEventListener('input', () => {
    if (!currentProject) return;
    currentProject.metadata = currentProject.metadata || {};
    currentProject.metadata.title = titleInput.value;
    markProjectDirty();
    syncJsonEditor();
  });

  gradeInput?.addEventListener('change', () => {
    if (!currentProject) return;
    currentProject.metadata = currentProject.metadata || {};
    currentProject.metadata.grade = Number(gradeInput.value);
    markProjectDirty();
    syncJsonEditor();
  });

  voiceInput?.addEventListener('change', async () => {
    if (!currentProject) return;
    currentProject.metadata = currentProject.metadata || {};
    currentProject.metadata.voice = voiceInput.value;
    markProjectDirty();
    syncJsonEditor();
    await regenerateAudioForCurrentProject('thay đổi giọng đọc');
  });

  document.getElementById('btn-refresh-voices')?.addEventListener('click', () => {
    fetchAndPopulateVoices(true);
  });

  // Populate voices on first load
  fetchAndPopulateVoices(false);
}

async function fetchAndPopulateVoices(showStatus = false) {
  const voiceInput = document.getElementById('setting-voice');
  const statusEl = document.getElementById('voice-provider-status');
  const vieneuGroup = document.getElementById('voice-optgroup-vieneu');
  if (!voiceInput) return;

  const currentValue = voiceInput.value;

  try {
    if (showStatus && statusEl) statusEl.textContent = 'Đang tải danh sách giọng đọc...';
    const response = await fetch('/api/voices', { cache: 'no-store' });
    const data = await response.json();
    if (!response.ok || !data.success) {
      if (statusEl) statusEl.textContent = 'Không thể tải danh sách giọng đọc.';
      return;
    }

    const edgeVoices = data.voices.filter((v) => v.provider === 'edge');
    const vieneuVoices = data.voices.filter((v) => v.provider === 'vieneu');

    // Update Edge optgroup
    const edgeGroup = voiceInput.querySelector('optgroup[data-provider="edge"]');
    if (edgeGroup) {
      edgeGroup.innerHTML = '';
      edgeVoices.forEach((v) => {
        const opt = document.createElement('option');
        opt.value = v.id;
        opt.textContent = `${v.name} (${v.description})`;
        edgeGroup.appendChild(opt);
      });
    }

    // Update VieNeu optgroup
    if (vieneuGroup) {
      vieneuGroup.innerHTML = '';
      if (vieneuVoices.length > 0) {
        vieneuVoices.forEach((v) => {
          const opt = document.createElement('option');
          opt.value = v.id;
          opt.textContent = `${v.name} (${v.description || v.label || ''})`;
          if (data.vieneuStatus !== 'ready') {
            opt.textContent += ' ⏳';
          }
          vieneuGroup.appendChild(opt);
        });
      } else {
        const placeholder = document.createElement('option');
        placeholder.disabled = true;
        placeholder.textContent = 'Chưa cài đặt VieNeu TTS';
        vieneuGroup.appendChild(placeholder);
      }
    }

    // Restore selection
    const allOptions = Array.from(voiceInput.querySelectorAll('option')).map((o) => o.value);
    if (allOptions.includes(currentValue)) {
      voiceInput.value = currentValue;
    } else if (currentProject?.metadata?.voice && allOptions.includes(currentProject.metadata.voice)) {
      voiceInput.value = currentProject.metadata.voice;
    }

    // Status line
    if (statusEl) {
      const providerText = data.activeProvider === 'vieneu' ? 'VieNeu (bản địa)' : 'Edge TTS (Microsoft)';
      const vieneuIcon = data.vieneuStatus === 'ready' ? '🟢' : data.vieneuStatus === 'unavailable' ? '🟡' : '⚪';
      statusEl.textContent = `Provider hiện tại: ${providerText} · VieNeu: ${vieneuIcon} ${data.vieneuStatus}`;
    }
  } catch (error) {
    console.warn('Failed to fetch voices:', error);
    if (statusEl) statusEl.textContent = 'Server chưa sẵn sàng để tải giọng đọc.';
  }
}

function initAudioControls() {
  btnAudioToggle?.addEventListener('click', async () => {
    if (!audioEl) return;
    audioEl.muted = !audioEl.muted;
    btnAudioToggle.innerHTML = audioEl.muted
      ? '<span>🔇</span><span>Bật Tiếng</span>'
      : '<span>🔊</span><span>Tắt Tiếng</span>';
    if (!audioEl.muted && audioEl.paused) {
      await audioEl.play().catch(() => {});
      audioEl.pause();
    }
  });

  btnGenerateAudio?.addEventListener('click', () => regenerateAudioForCurrentProject('yêu cầu thủ công'));
}

function updateStudioJobProgress(state, label, percent = 0) {
  const safePercent = Math.max(0, Math.min(100, Number(percent) || 0));
  if (studioJobProgress) studioJobProgress.dataset.state = state;
  if (studioJobProgressLabel) studioJobProgressLabel.textContent = label;
  if (studioJobProgressPercent) studioJobProgressPercent.textContent = `${Math.round(safePercent)}%`;
  if (studioJobProgressBar) studioJobProgressBar.style.width = `${safePercent}%`;
}

function setAudioStatus(state, message, percent = state === 'ready' ? 100 : 0) {
  if (audioStatus) {
    audioStatus.dataset.state = state;
    audioStatus.innerText = message;
  }
  updateStudioJobProgress(state, message, percent);
}

async function pollAudioJobStatus() {
  try {
    const response = await fetch('/api/audio-status', { cache: 'no-store' });
    const status = await response.json();
    if (!response.ok) return;
    if (status.active) {
      setAudioStatus('working', status.stage || 'Đang tạo âm thanh...', status.progress || 3);
    } else if (status.error) {
      setAudioStatus('error', status.stage || 'Tạo âm thanh thất bại', status.progress || 0);
    }
  } catch {}
}

function startAudioStatusPolling() {
  if (audioStatusPollInterval) clearInterval(audioStatusPollInterval);
  pollAudioJobStatus();
  audioStatusPollInterval = setInterval(pollAudioJobStatus, 500);
}

function stopAudioStatusPolling() {
  if (audioStatusPollInterval) clearInterval(audioStatusPollInterval);
  audioStatusPollInterval = null;
}

/**
 * Timeline Voice Picker — voice dropdown + "Tạo" button + variant chips.
 */
function initTimelineVoicePicker() {
  const tlVoiceSelect = document.getElementById('timeline-voice-select');
  const btnGenVoice = document.getElementById('btn-generate-voice');
  const chipContainer = document.getElementById('voice-variant-chips');
  const settingsVoice = document.getElementById('setting-voice');
  if (!tlVoiceSelect || !btnGenVoice) return;

  // Populate from /api/voices
  populateTimelineVoiceSelect();

  // Sync from settings → timeline dropdown when settings changes
  settingsVoice?.addEventListener('change', () => {
    if (tlVoiceSelect.querySelector(`option[value="${settingsVoice.value}"]`)) {
      tlVoiceSelect.value = settingsVoice.value;
    }
  });

  // Sync from timeline → settings when timeline changes
  tlVoiceSelect.addEventListener('change', () => {
    if (settingsVoice) {
      if (settingsVoice.querySelector(`option[value="${tlVoiceSelect.value}"]`)) {
        settingsVoice.value = tlVoiceSelect.value;
      }
    }
  });

  // "Tạo" button — set voice and regenerate
  btnGenVoice.addEventListener('click', async () => {
    if (!currentProject || audioGenerationPromise) return;
    const voice = tlVoiceSelect.value;
    if (!voice) return;

    // Update project voice
    currentProject.metadata = currentProject.metadata || {};
    currentProject.metadata.voice = voice;
    markProjectDirty();
    syncJsonEditor();
    if (settingsVoice) settingsVoice.value = voice;

    // Generate audio
    const result = await regenerateAudioForCurrentProject('timeline voice picker');
    if (result) {
      // Refresh variant chips after generation
      await loadVoiceVariantChips();
    }
  });

  // Initial chip load
  loadVoiceVariantChips();
}

async function populateTimelineVoiceSelect() {
  const tlVoiceSelect = document.getElementById('timeline-voice-select');
  if (!tlVoiceSelect) return;

  try {
    const response = await fetch('/api/voices', { cache: 'no-store' });
    const data = await response.json();
    if (!response.ok || !data.success) return;

    const edgeVoices = data.voices.filter((v) => v.provider === 'edge');
    const vieneuVoices = data.voices.filter((v) => v.provider === 'vieneu');

    // Update Edge optgroup
    const edgeGroup = tlVoiceSelect.querySelector('optgroup[data-provider="edge"]');
    if (edgeGroup) {
      edgeGroup.innerHTML = '';
      edgeVoices.forEach((v) => {
        const opt = document.createElement('option');
        opt.value = v.id;
        opt.textContent = v.name;
        edgeGroup.appendChild(opt);
      });
    }

    // Update VieNeu optgroup
    const vieneuGroup = document.getElementById('tl-voice-optgroup-vieneu');
    if (vieneuGroup) {
      vieneuGroup.innerHTML = '';
      vieneuVoices.forEach((v) => {
        const opt = document.createElement('option');
        opt.value = v.id;
        opt.textContent = (v.label || v.name) + (data.vieneuStatus !== 'ready' ? ' ⏳' : '');
        vieneuGroup.appendChild(opt);
      });
    }

    // Set current voice from project (with normalization support)
    const currentVoice = currentProject?.metadata?.voice;
    if (currentVoice) {
      const allOpts = Array.from(tlVoiceSelect.querySelectorAll('option')).map((o) => o.value);
      let matched = allOpts.find((val) => val === currentVoice);
      if (!matched && currentVoice.startsWith('vieneu:')) {
        const clean = currentVoice.slice(7).replace(/^⭐\s*/, '').split(/[,—\-]/)[0].trim();
        matched = allOpts.find((val) => val === `vieneu:${clean}`);
      }
      if (matched) {
        tlVoiceSelect.value = matched;
        if (currentProject.metadata) currentProject.metadata.voice = matched;
      }
    }
  } catch (error) {
    console.warn('Failed to populate timeline voice select:', error);
  }
}

async function loadVoiceVariantChips() {
  const chipContainer = document.getElementById('voice-variant-chips');
  if (!chipContainer || !currentProject) return;

  try {
    const response = await fetch('/api/voice-variants', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectData: currentProject }),
    });
    const data = await response.json();
    if (!data.success) return;

    chipContainer.innerHTML = '';
    const variants = data.variants || [];
    if (variants.length === 0) return;

    const currentVoice = currentProject?.metadata?.voice || 'vi-VN-HoaiMyNeural';

    variants.forEach((variant) => {
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'voice-variant-chip';
      if (variant.voiceId === currentVoice) chip.classList.add('active');
      const isVieneu = variant.voiceId.startsWith('vieneu:');
      chip.innerHTML = `<span class="chip-icon">${isVieneu ? '🧠' : '☁️'}</span>${variant.voiceName}`;
      chip.title = `Nghe thử với giọng ${variant.voiceName}`;
      chip.dataset.voiceId = variant.voiceId;
      chip.dataset.masterUrl = variant.masterUrl;
      chip.dataset.masterFile = variant.masterFile;

      chip.addEventListener('click', () => switchToVoiceVariant(variant));
      chipContainer.appendChild(chip);
    });
  } catch (error) {
    console.warn('Failed to load voice variants:', error);
  }
}

function switchToVoiceVariant(variant) {
  if (!currentProject || !variant.masterUrl) return;

  // Update the project metadata voice
  currentProject.metadata = currentProject.metadata || {};
  currentProject.metadata.voice = variant.voiceId;
  runtimeAudioFile = variant.masterFile;
  audioMixDirty = false;

  // Switch audio source instantly — no regeneration needed
  if (audioEl) {
    const wasPlaying = !audioEl.paused;
    const currentTime = audioEl.currentTime;
    audioEl.src = variant.masterUrl;
    audioEl.load();
    audioEl.addEventListener('canplay', function onCanPlay() {
      audioEl.removeEventListener('canplay', onCanPlay);
      audioEl.currentTime = currentTime;
      if (wasPlaying) audioEl.play().catch(() => {});
    }, { once: true });
  }

  // Update chip active states
  const chipContainer = document.getElementById('voice-variant-chips');
  if (chipContainer) {
    chipContainer.querySelectorAll('.voice-variant-chip').forEach((chip) => {
      chip.classList.toggle('active', chip.dataset.voiceId === variant.voiceId);
    });
  }

  // Sync settings sidebar
  const settingsVoice = document.getElementById('setting-voice');
  if (settingsVoice && settingsVoice.querySelector(`option[value="${variant.voiceId}"]`)) {
    settingsVoice.value = variant.voiceId;
  }

  // Update timeline voice select
  const tlVoiceSelect = document.getElementById('timeline-voice-select');
  if (tlVoiceSelect) {
    let opt = tlVoiceSelect.querySelector(`option[value="${variant.voiceId}"]`);
    if (!opt && variant.voiceId.startsWith('vieneu:')) {
      const clean = variant.voiceId.slice(7).replace(/^⭐\s*/, '').split(/[,—\-]/)[0].trim();
      opt = tlVoiceSelect.querySelector(`option[value="vieneu:${clean}"]`);
    }
    if (opt) tlVoiceSelect.value = opt.value;
  }

  setAudioStatus('ready', `Đang phát giọng: ${variant.voiceName}`, 100);
  showToast(`Đã chuyển sang giọng ${variant.voiceName}`);
  syncJsonEditor();
}

async function regenerateAudioForCurrentProject(source) {
  if (!currentProject) return false;
  if (audioGenerationPromise) return audioGenerationPromise;
  const generationRevision = projectLoadRevision;
  const projectSnapshot = cloneJson(currentProject);

  audioGenerationPromise = (async () => {
    setAudioStatus('working', 'Đang chuẩn bị tạo âm thanh...', 3);
    startAudioStatusPolling();
    btnGenerateAudio?.setAttribute('disabled', 'disabled');
    btnRenderTrigger?.setAttribute('disabled', 'disabled');
    if (audioEl) audioEl.pause();

    try {
      const response = await fetch('/api/generate-audio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectData: projectSnapshot,
          force: source === 'yêu cầu thủ công',
        }),
      });
      const payload = await response.json();
      if (!response.ok || !payload.success) {
        throw new Error(payload.error || 'Server không thể tạo âm thanh.');
      }

      if (generationRevision !== projectLoadRevision) return false;

      runtimeAudioFile = payload.masterFile || payload.audioFile;
      audioMixDirty = false;
      if (audioEl) {
        audioEl.src = payload.voiceUrl || payload.audioUrl;
        audioEl.load();
      }
      setAudioStatus('ready', `Voiceover sẵn sàng: ${payload.sceneCount} cảnh`, 100);
      if (hasHtmlTemplate()) await refreshProjectPreview();
      loadVoiceVariantChips();
      showToast(`Đã tạo Voiceover và đồng bộ preview theo ${source}.`);
      return true;
    } catch (error) {
      const connectionLost = error instanceof TypeError && /fetch/i.test(error.message);
      const message = connectionLost
        ? 'Dev Server đã dừng hoặc mất kết nối.'
        : `Không thể tạo Voiceover: ${error.message}`;
      setAudioStatus('error', message, 0);
      showToast(`${message} JSON và Preview vẫn được giữ; bấm “Tạo lại Voiceover” để thử lại.`, 'error');
      await checkServerHealth();
      return false;
    } finally {
      stopAudioStatusPolling();
      btnGenerateAudio?.removeAttribute('disabled');
      if (serverOnline) btnRenderTrigger?.removeAttribute('disabled');
      audioGenerationPromise = null;
    }
  })();

  return audioGenerationPromise;
}

async function checkServerHealth() {
  if (healthCheckInFlight) return healthCheckInFlight;

  healthCheckInFlight = (async () => {
    if (window.location.protocol === 'file:') {
      serverOnline = false;
      serverStatus.dataset.state = 'error';
      serverStatus.innerText = 'Mở bằng start_studio.bat';
      btnGenerateAudio?.setAttribute('disabled', 'disabled');
      btnRenderTrigger?.setAttribute('disabled', 'disabled');
      return false;
    }

    try {
      const response = await fetch('/api/health', { cache: 'no-store' });
      const payload = await response.json();
      if (!response.ok || !payload.success) throw new Error(payload.error || 'Server chưa sẵn sàng.');
      if (!payload.systemReady) {
        const systemResponse = await fetch('/api/system-check', { cache: 'no-store' });
        const system = await systemResponse.json();
        const missing = Object.entries(system.checks || {})
          .filter(([, check]) => !check.ok)
          .map(([name]) => name)
          .join(', ');
        throw new Error(`Bộ render chưa sẵn sàng: ${missing || 'hãy chạy npm run setup'}`);
      }

      serverOnline = true;
      if (payload.audioActive || audioGenerationPromise) {
        serverStatus.dataset.state = 'working';
        serverStatus.innerText = 'Đang tạo âm thanh...';
        btnGenerateAudio?.setAttribute('disabled', 'disabled');
        btnRenderTrigger?.setAttribute('disabled', 'disabled');
      } else if (payload.renderActive) {
        serverStatus.dataset.state = 'working';
        serverStatus.innerText = 'Đang render video...';
        btnGenerateAudio?.setAttribute('disabled', 'disabled');
        btnRenderTrigger?.setAttribute('disabled', 'disabled');
      } else {
        serverStatus.dataset.state = 'ready';
        serverStatus.innerText = 'Dev Server & render sẵn sàng';
        btnGenerateAudio?.removeAttribute('disabled');
        btnRenderTrigger?.removeAttribute('disabled');
      }
      serverStatus.title = 'Node Server, HyperFrames, FFmpeg, FFprobe và trình duyệt render đã sẵn sàng';

      if (payload.network?.primaryLanUrl) {
        const btnCopyLan = document.getElementById('btn-copy-lan');
        if (btnCopyLan) {
          btnCopyLan.dataset.lanUrl = payload.network.primaryLanUrl;
          btnCopyLan.title = `Sao chép link mạng LAN: ${payload.network.primaryLanUrl}`;
        }
      }
      return true;
    } catch (error) {
      serverOnline = false;
      serverStatus.dataset.state = 'error';
      serverStatus.innerText = error.message.includes('Bộ render') ? 'Bộ render chưa sẵn sàng' : 'Dev Server đã dừng';
      serverStatus.title = error.message;
      btnGenerateAudio?.setAttribute('disabled', 'disabled');
      btnRenderTrigger?.setAttribute('disabled', 'disabled');
      return false;
    }
  })();

  try {
    return await healthCheckInFlight;
  } finally {
    healthCheckInFlight = null;
  }
}

function initModals() {
  document.querySelectorAll('.btn-close-modal').forEach(btn => {
    btn.addEventListener('click', () => {
      const modal = btn.closest('.modal-backdrop');
      if (modal?.id === 'modal-render-progress' && (renderJobId || renderPollInterval)) {
        showToast('Render đang chạy. Hãy dùng nút Hủy render trước.', 'error');
        return;
      }
      modal?.classList.remove('active');
    });
  });

  document.getElementById('btn-cancel-render').addEventListener('click', cancelPremiumRender);
}

function syncSettingsUI() {
  const titleInput = document.getElementById('setting-title');
  const gradeInput = document.getElementById('setting-grade');
  const voiceInput = document.getElementById('setting-voice');

  if (titleInput && currentProject?.metadata?.title) titleInput.value = currentProject.metadata.title;
  if (gradeInput && currentProject?.metadata?.grade) gradeInput.value = currentProject.metadata.grade;
  if (voiceInput && currentProject?.metadata?.voice) voiceInput.value = currentProject.metadata.voice;
}

function syncJsonEditor() {
  if (rawJsonEditor && currentProject) {
    rawJsonEditor.value = JSON.stringify(currentProject, null, 2);
  }
}

async function chooseOutputDirectory() {
  if (!('showDirectoryPicker' in window)) {
    alert('Trình duyệt này chưa hỗ trợ chọn thư mục trực tiếp. Video vẫn được lưu trong rendered_output và có thể tải bằng nút Tải Video MP4.');
    return;
  }

  try {
    const handle = await window.showDirectoryPicker({
      id: 'mathca-video-output',
      mode: 'readwrite',
    });
    const permission = await handle.requestPermission({ mode: 'readwrite' });
    if (permission !== 'granted') throw new Error('Chưa được cấp quyền ghi vào thư mục đã chọn.');

    selectedOutputDirectoryHandle = handle;
    outputFolderStatus.innerText = `Đã chọn: ${handle.name}`;
    outputFolderStatus.title = `Video mới sẽ tự lưu vào thư mục ${handle.name}`;
    showToast(`Đã chọn thư mục lưu video: ${handle.name}`);
  } catch (error) {
    if (error.name !== 'AbortError') {
      alert(`Không thể chọn thư mục lưu: ${error.message}`);
    }
  }
}

async function ensureOutputDirectoryPermission(handle) {
  const permissionOptions = { mode: 'readwrite' };
  if (typeof handle.queryPermission === 'function') {
    const currentPermission = await handle.queryPermission(permissionOptions);
    if (currentPermission === 'granted') return true;
  }
  if (typeof handle.requestPermission === 'function') {
    return (await handle.requestPermission(permissionOptions)) === 'granted';
  }
  return false;
}

async function saveRenderedVideoToSelectedFolder(outputFile) {
  if (!selectedOutputDirectoryHandle) {
    return { saved: false, message: `Bản dự phòng: rendered_output/${outputFile}` };
  }

  const hasPermission = await ensureOutputDirectoryPermission(selectedOutputDirectoryHandle);
  if (!hasPermission) throw new Error('Không còn quyền ghi vào thư mục đã chọn.');

  const response = await fetch(`/rendered/${encodeURIComponent(outputFile)}`, { cache: 'no-store' });
  if (!response.ok) throw new Error('Không tải được file MP4 vừa render từ server.');

  const fileHandle = await selectedOutputDirectoryHandle.getFileHandle(outputFile, { create: true });
  const writable = await fileHandle.createWritable();
  try {
    if (response.body?.getReader) {
      const reader = response.body.getReader();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        await writable.write(value);
      }
    } else {
      await writable.write(await response.blob());
    }
  } finally {
    await writable.close();
  }

  return {
    saved: true,
    message: `Đã lưu vào thư mục "${selectedOutputDirectoryHandle.name}" với tên ${outputFile}`,
  };
}

/**
 * 9. Render Video Pipeline (HyperFrames Engine)
 */
async function triggerRenderProcess() {
  if (!currentProject) return;
  if (!(await checkServerHealth())) {
    showToast(`Studio chưa sẵn sàng để render. ${serverStatus.title || 'Hãy chạy lại start_studio.bat.'}`, 'error');
    return;
  }

  if (audioGenerationPromise) {
    setAudioStatus('working', 'Đang chờ tạo âm thanh xong...');
    const audioReady = await audioGenerationPromise;
    if (!audioReady) return;
  }
  if (audioMixDirty || !runtimeAudioFile) {
    setAudioStatus('working', 'Đang cập nhật audio master trước khi render...');
    const audioReady = await regenerateAudioForCurrentProject('thay đổi BGM/SFX');
    if (!audioReady) return;
  }

  modalRenderProgress.classList.add('active');
  renderStageText.innerText = 'Đang biên dịch bố cục và hoạt ảnh HyperFrames...';
  renderProgressBar.style.width = '10%';
  renderPercentText.innerText = '10%';
  renderSuccessBox.style.display = 'none';
  renderCompletionHandled = false;
  updateStudioJobProgress('working', 'Đang khởi động render...', 5);
  renderOutputLocation.innerText = selectedOutputDirectoryHandle
    ? `Sau khi render, video sẽ tự lưu vào thư mục "${selectedOutputDirectoryHandle.name}".`
    : 'Bản dự phòng sẽ được lưu trong rendered_output.';

  const fullHtml = buildRuntimeCompositionHtml();

  try {
    const response = await fetch('/api/render', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        projectData: currentProject,
        htmlContent: fullHtml,
        fps: renderConfig.fps,
        quality: renderConfig.quality,
        resolution: renderConfig.resolution,
        includeAudio: renderConfig.includeAudio,
      }),
    });

    const payload = await response.json();
    if (!response.ok || !payload.success) {
      throw new Error(payload.error || 'Không thể khởi động render.');
    }

    renderJobId = payload.jobId || null;
    if (renderPollInterval) clearInterval(renderPollInterval);
    renderPollInterval = setInterval(pollRenderStatus, 800);
    await pollRenderStatus();
  } catch (error) {
    showToast(`Không thể khởi động server render: ${error.message}`, 'error');
    updateStudioJobProgress('error', 'Render thất bại', 0);
    modalRenderProgress.classList.remove('active');
    await checkServerHealth();
  }
}

async function pollRenderStatus() {
  try {
    const response = await fetch('/api/render-status', { cache: 'no-store' });
    const status = await response.json();
    if (!response.ok) throw new Error(status.error || 'Không đọc được trạng thái render.');

    renderStageText.innerText = status.stage || 'Đang render khung hình...';
    renderProgressBar.style.width = `${status.progress || 0}%`;
    renderPercentText.innerText = `${status.progress || 0}%`;
    updateRenderSteps(status);
    // Sync persistent progress strip with render job
    updateStudioJobProgress('working', status.stage || 'Đang render...', status.progress || 0);

    if (!status.active && status.progress === 100 && status.outputFile) {
      clearInterval(renderPollInterval);
      if (renderCompletionHandled) return;
      renderCompletionHandled = true;
      btnDownloadVideo.href = `/rendered/${encodeURIComponent(status.outputFile)}`;

      try {
        renderStageText.innerText = selectedOutputDirectoryHandle
          ? 'Render hoàn tất. Đang lưu vào thư mục đã chọn...'
          : 'Render hoàn tất!';
        const saveResult = await saveRenderedVideoToSelectedFolder(status.outputFile);
        renderOutputLocation.innerText = saveResult.message;
        showToast(saveResult.saved ? 'Đã render và lưu video vào thư mục đã chọn! 🎉' : 'Render video MP4 hoàn tất! 🎉');
      } catch (error) {
        renderOutputLocation.innerText = `Không thể tự lưu vào thư mục đã chọn: ${error.message} Bản dự phòng vẫn còn trong rendered_output.`;
        showToast('Render xong nhưng chưa thể sao chép vào thư mục đã chọn.', 'error');
      }

      renderStageText.innerText = 'Render hoàn tất!';
      renderJobId = null;
      renderSuccessBox.style.display = 'block';
      updateStudioJobProgress('ready', 'Render hoàn tất!', 100);
    } else if (!status.active && status.error) {
      clearInterval(renderPollInterval);
      const logTail = Array.isArray(status.log) ? status.log.slice(-3).join(' | ') : '';
      renderStageText.innerText = `Render thất bại: ${status.error}`;
      updateStudioJobProgress('error', `Render lỗi: ${status.error}`, status.progress || 0);
      showToast(`Render thất bại: ${status.error}${logTail ? ' — ' + logTail : ''}`, 'error');
    }
  } catch (error) {
    clearInterval(renderPollInterval);
    renderStageText.innerText = 'Mất kết nối với server render.';
    updateStudioJobProgress('error', 'Mất kết nối render server', 0);
    await checkServerHealth();
  }
}

/**
 * 10. Complete HyperFrames HTML Generator
 */
function generateCompleteHtmlComposition(project, options = {}) {
  if (!window.MathCAComposition?.generateCompleteHtmlComposition) {
    throw new Error('Không tải được bộ tạo composition HyperFrames.');
  }
  return window.MathCAComposition.generateCompleteHtmlComposition(project, options);
}

/**
 * Utilities
 */
function formatTime(sec) {
  if (isNaN(sec)) return '00:00.0';
  const m = Math.floor(sec / 60);
  const s = (sec % 60).toFixed(1);
  return `${m < 10 ? '0' : ''}${m}:${parseFloat(s) < 10 ? '0' : ''}${s}`;
}

let _toastTimer = null;
function showToast(msg, type = 'success') {
  let toast = document.getElementById('studio-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'studio-toast';
    toast.style.position = 'fixed';
    toast.style.bottom = '90px';
    toast.style.right = '24px';
    toast.style.padding = '12px 24px';
    toast.style.borderRadius = '10px';
    toast.style.fontWeight = '700';
    toast.style.fontSize = '14px';
    toast.style.boxShadow = '0 8px 24px rgba(0,0,0,0.3)';
    toast.style.zIndex = '9999';
    toast.style.transition = 'all 0.3s ease';
    toast.style.maxWidth = '420px';
    document.body.appendChild(toast);
  }
  // Clear any previous timeout so new toast isn't hidden by stale timer
  if (_toastTimer) { clearTimeout(_toastTimer); _toastTimer = null; }
  const colors = {
    success: 'rgba(18, 171, 160, 0.95)',
    error: 'rgba(255, 82, 57, 0.95)',
    info: 'rgba(30, 60, 90, 0.95)',
  };
  toast.style.background = colors[type] || colors.success;
  toast.style.color = '#ffffff';
  toast.innerText = msg;
  toast.style.opacity = '1';
  toast.style.transform = 'translateY(0)';
  _toastTimer = setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    _toastTimer = null;
  }, type === 'error' ? 5000 : 2500);
}

/**
 * Update Manager: Check and Apply updates from GitHub
 */
let updateCheckInFlight = false;
let updateApplyInFlight = false;

function initUpdateManager() {
  const btnCheckUpdate = document.getElementById('btn-check-update');
  const modalUpdate = document.getElementById('modal-update');
  const btnRecheckUpdate = document.getElementById('btn-recheck-update');
  const btnApplyUpdate = document.getElementById('btn-apply-update');

  btnCheckUpdate?.addEventListener('click', () => {
    modalUpdate?.classList.add('active');
    checkAppUpdate(true);
  });

  btnRecheckUpdate?.addEventListener('click', () => checkAppUpdate(true));
  btnApplyUpdate?.addEventListener('click', applyAppUpdate);

  // Background check on startup
  setTimeout(() => checkAppUpdate(false), 2500);
}

async function checkAppUpdate(isManual = false) {
  if (updateCheckInFlight) return;
  updateCheckInFlight = true;

  const updateBadge = document.getElementById('update-badge');
  const updateCurrentCommit = document.getElementById('update-current-commit');
  const updateRemoteCommit = document.getElementById('update-remote-commit');
  const updateStatusMsg = document.getElementById('update-status-msg');
  const updateChangelogSection = document.getElementById('update-changelog-section');
  const updateChangelogList = document.getElementById('update-changelog-list');
  const btnApplyUpdate = document.getElementById('btn-apply-update');
  const btnRecheckUpdate = document.getElementById('btn-recheck-update');

  if (isManual) {
    if (updateStatusMsg) {
      updateStatusMsg.className = 'update-status-msg checking';
      updateStatusMsg.textContent = 'Đang kết nối GitHub để kiểm tra phiên bản mới...';
    }
    if (btnApplyUpdate) btnApplyUpdate.disabled = true;
    if (btnRecheckUpdate) btnRecheckUpdate.disabled = true;
  }

  try {
    const res = await fetch('/api/update/check');
    const data = await res.json();

    if (!data.success) {
      throw new Error(data.error || 'Không thể kiểm tra bản cập nhật.');
    }

    if (updateCurrentCommit) updateCurrentCommit.textContent = data.currentCommit || '—';
    if (updateRemoteCommit) updateRemoteCommit.textContent = data.remoteCommit || '—';

    if (data.hasUpdate) {
      if (updateBadge) updateBadge.style.display = 'inline-block';
      if (updateStatusMsg) {
        updateStatusMsg.className = 'update-status-msg has-update';
        updateStatusMsg.textContent = `🚀 Có ${data.commitsBehind || 1} bản cập nhật mới trên GitHub! Nhấn "Cập Nhật Ngay" để nâng cấp.`;
      }
      if (btnApplyUpdate) btnApplyUpdate.disabled = false;

      if (data.changelog && data.changelog.length > 0 && updateChangelogList && updateChangelogSection) {
        updateChangelogList.innerHTML = '';
        data.changelog.forEach((item) => {
          const li = document.createElement('li');
          li.textContent = item;
          updateChangelogList.appendChild(li);
        });
        updateChangelogSection.style.display = 'block';
      }
    } else {
      if (updateBadge) updateBadge.style.display = 'none';
      if (updateStatusMsg) {
        updateStatusMsg.className = 'update-status-msg up-to-date';
        updateStatusMsg.textContent = '✅ Bạn đang sử dụng phiên bản mới nhất từ GitHub!';
      }
      if (btnApplyUpdate) btnApplyUpdate.disabled = true;
      if (updateChangelogSection) updateChangelogSection.style.display = 'none';
    }
  } catch (err) {
    console.warn('[Update Check]', err);
    if (isManual && updateStatusMsg) {
      updateStatusMsg.className = 'update-status-msg error';
      updateStatusMsg.textContent = `Lỗi kiểm tra cập nhật: ${err.message}`;
    }
  } finally {
    updateCheckInFlight = false;
    if (btnRecheckUpdate) btnRecheckUpdate.disabled = false;
  }
}

async function applyAppUpdate() {
  if (updateApplyInFlight) return;
  updateApplyInFlight = true;

  const btnApplyUpdate = document.getElementById('btn-apply-update');
  const btnRecheckUpdate = document.getElementById('btn-recheck-update');
  const updateStatusMsg = document.getElementById('update-status-msg');
  const updateProgressContainer = document.getElementById('update-progress-container');
  const updateStepText = document.getElementById('update-step-text');
  const updateBadge = document.getElementById('update-badge');

  if (btnApplyUpdate) btnApplyUpdate.disabled = true;
  if (btnRecheckUpdate) btnRecheckUpdate.disabled = true;
  if (updateProgressContainer) updateProgressContainer.style.display = 'block';
  if (updateStepText) updateStepText.textContent = 'Đang kéo mã nguồn mới nhất từ GitHub (git pull)...';
  if (updateStatusMsg) {
    updateStatusMsg.className = 'update-status-msg updating';
    updateStatusMsg.textContent = 'Đang cập nhật phiên bản mới, vui lòng không tắt trình duyệt hoặc server...';
  }

  try {
    const res = await fetch('/api/update/apply', { method: 'POST' });
    const data = await res.json();

    if (!data.success) {
      throw new Error(data.error || 'Cập nhật thất bại.');
    }

    if (updateStepText) updateStepText.textContent = 'Hoàn tất cập nhật!';
    if (updateStatusMsg) {
      updateStatusMsg.className = 'update-status-msg up-to-date';
      updateStatusMsg.textContent = '🎉 Cập nhật thành công! Trang sẽ tự động tải lại sau 3 giây...';
    }
    if (updateBadge) updateBadge.style.display = 'none';
    showToast('Cập nhật thành công! Đang tải lại Studio... 🎉');

    setTimeout(() => {
      window.location.reload();
    }, 3000);
  } catch (err) {
    console.error('[Update Apply]', err);
    if (updateStatusMsg) {
      updateStatusMsg.className = 'update-status-msg error';
      updateStatusMsg.textContent = `Cập nhật thất bại: ${err.message}`;
    }
    if (updateProgressContainer) updateProgressContainer.style.display = 'none';
    if (btnApplyUpdate) btnApplyUpdate.disabled = false;
    if (btnRecheckUpdate) btnRecheckUpdate.disabled = false;
    showToast(`Lỗi cập nhật: ${err.message}`, 'error');
  } finally {
    updateApplyInFlight = false;
  }
}



