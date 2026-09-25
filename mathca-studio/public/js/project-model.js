(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.MathCAProjectModel = factory();
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  var AUDIO_DEFAULTS = Object.freeze({
    bgm: Object.freeze({
      enabled: false,
      src: "",
      volume: 0.3,
      startTime: 0,
      loop: true,
      fadeIn: 0.8,
      fadeOut: 1.2,
      ducking: Object.freeze({
        enabled: true,
        underVoiceDb: -12,
        attack: 0.12,
        release: 0.35,
      }),
    }),
    sfxMasterVolume: 0.5,
    sfx: Object.freeze([]),
  });

  function isObject(value) {
    return value !== null && typeof value === "object" && !Array.isArray(value);
  }

  function cloneValue(value, seen) {
    if (value === null || typeof value !== "object") return value;
    if (typeof structuredClone === "function") {
      try {
        return structuredClone(value);
      } catch {
        // Fall through for values that structuredClone cannot copy.
      }
    }

    var visited = seen || new Map();
    if (visited.has(value)) return visited.get(value);
    var output = Array.isArray(value) ? [] : {};
    visited.set(value, output);
    Object.keys(value).forEach(function (key) {
      output[key] = cloneValue(value[key], visited);
    });
    return output;
  }

  function finiteNumber(value, fallback) {
    var number = Number(value);
    return Number.isFinite(number) ? number : fallback;
  }

  function clamp(value, minimum, maximum) {
    return Math.min(maximum, Math.max(minimum, value));
  }

  function roundTime(value) {
    return Math.round(value * 1000) / 1000;
  }

  function getProjectDuration(project) {
    var metadataDuration = finiteNumber(
      project && project.metadata && project.metadata.duration,
      0,
    );
    var scenes = Array.isArray(project && project.scenes) ? project.scenes : [];
    var sceneDuration = scenes.reduce(function (maximum, scene) {
      var endTime = finiteNumber(scene && scene.endTime, finiteNumber(scene && scene.end, 0));
      return Math.max(maximum, endTime);
    }, 0);
    return roundTime(Math.max(0, metadataDuration, sceneDuration));
  }

  function normalizeDucking(ducking) {
    var source = isObject(ducking) ? ducking : {};
    return Object.assign({}, source, {
      enabled:
        source.enabled === undefined ? AUDIO_DEFAULTS.bgm.ducking.enabled : Boolean(source.enabled),
      underVoiceDb: clamp(
        finiteNumber(source.underVoiceDb, AUDIO_DEFAULTS.bgm.ducking.underVoiceDb),
        -60,
        0,
      ),
      attack: Math.max(0, finiteNumber(source.attack, AUDIO_DEFAULTS.bgm.ducking.attack)),
      release: Math.max(0, finiteNumber(source.release, AUDIO_DEFAULTS.bgm.ducking.release)),
    });
  }

  function normalizeBgm(bgm, duration) {
    var source = isObject(bgm) ? bgm : {};
    var projectDuration = Math.max(0, finiteNumber(duration, 0));
    var startTime = clamp(
      finiteNumber(source.startTime, AUDIO_DEFAULTS.bgm.startTime),
      0,
      projectDuration,
    );
    var defaultEnd = projectDuration;
    var endTime = clamp(finiteNumber(source.endTime, defaultEnd), startTime, projectDuration);
    var regionDuration = Math.max(0, endTime - startTime);

    return Object.assign({}, source, {
      enabled: source.enabled === undefined ? AUDIO_DEFAULTS.bgm.enabled : Boolean(source.enabled),
      src: typeof source.src === "string" ? source.src : AUDIO_DEFAULTS.bgm.src,
      volume: clamp(finiteNumber(source.volume, AUDIO_DEFAULTS.bgm.volume), 0, 1),
      startTime: roundTime(startTime),
      endTime: roundTime(endTime),
      loop: source.loop === undefined ? AUDIO_DEFAULTS.bgm.loop : Boolean(source.loop),
      fadeIn: roundTime(
        clamp(finiteNumber(source.fadeIn, AUDIO_DEFAULTS.bgm.fadeIn), 0, regionDuration),
      ),
      fadeOut: roundTime(
        clamp(finiteNumber(source.fadeOut, AUDIO_DEFAULTS.bgm.fadeOut), 0, regionDuration),
      ),
      ducking: normalizeDucking(source.ducking),
    });
  }

  function normalizeSfxClip(clip, index, duration) {
    var source = isObject(clip) ? clip : {};
    var projectDuration = Math.max(0, finiteNumber(duration, 0));
    var startTime = clamp(finiteNumber(source.startTime, 0), 0, projectDuration);
    var availableDuration = Math.max(0, projectDuration - startTime);
    var requestedDuration = Math.max(0, finiteNumber(source.duration, 0.9));
    var clipDuration =
      projectDuration > 0 ? Math.min(requestedDuration, availableDuration) : requestedDuration;

    return Object.assign({}, source, {
      id:
        typeof source.id === "string" && source.id.trim()
          ? source.id
          : "sfx-" + String(index + 1).padStart(2, "0"),
      src: typeof source.src === "string" ? source.src : "",
      name: typeof source.name === "string" ? source.name : "SFX " + (index + 1),
      startTime: roundTime(startTime),
      duration: roundTime(clipDuration),
      volume: clamp(finiteNumber(source.volume, 0.42), 0, 1),
      pan: clamp(finiteNumber(source.pan, 0), -1, 1),
    });
  }

  function normalizeAudioBlock(audio, duration) {
    var source = isObject(audio) ? audio : {};
    var clips = Array.isArray(source.sfx) ? source.sfx : [];
    return Object.assign({}, source, {
      bgm: normalizeBgm(source.bgm, duration),
      sfxMasterVolume: clamp(
        finiteNumber(source.sfxMasterVolume, AUDIO_DEFAULTS.sfxMasterVolume),
        0,
        1,
      ),
      sfx: clips.map(function (clip, index) {
        return normalizeSfxClip(clip, index, duration);
      }),
    });
  }

  function normalizeScene(scene, index) {
    var output = isObject(scene) ? cloneValue(scene) : {};
    var fallbackStart = finiteNumber(output.start, 0);
    var startTime = Math.max(0, finiteNumber(output.startTime, fallbackStart));
    var fallbackEnd = finiteNumber(output.end, startTime);
    var endTime = Math.max(startTime, finiteNumber(output.endTime, fallbackEnd));
    var fallbackVoice = typeof output.voiceover === "string" ? output.voiceover : "";

    if (typeof output.id !== "string" || !output.id.trim()) {
      output.id = "scene-" + String(index + 1).padStart(2, "0");
    }
    if (typeof output.name !== "string") {
      output.name = typeof output.title === "string" ? output.title : "Phan canh " + (index + 1);
    }
    output.startTime = roundTime(startTime);
    output.endTime = roundTime(endTime);
    output.voiceText = typeof output.voiceText === "string" ? output.voiceText : fallbackVoice;
    output.elements = Array.isArray(output.elements) ? output.elements : [];
    delete output.start;
    delete output.end;
    delete output.voiceover;
    return output;
  }

  function mergePreservingUnknown(sourceValue, runtimeValue) {
    if (Array.isArray(runtimeValue)) {
      var sourceArray = Array.isArray(sourceValue) ? sourceValue : [];
      return runtimeValue.map(function (runtimeItem, index) {
        var sourceItem = null;
        if (isObject(runtimeItem) && typeof runtimeItem.id === "string") {
          sourceItem = sourceArray.find(function (candidate) {
            return isObject(candidate) && candidate.id === runtimeItem.id;
          });
        }
        if (sourceItem === null || sourceItem === undefined) sourceItem = sourceArray[index];
        return mergePreservingUnknown(sourceItem, runtimeItem);
      });
    }
    if (isObject(runtimeValue)) {
      var output = isObject(sourceValue) ? cloneValue(sourceValue) : {};
      Object.keys(runtimeValue).forEach(function (key) {
        output[key] = mergePreservingUnknown(output[key], runtimeValue[key]);
      });
      return output;
    }
    return cloneValue(runtimeValue);
  }

  function normalizeProjectForRuntime(project) {
    var source = isObject(project) ? project : {};
    var output = cloneValue(source);
    output.metadata = isObject(output.metadata) ? output.metadata : {};
    output.scenes = Array.isArray(output.scenes) ? output.scenes.map(normalizeScene) : [];
    output.globalElements = Array.isArray(output.globalElements) ? output.globalElements : [];

    var duration = getProjectDuration(output);
    if (
      !Number.isFinite(Number(output.metadata.duration)) ||
      Number(output.metadata.duration) < 0
    ) {
      output.metadata.duration = duration;
    }
    output.audio = normalizeAudioBlock(output.audio, duration);
    return output;
  }

  function stableStringify(value) {
    if (value === null || typeof value !== "object") return JSON.stringify(value);
    if (Array.isArray(value)) {
      return "[" + value.map(stableStringify).join(",") + "]";
    }
    return (
      "{" +
      Object.keys(value)
        .sort()
        .map(function (key) {
          return JSON.stringify(key) + ":" + stableStringify(value[key]);
        })
        .join(",") +
      "}"
    );
  }

  function audioBlocksEqual(left, right, duration) {
    return (
      stableStringify(normalizeAudioBlock(left, duration)) ===
      stableStringify(normalizeAudioBlock(right, duration))
    );
  }

  function serializeProject(runtimeProject, sourceSnapshot) {
    var source = isObject(sourceSnapshot) ? sourceSnapshot : {};
    var runtime = isObject(runtimeProject) ? runtimeProject : {};
    var output = mergePreservingUnknown(source, runtime);
    var duration = getProjectDuration(output);
    var sourceHasAudio = Object.prototype.hasOwnProperty.call(source, "audio");

    if (Array.isArray(output.scenes)) {
      output.scenes.forEach(function (scene) {
        if (!isObject(scene)) return;
        delete scene.start;
        delete scene.end;
        delete scene.voiceover;
      });
    }

    if (Object.prototype.hasOwnProperty.call(output, "audio")) {
      output.audio = normalizeAudioBlock(output.audio, duration);
      if (!sourceHasAudio && audioBlocksEqual(output.audio, undefined, duration)) {
        delete output.audio;
      }
    }

    return output;
  }

  function hasAudioChanges(runtimeProject, sourceSnapshot) {
    var runtime = isObject(runtimeProject) ? runtimeProject : {};
    var source = isObject(sourceSnapshot) ? sourceSnapshot : {};
    var duration = getProjectDuration(runtime);
    return !audioBlocksEqual(runtime.audio, source.audio, duration);
  }

  return {
    AUDIO_DEFAULTS: AUDIO_DEFAULTS,
    audioBlocksEqual: audioBlocksEqual,
    cloneValue: cloneValue,
    getProjectDuration: getProjectDuration,
    hasAudioChanges: hasAudioChanges,
    mergePreservingUnknown: mergePreservingUnknown,
    normalizeAudioBlock: normalizeAudioBlock,
    normalizeProjectForRuntime: normalizeProjectForRuntime,
    normalizeScene: normalizeScene,
    serializeProject: serializeProject,
    stableStringify: stableStringify,
  };
});
