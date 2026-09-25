const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const moduleFiles = [
  "project-model.js",
  "studio-store.js",
  "audio-plan.js",
  "playback-engine.js",
  "timeline.js",
  "audio-preview.js",
];

test("frontend modules expose browser UMD globals without CommonJS", () => {
  const context = vm.createContext({
    clearTimeout,
    console,
    Date,
    Map,
    Math,
    Object,
    Promise,
    Set,
    setTimeout,
    structuredClone,
  });
  context.globalThis = context;

  moduleFiles.forEach((filename) => {
    const source = fs.readFileSync(path.join(__dirname, "..", "public", "js", filename), "utf8");
    vm.runInContext(source, context, { filename });
  });

  assert.equal(typeof context.MathCAProjectModel.normalizeProjectForRuntime, "function");
  assert.equal(typeof context.MathCAStudioStore.createStudioStore, "function");
  assert.equal(typeof context.MathCAAudioPlan.createAudioPlan, "function");
  assert.equal(typeof context.MathCAPlaybackEngine.createPlaybackEngine, "function");
  assert.equal(typeof context.MathCATimeline.deriveTimelineTracks, "function");
  assert.equal(typeof context.MathCAAudioPreview.createAudioPreviewEngine, "function");

  const store = context.MathCAStudioStore.createStudioStore({
    metadata: { duration: 2 },
    scenes: [
      { id: "scene", name: "Scene", startTime: 0, endTime: 2, voiceText: "Voice", elements: [] },
    ],
  });
  const tracks = context.MathCATimeline.deriveTimelineTracks(store.getState().project);
  const audioPlan = context.MathCAAudioPlan.createAudioPlan(store.getState().project);

  assert.equal(tracks.duration, 2);
  assert.equal(tracks.tracks.scenes.length, 1);
  assert.equal(audioPlan.output.sampleRate, 48000);
  store.destroy();
});
