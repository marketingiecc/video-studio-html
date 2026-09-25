const assert = require("node:assert/strict");
const test = require("node:test");
const { createPlaybackEngine } = require("../public/js/playback-engine");
const {
  computeBgmMediaTime,
  createAudioPreviewEngine,
  createCleanupBag,
  getBgmPreviewGain,
  shouldTriggerSfx,
} = require("../public/js/audio-preview");

test("canonical playback clock drives followers and corrects drift", () => {
  let wallTime = 0;
  let frameCallback = null;
  const updates = [];
  const followerCalls = [];
  const follower = {
    currentTime: 0,
    getCurrentTime() {
      return this.currentTime;
    },
    seek(time) {
      this.currentTime = time;
      followerCalls.push(["seek", time]);
    },
    play() {
      followerCalls.push(["play"]);
    },
    pause() {
      followerCalls.push(["pause"]);
    },
    setPlaybackRate(rate) {
      followerCalls.push(["rate", rate]);
    },
  };
  const engine = createPlaybackEngine({
    duration: 3,
    now: () => wallTime,
    requestFrame: (callback) => {
      frameCallback = callback;
      return 1;
    },
    cancelFrame: () => {
      frameCallback = null;
    },
    driftCheckInterval: 100,
    onTimeUpdate: (time) => updates.push(time),
  });

  engine.addFollower(follower);
  assert.equal(engine.play(), true);
  wallTime = 1000;
  follower.currentTime = 0;
  const tick = frameCallback;
  tick(wallTime);

  assert.equal(engine.getCurrentTime(), 1);
  assert.equal(updates.at(-1), 1);
  assert.ok(followerCalls.some((call) => call[0] === "seek" && call[1] === 1));

  engine.seek(2.5);
  assert.equal(follower.currentTime, 2.5);
  engine.pause();
  assert.equal(engine.isPlaying(), false);
  engine.destroy();
});

test("playback clock ends exactly at duration", () => {
  let frameCallback;
  const engine = createPlaybackEngine({
    duration: 1,
    now: () => 0,
    requestFrame: (callback) => {
      frameCallback = callback;
      return 1;
    },
  });
  engine.play();
  frameCallback(1500);
  assert.equal(engine.getCurrentTime(), 1);
  assert.equal(engine.isPlaying(), false);
});

test("audio preview helpers handle BGM looping, fades, ducking and SFX crossings", () => {
  const bgm = {
    active: true,
    startTime: 2,
    endTime: 10,
    volume: 0.5,
    loop: true,
    fadeIn: 2,
    fadeOut: 2,
    ducking: {
      enabled: true,
      underVoiceGain: 0.25,
      windows: [{ startTime: 4, endTime: 6 }],
    },
  };
  assert.equal(computeBgmMediaTime(7, bgm, 3), 2);
  assert.equal(computeBgmMediaTime(1, bgm, 3), null);
  assert.equal(getBgmPreviewGain(bgm, 3), 0.25);
  assert.equal(getBgmPreviewGain(bgm, 5), 0.125);
  assert.equal(shouldTriggerSfx({ startTime: 2, endTime: 3 }, 1.9, 2.1, false), true);
  assert.equal(shouldTriggerSfx({ startTime: 2, endTime: 3 }, 1.9, 3.1, false), false);
  assert.equal(shouldTriggerSfx({ startTime: 2, endTime: 3 }, 0, 2.5, true), true);
});

test("cleanup bag revokes URLs, disconnects nodes and removes listeners once", () => {
  const revoked = [];
  let removed = 0;
  let disconnected = 0;
  const target = {
    addEventListener() {},
    removeEventListener() {
      removed += 1;
    },
  };
  const node = {
    stop() {},
    disconnect() {
      disconnected += 1;
    },
  };
  const bag = createCleanupBag({ urlApi: { revokeObjectURL: (url) => revoked.push(url) } });

  bag.listen(target, "ended", () => {});
  bag.trackObjectUrl("blob:test");
  bag.trackNode(node);
  bag.cleanup();
  bag.cleanup();

  assert.deepEqual(revoked, ["blob:test"]);
  assert.equal(removed, 1);
  assert.equal(disconnected, 1);
});

test("audio preview engine synchronizes media and cleans up on destroy", () => {
  function media() {
    return {
      currentTime: 0,
      duration: 4,
      paused: true,
      pauseCalls: 0,
      playCalls: 0,
      loadCalls: 0,
      pause() {
        this.paused = true;
        this.pauseCalls += 1;
      },
      play() {
        this.paused = false;
        this.playCalls += 1;
        return Promise.resolve();
      },
      load() {
        this.loadCalls += 1;
      },
    };
  }
  const voice = media();
  const bgm = media();
  const engine = createAudioPreviewEngine({ voiceElement: voice, bgmElement: bgm });
  engine.setPlan({
    duration: 10,
    voice: { enabled: true, gain: 1 },
    bgm: {
      active: true,
      startTime: 0,
      endTime: 10,
      volume: 0.3,
      loop: true,
      fadeIn: 0,
      fadeOut: 0,
      ducking: { enabled: false, windows: [] },
    },
    sfx: { clips: [] },
  });
  engine.setVoiceSource("voice.mp3");
  engine.setBgmSource("bgm.mp3");
  engine.play(2);

  assert.equal(voice.currentTime, 2);
  assert.equal(bgm.currentTime, 2);
  assert.equal(voice.playCalls, 1);
  assert.equal(bgm.playCalls, 1);

  engine.destroy();
  assert.ok(voice.pauseCalls >= 1);
  assert.ok(bgm.pauseCalls >= 1);
});
