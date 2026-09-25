# Design

## Source of truth
- **Status:** Active
- **Date:** 2026-09-25
- **Product surfaces:** MathCA Video Studio Pro local desktop editor, JSON import, editable Preview, Inspector, Media Library, CapCut-style Timeline, audio mix, and MP4 render.
- **Evidence reviewed:** `README.md`, `public/index.html`, `public/css/studio.css`, `public/js/app.js`, `public/js/premium-ui.js`, `public/js/composition-generator.js`, `MathCA_Studio_UIUX_Redesign/reference/source_original.png`, `tests/artifacts/premium-1366x768.png`, `tests/artifacts/premium-1440x900.png`, `tests/artifacts/premium-1920x1080.png`, `tests/artifacts/e2e-media-layers.png`, and the real grade-3 import fixture.
- **Contract:** This file governs the production Studio. The earlier `MathCA_Studio_UIUX_Redesign/` prototype remains reference material only.

## Brand
- **Personality:** energetic, educational, precise, professional, and friendly to Vietnamese content operators.
- **Trust signals:** engine state, autosave state, durable asset paths, visible layer order, synchronized playback, truthful render progress, and cancellable jobs.
- **Core colors:** MathCA Teal `#12ABA0`, Teal Dark `#006A63`, Coral `#FF5239`, Yellow `#FFBD05`, on near-black navy editor surfaces.
- **Avoid:** generic purple SaaS styling, decorative glass that harms readability, emoji as structural controls, and visual effects that compete with the video canvas.

## Product goals
- Preserve all original JSON, scene, template-preview, voiceover, export, and render workflows.
- Make every editable visual object explicit as a Timeline layer.
- Let operators zoom, pan, scroll, reorder layers, and add durable local media without leaving the editing flow.
- Make BGM/SFX selection and preview predictable and render-identical.
- **Non-goals:** replacing HyperFrames, silently rewriting imported `html_template`, or becoming a general-purpose desktop NLE.
- **Success signals:** imported templates remain byte-preserved in project data, Voiceover is ready after import, upper Timeline rows render above lower rows, media paths remain durable, and 1366px desktop layouts have no horizontal overflow.

## Personas and jobs
- **Primary:** MathCA content producer creating and revising short educational videos from JSON.
- **Secondary:** designer/editor tuning composition, layer order, timing, voice, BGM, SFX, images, and video overlays.
- **Reviewer/operator:** loads a project, checks Preview/audio, makes small corrections, and exports MP4.
- **Context:** desktop-first production, dense timelines, repeated imports, and frequent switching between canvas, timeline, and Inspector.

## Information architecture
- **Topbar:** project open/save/export, undo/redo, engine/save status, and one Coral Render CTA.
- **Left rail:** Script, JSON, Settings, Audio, and Media entry points.
- **Scene panel:** ordered scene list with timing, narration, selection, and scene creation.
- **Workspace:** object tools, Preview zoom controls, scrollable viewport, editable iframe/canvas, and fit-to-view action.
- **Inspector:** Properties, Effects, and Audio tabs with an internally scrolling content region.
- **Timeline:** shared ruler/playhead; fixed Scene, Voiceover, BGM, SFX tracks; one dynamic row per active-scene object.
- **Libraries/modals:** unified Image, Audio, and Video Library plus render configuration/progress.

## Design principles
1. **Preserve first:** imported schema and unknown fields survive unless the user deliberately edits them.
2. **Canvas first:** editor chrome supports the output without hiding or visually competing with it.
3. **One timing source:** Preview, playhead, Voiceover, BGM, SFX, and render derive from canonical project time.
4. **Layer order is visible:** upper object rows map to higher visual `z-index`.
5. **Direct manipulation plus numeric fallback:** drag/resize/reorder are paired with Inspector controls.
6. **Durable media:** persisted JSON stores managed asset IDs or relative paths, never runtime `blob:` URLs.
7. **Reversible operations:** object/timing/audio changes participate in undo/redo and autosave feedback.

## Visual language
- **Color:** navy/near-black production shell, Teal for focus/selection, Coral for render/destructive emphasis, Yellow for learning highlights.
- **Typography:** compact dense editor typography matching the established Studio; video content owns expressive large type.
- **Spacing:** 4/8px rhythm with 8-12px panel padding and compact 29px Timeline rows.
- **Shape/elevation:** 7-12px radii, subtle borders, restrained shadows, stronger framing only around Preview and modals.
- **Motion:** 150-220ms UI transitions; playback and progress communicate state; reduced motion is respected.
- **Iconography:** one SVG control language; media thumbnails carry the visual identity.

## Components
- **Core:** PremiumTopbar, ToolRail, ScenePanel, WorkspaceToolbar, PreviewViewport, InspectorTabs, Timeline, RenderModal.
- **New/extended:** PreviewZoomControls, CanvasPanSurface, DynamicLayerRow, MediaLibraryDialog, MediaAssetCard, VideoElementRenderer, BgmClip, SfxClip.
- **States:** default, hover, active, focus-visible, disabled, loading, empty, error, success, drag-over, selected, rendering.
- **Token ownership:** production tokens remain in `public/css/studio.css`; do not introduce a parallel design system.

## Accessibility
- Target WCAG 2.2 AA for Studio chrome.
- Native buttons/inputs are used; focus state must remain visible.
- Keyboard shortcuts remain available for playback, save, undo/redo, and deletion.
- Preview zoom supports buttons, slider, Fit, and Ctrl/Cmd + wheel.
- Dragging media/layers has button or Inspector alternatives where applicable.
- The imported fixture currently contains pre-existing contrast failures inside its original `html_template`; Studio preserves that source instead of silently recoloring user content.

## Responsive behavior
- Primary targets: 1366x768, 1440x900, and 1920x1080.
- The center workspace keeps a minimum usable width while side panels remain visible.
- Preview becomes scrollable at high zoom rather than forcing global page overflow.
- Timeline keeps a fixed viewport and scrolls vertically when dynamic object rows exceed available height.
- Inspector tab/header remain fixed while its active body scrolls.
- Mobile editing remains out of scope.

## Interaction states
- **Loading:** audio/render controls disable and show current stage.
- **Empty:** no media or no object layers presents a clear drop/add prompt.
- **Drag-over:** Timeline rows and media drop zones show a Teal target state.
- **Error:** malformed JSON, upload failure, TTS failure, and render failure surface actionable messages.
- **Success:** import, autosave, media insertion, audio generation, and render completion give concise feedback.
- **Offline/slow:** local media/render remains available after runtime setup; TTS failure exposes retry instead of corrupting project JSON.

## Content voice
- Vietnamese labels are concise and action-first: “Mở JSON”, “Thêm vào dự án”, “Chèn tại playhead”, “Vừa khung”, “Render video MP4”.
- Status copy states the result and current readiness.
- Technical details such as stereo 48 kHz stay secondary to user actions.

## Implementation constraints
- Keep `public/js/composition-generator.js` as the shared browser/server composition generator.
- `scene.elements.at(-1)` is the top visual layer; Timeline displays scene elements in reverse order so the upper row is the top layer.
- Do not add `metadata.audioFile`; generated Voiceover/master files are runtime state.
- Serialize the optional `audio` block only after audio changes.
- Preserve unknown JSON fields and `html_template` source content.
- Persist media as project-relative paths/managed IDs; revoke runtime object URLs.
- Rendering remains deterministic and uses local pinned HyperFrames/FFmpeg binaries.
- Required verification: `npm run check`, import E2E, redesign E2E, media/layer E2E, and a real audio/video render.

## Open questions
- [ ] **Waveform peaks** — owner: engineering — decide whether real waveform analysis should replace the current track treatment.
- [ ] **Cross-scene media clips** — owner: product — define whether an image/video layer may span several scenes.
- [ ] **Asset deletion** — owner: engineering — define safe cleanup when a managed media asset is no longer referenced.
- [ ] **Template contrast editing** — owner: product/design — decide whether future versions may offer an opt-in accessibility fixer without changing imported source silently.
