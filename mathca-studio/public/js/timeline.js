(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory(require("./project-model"));
  } else {
    root.MathCATimeline = factory(root.MathCAProjectModel);
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function (ProjectModel) {
  "use strict";

  if (!ProjectModel) throw new Error("MathCAProjectModel is required");

  var TRACK_ORDER = Object.freeze(["scenes", "voiceover", "bgm", "sfx", "elements"]);

  function clamp(value, minimum, maximum) {
    return Math.min(maximum, Math.max(minimum, value));
  }

  function round(value) {
    return Math.round(value * 1000) / 1000;
  }

  function timeToPercent(time, duration) {
    var total = Math.max(0, Number(duration) || 0);
    if (!total) return 0;
    return clamp(((Number(time) || 0) / total) * 100, 0, 100);
  }

  function percentToTime(percent, duration) {
    return round((clamp(Number(percent) || 0, 0, 100) / 100) * Math.max(0, Number(duration) || 0));
  }

  function pixelsToTime(deltaPixels, contentWidth, duration) {
    var width = Math.max(1, Number(contentWidth) || 1);
    return round(((Number(deltaPixels) || 0) / width) * Math.max(0, Number(duration) || 0));
  }

  function uniqueId(items, baseId) {
    var used = new Set(
      items.map(function (item) {
        return item && item.id;
      }),
    );
    if (!used.has(baseId)) return baseId;
    var suffix = 2;
    while (used.has(baseId + "-" + suffix)) suffix += 1;
    return baseId + "-" + suffix;
  }

  function deriveSceneClips(project) {
    return project.scenes.map(function (scene, index) {
      var startTime = Number(scene.startTime) || 0;
      var endTime = Math.max(startTime, Number(scene.endTime) || startTime);
      return {
        id: scene.id,
        sceneId: scene.id,
        index: index,
        label: scene.name || "Phan canh " + (index + 1),
        startTime: startTime,
        endTime: endTime,
        duration: round(endTime - startTime),
      };
    });
  }

  function deriveVoiceClips(project) {
    return project.scenes.reduce(function (clips, scene, index) {
      var text = typeof scene.voiceText === "string" ? scene.voiceText.trim() : "";
      if (!text) return clips;
      var startTime = Number(scene.startTime) || 0;
      var endTime = Math.max(startTime, Number(scene.endTime) || startTime);
      clips.push({
        id: "voice-" + (scene.id || index + 1),
        sceneId: scene.id,
        label: text,
        text: text,
        startTime: startTime,
        endTime: endTime,
        duration: round(endTime - startTime),
      });
      return clips;
    }, []);
  }

  function deriveBgmClips(project, duration) {
    var bgm = project.audio.bgm;
    var hasSource = Boolean(bgm.src || bgm.assetId);
    var startTime = clamp(Number(bgm.startTime) || 0, 0, duration);
    var endTime = clamp(Number(bgm.endTime), startTime, duration);
    if (!Number.isFinite(endTime)) endTime = duration;
    return [
      {
        id: "bgm",
        label: bgm.name || (hasSource ? bgm.src : "BGM dang tat"),
        startTime: startTime,
        endTime: endTime,
        duration: round(endTime - startTime),
        enabled: Boolean(bgm.enabled),
        empty: !hasSource,
        loop: Boolean(bgm.loop),
      },
    ];
  }

  function deriveSfxClips(project, duration) {
    return project.audio.sfx.map(function (clip, index) {
      var startTime = clamp(Number(clip.startTime) || 0, 0, duration);
      var clipDuration = Math.min(
        Math.max(0, Number(clip.duration) || 0),
        Math.max(0, duration - startTime),
      );
      return {
        id: clip.id,
        label: clip.name || "SFX " + (index + 1),
        startTime: startTime,
        endTime: round(startTime + clipDuration),
        duration: round(clipDuration),
        volume: clip.volume,
        pan: clip.pan,
      };
    });
  }

  function deriveElementClips(project) {
    return project.scenes.reduce(function (clips, scene) {
      var sceneStart = Number(scene.startTime) || 0;
      var sceneEnd = Math.max(sceneStart, Number(scene.endTime) || sceneStart);
      var elements = Array.isArray(scene.elements) ? scene.elements : [];
      elements.forEach(function (element, index) {
        var animation = element.animation || {};
        var startTime = Number.isFinite(Number(element.startTime))
          ? Number(element.startTime)
          : sceneStart + Math.max(0, Number(animation.delay) || 0);
        startTime = clamp(startTime, sceneStart, sceneEnd);
        var requestedEnd = Number(element.endTime);
        var entryDuration = Math.max(0.05, Number(animation.duration) || 0.45);
        var loops = animation.loop && animation.loop !== "none";
        var endTime = Number.isFinite(requestedEnd)
          ? requestedEnd
          : loops
            ? sceneEnd
            : startTime + entryDuration;
        endTime = clamp(endTime, startTime, sceneEnd);
        clips.push({
          id: element.id || scene.id + "-element-" + (index + 1),
          sceneId: scene.id,
          elementId: element.id || null,
          label: element.name || element.text || element.type || "Element",
          startTime: round(startTime),
          endTime: round(endTime),
          duration: round(endTime - startTime),
          type: element.type || "element",
        });
      });
      return clips;
    }, []);
  }

  function deriveTimelineTracks(project) {
    var runtime = ProjectModel.normalizeProjectForRuntime(project || {});
    var duration = ProjectModel.getProjectDuration(runtime);
    return {
      duration: duration,
      order: TRACK_ORDER.slice(),
      tracks: {
        scenes: deriveSceneClips(runtime),
        voiceover: deriveVoiceClips(runtime),
        bgm: deriveBgmClips(runtime, duration),
        sfx: deriveSfxClips(runtime, duration),
        elements: deriveElementClips(runtime),
      },
    };
  }

  function calculateRulerTicks(duration, targetTickCount) {
    var total = Math.max(0, Number(duration) || 0);
    var target = Math.max(2, Number(targetTickCount) || 8);
    if (!total) return [{ time: 0, percent: 0, label: "0s" }];
    var rough = total / target;
    var magnitude = Math.pow(10, Math.floor(Math.log10(rough)));
    var normalized = rough / magnitude;
    var step = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10;
    step *= magnitude;
    var ticks = [];
    for (var time = 0; time < total; time += step) {
      ticks.push({
        time: round(time),
        percent: timeToPercent(time, total),
        label: round(time) + "s",
      });
    }
    ticks.push({ time: total, percent: 100, label: total + "s" });
    return ticks;
  }

  function withRuntimeProject(project, mutator) {
    var output = ProjectModel.normalizeProjectForRuntime(project || {});
    mutator(output, ProjectModel.getProjectDuration(output));
    return ProjectModel.normalizeProjectForRuntime(output);
  }

  function moveSfxClip(project, clipId, startTime) {
    return withRuntimeProject(project, function (output, duration) {
      var clip = output.audio.sfx.find(function (item) {
        return item.id === clipId;
      });
      if (!clip) return;
      clip.startTime = round(
        clamp(Number(startTime) || 0, 0, Math.max(0, duration - clip.duration)),
      );
    });
  }

  function nudgeSfxClip(project, clipId, delta) {
    var runtime = ProjectModel.normalizeProjectForRuntime(project || {});
    var clip = runtime.audio.sfx.find(function (item) {
      return item.id === clipId;
    });
    if (!clip) return runtime;
    return moveSfxClip(runtime, clipId, clip.startTime + (Number(delta) || 0));
  }

  function updateSfxClip(project, clipId, patch) {
    return withRuntimeProject(project, function (output) {
      var clip = output.audio.sfx.find(function (item) {
        return item.id === clipId;
      });
      if (!clip) return;
      Object.assign(clip, patch || {});
    });
  }

  function moveBgmRegion(project, startTime) {
    return withRuntimeProject(project, function (output, duration) {
      var bgm = output.audio.bgm;
      var regionDuration = Math.max(0, bgm.endTime - bgm.startTime);
      var nextStart = clamp(Number(startTime) || 0, 0, Math.max(0, duration - regionDuration));
      bgm.startTime = round(nextStart);
      bgm.endTime = round(nextStart + regionDuration);
    });
  }

  function trimBgmRegion(project, edge, time, minimumDuration) {
    return withRuntimeProject(project, function (output, duration) {
      var bgm = output.audio.bgm;
      var minimum = Math.max(0.1, Number(minimumDuration) || 0.1);
      if (edge === "start" || edge === "left") {
        bgm.startTime = round(clamp(Number(time) || 0, 0, Math.max(0, bgm.endTime - minimum)));
      } else if (edge === "end" || edge === "right") {
        bgm.endTime = round(clamp(Number(time) || 0, bgm.startTime + minimum, duration));
      }
    });
  }

  function splitScene(project, sceneId, atTime, options) {
    var settings = options || {};
    return withRuntimeProject(project, function (output) {
      var index = output.scenes.findIndex(function (scene) {
        return scene.id === sceneId;
      });
      if (index < 0) return;
      var scene = output.scenes[index];
      var minimum = Math.max(0.05, Number(settings.minimumDuration) || 0.3);
      var splitTime = Number(atTime);
      if (
        !Number.isFinite(splitTime) ||
        splitTime <= scene.startTime + minimum ||
        splitTime >= scene.endTime - minimum
      ) {
        return;
      }
      var second = ProjectModel.cloneValue(scene);
      second.id = uniqueId(output.scenes, settings.id || scene.id + "-part-2");
      second.name = settings.name || scene.name + " (phan 2)";
      second.startTime = round(splitTime);
      scene.endTime = round(splitTime);
      output.scenes.splice(index + 1, 0, second);
    });
  }

  function duplicateScene(project, sceneId, options) {
    var settings = options || {};
    return withRuntimeProject(project, function (output) {
      var index = output.scenes.findIndex(function (scene) {
        return scene.id === sceneId;
      });
      if (index < 0) return;
      var copy = ProjectModel.cloneValue(output.scenes[index]);
      copy.id = uniqueId(output.scenes, settings.id || copy.id + "-copy");
      copy.name = settings.name || copy.name + " (ban sao)";
      output.scenes.splice(index + 1, 0, copy);
    });
  }

  function deleteScene(project, sceneId) {
    return withRuntimeProject(project, function (output) {
      if (output.scenes.length <= 1) return;
      output.scenes = output.scenes.filter(function (scene) {
        return scene.id !== sceneId;
      });
    });
  }

  function duplicateSfx(project, clipId, options) {
    var settings = options || {};
    return withRuntimeProject(project, function (output, duration) {
      var index = output.audio.sfx.findIndex(function (clip) {
        return clip.id === clipId;
      });
      if (index < 0) return;
      var copy = ProjectModel.cloneValue(output.audio.sfx[index]);
      copy.id = uniqueId(output.audio.sfx, settings.id || copy.id + "-copy");
      copy.startTime = round(
        clamp(
          copy.startTime + (Number(settings.offset) || 0.4),
          0,
          Math.max(0, duration - copy.duration),
        ),
      );
      output.audio.sfx.splice(index + 1, 0, copy);
    });
  }

  function deleteSfx(project, clipId) {
    return withRuntimeProject(project, function (output) {
      output.audio.sfx = output.audio.sfx.filter(function (clip) {
        return clip.id !== clipId;
      });
    });
  }

  function createTimelineController(store) {
    if (
      !store ||
      typeof store.getState !== "function" ||
      typeof store.updateProject !== "function"
    ) {
      throw new TypeError("Timeline controller requires a studio store");
    }
    return {
      deleteScene: function (sceneId) {
        return store.updateProject("delete-scene", function (project) {
          Object.assign(project, deleteScene(project, sceneId));
        });
      },
      deleteSfx: function (clipId) {
        return store.updateProject("delete-sfx", function (project) {
          Object.assign(project, deleteSfx(project, clipId));
        });
      },
      derive: function () {
        return deriveTimelineTracks(store.getState().project);
      },
      duplicateScene: function (sceneId, options) {
        return store.updateProject("duplicate-scene", function (project) {
          Object.assign(project, duplicateScene(project, sceneId, options));
        });
      },
      duplicateSfx: function (clipId, options) {
        return store.updateProject("duplicate-sfx", function (project) {
          Object.assign(project, duplicateSfx(project, clipId, options));
        });
      },
      moveBgm: function (startTime) {
        return store.updateProject("move-bgm", function (project) {
          Object.assign(project, moveBgmRegion(project, startTime));
        });
      },
      moveSfx: function (clipId, startTime) {
        return store.updateProject("move-sfx", function (project) {
          Object.assign(project, moveSfxClip(project, clipId, startTime));
        });
      },
      nudgeSfx: function (clipId, delta) {
        return store.updateProject("nudge-sfx", function (project) {
          Object.assign(project, nudgeSfxClip(project, clipId, delta));
        });
      },
      seekByPercent: function (percent) {
        var duration = ProjectModel.getProjectDuration(store.getState().project);
        return store.seek(percentToTime(percent, duration));
      },
      splitScene: function (sceneId, atTime, options) {
        return store.updateProject("split-scene", function (project) {
          Object.assign(project, splitScene(project, sceneId, atTime, options));
        });
      },
      trimBgm: function (edge, time, minimumDuration) {
        return store.updateProject("trim-bgm", function (project) {
          Object.assign(project, trimBgmRegion(project, edge, time, minimumDuration));
        });
      },
    };
  }

  return {
    TRACK_ORDER: TRACK_ORDER,
    calculateRulerTicks: calculateRulerTicks,
    createTimelineController: createTimelineController,
    deleteScene: deleteScene,
    deleteSfx: deleteSfx,
    deriveTimelineTracks: deriveTimelineTracks,
    duplicateScene: duplicateScene,
    duplicateSfx: duplicateSfx,
    moveBgmRegion: moveBgmRegion,
    moveSfxClip: moveSfxClip,
    nudgeSfxClip: nudgeSfxClip,
    percentToTime: percentToTime,
    pixelsToTime: pixelsToTime,
    splitScene: splitScene,
    timeToPercent: timeToPercent,
    trimBgmRegion: trimBgmRegion,
    updateSfxClip: updateSfxClip,
  };
});
