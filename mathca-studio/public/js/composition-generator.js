(function initMathCAComposition(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.MathCAComposition = api;
})(typeof window !== 'undefined' ? window : globalThis, function createMathCACompositionApi() {
  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, (character) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    })[character]);
  }

  function safeId(value, fallback) {
    const normalized = String(value || fallback).replace(/[^a-zA-Z0-9_-]/g, '-');
    return normalized || fallback;
  }

  function numberOr(value, fallback = 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  function styleValue(property, value, suffix = 'px') {
    if (value === undefined || value === null || value === '') return '';
    return `${property}:${numberOr(value)}${suffix};`;
  }

  function buildElementInner(element) {
    const type = element.type || 'text';
    const text = escapeHtml(element.text || '');
    if (type === 'image') {
      return `<img src="${escapeHtml(element.src || '')}" alt="${escapeHtml(element.name || 'Hình ảnh')}" />`;
    }
    if (type === 'video') {
      return `<video src="${escapeHtml(element.src || '')}" muted loop autoplay playsinline preload="auto"></video>`;
    }
    if (type === 'slots') {
      const parts = String(element.text || '3 ? 5').trim().split(/\s+/);
      return parts.map((part) => `<span>${escapeHtml(part)}</span>`).join('');
    }
    return text.replace(/\n/g, '<span class="line-break"></span>');
  }

  function buildElementMarkup(element, fallbackId, layerIndex = 0) {
    const id = safeId(element.id, fallbackId);
    const type = safeId(element.type || 'text', 'text');
    const style = [
      styleValue('left', element.x),
      styleValue('top', element.y),
      styleValue('width', element.width),
      styleValue('height', element.height ?? (['image', 'video'].includes(element.type) ? element.width : undefined)),
      styleValue('font-size', element.fontSize),
      element.color ? `color:${escapeHtml(element.color)};` : '',
      element.bgColor ? `background:${escapeHtml(element.bgColor)};` : '',
      `z-index:${100 + layerIndex};`,
    ].join('');

    return `<div id="${id}" data-hf-id="${id}" class="mathca-element mathca-${type}" style="${style}">${buildElementInner(element)}</div>`;
  }

  function entryTween(selector, animation, absoluteStart) {
    const duration = Math.max(0.05, numberOr(animation?.duration, 0.45));
    const start = Math.max(0, absoluteStart + numberOr(animation?.delay, 0.2));
    const position = start.toFixed(3);
    const target = JSON.stringify(selector);
    const type = animation?.type || 'pop-punch';

    const variants = {
      'drop-bounce': `{ y: -220, opacity: 0 }, { y: 0, opacity: 1, duration: ${duration}, ease: "bounce.out" }`,
      'zoom-hero': `{ scale: 0.05, opacity: 0 }, { scale: 1, opacity: 1, duration: ${duration}, ease: "back.out(3.2)" }`,
      'slide-up': `{ y: 150, opacity: 0 }, { y: 0, opacity: 1, duration: ${duration}, ease: "power3.out" }`,
      'slide-left': `{ x: -220, opacity: 0 }, { x: 0, opacity: 1, duration: ${duration}, ease: "power3.out" }`,
      'slide-right': `{ x: 220, opacity: 0 }, { x: 0, opacity: 1, duration: ${duration}, ease: "power3.out" }`,
      'elastic-pop': `{ scale: 0.1, opacity: 0 }, { scale: 1, opacity: 1, duration: ${duration}, ease: "elastic.out(1, 0.35)" }`,
      'fade-in': `{ opacity: 0 }, { opacity: 1, duration: ${duration}, ease: "power2.out" }`,
      'pop-punch': `{ scale: 0.25, opacity: 0 }, { scale: 1, opacity: 1, duration: ${duration}, ease: "back.out(2.4)" }`,
    };

    return `tl.fromTo(${target}, ${variants[type] || variants['pop-punch']}, ${position});`;
  }

  function loopTween(selector, animation, absoluteStart, availableDuration) {
    const loop = animation?.loop;
    if (!loop || loop === 'none') return '';
    const target = JSON.stringify(selector);
    const start = Math.max(0, absoluteStart + numberOr(animation?.delay, 0.2) + numberOr(animation?.duration, 0.45));
    const repeat = Math.max(1, Math.min(20, Math.floor(Math.max(0.6, availableDuration) / 0.6)));
    const position = start.toFixed(3);
    const variants = {
      pulse: `{ scale: 1.07, duration: 0.28, yoyo: true, repeat: ${repeat}, ease: "sine.inOut" }`,
      float: `{ y: -16, duration: 0.7, yoyo: true, repeat: ${repeat}, ease: "sine.inOut" }`,
      wiggle: `{ rotation: 4, duration: 0.14, yoyo: true, repeat: ${repeat * 2}, ease: "sine.inOut" }`,
      glow: `{ filter: "drop-shadow(0 0 20px #ffbd05)", duration: 0.45, yoyo: true, repeat: ${repeat}, ease: "sine.inOut" }`,
    };
    return variants[loop] ? `tl.to(${target}, ${variants[loop]}, ${position});` : '';
  }

  function getGlobal(project, id) {
    return (project.globalElements || []).find((element) => element.id === id) || {};
  }

  function assetAudioPath(audioFile) {
    const file = String(audioFile || '').trim();
    if (!file) return null;
    if (/^(?:https?:|data:|blob:|\/)/i.test(file)) return file;
    return file.startsWith('assets/') ? file : `assets/${file}`;
  }

  function prepareTemplateHtml(template, options = {}) {
    let html = String(template || '');
    const audioPath = assetAudioPath(options.audioFile);

    // Keep imported templates renderable offline without modifying the JSON source.
    html = html.replace(
      /<script\b[^>]*src=["'][^"']*(?:cdnjs\.cloudflare\.com\/ajax\/libs\/gsap|cdn\.jsdelivr\.net\/npm\/gsap|unpkg\.com\/gsap)[^"']*["'][^>]*><\/script>/gi,
      '<script src="assets/gsap.min.js"></script>',
    );
    html = html.replace(/<link\b[^>]*href=["']https:\/\/fonts\.googleapis\.com[^"']*["'][^>]*>/gi, '');
    html = html.replace(/<link\b[^>]*href=["']https:\/\/fonts\.gstatic\.com[^"']*["'][^>]*>/gi, '');
    html = html.replace(/<link\b[^>]*rel=["']preconnect["'][^>]*href=["']https:\/\/fonts\.(?:googleapis|gstatic)\.com[^"']*["'][^>]*>/gi, '');

    if (!/@font-face\s*\{[^}]*font-family\s*:\s*["']?Inter/i.test(html)) {
      html = html.replace(
        /<\/head>/i,
        `<style data-mathca-local-fonts>
@font-face{font-family:Inter;src:url('assets/fonts/Inter-Regular.otf') format('opentype');font-weight:400}
@font-face{font-family:Inter;src:url('assets/fonts/Inter-Bold.otf') format('opentype');font-weight:700}
@font-face{font-family:Inter;src:url('assets/fonts/Inter-Black.otf') format('opentype');font-weight:900}
</style></head>`,
      );
    }

    if (audioPath) {
      html = html.replace(
        /(<audio\b[^>]*\bsrc=["'])[^"']*(["'])/i,
        `$1${escapeHtml(audioPath)}$2`,
      );
    }

    return html;
  }

  function generateCompleteHtmlComposition(project = {}, options = {}) {
    if (typeof project.html_template === 'string' && project.html_template.trim()) {
      return prepareTemplateHtml(project.html_template, {
        audioFile: options.audioFile || project.metadata?.audioFile,
      });
    }

    const title = project.metadata?.title || 'MathCA Video';
    const scenes = Array.isArray(project.scenes) ? project.scenes : [];
    const duration = Math.max(
      0.5,
      numberOr(project.metadata?.duration, 0),
      ...scenes.map((scene) => numberOr(scene.endTime, 0)),
    );

    let scenesHtml = '';
    const timelineLines = [];

    scenes.forEach((scene, sceneIndex) => {
      const sceneId = safeId(scene.id, `scene-${sceneIndex + 1}`);
      const elements = Array.isArray(scene.elements) ? scene.elements : [];
      const elementsHtml = elements
        .map((element, elementIndex) => buildElementMarkup(element, `${sceneId}-element-${elementIndex + 1}`, elementIndex))
        .join('\n');

      scenesHtml += `<section id="${sceneId}" data-hf-id="${sceneId}" class="stage-scene${sceneIndex === 0 ? ' is-active' : ''}">${elementsHtml}</section>`;

      const sceneStart = numberOr(scene.startTime, 0);
      const sceneEnd = Math.max(sceneStart + 0.5, numberOr(scene.endTime, duration));
      if (sceneIndex > 0) {
        const previousId = safeId(scenes[sceneIndex - 1].id, `scene-${sceneIndex}`);
        timelineLines.push(`tl.to(${JSON.stringify(`#${previousId}`)}, { autoAlpha: 0, duration: 0.22 }, ${(sceneStart - 0.22).toFixed(3)});`);
        timelineLines.push(`tl.to(${JSON.stringify(`#${sceneId}`)}, { autoAlpha: 1, duration: 0.28 }, ${sceneStart.toFixed(3)});`);
      }

      elements.forEach((element, elementIndex) => {
        const elementId = safeId(element.id, `${sceneId}-element-${elementIndex + 1}`);
        const selector = `#${elementId}`;
        timelineLines.push(entryTween(selector, element.animation, sceneStart));
        const loopLine = loopTween(selector, element.animation, sceneStart, sceneEnd - sceneStart);
        if (loopLine) timelineLines.push(loopLine);
      });
    });

    const header = getGlobal(project, 'elem-header-brand');
    const mascot = getGlobal(project, 'elem-mascot-wrapper');
    const cta = getGlobal(project, 'elem-cta-btn');
    const globalEntries = [
      ['#elem-header-brand', header, 0],
      ['#elem-mascot-wrapper', mascot, 0],
      ['#elem-cta-btn', cta, 0],
    ];
    globalEntries.forEach(([selector, element, start]) => {
      timelineLines.push(entryTween(selector, element.animation, start));
      const loopLine = loopTween(selector, element.animation, start, duration);
      if (loopLine) timelineLines.push(loopLine);
    });

    const headerStyle = `${styleValue('left', header.x, 'px')}${styleValue('top', header.y ?? 75, 'px')}${styleValue('width', header.width ?? 1080, 'px')}`;
    const mascotStyle = `${styleValue('left', mascot.x ?? 720, 'px')}${styleValue('top', mascot.y ?? 1380, 'px')}${styleValue('width', mascot.width ?? 320, 'px')}`;
    const ctaStyle = `${styleValue('left', cta.x ?? 230, 'px')}${styleValue('top', cta.y ?? 1720, 'px')}${styleValue('font-size', cta.fontSize ?? 38, 'px')}${cta.color ? `color:${escapeHtml(cta.color)};` : ''}${cta.bgColor ? `background:${escapeHtml(cta.bgColor)};` : ''}`;

    return `<!doctype html>
<html lang="vi">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=1080, height=1920" />
    <title>${escapeHtml(title)}</title>
    <script src="assets/gsap.min.js"></script>
    <style>
      @font-face { font-family: 'Inter'; src: url('assets/fonts/Inter-Regular.otf') format('opentype'); font-weight: 400; }
      @font-face { font-family: 'Inter'; src: url('assets/fonts/Inter-Bold.otf') format('opentype'); font-weight: 700; }
      @font-face { font-family: 'Inter'; src: url('assets/fonts/Inter-Black.otf') format('opentype'); font-weight: 900; }
      * { box-sizing: border-box; }
      html, body { margin: 0; width: 1080px; height: 1920px; overflow: hidden; background: #fbfbf9; font-family: 'Inter', sans-serif; }
      #root { position: relative; width: 1080px; height: 1920px; overflow: hidden; background: #fbfbf9; }
      .bg-container { position: absolute; inset: 0; background-color: #fbfbf9; background-image: radial-gradient(#12aba0 2px, transparent 2px), radial-gradient(#ffbd05 1.5px, transparent 1.5px); background-size: 40px 40px, 80px 80px; opacity: 0.85; }
      .header-wrapper { position: absolute; display: flex; flex-direction: column; align-items: center; z-index: 10; }
      .logo-brand { height: 110px; margin-bottom: 20px; filter: drop-shadow(0 8px 16px rgba(0,0,0,0.06)); }
      .header-top-tag { background: #ff5239; color: #fff; font-size: 30px; font-weight: 800; padding: 10px 40px; border-radius: 9999px; letter-spacing: .04em; }
      .stage-card { position: absolute; top: 380px; left: 70px; width: 940px; height: 1080px; background: #fff; border-radius: 40px; box-shadow: 0 20px 50px rgba(18,171,160,.12); border: 2.5px solid rgba(18,171,160,.18); overflow: hidden; z-index: 10; }
      .stage-scene { position: absolute; inset: 0; padding: 40px 36px; opacity: 0; visibility: hidden; }
      .stage-scene.is-active { opacity: 1; visibility: visible; }
      .mathca-element { position: absolute; white-space: pre-wrap; }
      .mathca-text { font-weight: 900; line-height: 1.1; text-shadow: 0 6px 20px rgba(0,0,0,.15); }
      .mathca-badge { display: inline-flex; align-items: center; padding: 12px 36px; border-radius: 9999px; background: #ffbd05; color: #1a1c1c; font-weight: 900; letter-spacing: .04em; box-shadow: 0 8px 20px rgba(0,0,0,.12); }
      .mathca-card { padding: 22px 28px; border: 2.5px solid #c9eee9; border-radius: 28px; background: #f8fcfb; color: #006a63; font-weight: 800; text-align: center; box-shadow: 0 10px 24px rgba(18,171,160,.12); }
      .mathca-equation { padding: 18px 28px; border: 3px solid #12aba0; border-radius: 24px; background: #e6f7f6; color: #1a1c1c; font-weight: 900; }
      .mathca-pill { display: inline-flex; align-items: center; padding: 14px 40px; border-radius: 9999px; background: linear-gradient(135deg,#12aba0,#006a63); color: #fff; font-weight: 900; box-shadow: 0 10px 24px rgba(0,106,99,.3); }
      .mathca-slots { display: flex; gap: 20px; }
      .mathca-slots span { display: flex; width: 180px; height: 180px; align-items: center; justify-content: center; border: 4px solid #12aba0; border-radius: 28px; background: #e6f7f6; color: #006a63; font-size: inherit; font-weight: 900; }
      .mathca-image img { width: 100%; height: 100%; object-fit: contain; filter: drop-shadow(0 10px 20px rgba(0,0,0,.12)); }
      .mathca-video { overflow: hidden; border-radius: 24px; }
      .mathca-video video { width: 100%; height: 100%; object-fit: cover; }
      .line-break { display: block; height: .28em; }
      .mascot-stage-box { position: absolute; z-index: 25; }
      .mascot-stage-box img { width: 100%; filter: drop-shadow(0 14px 28px rgba(0,0,0,.12)); }
      .cta-button { position: absolute; z-index: 20; padding: 18px 60px; border-radius: 9999px; background: linear-gradient(135deg,#ff5239,#e02e16); color: #fff; font-weight: 900; box-shadow: 0 12px 30px rgba(255,82,57,.45); white-space: nowrap; }
    </style>
  </head>
  <body>
    <div id="root" data-composition-id="main" data-start="0" data-duration="${duration}" data-width="1080" data-height="1920">
      <div class="bg-container"></div>
      <audio id="soundtrack" class="clip" src="${escapeHtml(assetAudioPath(options.audioFile || project.metadata?.audioFile || 'audio.mp3'))}" data-start="0" data-duration="${duration}" data-track-index="0" data-volume="1"></audio>
      <div id="elem-header-brand" data-hf-id="elem-header-brand" class="header-wrapper" style="${headerStyle}">
        <img class="logo-brand" src="assets/logo.png" alt="MathCA Logo" />
        <div class="header-top-tag">${escapeHtml(header.text || 'HỆ THỐNG GIÁO DỤC TOÁN MATHCA')}</div>
      </div>
      <div id="stage" class="stage-card">${scenesHtml}</div>
      <div id="elem-mascot-wrapper" data-hf-id="elem-mascot-wrapper" class="mascot-stage-box" style="${mascotStyle}"><img src="assets/mascot.png" alt="Mascot MathCA" /></div>
      <div id="elem-cta-btn" data-hf-id="elem-cta-btn" class="cta-button" style="${ctaStyle}">${escapeHtml(cta.text || 'FOLLOW MATHCA ✨')}</div>
    </div>
    <script>
      window.__timelines = window.__timelines || {};
      const tl = gsap.timeline({ paused: true });
      ${timelineLines.join('\n      ')}
      window.__timelines["main"] = tl;
    </script>
  </body>
</html>`;
  }

  return {
    escapeHtml,
    generateCompleteHtmlComposition,
    prepareTemplateHtml,
  };
});
