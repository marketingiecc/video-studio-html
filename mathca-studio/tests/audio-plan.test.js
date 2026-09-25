const assert = require("node:assert/strict");
const test = require("node:test");
const {
  createAudioPlan,
  dbToGain,
  equalPowerPan,
  hashAudioPlan,
  resolveAssetReference,
} = require("../public/js/audio-plan");

function makeProject() {
  return {
    metadata: { duration: 10, voice: "vi-VN-HoaiMyNeural" },
    scenes: [
      { id: "one", name: "One", startTime: 0, endTime: 3, voiceText: "Xin chao", elements: [] },
      { id: "gap", name: "Gap", startTime: 3, endTime: 5, voiceText: "", elements: [] },
      { id: "two", name: "Two", startTime: 5, endTime: 9, voiceText: "Hoc toan", elements: [] },
    ],
    audio: {
      bgm: {
        enabled: true,
        src: "assets/bgm/happy.mp3",
        assetId: "bgm-happy",
        volume: 0.3,
        startTime: 0,
        endTime: 10,
        loop: true,
        fadeIn: 0.8,
        fadeOut: 1.2,
        ducking: { enabled: true, underVoiceDb: -12, attack: 0.12, release: 0.35 },
      },
      sfxMasterVolume: 0.5,
      sfx: [
        {
          id: "pop",
          src: "preset:pop",
          name: "Pop",
          startTime: 2,
          duration: 0.8,
          volume: 0.42,
          pan: -0.5,
        },
      ],
    },
  };
}

test("audio plan is deterministic stereo 48kHz and derives voice ducking windows", () => {
  const project = makeProject();
  const first = createAudioPlan(project, { voiceSrc: "assets/voice.mp3", voiceAssetId: "voice-1" });
  const second = createAudioPlan(structuredClone(project), {
    voiceSrc: "assets/voice.mp3",
    voiceAssetId: "voice-1",
  });

  assert.equal(first.output.sampleRate, 48000);
  assert.equal(first.output.channels, 2);
  assert.equal(first.output.channelLayout, "stereo");
  assert.equal(first.voice.segments.length, 2);
  assert.equal(first.bgm.active, true);
  assert.equal(first.bgm.ducking.underVoiceGain, dbToGain(-12));
  assert.deepEqual(first.bgm.ducking.windows, [
    { startTime: 0, endTime: 3.35, duration: 3.35 },
    { startTime: 4.88, endTime: 9.35, duration: 4.47 },
  ]);
  assert.equal(first.hash, second.hash);
  assert.equal(hashAudioPlan(first), first.hash);
});

test("SFX gain combines master and clip volume with equal-power pan", () => {
  const plan = createAudioPlan(makeProject());
  const clip = plan.sfx.clips[0];
  const expectedPan = equalPowerPan(-0.5);

  assert.equal(clip.effectiveGain, 0.21);
  assert.equal(clip.panGains.left, expectedPan.left);
  assert.equal(clip.panGains.right, expectedPan.right);
  assert.ok(clip.panGains.left > clip.panGains.right);
});

test("audio hash changes for meaningful timing or mix edits", () => {
  const base = makeProject();
  const moved = structuredClone(base);
  moved.audio.sfx[0].startTime = 2.1;
  const quieter = structuredClone(base);
  quieter.audio.bgm.volume = 0.2;

  assert.notEqual(createAudioPlan(base).hash, createAudioPlan(moved).hash);
  assert.notEqual(createAudioPlan(base).hash, createAudioPlan(quieter).hash);
});

test("asset references distinguish durable project assets from runtime-only URLs", () => {
  assert.deepEqual(resolveAssetReference("preset:pop"), {
    assetId: null,
    src: "preset:pop",
    kind: "preset",
    durable: true,
  });
  assert.equal(resolveAssetReference("blob:http://localhost/1").durable, false);
  assert.equal(resolveAssetReference("C:\\temp\\sound.wav").kind, "absolute");
  assert.equal(resolveAssetReference("C:\\temp\\sound.wav").durable, false);
  assert.equal(resolveAssetReference("upload:file.wav", "sha256-file").durable, true);
});
