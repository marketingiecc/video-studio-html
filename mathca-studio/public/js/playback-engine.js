(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.MathCAPlaybackEngine = factory();
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  function defaultNow() {
    if (typeof performance !== "undefined" && typeof performance.now === "function") {
      return performance.now();
    }
    return Date.now();
  }

  function defaultRequestFrame(callback) {
    if (typeof requestAnimationFrame === "function") return requestAnimationFrame(callback);
    return setTimeout(function () {
      callback(defaultNow());
    }, 16);
  }

  function defaultCancelFrame(handle) {
    if (typeof cancelAnimationFrame === "function") cancelAnimationFrame(handle);
    else clearTimeout(handle);
  }

  function clampTime(time, duration) {
    var maximum = Math.max(0, Number(duration) || 0);
    return Math.min(maximum, Math.max(0, Number(time) || 0));
  }

  function createMediaFollower(media, options) {
    var settings = options || {};
    return {
      getCurrentTime: function () {
        return (Number(media && media.currentTime) || 0) + (Number(settings.offset) || 0);
      },
      isActiveAt: settings.isActiveAt,
      pause: function () {
        if (media && typeof media.pause === "function") media.pause();
      },
      play: function () {
        if (!media || typeof media.play !== "function") return undefined;
        var result = media.play();
        if (result && typeof result.catch === "function") result.catch(function () {});
        return result;
      },
      seek: function (time) {
        if (!media) return;
        try {
          media.currentTime = Math.max(0, time - (Number(settings.offset) || 0));
        } catch {
          // Media may reject seeks until metadata is available.
        }
      },
      setPlaybackRate: function (rate) {
        if (media && "playbackRate" in media) media.playbackRate = rate;
      },
    };
  }

  function createPlaybackEngine(options) {
    var settings = options || {};
    var now = typeof settings.now === "function" ? settings.now : defaultNow;
    var requestFrame =
      typeof settings.requestFrame === "function" ? settings.requestFrame : defaultRequestFrame;
    var cancelFrame =
      typeof settings.cancelFrame === "function" ? settings.cancelFrame : defaultCancelFrame;
    var getDuration =
      typeof settings.getDuration === "function"
        ? settings.getDuration
        : function () {
            return Number(settings.duration) || 0;
          };
    var onTimeUpdate =
      typeof settings.onTimeUpdate === "function" ? settings.onTimeUpdate : function () {};
    var resyncThreshold = Math.max(0.01, Number(settings.resyncThreshold) || 0.1);
    var driftCheckInterval = Math.max(16, Number(settings.driftCheckInterval) || 250);
    var loop = Boolean(settings.loop);
    var currentTime = clampTime(settings.currentTime || 0, getDuration());
    var playbackRate = Math.min(4, Math.max(0.1, Number(settings.playbackRate) || 1));
    var playing = false;
    var anchorTime = currentTime;
    var anchorWallTime = now();
    var lastDriftCheck = anchorWallTime;
    var frameHandle = null;
    var destroyed = false;
    var followers = new Set();
    var listeners = new Set();

    function emit(type, detail) {
      var event = Object.assign(
        { type: type, currentTime: currentTime, playing: playing },
        detail || {},
      );
      listeners.forEach(function (listener) {
        listener(event);
      });
    }

    function followerActive(follower, time) {
      return typeof follower.isActiveAt !== "function" || follower.isActiveAt(time);
    }

    function callFollower(follower, method, args) {
      if (typeof follower[method] !== "function") return;
      try {
        follower[method].apply(follower, args || []);
      } catch (error) {
        emit("follower:error", { error: error, follower: follower, method: method });
      }
    }

    function syncFollowers(time, force) {
      followers.forEach(function (follower) {
        var active = followerActive(follower, time);
        if (!active) {
          callFollower(follower, "pause", [time]);
          return;
        }
        var followerTime =
          typeof follower.getCurrentTime === "function" ? Number(follower.getCurrentTime()) : NaN;
        if (
          force ||
          !Number.isFinite(followerTime) ||
          Math.abs(followerTime - time) > resyncThreshold
        ) {
          callFollower(follower, "seek", [time]);
        }
        callFollower(follower, "setPlaybackRate", [playbackRate]);
        if (playing) callFollower(follower, "play", [time]);
        else callFollower(follower, "pause", [time]);
      });
    }

    function schedule() {
      if (!playing || destroyed || frameHandle !== null) return;
      frameHandle = requestFrame(tick);
    }

    function tick(timestamp) {
      frameHandle = null;
      if (!playing || destroyed) return;
      var wallTime = Number.isFinite(timestamp) ? timestamp : now();
      var duration = Math.max(0, Number(getDuration()) || 0);
      currentTime = anchorTime + ((wallTime - anchorWallTime) / 1000) * playbackRate;

      if (currentTime >= duration) {
        if (loop && duration > 0) {
          currentTime = currentTime % duration;
          anchorTime = currentTime;
          anchorWallTime = wallTime;
          syncFollowers(currentTime, true);
          emit("loop");
        } else {
          currentTime = duration;
          playing = false;
          syncFollowers(currentTime, true);
          onTimeUpdate(currentTime, { playing: false, ended: true });
          emit("ended");
          return;
        }
      }

      onTimeUpdate(currentTime, { playing: true });
      if (wallTime - lastDriftCheck >= driftCheckInterval) {
        lastDriftCheck = wallTime;
        syncFollowers(currentTime, false);
      }
      emit("tick");
      schedule();
    }

    function seek(time, seekOptions) {
      if (destroyed) return currentTime;
      currentTime = clampTime(time, getDuration());
      anchorTime = currentTime;
      anchorWallTime = now();
      syncFollowers(currentTime, !seekOptions || seekOptions.sync !== false);
      onTimeUpdate(currentTime, { playing: playing, seek: true });
      emit("seek");
      return currentTime;
    }

    function play() {
      if (destroyed || playing) return false;
      var duration = Math.max(0, Number(getDuration()) || 0);
      if (duration <= 0) return false;
      if (currentTime >= duration) currentTime = 0;
      playing = true;
      anchorTime = currentTime;
      anchorWallTime = now();
      lastDriftCheck = anchorWallTime;
      syncFollowers(currentTime, true);
      onTimeUpdate(currentTime, { playing: true, play: true });
      emit("play");
      schedule();
      return true;
    }

    function pause() {
      if (destroyed || !playing) return false;
      var wallTime = now();
      currentTime = clampTime(
        anchorTime + ((wallTime - anchorWallTime) / 1000) * playbackRate,
        getDuration(),
      );
      playing = false;
      if (frameHandle !== null) {
        cancelFrame(frameHandle);
        frameHandle = null;
      }
      syncFollowers(currentTime, true);
      onTimeUpdate(currentTime, { playing: false, pause: true });
      emit("pause");
      return true;
    }

    function setPlaybackRate(rate) {
      var nextRate = Math.min(4, Math.max(0.1, Number(rate) || 1));
      if (playing) {
        var wallTime = now();
        currentTime = clampTime(
          anchorTime + ((wallTime - anchorWallTime) / 1000) * playbackRate,
          getDuration(),
        );
        anchorTime = currentTime;
        anchorWallTime = wallTime;
      }
      playbackRate = nextRate;
      followers.forEach(function (follower) {
        callFollower(follower, "setPlaybackRate", [playbackRate]);
      });
      emit("rate", { playbackRate: playbackRate });
      return playbackRate;
    }

    function addFollower(follower) {
      if (!follower || typeof follower !== "object")
        throw new TypeError("Follower must be an object");
      followers.add(follower);
      callFollower(follower, "seek", [currentTime]);
      callFollower(follower, "setPlaybackRate", [playbackRate]);
      if (playing && followerActive(follower, currentTime))
        callFollower(follower, "play", [currentTime]);
      return function removeFollower() {
        callFollower(follower, "pause", [currentTime]);
        followers.delete(follower);
      };
    }

    function subscribe(listener) {
      if (typeof listener !== "function") throw new TypeError("Listener must be a function");
      listeners.add(listener);
      return function unsubscribe() {
        listeners.delete(listener);
      };
    }

    function destroy() {
      if (destroyed) return;
      if (frameHandle !== null) cancelFrame(frameHandle);
      frameHandle = null;
      playing = false;
      followers.forEach(function (follower) {
        callFollower(follower, "pause", [currentTime]);
        callFollower(follower, "destroy", []);
      });
      followers.clear();
      listeners.clear();
      destroyed = true;
    }

    return {
      addFollower: addFollower,
      destroy: destroy,
      getCurrentTime: function () {
        return currentTime;
      },
      getDuration: function () {
        return Math.max(0, Number(getDuration()) || 0);
      },
      getPlaybackRate: function () {
        return playbackRate;
      },
      isPlaying: function () {
        return playing;
      },
      pause: pause,
      play: play,
      seek: seek,
      setLoop: function (value) {
        loop = Boolean(value);
      },
      setPlaybackRate: setPlaybackRate,
      subscribe: subscribe,
      syncFollowers: function () {
        syncFollowers(currentTime, true);
      },
      toggle: function () {
        return playing ? pause() : play();
      },
    };
  }

  return {
    clampTime: clampTime,
    createMediaFollower: createMediaFollower,
    createPlaybackEngine: createPlaybackEngine,
  };
});
