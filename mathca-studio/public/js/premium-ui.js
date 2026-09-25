const PREMIUM_SFX_PRESETS = [
  { key: 'whoosh', name: 'Whoosh', duration: 1.1 },
  { key: 'pop', name: 'Pop', duration: 0.35 },
  { key: 'boing', name: 'Boing', duration: 0.8 },
  { key: 'chime', name: 'Chime', duration: 1.2 },
  { key: 'click', name: 'Click', duration: 0.18 },
];

let premiumMediaKind = 'image';

const FALLBACK_BGM_LIBRARY = [
  { id: 'bgm-happy-math-01', assetId: 'bgm-happy-math-01', name: 'Happy Math', mood: 'Vui tươi · Học tập', src: 'assets/audio-library/bgm/happy-math.wav', url: '/assets/audio-library/bgm/happy-math.wav', duration: 4 },
];

function initPremiumStudio() {
  document.querySelectorAll('.inspector-tab').forEach((button) => {
    button.addEventListener('click', () => openPremiumInspectorTab(button.dataset.inspectorTab));
  });
  document.getElementById('rail-audio')?.addEventListener('click', () => openPremiumInspectorTab('audio'));
  document.getElementById('btn-undo')?.addEventListener('click', premiumUndo);
  document.getElementById('btn-redo')?.addEventListener('click', premiumRedoAction);
  document.getElementById('btn-add-scene')?.addEventListener('click', addPremiumScene);
  document.getElementById('btn-split-scene')?.addEventListener('click', splitPremiumScene);
  document.getElementById('btn-duplicate-timeline')?.addEventListener('click', duplicateTimelineSelection);
  document.getElementById('btn-delete-timeline')?.addEventListener('click', deleteTimelineSelection);
  document.getElementById('timeline-zoom')?.addEventListener('input', (event) => {
    const content = document.getElementById('timeline-track');
    if (!content) return;
    const base = Math.max(820, content.parentElement?.clientWidth || 820);
    content.style.width = `${Math.round(base * Number(event.target.value) / 100)}px`;
  });
  bindAudioInspectorControls();
  bindAudioLibrary();
  bindMediaLibrary();
  bindTimelineScrollSync();
  bindRenderConfiguration();
  bindTimelineResize();
  updateHistoryButtons();

  window.addEventListener('keydown', (event) => {
    const tag = document.activeElement?.tagName;
    if (['INPUT', 'TEXTAREA', 'SELECT'].includes(tag) && event.key !== 'Escape') return;
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') {
      event.preventDefault();
      document.getElementById('btn-save-project')?.click();
    } else if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z') {
      event.preventDefault();
      event.shiftKey ? premiumRedoAction() : premiumUndo();
    } else if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'y') {
      event.preventDefault();
      premiumRedoAction();
    } else if (event.code === 'Space') {
      event.preventDefault();
      togglePlayPause();
    }
  }, true);

  document.addEventListener('focusin', (event) => {
    if (event.target.matches('input, textarea, select') && currentProject) premiumHistorySnapshot = snapshotProjectState();
  });
  document.addEventListener('change', (event) => {
    if (!event.target.matches('input, textarea, select') || !premiumHistorySnapshot) return;
    pushPremiumHistory(premiumHistorySnapshot);
    premiumHistorySnapshot = null;
    markProjectDirty();
  });
}

function openPremiumInspectorTab(name) {
  document.querySelectorAll('.inspector-tab').forEach((button) => {
    const active = button.dataset.inspectorTab === name;
    button.classList.toggle('active', active);
    button.setAttribute('aria-selected', String(active));
  });
  document.getElementById('inspector-content')?.classList.toggle('active', name !== 'audio');
  document.getElementById('audio-inspector-panel')?.classList.toggle('active', name === 'audio');
  document.getElementById('rail-audio')?.classList.toggle('active', name === 'audio');
  const heading = document.getElementById('inspector-heading');
  if (heading) heading.textContent = name === 'audio' ? 'Âm thanh dự án' : name === 'effects' ? 'Hiệu ứng đối tượng' : 'Đối tượng đang chọn';
  if (name === 'effects') setTimeout(() => document.getElementById('animation-section')?.scrollIntoView({ block: 'start', behavior: 'smooth' }), 20);
}

function renderPremiumAudioUI() {
  if (!currentProject) return;
  const audio = ensureRuntimeAudioState();
  const bgm = audio.bgm;
  const setValue = (id, value) => { const el = document.getElementById(id); if (el) el.value = value; };
  const setChecked = (id, value) => { const el = document.getElementById(id); if (el) el.checked = Boolean(value); };
  document.getElementById('bgm-state-text').textContent = bgm.enabled ? 'Đang bật' : 'Đang tắt';
  document.getElementById('bgm-name').textContent = bgm.name || 'Chưa chọn nhạc';
  document.getElementById('bgm-meta').textContent = bgm.src ? (bgm.assetId ? `Asset ${bgm.assetId}` : bgm.src) : 'Chọn từ thư viện hoặc tải MP3/WAV/M4A';
  setChecked('bgm-toggle', bgm.enabled);
  setChecked('bgm-loop', bgm.loop);
  setChecked('bgm-ducking', bgm.ducking.enabled);
  setValue('bgm-volume', Math.round(bgm.volume * 100));
  setValue('bgm-start', bgm.startTime.toFixed(1));
  setValue('bgm-end', bgm.endTime.toFixed(1));
  setValue('bgm-fade-in', bgm.fadeIn);
  setValue('bgm-fade-out', bgm.fadeOut);
  setValue('bgm-duck-db', bgm.ducking.underVoiceDb);
  document.getElementById('bgm-volume-output').textContent = `${Math.round(bgm.volume * 100)}%`;
  document.getElementById('bgm-duck-output').textContent = `${bgm.ducking.underVoiceDb} dB`;
  setValue('sfx-master-volume', Math.round(audio.sfxMasterVolume * 100));
  document.getElementById('sfx-master-output').textContent = `${Math.round(audio.sfxMasterVolume * 100)}%`;

  const presets = document.getElementById('sfx-presets');
  if (presets && !presets.children.length) {
    PREMIUM_SFX_PRESETS.forEach((preset) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'sfx-preset';
      button.textContent = preset.name;
      button.title = `Chèn ${preset.name} tại playhead`;
      button.addEventListener('click', () => insertPremiumSfx(preset));
      presets.appendChild(button);
    });
  }

  const clip = selectedRuntimeSfx();
  document.getElementById('sfx-selected-name').textContent = clip?.name || 'Chưa chọn';
  ['sfx-clip-volume', 'sfx-clip-pan', 'btn-sfx-nudge-left', 'btn-sfx-nudge-right'].forEach((id) => {
    const el = document.getElementById(id); if (el) el.disabled = !clip;
  });
  if (clip) {
    setValue('sfx-clip-volume', Math.round(clip.volume * 100));
    setValue('sfx-clip-pan', Math.round(clip.pan * 100));
    document.getElementById('sfx-clip-volume-output').textContent = `${Math.round(clip.volume * 100)}%`;
    document.getElementById('sfx-clip-pan-output').textContent = clip.pan === 0 ? 'C' : clip.pan < 0 ? `L ${Math.abs(Math.round(clip.pan * 100))}` : `R ${Math.round(clip.pan * 100)}`;
  }
  updateRenderAudioSummary();
}

function bindAudioInspectorControls() {
  const bindCheckbox = (id, apply) => document.getElementById(id)?.addEventListener('change', (event) => {
    withProjectCommand('Đã cập nhật âm thanh', () => { apply(Boolean(event.target.checked)); persistRuntimeAudio(); });
  });
  const bindNumber = (id, apply) => document.getElementById(id)?.addEventListener('change', (event) => {
    withProjectCommand('Đã cập nhật âm thanh', () => { apply(Number(event.target.value)); persistRuntimeAudio(); });
  });
  bindCheckbox('bgm-toggle', (value) => { ensureRuntimeAudioState().bgm.enabled = value; syncBgmPreviewWithPlayhead(); });
  bindCheckbox('bgm-loop', (value) => { ensureRuntimeAudioState().bgm.loop = value; });
  bindCheckbox('bgm-ducking', (value) => { ensureRuntimeAudioState().bgm.ducking.enabled = value; });
  bindNumber('bgm-start', (value) => { const b = ensureRuntimeAudioState().bgm; b.startTime = Math.max(0, Math.min(value, b.endTime - .1)); });
  bindNumber('bgm-end', (value) => { const b = ensureRuntimeAudioState().bgm; b.endTime = Math.min(getProjectDuration(), Math.max(b.startTime + .1, value)); });
  bindNumber('bgm-fade-in', (value) => { ensureRuntimeAudioState().bgm.fadeIn = Math.max(0, value); });
  bindNumber('bgm-fade-out', (value) => { ensureRuntimeAudioState().bgm.fadeOut = Math.max(0, value); });
  document.getElementById('bgm-volume')?.addEventListener('input', (event) => { ensureRuntimeAudioState().bgm.volume = Number(event.target.value) / 100; document.getElementById('bgm-volume-output').textContent = `${event.target.value}%`; updateBgmPreviewGain(); persistRuntimeAudio(); });
  document.getElementById('bgm-duck-db')?.addEventListener('input', (event) => { ensureRuntimeAudioState().bgm.ducking.underVoiceDb = Number(event.target.value); document.getElementById('bgm-duck-output').textContent = `${event.target.value} dB`; persistRuntimeAudio(); });
  document.getElementById('sfx-master-volume')?.addEventListener('input', (event) => { ensureRuntimeAudioState().sfxMasterVolume = Number(event.target.value) / 100; document.getElementById('sfx-master-output').textContent = `${event.target.value}%`; persistRuntimeAudio(); });
  document.getElementById('sfx-clip-volume')?.addEventListener('input', (event) => { const clip = selectedRuntimeSfx(); if (!clip) return; clip.volume = Number(event.target.value) / 100; document.getElementById('sfx-clip-volume-output').textContent = `${event.target.value}%`; persistRuntimeAudio(); });
  document.getElementById('sfx-clip-pan')?.addEventListener('input', (event) => { const clip = selectedRuntimeSfx(); if (!clip) return; clip.pan = Number(event.target.value) / 100; document.getElementById('sfx-clip-pan-output').textContent = clip.pan === 0 ? 'C' : clip.pan < 0 ? `L ${Math.abs(event.target.value)}` : `R ${event.target.value}`; persistRuntimeAudio(); });
  document.getElementById('btn-sfx-nudge-left')?.addEventListener('click', () => nudgePremiumSfx(-.1));
  document.getElementById('btn-sfx-nudge-right')?.addEventListener('click', () => nudgePremiumSfx(.1));
  document.getElementById('btn-open-audio-library')?.addEventListener('click', () => openAudioLibrary('bgm'));
  document.getElementById('btn-upload-bgm')?.addEventListener('click', () => document.getElementById('input-upload-bgm')?.click());
  document.getElementById('btn-upload-sfx')?.addEventListener('click', () => document.getElementById('input-upload-sfx')?.click());
  document.getElementById('input-upload-bgm')?.addEventListener('change', (event) => uploadPremiumAudio(event.target.files?.[0], 'bgm'));
  document.getElementById('input-upload-sfx')?.addEventListener('change', (event) => uploadPremiumAudio(event.target.files?.[0], 'sfx'));
  document.getElementById('btn-bgm-preview')?.addEventListener('click', toggleBgmPreview);
}
function insertPremiumSfx(preset) {
  const id = `sfx-${preset.key}-${Date.now()}`;
  withProjectCommand(`Đã chèn ${preset.name}`, () => {
    ensureRuntimeAudioState().sfx.push({ id, src: `preset:${preset.key}`, assetId: `preset-${preset.key}`, name: preset.name, startTime: Number(currentPlayheadTime.toFixed(2)), duration: preset.duration, volume: .42, pan: 0 });
    selectedSfxId = id;
    persistRuntimeAudio();
  });
  previewPresetSfx(preset.key, .42, 0);
  openPremiumInspectorTab('audio');
}

function nudgePremiumSfx(delta) {
  const clip = selectedRuntimeSfx();
  if (!clip) return;
  withProjectCommand(`Đã dịch SFX ${delta > 0 ? '+' : ''}${delta}s`, () => {
    clip.startTime = Math.max(0, Math.min(getProjectDuration() - clip.duration, clip.startTime + delta));
    persistRuntimeAudio();
  });
}

function previewPresetSfx(key, volume = .42, pan = 0) {
  const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextCtor) return;
  const context = new AudioContextCtor();
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  const panner = typeof context.createStereoPanner === 'function' ? context.createStereoPanner() : null;
  const now = context.currentTime;
  const frequencies = { whoosh: 520, pop: 920, boing: 280, chime: 1320, click: 1600 };
  oscillator.frequency.setValueAtTime(frequencies[key] || 880, now);
  if (key === 'whoosh') oscillator.frequency.exponentialRampToValueAtTime(120, now + .45);
  if (key === 'boing') oscillator.frequency.exponentialRampToValueAtTime(640, now + .22);
  gain.gain.setValueAtTime(Math.max(.001, volume * ensureRuntimeAudioState().sfxMasterVolume), now);
  gain.gain.exponentialRampToValueAtTime(.001, now + (key === 'chime' ? .8 : .28));
  if (panner) { panner.pan.value = pan; oscillator.connect(gain).connect(panner).connect(context.destination); }
  else oscillator.connect(gain).connect(context.destination);
  oscillator.start(now);
  oscillator.stop(now + (key === 'chime' ? .82 : .3));
  oscillator.addEventListener('ended', () => context.close());
}

async function uploadPremiumAudio(file, kind) {
  if (!file) return;
  try {
    const response = await fetch('/api/audio-assets', {
      method: 'POST',
      headers: { 'Content-Type': file.type || 'application/octet-stream', 'X-File-Name': encodeURIComponent(file.name), 'X-Audio-Kind': kind },
      body: file,
    });
    const payload = await response.json();
    if (!response.ok || !payload.success) throw new Error(payload.error || 'Không thể lưu file âm thanh.');
    applyUploadedAudioAsset(payload.asset || payload, kind);
  } catch (error) {
    showToast(`Không thể lưu file âm thanh: ${error.message}`, 'error');
  } finally {
    const input = document.getElementById(kind === 'bgm' ? 'input-upload-bgm' : 'input-upload-sfx');
    if (input) input.value = '';
  }
}

function applyUploadedAudioAsset(asset, kind) {
  const src = asset.src || asset.url || '';
  if (kind === 'bgm') {
    if (bgmRuntimeUrl?.startsWith('blob:')) URL.revokeObjectURL(bgmRuntimeUrl);
    bgmRuntimeUrl = asset.url || (src.startsWith('/') ? src : null);
    withProjectCommand(`Đã tải BGM ${asset.name}`, () => {
      Object.assign(ensureRuntimeAudioState().bgm, { enabled: true, src, assetId: asset.assetId || asset.id || null, name: asset.name || 'BGM tải lên', startTime: 0, endTime: getProjectDuration() });
      persistRuntimeAudio();
    });
    syncBgmPreviewWithPlayhead();
  } else {
    const id = `sfx-upload-${Date.now()}`;
    withProjectCommand(`Đã chèn SFX ${asset.name}`, () => {
      ensureRuntimeAudioState().sfx.push({ id, src, assetId: asset.assetId || asset.id || null, name: asset.name || 'SFX tải lên', startTime: currentPlayheadTime, duration: Number(asset.duration) || 1, volume: .42, pan: 0 });
      selectedSfxId = id;
      persistRuntimeAudio();
    });
  }
}

function bindAudioLibrary() {
  document.querySelectorAll('.library-tab').forEach((button) => button.addEventListener('click', () => {
    libraryKind = button.dataset.libraryKind;
    document.querySelectorAll('.library-tab').forEach((item) => item.classList.toggle('active', item === button));
    renderAudioLibrary();
  }));
  document.getElementById('audio-library-search')?.addEventListener('input', renderAudioLibrary);
  document.getElementById('btn-library-upload')?.addEventListener('click', () => document.getElementById(libraryKind === 'bgm' ? 'input-upload-bgm' : 'input-upload-sfx')?.click());
}

function openAudioLibrary(kind = 'bgm') {
  libraryKind = kind;
  document.querySelectorAll('.library-tab').forEach((button) => button.classList.toggle('active', button.dataset.libraryKind === kind));
  renderAudioLibrary();
  document.getElementById('modal-audio-library')?.classList.add('active');
}

async function renderAudioLibrary() {
  const list = document.getElementById('audio-library-list');
  const empty = document.getElementById('audio-library-empty');
  if (!list) return;
  let assets = libraryKind === 'bgm' ? FALLBACK_BGM_LIBRARY : PREMIUM_SFX_PRESETS.map((p) => ({ id: `sfx-${p.key}`, ...p, src: `preset:${p.key}`, mood: 'Preset MathCA' }));
  try {
    const response = await fetch(`/api/audio-assets?kind=${encodeURIComponent(libraryKind)}`, { cache: 'no-store' });
    const payload = await response.json();
    if (response.ok && Array.isArray(payload.assets) && payload.assets.length) assets = payload.assets;
  } catch {}
  const query = (document.getElementById('audio-library-search')?.value || '').trim().toLowerCase();
  assets = assets.filter((asset) => `${asset.name || ''} ${asset.mood || ''}`.toLowerCase().includes(query));
  list.innerHTML = '';
  empty?.classList.toggle('show', assets.length === 0);
  assets.forEach((asset) => {
    const row = document.createElement('div');
    row.className = 'audio-asset-row';
    row.innerHTML = `<button class="mini-control preview-library-asset" type="button" aria-label="Phát thử"><svg class="ui-icon"><use href="#icon-play"/></svg></button><div><strong>${escapeHtmlText(asset.name || 'Audio')}</strong><span>${escapeHtmlText(asset.mood || asset.kind || 'MathCA Audio')}</span></div><button class="btn-header choose-library-asset" type="button">${libraryKind === 'bgm' ? 'Chọn' : 'Chèn'}</button>`;
    row.querySelector('.preview-library-asset').addEventListener('click', () => previewLibraryAsset(asset));
    row.querySelector('.choose-library-asset').addEventListener('click', () => chooseLibraryAsset(asset));
    list.appendChild(row);
  });
}

function escapeHtmlText(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
}

function previewLibraryAsset(asset) {
  if (asset.url || String(asset.src || '').startsWith('/')) {
    const preview = new Audio(asset.url || asset.src);
    preview.volume = .35;
    preview.play().catch(() => {});
  } else previewPresetSfx(asset.key || String(asset.src || '').split(':')[1] || 'chime');
}

function chooseLibraryAsset(asset) {
  if (libraryKind === 'bgm') {
    withProjectCommand(`Đã chọn BGM ${asset.name}`, () => {
      Object.assign(ensureRuntimeAudioState().bgm, { enabled: true, src: asset.src || asset.url || `library:${asset.id}`, assetId: asset.assetId || asset.id, name: asset.name, startTime: 0, endTime: getProjectDuration() });
      bgmRuntimeUrl = asset.url || (String(asset.src || '').startsWith('/') ? asset.src : null);
      persistRuntimeAudio();
    });
    syncBgmPreviewWithPlayhead();
  } else { applyUploadedAudioAsset(asset, 'sfx'); previewLibraryAsset(asset); }
  document.getElementById('modal-audio-library')?.classList.remove('active');
}

function getBgmPreviewElement() {
  let element = document.getElementById('bgm-preview-element');
  if (!element) {
    element = document.createElement('audio');
    element.id = 'bgm-preview-element';
    element.preload = 'metadata';
    document.body.appendChild(element);
  }
  return element;
}

function resolveBgmPreviewUrl() {
  const bgm = ensureRuntimeAudioState().bgm;
  if (bgmRuntimeUrl) return bgmRuntimeUrl;
  if (bgm.src.startsWith('/')) return bgm.src;
  return '';
}

function updateBgmPreviewGain() {
  const element = getBgmPreviewElement();
  const bgm = ensureRuntimeAudioState().bgm;
  let gain = bgm.volume;
  const hasVoice = currentProject?.scenes?.some((scene) => currentPlayheadTime >= Number(scene.startTime) && currentPlayheadTime < Number(scene.endTime) && String(scene.voiceText || '').trim());
  if (hasVoice && bgm.ducking.enabled) gain *= Math.pow(10, bgm.ducking.underVoiceDb / 20);
  element.volume = Math.max(0, Math.min(1, gain));
}

function syncBgmPreviewWithPlayhead() {
  if (!currentProject) return;
  const element = getBgmPreviewElement();
  const bgm = ensureRuntimeAudioState().bgm;
  const url = resolveBgmPreviewUrl();
  if (url && element.src !== new URL(url, window.location.href).href) element.src = url;
  updateBgmPreviewGain();
  if (!bgm.enabled || !url || currentPlayheadTime < bgm.startTime || currentPlayheadTime > bgm.endTime) { element.pause(); return; }
  const offset = Math.max(0, currentPlayheadTime - bgm.startTime);
  if (Math.abs(element.currentTime - offset) > .15) { try { element.currentTime = offset; } catch {} }
  element.loop = bgm.loop;
  if (isPlaying) element.play().catch(() => {}); else element.pause();
}

function toggleBgmPreview() {
  const element = getBgmPreviewElement();
  if (element.paused) { syncBgmPreviewWithPlayhead(); element.play().catch(() => showToast('BGM chưa có file preview.', 'error')); }
  else element.pause();
}
function renderPremiumTimeline() {
  if (!currentProject) return;
  const duration = getProjectDuration();
  const pct = (time) => `${Math.max(0, Math.min(100, time / duration * 100))}%`;
  const ruler = document.getElementById('timeline-ruler');
  if (ruler) {
    ruler.innerHTML = '';
    const step = duration > 45 ? 10 : 5;
    for (let time = 0; time <= duration; time += step) {
      const mark = document.createElement('span');
      mark.style.left = pct(time);
      mark.textContent = `${time}s`;
      ruler.appendChild(mark);
    }
  }
  document.getElementById('timeline-duration-label').textContent = `${duration.toFixed(1)}s`;
  const sceneTrack = document.getElementById('scene-track');
  const voiceTrack = document.getElementById('voice-track');
  const bgmTrack = document.getElementById('bgm-track');
  const sfxTrack = document.getElementById('sfx-track');
  const elementsTrack = document.getElementById('elements-track');
  const elementLabels = document.getElementById('element-layer-labels');
  [sceneTrack, voiceTrack, bgmTrack, sfxTrack, elementsTrack, elementLabels].forEach((track) => { if (track) track.innerHTML = ''; });

  currentProject.scenes.forEach((scene, index) => {
    const start = Number(scene.startTime) || 0;
    const end = Number(scene.endTime) || start + 1;
    const sceneClip = makeTimelineClip('scene', `${index + 1}. ${scene.name || scene.title || 'Cảnh'}`, start, end - start, duration);
    sceneClip.classList.toggle('selected', index === currentSceneIndex);
    sceneClip.addEventListener('click', (event) => {
      event.stopPropagation();
      currentSceneIndex = index;
      selectedSfxId = null;
      updateSidebarActiveCard();
      renderActiveScene(false);
      renderPremiumTimeline();
    });
    sceneTrack?.appendChild(sceneClip);
    if (String(scene.voiceText || '').trim()) voiceTrack?.appendChild(makeTimelineClip('voice', `VO ${index + 1}`, start, end - start, duration));
  });

  const bgm = ensureRuntimeAudioState().bgm;
  if (bgm.src || bgm.assetId) {
    const clip = makeTimelineClip('bgm', `${bgm.name}${bgm.enabled ? '' : ' · TẮT'}`, bgm.startTime, bgm.endTime - bgm.startTime, duration);
    clip.classList.toggle('disabled', !bgm.enabled);
    clip.dataset.timelineBgm = 'true';
    clip.insertAdjacentHTML('afterbegin', '<span class="trim-handle left" data-trim="left"></span>');
    clip.insertAdjacentHTML('beforeend', '<span class="trim-handle right" data-trim="right"></span>');
    bgmTrack?.appendChild(clip);
  } else if (bgmTrack) bgmTrack.innerHTML = '<div class="timeline-empty">BGM đang tắt · mở tab Âm thanh hoặc kéo nhạc từ Media</div>';

  ensureRuntimeAudioState().sfx.forEach((sfx) => {
    const clip = makeTimelineClip('sfx', sfx.name, sfx.startTime, sfx.duration, duration);
    clip.dataset.timelineSfx = sfx.id;
    clip.classList.toggle('selected', sfx.id === selectedSfxId);
    clip.addEventListener('click', (event) => {
      event.stopPropagation();
      selectedSfxId = sfx.id;
      openPremiumInspectorTab('audio');
      renderPremiumAudioUI();
      renderPremiumTimeline();
    });
    sfxTrack?.appendChild(clip);
  });

  const scene = currentScene();
  const visualLayers = [...(scene?.elements || [])].reverse();
  visualLayers.forEach((element, visualIndex) => {
    const label = document.createElement('div');
    label.className = 'track-label element-color element-layer-label';
    label.draggable = true;
    label.dataset.elementLayerId = element.id;
    const name = document.createElement('span');
    name.textContent = element.name || element.text || element.id || 'Đối tượng';
    const index = document.createElement('span');
    index.className = 'layer-index';
    index.textContent = `L${visualLayers.length - visualIndex}`;
    label.append(name, index);
    elementLabels?.appendChild(label);

    const row = document.createElement('div');
    row.className = 'element-layer-track';
    row.draggable = true;
    row.dataset.elementLayerId = element.id;
    const start = Number(element.startTime ?? scene.startTime) || 0;
    const end = Math.max(start + 0.1, Number(element.endTime ?? scene.endTime) || start + 1);
    const clip = makeTimelineClip('element', element.name || element.text || element.id || 'Đối tượng', start, end - start, duration);
    clip.dataset.timelineElement = element.id;
    clip.draggable = true;
    clip.classList.toggle('selected', element.id === selectedElementId);
    clip.addEventListener('click', (event) => {
      event.stopPropagation();
      selectedSfxId = null;
      const dom = findRenderedElementById(element.id);
      if (dom) selectElement(element, dom, false);
      renderPremiumTimeline();
    });
    row.appendChild(clip);
    elementsTrack?.appendChild(row);
    [label, row, clip].forEach((node) => bindElementLayerDrag(node, element.id));
  });

  const rowCount = 4 + Math.max(1, visualLayers.length);
  const timelineContent = document.getElementById('timeline-track');
  if (timelineContent) timelineContent.style.height = `calc(${rowCount} * var(--timeline-row-h) + ${Math.max(0, rowCount - 1) * 4}px)`;
  bindPremiumTimelineDrag();
  bindTimelineMediaDrop();
  updateScrubberUI(currentPlayheadTime);
}

function bindElementLayerDrag(node, elementId) {
  node.addEventListener('dragstart', (event) => {
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('application/x-mathca-layer', elementId);
  });
  node.addEventListener('dragover', (event) => {
    if (!event.dataTransfer.types.includes('application/x-mathca-layer')) return;
    event.preventDefault();
    node.classList.add('drag-over');
  });
  node.addEventListener('dragleave', () => node.classList.remove('drag-over'));
  node.addEventListener('drop', (event) => {
    const sourceId = event.dataTransfer.getData('application/x-mathca-layer');
    if (!sourceId) return;
    event.preventDefault();
    node.classList.remove('drag-over');
    reorderElementLayer(sourceId, elementId);
  });
}

async function reorderElementLayer(sourceId, targetId) {
  const scene = currentScene();
  if (!scene?.elements || sourceId === targetId) return;
  const visual = [...scene.elements].reverse();
  const sourceIndex = visual.findIndex((element) => element.id === sourceId);
  const targetIndex = visual.findIndex((element) => element.id === targetId);
  if (sourceIndex < 0 || targetIndex < 0) return;
  const before = snapshotProjectState();
  const [moved] = visual.splice(sourceIndex, 1);
  visual.splice(targetIndex, 0, moved);
  scene.elements = visual.reverse();
  pushPremiumHistory(before);
  markProjectDirty('Đã đổi thứ tự layer');
  syncJsonEditor();
  await rerenderProjectCanvas();
  const dom = findRenderedElementById(sourceId);
  if (dom) selectElement(moved, dom, false);
  renderPremiumTimeline();
}

function bindTimelineScrollSync() {
  const scroll = document.querySelector('.timeline-scroll');
  const labels = document.querySelector('.track-labels');
  scroll?.addEventListener('scroll', () => {
    if (labels) labels.scrollTop = scroll.scrollTop;
  });
}

function makeTimelineClip(type, label, start, length, duration) {
  const clip = document.createElement('button');
  clip.type = 'button';
  clip.className = `timeline-clip ${type}`;
  clip.textContent = label;
  clip.style.left = `${Math.max(0, start / duration * 100)}%`;
  clip.style.width = `${Math.max(type === 'sfx' ? 2.5 : 1, length / duration * 100)}%`;
  return clip;
}

function bindPremiumTimelineDrag() {
  const content = document.getElementById('timeline-track');
  if (!content) return;
  content.querySelectorAll('[data-timeline-sfx]').forEach((element) => {
    element.onpointerdown = (event) => {
      if (event.button !== 0) return;
      event.preventDefault();
      event.stopPropagation();
      const clip = ensureRuntimeAudioState().sfx.find((item) => item.id === element.dataset.timelineSfx);
      if (!clip) return;
      const before = snapshotProjectState();
      const startX = event.clientX;
      const initial = clip.startTime;
      element.setPointerCapture(event.pointerId);
      element.onpointermove = (move) => {
        const rect = content.getBoundingClientRect();
        clip.startTime = Math.max(0, Math.min(getProjectDuration() - clip.duration, initial + (move.clientX - startX) / rect.width * getProjectDuration()));
        element.style.left = `${clip.startTime / getProjectDuration() * 100}%`;
      };
      element.onpointerup = () => {
        element.onpointermove = null;
        element.onpointerup = null;
        selectedSfxId = clip.id;
        persistRuntimeAudio();
        pushPremiumHistory(before);
        renderPremiumAudioUI();
        renderPremiumTimeline();
      };
    };
  });
  const bgmElement = content.querySelector('[data-timeline-bgm]');
  if (bgmElement) bgmElement.onpointerdown = (event) => {
    if (event.button !== 0) return;
    event.preventDefault();
    event.stopPropagation();
    const before = snapshotProjectState();
    const bgm = ensureRuntimeAudioState().bgm;
    const mode = event.target.dataset.trim || 'move';
    const startX = event.clientX;
    const start = bgm.startTime;
    const end = bgm.endTime;
    bgmElement.setPointerCapture(event.pointerId);
    bgmElement.onpointermove = (move) => {
      const rect = content.getBoundingClientRect();
      const delta = (move.clientX - startX) / rect.width * getProjectDuration();
      if (mode === 'left') bgm.startTime = Math.max(0, Math.min(end - .1, start + delta));
      else if (mode === 'right') bgm.endTime = Math.min(getProjectDuration(), Math.max(start + .1, end + delta));
      else {
        const length = end - start;
        bgm.startTime = Math.max(0, Math.min(getProjectDuration() - length, start + delta));
        bgm.endTime = bgm.startTime + length;
      }
      bgmElement.style.left = `${bgm.startTime / getProjectDuration() * 100}%`;
      bgmElement.style.width = `${(bgm.endTime - bgm.startTime) / getProjectDuration() * 100}%`;
    };
    bgmElement.onpointerup = () => {
      bgmElement.onpointermove = null;
      bgmElement.onpointerup = null;
      persistRuntimeAudio();
      pushPremiumHistory(before);
      renderPremiumAudioUI();
      renderPremiumTimeline();
    };
  };
}

function addPremiumScene() {
  const last = currentProject?.scenes?.at(-1);
  const start = Number(last?.endTime) || 0;
  withProjectCommand('Đã thêm phân cảnh', () => {
    currentProject.scenes.push({ id: `scene-${Date.now()}`, name: 'Phân cảnh mới', startTime: start, endTime: start + 3, voiceText: '', elements: [] });
    currentSceneIndex = currentProject.scenes.length - 1;
    currentProject.metadata.duration = start + 3;
    ensureRuntimeAudioState().bgm.endTime = Math.max(ensureRuntimeAudioState().bgm.endTime, start + 3);
  });
  buildSidebarScenes();
  renderActiveScene(false);
}

function splitPremiumScene() {
  const scene = currentScene();
  if (!scene || currentPlayheadTime <= Number(scene.startTime) + .3 || currentPlayheadTime >= Number(scene.endTime) - .3) {
    showToast('Đặt playhead bên trong phân cảnh để chia.', 'error');
    return;
  }
  withProjectCommand('Đã chia phân cảnh', () => {
    const clone = cloneJson(scene);
    clone.id = `scene-${Date.now()}`;
    clone.name = `${scene.name || 'Cảnh'} (phần 2)`;
    clone.startTime = Number(currentPlayheadTime.toFixed(2));
    scene.endTime = clone.startTime;
    currentProject.scenes.splice(currentSceneIndex + 1, 0, clone);
    currentSceneIndex += 1;
  });
  buildSidebarScenes();
  renderActiveScene(false);
}

function duplicateTimelineSelection() {
  const sfx = selectedRuntimeSfx();
  if (sfx) {
    withProjectCommand('Đã sao chép SFX', () => {
      const copy = cloneJson(sfx);
      copy.id = `sfx-copy-${Date.now()}`;
      copy.startTime = Math.min(getProjectDuration() - copy.duration, copy.startTime + .4);
      ensureRuntimeAudioState().sfx.push(copy);
      selectedSfxId = copy.id;
      persistRuntimeAudio();
    });
    return;
  }
  const scene = currentScene();
  if (!scene) return;
  withProjectCommand('Đã sao chép phân cảnh', () => {
    const copy = cloneJson(scene);
    copy.id = `scene-copy-${Date.now()}`;
    copy.name = `${scene.name || 'Cảnh'} (bản sao)`;
    const length = Number(scene.endTime) - Number(scene.startTime);
    copy.startTime = getProjectDuration();
    copy.endTime = copy.startTime + length;
    currentProject.scenes.push(copy);
    currentProject.metadata.duration = copy.endTime;
    currentSceneIndex = currentProject.scenes.length - 1;
  });
  buildSidebarScenes();
  renderActiveScene(false);
}

function deleteTimelineSelection() {
  const sfx = selectedRuntimeSfx();
  if (sfx) {
    if (!confirm(`Xóa SFX "${sfx.name}"?`)) return;
    withProjectCommand('Đã xóa SFX', () => {
      ensureRuntimeAudioState().sfx = ensureRuntimeAudioState().sfx.filter((clip) => clip.id !== sfx.id);
      selectedSfxId = null;
      persistRuntimeAudio();
    });
    return;
  }
  const scene = currentScene();
  if (!scene || currentProject.scenes.length <= 1 || !confirm(`Xóa phân cảnh "${scene.name || scene.id}"?`)) return;
  withProjectCommand('Đã xóa phân cảnh', () => {
    currentProject.scenes.splice(currentSceneIndex, 1);
    currentSceneIndex = Math.max(0, currentSceneIndex - 1);
  });
  buildSidebarScenes();
  renderActiveScene(false);
}
function bindMediaLibrary() {
  document.getElementById('rail-media')?.addEventListener('click', () => openMediaLibrary('image'));
  document.getElementById('btn-open-media-library')?.addEventListener('click', () => openMediaLibrary('image'));
  document.querySelectorAll('.media-library-tab').forEach((button) => button.addEventListener('click', () => {
    premiumMediaKind = button.dataset.mediaKind;
    document.querySelectorAll('.media-library-tab').forEach((item) => item.classList.toggle('active', item === button));
    renderMediaLibrary();
  }));
  document.getElementById('media-library-search')?.addEventListener('input', renderMediaLibrary);
  document.getElementById('btn-media-upload')?.addEventListener('click', () => {
    if (premiumMediaKind === 'image') document.getElementById('input-media-upload-image')?.click();
    else if (premiumMediaKind === 'video') document.getElementById('input-upload-video')?.click();
    else document.getElementById('input-upload-sfx')?.click();
  });
  document.getElementById('input-media-upload-image')?.addEventListener('change', (event) => uploadMediaAsset(event.target.files?.[0], 'image'));
  document.getElementById('input-upload-video')?.addEventListener('change', (event) => uploadMediaAsset(event.target.files?.[0], 'video'));
}

function openMediaLibrary(kind = 'image') {
  premiumMediaKind = kind;
  document.querySelectorAll('.media-library-tab').forEach((button) => button.classList.toggle('active', button.dataset.mediaKind === kind));
  document.getElementById('rail-media')?.classList.add('active');
  renderMediaLibrary();
  document.getElementById('modal-media-library')?.classList.add('active');
}

async function fetchMediaAssets(kind) {
  if (kind === 'audio') {
    const [bgmResponse, sfxResponse] = await Promise.all([
      fetch('/api/audio-assets?kind=bgm', { cache: 'no-store' }),
      fetch('/api/audio-assets?kind=sfx', { cache: 'no-store' }),
    ]);
    const [bgm, sfx] = await Promise.all([bgmResponse.json(), sfxResponse.json()]);
    return [
      ...(bgm.assets || []).map((asset) => ({ ...asset, kind: 'audio', audioKind: 'bgm' })),
      ...(sfx.assets || []).map((asset) => ({ ...asset, kind: 'audio', audioKind: 'sfx' })),
    ];
  }
  const response = await fetch(`/api/media-assets?kind=${encodeURIComponent(kind)}`, { cache: 'no-store' });
  const payload = await response.json();
  if (!response.ok || !payload.success) throw new Error(payload.error || 'Không đọc được thư viện media.');
  return payload.assets || [];
}

async function renderMediaLibrary() {
  const list = document.getElementById('media-library-list');
  const empty = document.getElementById('media-library-empty');
  if (!list) return;
  list.innerHTML = '<div class="library-empty show">Đang tải thư viện...</div>';
  try {
    let assets = await fetchMediaAssets(premiumMediaKind);
    const query = (document.getElementById('media-library-search')?.value || '').trim().toLowerCase();
    assets = assets.filter((asset) => `${asset.name || ''} ${asset.kind || ''} ${asset.audioKind || ''}`.toLowerCase().includes(query));
    list.innerHTML = '';
    empty?.classList.toggle('show', assets.length === 0);
    assets.forEach((asset) => list.appendChild(createMediaAssetCard(asset)));
  } catch (error) {
    list.innerHTML = '';
    if (empty) {
      empty.textContent = error.message;
      empty.classList.add('show');
    }
  }
}

function createMediaAssetCard(asset) {
  const card = document.createElement('article');
  card.className = 'media-asset-card';
  card.draggable = true;
  const preview = document.createElement('div');
  preview.className = `media-asset-preview ${asset.kind === 'audio' ? 'audio' : ''}`;
  if (asset.kind === 'image') {
    const image = document.createElement('img');
    image.src = asset.url || `/${asset.src}`;
    image.alt = asset.name || 'Image';
    preview.appendChild(image);
  } else if (asset.kind === 'video') {
    const video = document.createElement('video');
    video.src = asset.url || `/${asset.src}`;
    video.muted = true;
    video.loop = true;
    video.playsInline = true;
    video.preload = 'metadata';
    preview.appendChild(video);
  } else {
    preview.innerHTML = '<svg class="ui-icon" style="width:28px;height:28px"><use href="#icon-wave"/></svg>';
  }
  const name = document.createElement('strong');
  name.textContent = asset.name || 'Media';
  const meta = document.createElement('span');
  meta.textContent = asset.kind === 'audio' ? (asset.audioKind === 'bgm' ? 'BGM · kéo vào track nhạc nền' : 'SFX · chèn tại playhead') : asset.kind === 'video' ? 'Video layer' : 'Image layer';
  const actions = document.createElement('div');
  actions.className = 'media-asset-actions';
  const add = document.createElement('button');
  add.type = 'button';
  add.className = 'btn-header premium';
  add.textContent = asset.kind === 'audio' && asset.audioKind === 'bgm' ? 'Chọn BGM' : 'Thêm vào dự án';
  add.addEventListener('click', () => addMediaAssetToProject(asset));
  actions.appendChild(add);
  card.append(preview, name, meta, actions);
  card.addEventListener('dragstart', (event) => {
    event.dataTransfer.effectAllowed = 'copy';
    event.dataTransfer.setData('application/x-mathca-media', JSON.stringify(asset));
  });
  return card;
}

async function uploadMediaAsset(file, kind) {
  if (!file) return;
  const input = document.getElementById(kind === 'image' ? 'input-media-upload-image' : 'input-upload-video');
  try {
    const response = await fetch('/api/media-assets', {
      method: 'POST',
      headers: {
        'Content-Type': file.type || 'application/octet-stream',
        'X-File-Name': encodeURIComponent(file.name),
        'X-Media-Kind': kind,
      },
      body: file,
    });
    const payload = await response.json();
    if (!response.ok || !payload.success) throw new Error(payload.error || 'Không thể lưu media.');
    await addMediaAssetToProject(payload.asset);
    await renderMediaLibrary();
  } catch (error) {
    showToast(`Không thể tải media: ${error.message}`, 'error');
  } finally {
    if (input) input.value = '';
  }
}

async function addMediaAssetToProject(asset) {
  if (asset.kind === 'audio' || asset.audioKind) {
    applyUploadedAudioAsset(asset, asset.audioKind === 'bgm' ? 'bgm' : 'sfx');
    openPremiumInspectorTab('audio');
    document.getElementById('modal-media-library')?.classList.remove('active');
    return;
  }
  const scene = currentScene();
  if (!scene) return;
  const src = String(asset.src || asset.url || '').replace(/^\//, '');
  const id = `${asset.kind || 'image'}-${Date.now()}`;
  const element = {
    id,
    name: asset.name || (asset.kind === 'video' ? 'Video mới' : 'Ảnh mới'),
    type: asset.kind === 'video' ? 'video' : 'image',
    src,
    assetId: asset.assetId || null,
    x: asset.kind === 'video' ? 290 : 310,
    y: asset.kind === 'video' ? 210 : 320,
    width: asset.kind === 'video' ? 360 : 320,
    height: asset.kind === 'video' ? 640 : 320,
    animation: { type: 'pop-punch', duration: 0.45, delay: 0.1 },
  };
  withProjectCommand(`Đã thêm ${element.name}`, () => scene.elements.push(element));
  await rerenderProjectCanvas();
  const dom = findRenderedElementById(id);
  if (dom) selectElement(element, dom, false);
  renderPremiumTimeline();
  document.getElementById('modal-media-library')?.classList.remove('active');
}

function bindTimelineMediaDrop() {
  const content = document.getElementById('timeline-track');
  if (!content || content.dataset.mediaDropBound === 'true') return;
  content.dataset.mediaDropBound = 'true';
  content.addEventListener('dragover', (event) => {
    if (!event.dataTransfer.types.includes('application/x-mathca-media')) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = 'copy';
    content.classList.add('media-drop-active');
  });
  content.addEventListener('dragleave', (event) => {
    if (!content.contains(event.relatedTarget)) content.classList.remove('media-drop-active');
  });
  content.addEventListener('drop', (event) => {
    const raw = event.dataTransfer.getData('application/x-mathca-media');
    if (!raw) return;
    event.preventDefault();
    content.classList.remove('media-drop-active');
    try { addMediaAssetToProject(JSON.parse(raw)); } catch (error) { showToast(error.message, 'error'); }
  });
}

function bindRenderConfiguration() {
  document.querySelectorAll('.render-preset').forEach((button) => button.addEventListener('click', () => {
    document.querySelectorAll('.render-preset').forEach((item) => item.classList.toggle('active', item === button));
    renderConfig.resolution = button.dataset.resolution;
  }));
  document.getElementById('render-fps')?.addEventListener('change', (event) => { renderConfig.fps = Number(event.target.value); });
  document.getElementById('render-quality')?.addEventListener('change', (event) => { renderConfig.quality = event.target.value; });
  document.getElementById('render-include-audio')?.addEventListener('change', (event) => { renderConfig.includeAudio = event.target.checked; updateRenderAudioSummary(); });
  document.getElementById('btn-start-render')?.addEventListener('click', triggerRenderProcess);
}

function updateRenderAudioSummary() {
  const target = document.getElementById('render-audio-summary');
  if (!target || !currentProject) return;
  const audio = ensureRuntimeAudioState();
  target.textContent = `${renderConfig.includeAudio ? 'Có audio' : 'Không audio'} · Voiceover ${runtimeAudioFile ? 'sẵn sàng' : 'chưa tạo'} · BGM ${audio.bgm.enabled ? Math.round(audio.bgm.volume * 100) + '%' : 'tắt'} · ${audio.sfx.length} SFX`;
}

function updateRenderSteps(status) {
  const text = String(status?.stage || '').toLowerCase();
  let current = 'validate';
  if (text.includes('audio') || text.includes('âm thanh') || text.includes('voice')) current = 'audio';
  if (text.includes('render') || text.includes('frame') || text.includes('mã hóa') || text.includes('encode')) current = 'encode';
  if (Number(status?.progress) === 100) current = 'complete';
  const order = ['validate', 'audio', 'encode', 'complete'];
  const index = order.indexOf(current);
  document.querySelectorAll('[data-render-step]').forEach((element) => {
    const stepIndex = order.indexOf(element.dataset.renderStep);
    element.classList.toggle('done', stepIndex < index);
    element.classList.toggle('active', stepIndex === index);
  });
}

async function cancelPremiumRender() {
  if (!renderJobId) {
    document.getElementById('modal-render-progress')?.classList.remove('active');
    return;
  }
  try {
    const response = await fetch(`/api/render/${encodeURIComponent(renderJobId)}/cancel`, { method: 'POST' });
    const payload = await response.json();
    if (!response.ok || !payload.success) throw new Error(payload.error || 'Không thể hủy render.');
    renderStageText.innerText = 'Đã hủy render.';
    renderJobId = null;
    if (renderPollInterval) clearInterval(renderPollInterval);
    await checkServerHealth();
  } catch (error) {
    showToast(error.message, 'error');
  }
}

/**
 * Timeline Resizer — drag handle between Preview and Timeline.
 * Drag up → taller Timeline; drag down → shorter.
 * Arrow Up/Down adjust by 16px; Home → min; End → max.
 * Double-click resets to the responsive default.
 */
function bindTimelineResize() {
  const handle = document.getElementById('timeline-resizer');
  if (!handle) return;

  const STEP = 16;
  const MIN_H = 170;
  const STORAGE_KEY = 'mathca-studio.timeline-h';
  const headerH = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--header-h')) || 64;

  function getMaxH() {
    return Math.max(MIN_H + STEP, window.innerHeight - headerH - 190);
  }

  function getDefaultH() {
    const vh = window.innerHeight;
    if (vh >= 1080) return 310;
    if (vh >= 900) return 280;
    return 248;
  }

  function applyHeight(h) {
    const clamped = Math.max(MIN_H, Math.min(getMaxH(), Math.round(h)));
    document.documentElement.style.setProperty('--timeline-h', `${clamped}px`);
    handle.setAttribute('aria-valuenow', String(clamped));
    window.dispatchEvent(new Event('resize'));
    return clamped;
  }

  // Restore from localStorage or use responsive default
  const stored = Number(localStorage.getItem(STORAGE_KEY));
  applyHeight(stored > 0 ? stored : getDefaultH());

  // --- Pointer drag ---
  handle.addEventListener('pointerdown', (event) => {
    if (event.button !== 0) return;
    event.preventDefault();
    handle.setPointerCapture(event.pointerId);
    document.body.classList.add('timeline-resizing');

    const startY = event.clientY;
    const startH = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--timeline-h')) || getDefaultH();

    function onMove(moveEvent) {
      // Dragging up (negative deltaY) increases height
      const newH = applyHeight(startH + (startY - moveEvent.clientY));
      localStorage.setItem(STORAGE_KEY, String(newH));
    }

    function onUp() {
      handle.removeEventListener('pointermove', onMove);
      handle.removeEventListener('pointerup', onUp);
      handle.removeEventListener('pointercancel', onUp);
      document.body.classList.remove('timeline-resizing');
    }

    handle.addEventListener('pointermove', onMove);
    handle.addEventListener('pointerup', onUp);
    handle.addEventListener('pointercancel', onUp);
  });

  // --- Double-click reset ---
  handle.addEventListener('dblclick', () => {
    const h = applyHeight(getDefaultH());
    localStorage.setItem(STORAGE_KEY, String(h));
  });

  // --- Keyboard ---
  handle.addEventListener('keydown', (event) => {
    let h = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--timeline-h')) || getDefaultH();
    if (event.key === 'ArrowUp') { event.preventDefault(); h = applyHeight(h + STEP); }
    else if (event.key === 'ArrowDown') { event.preventDefault(); h = applyHeight(h - STEP); }
    else if (event.key === 'Home') { event.preventDefault(); h = applyHeight(MIN_H); }
    else if (event.key === 'End') { event.preventDefault(); h = applyHeight(getMaxH()); }
    else return;
    localStorage.setItem(STORAGE_KEY, String(h));
  });
}

