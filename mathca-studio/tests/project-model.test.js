const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const {
  getProjectDuration,
  hasAudioChanges,
  normalizeAudioBlock,
  normalizeProjectForRuntime,
  serializeProject,
} = require("../public/js/project-model");

const fixturePath = path.join(__dirname, "fixtures", "MathCA_Lop3_5PhepTinhNangCao.json");
const fixture = JSON.parse(fs.readFileSync(fixturePath, "utf8"));

test("runtime normalization hydrates audio without mutating legacy input", () => {
  const input = structuredClone(fixture);
  const before = structuredClone(input);
  const runtime = normalizeProjectForRuntime(input);

  assert.deepEqual(input, before);
  assert.notStrictEqual(runtime, input);
  assert.equal(runtime.audio.bgm.enabled, false);
  assert.equal(runtime.audio.bgm.volume, 0.3);
  assert.equal(runtime.audio.bgm.endTime, 29.5);
  assert.equal(runtime.audio.bgm.ducking.underVoiceDb, -12);
  assert.equal(runtime.audio.sfxMasterVolume, 0.5);
  assert.deepEqual(runtime.audio.sfx, []);
  assert.equal(runtime.scenes[0].startTime, 0);
  assert.equal(runtime.scenes[0].voiceText, fixture.scenes[0].voiceText);
});

test("legacy round trip preserves canonical schema, unknown keys and html template", () => {
  const input = structuredClone(fixture);
  input.unknownRoot = { future: true };
  input.scenes[0].unknownScene = { keep: "yes" };
  input.scenes[0].elements[0].unknownElement = 42;

  const runtime = normalizeProjectForRuntime(input);
  const serialized = serializeProject(runtime, input);

  assert.deepEqual(serialized, input);
  assert.equal(serialized.audio, undefined);
  assert.equal(serialized.scenes[0].start, undefined);
  assert.equal(serialized.scenes[0].voiceover, undefined);
  assert.equal(serialized.html_template, input.html_template);
});

test("audio changes serialize the optional block while source snapshot stays unchanged", () => {
  const source = structuredClone(fixture);
  const runtime = normalizeProjectForRuntime(source);
  runtime.audio.bgm.enabled = true;
  runtime.audio.bgm.src = "assets/bgm/math.mp3";
  runtime.audio.bgm.assetId = "bgm-math";

  const serialized = serializeProject(runtime, source);

  assert.equal(serialized.audio.bgm.enabled, true);
  assert.equal(serialized.audio.bgm.src, "assets/bgm/math.mp3");
  assert.equal(serialized.audio.bgm.assetId, "bgm-math");
  assert.equal(source.audio, undefined);
  assert.equal(hasAudioChanges(runtime, source), true);
});

test("audio normalization preserves unknown fields and clamps unsafe values", () => {
  const normalized = normalizeAudioBlock(
    {
      futureAudioField: "keep",
      bgm: {
        enabled: 1,
        src: "assets/bgm/test.mp3",
        volume: 3,
        startTime: -4,
        endTime: 99,
        fadeIn: 80,
        fadeOut: -2,
        futureBgmField: true,
        ducking: { enabled: true, underVoiceDb: -99, attack: -1, release: 0.5, future: 1 },
      },
      sfxMasterVolume: -1,
      sfx: [{ startTime: 9.5, duration: 10, volume: 2, pan: -4, custom: "keep" }],
    },
    10,
  );

  assert.equal(normalized.futureAudioField, "keep");
  assert.equal(normalized.bgm.futureBgmField, true);
  assert.equal(normalized.bgm.volume, 1);
  assert.equal(normalized.bgm.startTime, 0);
  assert.equal(normalized.bgm.endTime, 10);
  assert.equal(normalized.bgm.fadeIn, 10);
  assert.equal(normalized.bgm.fadeOut, 0);
  assert.equal(normalized.bgm.ducking.underVoiceDb, -60);
  assert.equal(normalized.bgm.ducking.attack, 0);
  assert.equal(normalized.bgm.ducking.future, 1);
  assert.equal(normalized.sfxMasterVolume, 0);
  assert.equal(normalized.sfx[0].duration, 0.5);
  assert.equal(normalized.sfx[0].volume, 1);
  assert.equal(normalized.sfx[0].pan, -1);
  assert.equal(normalized.sfx[0].custom, "keep");
});

test("duration falls back to the latest canonical scene end", () => {
  const project = {
    metadata: {},
    scenes: [
      { id: "a", startTime: 0, endTime: 2, voiceText: "", elements: [] },
      { id: "b", startTime: 2, endTime: 7.25, voiceText: "", elements: [] },
    ],
  };
  assert.equal(getProjectDuration(project), 7.25);
  assert.equal(normalizeProjectForRuntime(project).metadata.duration, 7.25);
});
test("prototype timing aliases are read but serialized as canonical keys only", () => {
  const source = {
    metadata: { duration: 4 },
    futureRoot: true,
    scenes: [
      {
        id: "legacy-alias",
        title: "Alias title",
        start: 1,
        end: 4,
        voiceover: "Alias voice",
        futureScene: { keep: true },
        elements: [],
      },
    ],
  };
  const runtime = normalizeProjectForRuntime(source);
  runtime.scenes[0] = {
    id: runtime.scenes[0].id,
    name: runtime.scenes[0].name,
    startTime: runtime.scenes[0].startTime,
    endTime: runtime.scenes[0].endTime,
    voiceText: runtime.scenes[0].voiceText,
    elements: [],
  };
  const serialized = serializeProject(runtime, source);

  assert.equal(serialized.scenes[0].startTime, 1);
  assert.equal(serialized.scenes[0].endTime, 4);
  assert.equal(serialized.scenes[0].voiceText, "Alias voice");
  assert.equal(serialized.scenes[0].start, undefined);
  assert.equal(serialized.scenes[0].end, undefined);
  assert.equal(serialized.scenes[0].voiceover, undefined);
  assert.deepEqual(serialized.scenes[0].futureScene, { keep: true });
  assert.equal(serialized.futureRoot, true);
});
