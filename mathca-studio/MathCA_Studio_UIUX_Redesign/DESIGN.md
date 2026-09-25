# Design

## Source of truth
- **Status:** Active
- **Date:** 2026-09-25
- **Product surfaces:** MathCA Video Studio Pro desktop editor, audio library, timeline, inspector, preview, and MP4 export.
- **Evidence reviewed:** `reference/source_original.png`, three mockups in `images/`, the prior `index.html`, `PROMPT_AGENT_REDESIGN.md`, feature/audit documents, the sample project JSON, and the user-provided implementation brief.
- **Prototype contract:** `index.html` is the approved interaction prototype. The images are presentation references, not an independent component system.

## Brand
- **Personality:** confident, energetic, educational, technically capable, friendly to Vietnamese teachers and content operators.
- **Trust signals:** visible engine status, explicit save state, predictable timeline behavior, clear audio levels, progress and cancel states for rendering.
- **Core colors:** MathCA Teal `#12ABA0`, Teal Dark `#006A63`, Coral `#FF5239`, Yellow `#FFBD05`.
- **Avoid:** excessive neon borders, generic purple SaaS styling, emoji as structural icons, decorative glass that reduces contrast, and playful styling that makes professional editing controls feel toy-like.

## Product goals
- Preserve the workflow: Script -> 9:16 Canvas -> Inspector -> Timeline -> Preview -> Render MP4.
- Make scene, voice, BGM, SFX, and element timing understandable at a glance.
- Add backward-compatible audio without changing existing scene/element/animation contracts.
- Optimize daily production at desktop widths from 1366x768 upward.
- **Non-goals:** replacing HyperFrames, redesigning the MathCA content language, or implementing a full non-linear editing engine in this prototype.
- **Success signals:** fewer navigation errors, faster audio insertion, readable hierarchy at 1366x768, old JSON opens with BGM off, and render configuration is understandable before execution.

## Personas and jobs
- **Primary:** MathCA content producer who converts scripts into short educational videos and needs fast repeatable controls.
- **Secondary:** designer/editor who tunes layout, animation, voice, BGM, and SFX while protecting brand consistency.
- **Reviewer/operator:** opens a project, previews timing/audio, fixes obvious issues, and exports MP4.
- **Context:** desktop production, often dense projects, repeated keyboard use, and frequent switching between scene metadata and timeline timing.

## Information architecture
- **Topbar:** project I/O, preview, engine state, save state, and the single Coral Render CTA.
- **Left rail:** Script, Library, Audio, Effects, Text, Brand, Settings, Help.
- **Scene panel:** ordered scene list, time ranges, titles, descriptions, add/select state.
- **Workspace:** canvas tools, 9:16 canvas, zoom and navigation tools.
- **Inspector:** Properties, Effects, Audio tabs; selection-sensitive forms.
- **Timeline:** Scene, Voiceover, BGM, SFX, Elements tracks with one shared ruler/playhead.
- **Modals:** Audio Library and Export MP4.

## Design principles
1. **Canvas first:** chrome supports the video; it never competes with it.
2. **One source of timing truth:** timeline position, inspector values, preview, and audio playback reflect the same state.
3. **Color plus semantics:** every track uses icon, label, position, and color; color is never the only distinction.
4. **Progressive detail:** common actions stay visible; advanced audio parameters live in the Audio inspector.
5. **Safe compatibility:** missing optional audio data resolves to BGM OFF and valid defaults.
6. **Reversible editing:** property/timeline changes participate in undo/redo and dirty-state feedback.

## Visual language
- **Color:** near-black blue backgrounds, layered navy surfaces, low-contrast default borders, Teal only for selection/focus, Coral only for Render/destructive emphasis, Yellow for highlights and learning energy.
- **Typography:** Inter, compact UI scale 8-13px for dense editor chrome; large type is reserved for the video canvas.
- **Spacing:** 4/8px rhythm with 10-12px panel padding; primary controls have at least 36px hit areas.
- **Shape/elevation:** 7-12px radii, borders over heavy shadows, one strong shadow only for canvas/modals.
- **Motion:** 150-220ms UI transitions; progress and playback convey system state. Respect `prefers-reduced-motion`.
- **Imagery/iconography:** MathCA artwork remains bright and educational. Structural controls use one outline SVG icon family, never emoji.

## Components
- **Existing mapped components:** legacy top controls -> Topbar; scene cards -> ScenePanel; canvas controls -> WorkspaceToolbar; object properties -> Inspector; bottom scrubber -> multi-track Timeline.
- **New components:** AudioInspector, AudioLibraryModal, BgmTimelineClip, SfxTimelineClip, RenderModal, SaveStateIndicator, ToastRegion, TrackLabel, and RenderProgressSteps.
- **Variants/states:** default, hover, active/selected, focus-visible, disabled, loading, empty, error, success.
- **Token ownership:** prototype tokens live in `index.html`; production should map them into the existing app theme rather than create a parallel token system.

## Accessibility
- Target WCAG 2.2 AA for the production implementation.
- Native buttons/inputs are used for operable controls; icon-only controls have accessible names and tooltips.
- Focus indicators use a visible 2px Teal ring and must remain unobscured by timeline or modal chrome.
- Keyboard: Space play/pause, Ctrl/Cmd+S save, Ctrl/Cmd+Z undo, Ctrl/Cmd+Shift+Z or Ctrl/Cmd+Y redo, Delete removes selected clip after confirmation where destructive.
- Drag operations have numeric inspector inputs and nudge buttons as alternatives.
- Normal UI text and meaningful icons require adequate contrast; disabled state is not encoded by color alone.
- Reduced-motion users receive final states without nonessential animation.

## Responsive behavior
- Primary target: 1366x768, 1440x900, 1920x1080.
- At narrower desktop widths, secondary topbar labels and noncritical actions collapse before editor regions are removed.
- Scene and Inspector panels narrow, while Canvas keeps a minimum usable center width.
- At shorter heights, timeline and scene card heights compress while retaining all five tracks.
- The deliverable is a desktop editor prototype; mobile editing is explicitly out of scope.

## Interaction states
- **Loading:** render controls disable and progress identifies validation, audio mix, encoding, and completion.
- **Empty:** missing BGM shows an inline timeline prompt; library search has a dedicated empty result state.
- **Error:** malformed JSON and failed browser operations produce nonblocking error toasts.
- **Success:** save, insert, autosave, undo/redo, and render completion produce short status feedback.
- **Disabled:** selection-dependent SFX controls remain visibly disabled until a clip is selected.
- **Offline/slow:** the prototype has no runtime network dependency; production asset loading must expose progress and retry.

## Content voice
- Vietnamese UI copy is concise, action-first, and production-oriented.
- Prefer “Mở JSON”, “Chèn tại playhead”, “Bắt đầu render”, “Đã tự lưu bản nháp”.
- Avoid vague labels such as “OK”, “Xử lý”, or technical FFmpeg jargon in primary UI.
- Technical details such as stereo 48kHz and float32 appear as supporting text, not as the main action label.

## Implementation constraints
- Keep current scene/element/animation keys unchanged; `audio` remains an optional root block.
- Project JSON is the source of truth. Local storage may cache recovery data but must not replace project state.
- Preview may use `HTMLAudioElement`/Web Audio. Production render passes a normalized audio plan to the existing pipeline.
- Mix voice, BGM, and SFX in float32 with explicit gain automation; do not use a naive `amix` path that lowers perceived volume.
- Output audio is stereo 48kHz. BGM ducking defaults to -12 dB under voiceover.
- Production must add unit tests for migration/defaulting, store synchronization, and audio plan generation plus an end-to-end smoke test for render.
- Visual QA baselines: 1366x768 and 1920x1080, with no serious console errors.

## Open questions
- [ ] **Audio asset persistence** — owner: engineering — decide whether uploaded assets are copied into the project folder or referenced by managed asset IDs; impacts portability.
- [ ] **Waveform source** — owner: rendering team — confirm whether waveform peaks come from preload analysis or the render service; impacts timeline performance.
- [ ] **Autosave recovery** — owner: product/engineering — define retention and restore UX for drafts; impacts crash recovery.
- [ ] **Render cancellation boundary** — owner: engine team — confirm which pipeline stages are safely cancellable; impacts truthful progress behavior.
- [ ] **Licensing metadata** — owner: content operations — define license/attribution fields for library BGM/SFX; impacts export compliance.
