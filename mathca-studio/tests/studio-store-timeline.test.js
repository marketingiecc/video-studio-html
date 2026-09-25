const assert = require("node:assert/strict");
const test = require("node:test");
const { createStudioStore } = require("../public/js/studio-store");
const {
  calculateRulerTicks,
  deriveTimelineTracks,
  duplicateSfx,
  moveBgmRegion,
  moveSfxClip,
  nudgeSfxClip,
  splitScene,
  trimBgmRegion,
} = require("../public/js/timeline");

function makeProject() {
  return {
    metadata: { title: "Original", duration: 10 },
    customRoot: { preserve: true },
    scenes: [
      {
        id: "scene-a",
        name: "A",
        startTime: 0,
        endTime: 5,
        voiceText: "Voice A",
        unknown: "keep",
        elements: [
          {
            id: "title",
            name: "Title",
            type: "text",
            text: "A",
            animation: { delay: 0.2, duration: 0.5, loop: "none" },
          },
        ],
      },
      { id: "scene-b", name: "B", startTime: 5, endTime: 10, voiceText: "", elements: [] },
    ],
    audio: {
      bgm: {
        enabled: false,
        src: "",
        volume: 0.3,
        startTime: 0,
        endTime: 10,
        loop: true,
        fadeIn: 0.8,
        fadeOut: 1.2,
      },
      sfxMasterVolume: 0.5,
      sfx: [
        {
          id: "pop",
          src: "preset:pop",
          name: "Pop",
          startTime: 9.5,
          duration: 0.5,
          volume: 0.42,
          pan: 0,
        },
      ],
    },
    html_template: "<html>keep</html>",
  };
}

test("studio store centralizes selection, canonical time and dirty state", () => {
  const source = makeProject();
  const store = createStudioStore(source);
  const events = [];
  const unsubscribe = store.subscribe((_state, event) => events.push(event.type));

  assert.equal(store.getState().selection.sceneId, "scene-a");
  assert.equal(store.seek(99), 10);
  assert.equal(store.setPlaying(true), true);
  store.updateProject("rename", (project) => {
    project.metadata.title = "Changed";
  });

  assert.equal(store.getState().project.metadata.title, "Changed");
  assert.equal(store.getState().dirty, true);
  assert.equal(store.getState().save.status, "dirty");
  assert.equal(store.canUndo(), true);
  assert.ok(events.includes("playback:seek"));
  assert.ok(events.includes("commit"));

  assert.equal(store.undo(), true);
  assert.equal(store.getState().project.metadata.title, "Original");
  assert.equal(store.redo(), true);
  assert.equal(store.getState().project.metadata.title, "Changed");
  unsubscribe();
  store.destroy();
});

test("studio store caps history at 60 commands and serializes saved project", () => {
  const store = createStudioStore(makeProject());
  for (let index = 1; index <= 61; index += 1) {
    store.updateProject(`title-${index}`, (project) => {
      project.metadata.title = String(index);
    });
  }
  assert.deepEqual(store.getHistoryState(), { undo: 60, redo: 0, limit: 60 });

  let undoCount = 0;
  while (store.undo()) undoCount += 1;
  assert.equal(undoCount, 60);
  assert.equal(store.getState().project.metadata.title, "1");

  const saved = store.markSaved(undefined, "2026-09-25T00:00:00.000Z");
  assert.equal(store.getState().dirty, false);
  assert.equal(store.getState().save.lastSavedAt, "2026-09-25T00:00:00.000Z");
  assert.equal(saved.customRoot.preserve, true);
  assert.equal(saved.html_template, "<html>keep</html>");
});

test("timeline derives all five tracks from canonical project fields", () => {
  const timeline = deriveTimelineTracks(makeProject());
  assert.deepEqual(timeline.order, ["scenes", "voiceover", "bgm", "sfx", "elements"]);
  assert.equal(timeline.duration, 10);
  assert.equal(timeline.tracks.scenes.length, 2);
  assert.equal(timeline.tracks.voiceover.length, 1);
  assert.equal(timeline.tracks.bgm.length, 1);
  assert.equal(timeline.tracks.bgm[0].enabled, false);
  assert.equal(timeline.tracks.sfx.length, 1);
  assert.equal(timeline.tracks.elements[0].startTime, 0.2);
  assert.equal(timeline.tracks.elements[0].endTime, 0.7);
});

test("timeline audio edits clamp to project duration and do not mutate input", () => {
  const source = makeProject();
  const moved = moveSfxClip(source, "pop", 99);
  const nudged = nudgeSfxClip(moved, "pop", -0.1);
  const duplicate = duplicateSfx(nudged, "pop", { id: "pop-copy", offset: 0.4 });
  const movedBgm = moveBgmRegion(duplicate, 5);
  const trimmedBgm = trimBgmRegion(movedBgm, "start", 9.95, 0.1);

  assert.equal(source.audio.sfx.length, 1);
  assert.equal(moved.audio.sfx[0].startTime, 9.5);
  assert.equal(nudged.audio.sfx[0].startTime, 9.4);
  assert.equal(duplicate.audio.sfx.length, 2);
  assert.equal(duplicate.audio.sfx[1].startTime, 9.5);
  assert.equal(movedBgm.audio.bgm.startTime, 0);
  assert.equal(trimmedBgm.audio.bgm.startTime, 9.9);
  assert.equal(trimmedBgm.audio.bgm.endTime, 10);
});

test("scene split preserves canonical keys and unknown project data", () => {
  const source = makeProject();
  const split = splitScene(source, "scene-a", 2.5, { id: "scene-a-part-2" });

  assert.equal(source.scenes.length, 2);
  assert.equal(split.scenes.length, 3);
  assert.equal(split.scenes[0].endTime, 2.5);
  assert.equal(split.scenes[1].startTime, 2.5);
  assert.equal(split.scenes[1].voiceText, "Voice A");
  assert.equal(split.scenes[1].unknown, "keep");
  assert.equal(split.customRoot.preserve, true);
  assert.equal(split.html_template, "<html>keep</html>");
});

test("ruler tick generation includes zero and exact duration", () => {
  const ticks = calculateRulerTicks(29.5, 7);
  assert.equal(ticks[0].time, 0);
  assert.equal(ticks.at(-1).time, 29.5);
  assert.equal(ticks.at(-1).percent, 100);
});
