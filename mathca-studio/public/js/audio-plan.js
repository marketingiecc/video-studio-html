(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory(require("./project-model"));
  } else {
    root.MathCAAudioPlan = factory(root.MathCAProjectModel);
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function (ProjectModel) {
  "use strict";

  if (!ProjectModel) throw new Error("MathCAProjectModel is required");

  var OUTPUT_SAMPLE_RATE = 48000;
  var OUTPUT_CHANNELS = 2;

  function clamp(value, minimum, maximum) {
    return Math.min(maximum, Math.max(minimum, value));
  }

  function round(value, digits) {
    var factor = Math.pow(10, digits === undefined ? 6 : digits);
    return Math.round(value * factor) / factor;
  }

  function dbToGain(db) {
    return round(Math.pow(10, Number(db || 0) / 20));
  }

  function gainToDb(gain) {
    var safeGain = Math.max(Number(gain) || 0, 0.000001);
    return round(20 * Math.log10(safeGain), 3);
  }

  function equalPowerPan(pan) {
    var normalizedPan = clamp(Number(pan) || 0, -1, 1);
    var angle = ((normalizedPan + 1) * Math.PI) / 4;
    return {
      left: round(Math.cos(angle)),
      right: round(Math.sin(angle)),
    };
  }

  function resolveAssetReference(source, assetId) {
    var src = typeof source === "string" ? source.trim() : "";
    var id = typeof assetId === "string" ? assetId.trim() : "";
    var kind = "none";
    if (src.indexOf("preset:") === 0) kind = "preset";
    else if (src.indexOf("library:") === 0) kind = "library";
    else if (src.indexOf("upload:") === 0) kind = "upload";
    else if (/^blob:/i.test(src)) kind = "blob";
    else if (/^(https?:)?\/\//i.test(src)) kind = "remote";
    else if (/^[a-zA-Z]:[\\/]/.test(src) || /^\\\\/.test(src)) kind = "absolute";
    else if (src) kind = "project";
    return {
      assetId: id || null,
      src: src,
      kind: kind,
      durable: Boolean(id) || ["preset", "library", "project"].indexOf(kind) >= 0,
    };
  }

  function createVoiceSegments(project) {
    var scenes = Array.isArray(project.scenes) ? project.scenes : [];
    return scenes.reduce(function (segments, scene, index) {
      var text = typeof scene.voiceText === "string" ? scene.voiceText.trim() : "";
      if (!text) return segments;
      var startTime = Math.max(0, Number(scene.startTime) || 0);
      var endTime = Math.max(startTime, Number(scene.endTime) || startTime);
      segments.push({
        id: scene.id || "scene-" + String(index + 1).padStart(2, "0"),
        sceneId: scene.id || null,
        startTime: round(startTime, 3),
        endTime: round(endTime, 3),
        duration: round(endTime - startTime, 3),
        text: text,
      });
      return segments;
    }, []);
  }

  function mergeWindows(windows) {
    return windows
      .slice()
      .sort(function (a, b) {
        return a.startTime - b.startTime;
      })
      .reduce(function (merged, window) {
        var last = merged[merged.length - 1];
        if (!last || window.startTime > last.endTime) {
          merged.push(Object.assign({}, window));
        } else {
          last.endTime = Math.max(last.endTime, window.endTime);
          last.duration = round(last.endTime - last.startTime, 3);
        }
        return merged;
      }, []);
  }

  function createDuckingPlan(ducking, voiceSegments, duration) {
    var enabled = Boolean(ducking && ducking.enabled);
    var underVoiceDb = Number(ducking && ducking.underVoiceDb);
    var attack = Math.max(0, Number(ducking && ducking.attack) || 0);
    var release = Math.max(0, Number(ducking && ducking.release) || 0);
    var windows = enabled
      ? voiceSegments.map(function (segment) {
          var startTime = Math.max(0, segment.startTime - attack);
          var endTime = Math.min(duration, segment.endTime + release);
          return {
            startTime: round(startTime, 3),
            endTime: round(endTime, 3),
            duration: round(endTime - startTime, 3),
          };
        })
      : [];

    return {
      enabled: enabled,
      underVoiceDb: Number.isFinite(underVoiceDb) ? underVoiceDb : -12,
      underVoiceGain: dbToGain(Number.isFinite(underVoiceDb) ? underVoiceDb : -12),
      attack: round(attack, 3),
      release: round(release, 3),
      windows: mergeWindows(windows),
    };
  }

  function createBgmPlan(audio, voiceSegments, duration) {
    var bgm = audio.bgm;
    var asset = resolveAssetReference(bgm.src, bgm.assetId);
    var startTime = clamp(Number(bgm.startTime) || 0, 0, duration);
    var endTime = clamp(Number(bgm.endTime), startTime, duration);
    if (!Number.isFinite(endTime)) endTime = duration;
    return {
      enabled: Boolean(bgm.enabled),
      active: Boolean(bgm.enabled && (asset.src || asset.assetId) && endTime > startTime),
      asset: asset,
      name: typeof bgm.name === "string" ? bgm.name : "",
      volume: round(clamp(Number(bgm.volume) || 0, 0, 1)),
      gainDb: gainToDb(clamp(Number(bgm.volume) || 0, 0, 1)),
      startTime: round(startTime, 3),
      endTime: round(endTime, 3),
      duration: round(endTime - startTime, 3),
      loop: Boolean(bgm.loop),
      fadeIn: round(Math.min(Math.max(0, Number(bgm.fadeIn) || 0), endTime - startTime), 3),
      fadeOut: round(Math.min(Math.max(0, Number(bgm.fadeOut) || 0), endTime - startTime), 3),
      ducking: createDuckingPlan(bgm.ducking, voiceSegments, duration),
    };
  }

  function createSfxPlan(audio, duration) {
    var masterVolume = clamp(Number(audio.sfxMasterVolume) || 0, 0, 1);
    var clips = audio.sfx.map(function (clip, index) {
      var startTime = clamp(Number(clip.startTime) || 0, 0, duration);
      var clipDuration = Math.min(
        Math.max(0, Number(clip.duration) || 0),
        Math.max(0, duration - startTime),
      );
      var volume = clamp(Number(clip.volume) || 0, 0, 1);
      var pan = clamp(Number(clip.pan) || 0, -1, 1);
      var effectiveGain = masterVolume * volume;
      return {
        id: clip.id || "sfx-" + String(index + 1).padStart(2, "0"),
        asset: resolveAssetReference(clip.src, clip.assetId),
        name: typeof clip.name === "string" ? clip.name : "SFX " + (index + 1),
        startTime: round(startTime, 3),
        duration: round(clipDuration, 3),
        endTime: round(startTime + clipDuration, 3),
        volume: round(volume),
        masterVolume: round(masterVolume),
        effectiveGain: round(effectiveGain),
        gainDb: gainToDb(effectiveGain),
        pan: round(pan),
        panGains: equalPowerPan(pan),
      };
    });
    return {
      masterVolume: round(masterVolume),
      clips: clips,
    };
  }

  function createAudioPlan(project, options) {
    var settings = options || {};
    var normalizedProject = ProjectModel.normalizeProjectForRuntime(project || {});
    var duration = ProjectModel.getProjectDuration(normalizedProject);
    var audio = ProjectModel.normalizeAudioBlock(normalizedProject.audio, duration);
    var voiceSegments = createVoiceSegments(normalizedProject);
    var voiceGain = clamp(Number(settings.voiceGain) || 1, 0, 4);
    var plan = {
      version: 1,
      duration: duration,
      output: {
        sampleRate: OUTPUT_SAMPLE_RATE,
        channels: OUTPUT_CHANNELS,
        channelLayout: "stereo",
        sampleFormat: "fltp",
      },
      voice: {
        enabled: settings.includeVoice !== false,
        gain: round(voiceGain),
        gainDb: gainToDb(voiceGain),
        asset: resolveAssetReference(settings.voiceSrc || "", settings.voiceAssetId || ""),
        segments: voiceSegments,
      },
      bgm: createBgmPlan(audio, voiceSegments, duration),
      sfx: createSfxPlan(audio, duration),
    };
    plan.hash = hashAudioPlan(plan);
    return plan;
  }

  function hashString(value) {
    var text = String(value);
    var hash = 2166136261;
    for (var index = 0; index < text.length; index += 1) {
      hash ^= text.charCodeAt(index);
      hash = Math.imul(hash, 16777619);
    }
    return ("00000000" + (hash >>> 0).toString(16)).slice(-8);
  }

  function hashAudioPlan(plan) {
    var clone = ProjectModel.cloneValue(plan || {});
    if (clone && typeof clone === "object") delete clone.hash;
    return "ap1-" + hashString(ProjectModel.stableStringify(clone));
  }

  return {
    OUTPUT_CHANNELS: OUTPUT_CHANNELS,
    OUTPUT_SAMPLE_RATE: OUTPUT_SAMPLE_RATE,
    buildAudioPlan: createAudioPlan,
    createAudioPlan: createAudioPlan,
    createDuckingPlan: createDuckingPlan,
    createVoiceSegments: createVoiceSegments,
    dbToGain: dbToGain,
    equalPowerPan: equalPowerPan,
    gainToDb: gainToDb,
    getAudioPlanHash: hashAudioPlan,
    hashAudioPlan: hashAudioPlan,
    hashString: hashString,
    resolveAssetReference: resolveAssetReference,
  };
});
