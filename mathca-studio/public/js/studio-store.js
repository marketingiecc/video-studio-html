(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory(require("./project-model"));
  } else {
    root.MathCAStudioStore = factory(root.MathCAProjectModel);
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function (ProjectModel) {
  "use strict";

  if (!ProjectModel) throw new Error("MathCAProjectModel is required");

  var DEFAULT_HISTORY_LIMIT = 60;

  function clone(value) {
    return ProjectModel.cloneValue(value);
  }

  function clamp(value, minimum, maximum) {
    return Math.min(maximum, Math.max(minimum, value));
  }

  function initialSelection(project, selection) {
    var requested = selection || {};
    var scenes = project.scenes || [];
    var sceneId = requested.sceneId;
    if (
      !scenes.some(function (scene) {
        return scene.id === sceneId;
      })
    ) {
      sceneId = scenes.length ? scenes[0].id : null;
    }
    return {
      sceneId: sceneId || null,
      elementId: requested.elementId || null,
      sfxId: requested.sfxId || null,
    };
  }

  function createInitialState(project, options) {
    var settings = options || {};
    var runtimeProject = ProjectModel.normalizeProjectForRuntime(project);
    return {
      project: runtimeProject,
      sourceSnapshot: clone(project || {}),
      selection: initialSelection(runtimeProject, settings.selection),
      playback: {
        currentTime: 0,
        playing: false,
        rate: 1,
      },
      timeline: {
        zoom: 1,
      },
      dirty: false,
      save: {
        status: "saved",
        lastSavedAt: null,
        error: null,
      },
      operations: {},
      revision: 0,
      lastCommand: null,
    };
  }

  function createStudioStore(initialProject, options) {
    var settings = options || {};
    var historyLimit = Math.max(1, Number(settings.historyLimit) || DEFAULT_HISTORY_LIMIT);
    var state = createInitialState(initialProject || {}, settings);
    var undoStack = [];
    var redoStack = [];
    var listeners = new Set();
    var destroyed = false;

    function assertActive() {
      if (destroyed) throw new Error("Studio store has been destroyed");
    }

    function snapshotEditable() {
      return {
        project: clone(state.project),
        selection: clone(state.selection),
      };
    }

    function restoreEditable(snapshot) {
      var project = ProjectModel.normalizeProjectForRuntime(snapshot.project);
      state = Object.assign({}, state, {
        project: project,
        selection: initialSelection(project, snapshot.selection),
        playback: Object.assign({}, state.playback, {
          currentTime: clamp(
            state.playback.currentTime,
            0,
            ProjectModel.getProjectDuration(project),
          ),
        }),
        revision: state.revision + 1,
      });
    }

    function emit(type, detail) {
      var event = Object.assign({ type: type }, detail || {});
      listeners.forEach(function (listener) {
        listener(state, event);
      });
    }

    function pushHistory(stack, snapshot) {
      stack.push(snapshot);
      if (stack.length > historyLimit) stack.shift();
    }

    function setDirty(command) {
      state = Object.assign({}, state, {
        dirty: true,
        save: Object.assign({}, state.save, { status: "dirty", error: null }),
        lastCommand: command || null,
        revision: state.revision + 1,
      });
    }

    function commit(labelOrMutator, mutatorOrLabel, commitOptions) {
      assertActive();
      var label = typeof labelOrMutator === "string" ? labelOrMutator : mutatorOrLabel;
      var mutator = typeof labelOrMutator === "function" ? labelOrMutator : mutatorOrLabel;
      var command = typeof label === "string" && label ? label : "edit";
      var commandOptions = commitOptions || {};
      if (typeof mutator !== "function") throw new TypeError("commit requires a mutator function");

      var before = snapshotEditable();
      var draft = snapshotEditable();
      var result = mutator(draft, state);
      var nextProject = ProjectModel.normalizeProjectForRuntime(draft.project);
      var nextSelection = initialSelection(nextProject, draft.selection);
      var beforeKey = ProjectModel.stableStringify(before);
      var afterEditable = { project: nextProject, selection: nextSelection };
      var afterKey = ProjectModel.stableStringify(afterEditable);

      if (beforeKey === afterKey) return { changed: false, result: result };

      pushHistory(undoStack, before);
      redoStack = [];
      state = Object.assign({}, state, afterEditable, {
        playback: Object.assign({}, state.playback, {
          currentTime: clamp(
            state.playback.currentTime,
            0,
            ProjectModel.getProjectDuration(nextProject),
          ),
        }),
      });
      if (commandOptions.dirty === false) {
        state = Object.assign({}, state, {
          lastCommand: command,
          revision: state.revision + 1,
        });
      } else {
        setDirty(command);
      }
      emit("commit", { command: command, result: result });
      return { changed: true, result: result };
    }

    function updateProject(label, projectMutator, commitOptions) {
      return commit(
        label,
        function (draft, currentState) {
          return projectMutator(draft.project, draft.selection, currentState);
        },
        commitOptions,
      );
    }

    function replaceProject(project, replaceOptions) {
      assertActive();
      var nextOptions = replaceOptions || {};
      var runtimeProject = ProjectModel.normalizeProjectForRuntime(project);
      var sourceSnapshot = Object.prototype.hasOwnProperty.call(nextOptions, "sourceSnapshot")
        ? clone(nextOptions.sourceSnapshot)
        : clone(project || {});
      undoStack = [];
      redoStack = [];
      state = Object.assign({}, state, {
        project: runtimeProject,
        sourceSnapshot: sourceSnapshot,
        selection: initialSelection(runtimeProject, nextOptions.selection),
        playback: { currentTime: 0, playing: false, rate: state.playback.rate },
        dirty: Boolean(nextOptions.dirty),
        save: {
          status: nextOptions.dirty ? "dirty" : "saved",
          lastSavedAt: state.save.lastSavedAt,
          error: null,
        },
        operations: nextOptions.keepOperations ? state.operations : {},
        revision: state.revision + 1,
        lastCommand: null,
      });
      emit("project:replace");
      return state.project;
    }

    function undo() {
      assertActive();
      if (!undoStack.length) return false;
      pushHistory(redoStack, snapshotEditable());
      restoreEditable(undoStack.pop());
      setDirty("undo");
      emit("undo");
      return true;
    }

    function redo() {
      assertActive();
      if (!redoStack.length) return false;
      pushHistory(undoStack, snapshotEditable());
      restoreEditable(redoStack.pop());
      setDirty("redo");
      emit("redo");
      return true;
    }

    function setSelection(patch) {
      assertActive();
      var next = Object.assign({}, state.selection, patch || {});
      next = initialSelection(state.project, next);
      if (ProjectModel.stableStringify(next) === ProjectModel.stableStringify(state.selection))
        return false;
      state = Object.assign({}, state, {
        selection: next,
        revision: state.revision + 1,
      });
      emit("selection");
      return true;
    }

    function seek(time) {
      assertActive();
      var duration = ProjectModel.getProjectDuration(state.project);
      var nextTime = Math.round(clamp(Number(time) || 0, 0, duration) * 1000) / 1000;
      if (nextTime === state.playback.currentTime) return nextTime;
      state = Object.assign({}, state, {
        playback: Object.assign({}, state.playback, { currentTime: nextTime }),
        revision: state.revision + 1,
      });
      emit("playback:seek", { currentTime: nextTime });
      return nextTime;
    }

    function setPlaying(playing) {
      assertActive();
      var nextPlaying = Boolean(playing);
      if (nextPlaying === state.playback.playing) return nextPlaying;
      state = Object.assign({}, state, {
        playback: Object.assign({}, state.playback, { playing: nextPlaying }),
        revision: state.revision + 1,
      });
      emit(nextPlaying ? "playback:play" : "playback:pause");
      return nextPlaying;
    }

    function setPlaybackRate(rate) {
      assertActive();
      var nextRate = clamp(Number(rate) || 1, 0.1, 4);
      state = Object.assign({}, state, {
        playback: Object.assign({}, state.playback, { rate: nextRate }),
        revision: state.revision + 1,
      });
      emit("playback:rate", { rate: nextRate });
      return nextRate;
    }

    function setTimelineZoom(zoom) {
      assertActive();
      var nextZoom = clamp(Number(zoom) || 1, 0.8, 1.8);
      state = Object.assign({}, state, {
        timeline: Object.assign({}, state.timeline, { zoom: nextZoom }),
        revision: state.revision + 1,
      });
      emit("timeline:zoom", { zoom: nextZoom });
      return nextZoom;
    }

    function setOperation(name, patch) {
      assertActive();
      if (!name) throw new TypeError("Operation name is required");
      var previous = state.operations[name] || { status: "idle", progress: 0, error: null };
      var next = Object.assign({}, previous, patch || {});
      state = Object.assign({}, state, {
        operations: Object.assign(
          {},
          state.operations,
          (function () {
            var entry = {};
            entry[name] = next;
            return entry;
          })(),
        ),
        revision: state.revision + 1,
      });
      emit("operation", { name: name, operation: next });
      return next;
    }

    function markSaving() {
      state = Object.assign({}, state, {
        save: Object.assign({}, state.save, { status: "saving", error: null }),
        revision: state.revision + 1,
      });
      emit("save:saving");
    }

    function markSaved(savedProject, savedAt) {
      assertActive();
      var serialized = savedProject
        ? clone(savedProject)
        : ProjectModel.serializeProject(state.project, state.sourceSnapshot);
      state = Object.assign({}, state, {
        sourceSnapshot: serialized,
        dirty: false,
        save: {
          status: "saved",
          lastSavedAt: savedAt || new Date().toISOString(),
          error: null,
        },
        revision: state.revision + 1,
      });
      emit("save:saved");
      return serialized;
    }

    function markSaveError(error) {
      var message = error instanceof Error ? error.message : String(error || "Unknown save error");
      state = Object.assign({}, state, {
        save: Object.assign({}, state.save, { status: "error", error: message }),
        revision: state.revision + 1,
      });
      emit("save:error", { error: message });
    }

    function serialize() {
      return ProjectModel.serializeProject(state.project, state.sourceSnapshot);
    }

    function subscribe(listener) {
      assertActive();
      if (typeof listener !== "function") throw new TypeError("Subscriber must be a function");
      listeners.add(listener);
      return function unsubscribe() {
        listeners.delete(listener);
      };
    }

    function destroy() {
      listeners.clear();
      undoStack = [];
      redoStack = [];
      destroyed = true;
    }

    return {
      canRedo: function () {
        return redoStack.length > 0;
      },
      canUndo: function () {
        return undoStack.length > 0;
      },
      commit: commit,
      destroy: destroy,
      getHistoryState: function () {
        return { undo: undoStack.length, redo: redoStack.length, limit: historyLimit };
      },
      getState: function () {
        return state;
      },
      markSaveError: markSaveError,
      markSaved: markSaved,
      markSaving: markSaving,
      redo: redo,
      replaceProject: replaceProject,
      seek: seek,
      serialize: serialize,
      setOperation: setOperation,
      setPlaybackRate: setPlaybackRate,
      setPlaying: setPlaying,
      setProject: replaceProject,
      setSelection: setSelection,
      setTimelineZoom: setTimelineZoom,
      subscribe: subscribe,
      undo: undo,
      updateProject: updateProject,
    };
  }

  return {
    DEFAULT_HISTORY_LIMIT: DEFAULT_HISTORY_LIMIT,
    createInitialState: createInitialState,
    createStudioStore: createStudioStore,
  };
});
