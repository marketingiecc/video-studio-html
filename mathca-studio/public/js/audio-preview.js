(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.MathCAAudioPreview = factory();
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  function clamp(value, minimum, maximum) {
    return Math.min(maximum, Math.max(minimum, value));
  }

  function createCleanupBag(options) {
    var settings = options || {};
    var urlApi = settings.urlApi || (typeof URL !== "undefined" ? URL : null);
    var callbacks = [];
    var objectUrls = new Set();
    var audioNodes = new Set();
    var disposed = false;

    function add(callback) {
      if (typeof callback !== "function") return function () {};
      if (disposed) {
        callback();
        return function () {};
      }
      callbacks.push(callback);
      return function remove() {
        var index = callbacks.indexOf(callback);
        if (index >= 0) callbacks.splice(index, 1);
      };
    }

    function listen(target, type, listener, listenerOptions) {
      if (!target || typeof target.addEventListener !== "function") return function () {};
      target.addEventListener(type, listener, listenerOptions);
      return add(function () {
        target.removeEventListener(type, listener, listenerOptions);
      });
    }

    function trackObjectUrl(url) {
      if (typeof url === "string" && url) objectUrls.add(url);
      return url;
    }

    function revokeObjectUrl(url) {
      if (!objectUrls.has(url)) return false;
      objectUrls.delete(url);
      if (urlApi && typeof urlApi.revokeObjectURL === "function") urlApi.revokeObjectURL(url);
      return true;
    }

    function trackNode(node) {
      if (!node) return node;
      audioNodes.add(node);
      return node;
    }

    function releaseNode(node) {
      if (!audioNodes.has(node)) return;
      audioNodes.delete(node);
      try {
        if (typeof node.stop === "function") node.stop();
      } catch {
        // A stopped Web Audio source throws when stopped twice.
      }
      try {
        if (typeof node.disconnect === "function") node.disconnect();
      } catch {
        // Some browser nodes throw after their context closes.
      }
    }

    function cleanup() {
      if (disposed) return;
      disposed = true;
      callbacks
        .splice(0)
        .reverse()
        .forEach(function (callback) {
          try {
            callback();
          } catch {}
        });
      Array.from(audioNodes).forEach(releaseNode);
      Array.from(objectUrls).forEach(revokeObjectUrl);
    }

    return {
      add: add,
      cleanup: cleanup,
      isDisposed: function () {
        return disposed;
      },
      listen: listen,
      releaseNode: releaseNode,
      revokeObjectUrl: revokeObjectUrl,
      trackNode: trackNode,
      trackObjectUrl: trackObjectUrl,
    };
  }

  function isTimeInWindow(time, window) {
    return time >= Number(window.startTime || 0) && time <= Number(window.endTime || 0);
  }

  function computeBgmMediaTime(globalTime, bgm, mediaDuration) {
    if (!bgm || !bgm.active) return null;
    var time = Number(globalTime) || 0;
    if (time < bgm.startTime || time > bgm.endTime) return null;
    var offset = Math.max(0, time - bgm.startTime);
    var sourceDuration = Number(mediaDuration) || 0;
    if (sourceDuration > 0 && bgm.loop) return offset % sourceDuration;
    if (sourceDuration > 0 && offset > sourceDuration) return null;
    return offset;
  }

  function getBgmPreviewGain(bgm, time) {
    if (!bgm || !bgm.active) return 0;
    var gain = clamp(Number(bgm.volume) || 0, 0, 1);
    var local = (Number(time) || 0) - bgm.startTime;
    var remaining = bgm.endTime - (Number(time) || 0);
    if (bgm.fadeIn > 0 && local < bgm.fadeIn) gain *= clamp(local / bgm.fadeIn, 0, 1);
    if (bgm.fadeOut > 0 && remaining < bgm.fadeOut) gain *= clamp(remaining / bgm.fadeOut, 0, 1);
    if (
      bgm.ducking &&
      bgm.ducking.enabled &&
      bgm.ducking.windows.some(function (window) {
        return isTimeInWindow(time, window);
      })
    ) {
      gain *= Number(bgm.ducking.underVoiceGain) || 1;
    }
    return clamp(gain, 0, 1);
  }

  function shouldTriggerSfx(clip, previousTime, currentTime, seeking) {
    if (!clip || currentTime < previousTime) return false;
    if (seeking) {
      return currentTime >= clip.startTime && currentTime < clip.endTime;
    }
    return (
      clip.startTime > previousTime && clip.startTime <= currentTime && currentTime < clip.endTime
    );
  }

  function createAudioPreviewEngine(options) {
    var settings = options || {};
    var AudioContextConstructor =
      settings.AudioContext ||
      (typeof AudioContext !== "undefined" ? AudioContext : null) ||
      (typeof webkitAudioContext !== "undefined" ? webkitAudioContext : null);
    var context = settings.audioContext || null;
    var ownsContext = !settings.audioContext;
    var cleanupBag = createCleanupBag({ urlApi: settings.urlApi });
    var plan = null;
    var currentTime = 0;
    var previousTime = 0;
    var playing = false;
    var destroyed = false;
    var voiceElement = settings.voiceElement || null;
    var bgmElement = settings.bgmElement || null;
    var buffers = new Map();
    var activeSources = new Set();
    var objectUrlsByKey = new Map();

    function ensureContext() {
      if (!context && AudioContextConstructor) context = new AudioContextConstructor();
      return context;
    }

    function safeMediaSeek(media, time) {
      if (!media) return;
      try {
        media.currentTime = Math.max(0, Number(time) || 0);
      } catch {
        // Metadata may not be loaded yet.
      }
    }

    function safeMediaPlay(media) {
      if (!media || typeof media.play !== "function") return;
      var result = media.play();
      if (result && typeof result.catch === "function") result.catch(function () {});
    }

    function safeMediaPause(media) {
      if (media && typeof media.pause === "function") media.pause();
    }

    function assetKey(asset) {
      if (!asset) return "";
      return asset.assetId || asset.src || "";
    }

    function setObjectUrl(key, url) {
      var previous = objectUrlsByKey.get(key);
      if (previous && previous !== url) cleanupBag.revokeObjectUrl(previous);
      if (url) {
        objectUrlsByKey.set(key, cleanupBag.trackObjectUrl(url));
      } else {
        objectUrlsByKey.delete(key);
      }
      return url;
    }

    function revokeObjectUrl(key) {
      var url = objectUrlsByKey.get(key);
      if (!url) return false;
      objectUrlsByKey.delete(key);
      return cleanupBag.revokeObjectUrl(url);
    }

    function stopSource(source) {
      if (!source) return;
      activeSources.delete(source);
      cleanupBag.releaseNode(source);
    }

    function stopAllSfx() {
      Array.from(activeSources).forEach(stopSource);
    }

    function startSfxClip(clip, offset) {
      var audioContext = ensureContext();
      var buffer = buffers.get(assetKey(clip.asset));
      if (!audioContext || !buffer || typeof audioContext.createBufferSource !== "function")
        return null;
      var source = audioContext.createBufferSource();
      var gain = audioContext.createGain();
      var panner =
        typeof audioContext.createStereoPanner === "function"
          ? audioContext.createStereoPanner()
          : null;
      source.buffer = buffer;
      gain.gain.value = clamp(Number(clip.effectiveGain) || 0, 0, 4);
      if (panner) panner.pan.value = clamp(Number(clip.pan) || 0, -1, 1);
      source.connect(gain);
      if (panner) {
        gain.connect(panner);
        panner.connect(audioContext.destination);
      } else {
        gain.connect(audioContext.destination);
      }
      cleanupBag.trackNode(source);
      cleanupBag.trackNode(gain);
      if (panner) cleanupBag.trackNode(panner);
      activeSources.add(source);
      source.onended = function () {
        activeSources.delete(source);
        cleanupBag.releaseNode(source);
        cleanupBag.releaseNode(gain);
        if (panner) cleanupBag.releaseNode(panner);
      };
      var clipOffset = clamp(Number(offset) || 0, 0, Math.max(0, clip.duration));
      var remaining = Math.max(
        0,
        Math.min(clip.duration - clipOffset, buffer.duration - clipOffset),
      );
      if (remaining <= 0) {
        activeSources.delete(source);
        cleanupBag.releaseNode(source);
        cleanupBag.releaseNode(gain);
        if (panner) cleanupBag.releaseNode(panner);
        return null;
      }
      source.start(0, clipOffset, remaining);
      return source;
    }

    function syncVoice(time, shouldPlay) {
      if (!voiceElement || !plan || !plan.voice || !plan.voice.enabled) {
        safeMediaPause(voiceElement);
        return;
      }
      voiceElement.volume = clamp(Number(plan.voice.gain) || 0, 0, 1);
      if (Math.abs((Number(voiceElement.currentTime) || 0) - time) > 0.1)
        safeMediaSeek(voiceElement, time);
      if (shouldPlay) safeMediaPlay(voiceElement);
      else safeMediaPause(voiceElement);
    }

    function syncBgm(time, shouldPlay) {
      if (!bgmElement || !plan || !plan.bgm) return;
      var bgmTime = computeBgmMediaTime(time, plan.bgm, bgmElement.duration);
      if (bgmTime === null) {
        safeMediaPause(bgmElement);
        return;
      }
      bgmElement.loop = Boolean(plan.bgm.loop);
      bgmElement.volume = getBgmPreviewGain(plan.bgm, time);
      if (Math.abs((Number(bgmElement.currentTime) || 0) - bgmTime) > 0.1)
        safeMediaSeek(bgmElement, bgmTime);
      if (shouldPlay) safeMediaPlay(bgmElement);
      else safeMediaPause(bgmElement);
    }

    function triggerSfx(previous, time, seeking) {
      if (!plan || !plan.sfx || !Array.isArray(plan.sfx.clips)) return;
      plan.sfx.clips.forEach(function (clip) {
        if (!shouldTriggerSfx(clip, previous, time, seeking)) return;
        startSfxClip(clip, Math.max(0, time - clip.startTime));
      });
    }

    function sync(time, shouldPlay, syncOptions) {
      if (destroyed) return;
      var optionsValue = syncOptions || {};
      previousTime = currentTime;
      currentTime = clamp(Number(time) || 0, 0, plan ? plan.duration : Number.MAX_SAFE_INTEGER);
      var wasPlaying = playing;
      playing = Boolean(shouldPlay);
      var seeking = Boolean(optionsValue.seeking) || Math.abs(currentTime - previousTime) > 0.5;
      if (seeking || currentTime < previousTime || !playing) stopAllSfx();
      syncVoice(currentTime, playing);
      syncBgm(currentTime, playing);
      if (playing && (!wasPlaying || currentTime !== previousTime)) {
        triggerSfx(previousTime, currentTime, seeking || !wasPlaying);
      }
    }

    function setPlan(nextPlan) {
      stopAllSfx();
      plan = nextPlan || null;
      currentTime = clamp(currentTime, 0, plan ? plan.duration : 0);
      previousTime = currentTime;
      sync(currentTime, false, { seeking: true });
      return plan;
    }

    function setMediaSource(media, source) {
      if (!media) return;
      safeMediaPause(media);
      if (source !== undefined && media.src !== source) media.src = source || "";
      if (typeof media.load === "function") media.load();
    }

    function setVoiceElement(media) {
      safeMediaPause(voiceElement);
      voiceElement = media || null;
      syncVoice(currentTime, playing);
    }

    function setBgmElement(media) {
      safeMediaPause(bgmElement);
      bgmElement = media || null;
      syncBgm(currentTime, playing);
    }

    function registerAudioBuffer(reference, buffer) {
      var key = typeof reference === "string" ? reference : assetKey(reference);
      if (!key) throw new TypeError("Audio buffer reference is required");
      buffers.set(key, buffer);
      return function unregister() {
        buffers.delete(key);
      };
    }

    function destroy() {
      if (destroyed) return;
      safeMediaPause(voiceElement);
      safeMediaPause(bgmElement);
      stopAllSfx();
      buffers.clear();
      objectUrlsByKey.clear();
      cleanupBag.cleanup();
      if (ownsContext && context && typeof context.close === "function") {
        try {
          var result = context.close();
          if (result && typeof result.catch === "function") result.catch(function () {});
        } catch {}
      }
      context = null;
      voiceElement = null;
      bgmElement = null;
      destroyed = true;
    }

    return {
      destroy: destroy,
      getCurrentTime: function () {
        return currentTime;
      },
      getPlan: function () {
        return plan;
      },
      isPlaying: function () {
        return playing;
      },
      pause: function (time) {
        sync(time === undefined ? currentTime : time, false);
      },
      play: function (time) {
        sync(time === undefined ? currentTime : time, true, { seeking: !playing });
      },
      previewClip: function (clip) {
        return startSfxClip(clip, 0);
      },
      registerAudioBuffer: registerAudioBuffer,
      revokeObjectUrl: revokeObjectUrl,
      seek: function (time) {
        sync(time, false, { seeking: true });
      },
      setBgmElement: setBgmElement,
      setBgmSource: function (source) {
        setMediaSource(bgmElement, source);
      },
      setObjectUrl: setObjectUrl,
      setPlan: setPlan,
      setVoiceElement: setVoiceElement,
      setVoiceSource: function (source) {
        setMediaSource(voiceElement, source);
      },
      stopAllSfx: stopAllSfx,
      sync: sync,
    };
  }

  return {
    computeBgmMediaTime: computeBgmMediaTime,
    createAudioPreviewEngine: createAudioPreviewEngine,
    createCleanupBag: createCleanupBag,
    getBgmPreviewGain: getBgmPreviewGain,
    shouldTriggerSfx: shouldTriggerSfx,
  };
});
