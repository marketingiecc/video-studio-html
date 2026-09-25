# UI/UX Audit — Original vs Premium Redesign

## Evidence
- Before: `reference/source_original.png`.
- After: `index.html` and three images in `images/`.
- Primary target: desktop 1366x768 and larger.

## Before — key issues
1. **Topbar hierarchy:** many actions shared the same visual weight; Render competed with file actions.
2. **Navigation coupling:** script navigation and project controls were mixed, slowing orientation.
3. **Canvas emphasis:** similar panel contrast made the central 9:16 output less dominant.
4. **Inspector density:** long controls lacked top-level grouping and audio context.
5. **Timeline model:** the bottom scrubber did not clearly expose independent Voice/BGM/SFX timing.
6. **Audio discoverability:** voice generation existed, but BGM/SFX insertion and levels were not part of one obvious workflow.
7. **State feedback:** save, autosave, render progress, cancellation, empty states, and errors were inconsistent.
8. **Icon consistency:** mixed emoji/system glyphs reduced visual control and cross-platform consistency.

## After — design decisions
- **Topbar:** project actions are compact; engine/save state is visible; Coral is reserved for Render.
- **Navigation:** a stable left rail separates Script, Library, Audio, Effects, Text, Brand, Settings, Help.
- **Scene panel:** thumbnails, ordinal, time range, title, subtitle, active state, and Add Scene are scannable.
- **Workspace:** dark stage frames the bright 9:16 canvas; select/hand/undo/redo/fullscreen sit in one vertical tool group.
- **Inspector:** Properties, Effects, Audio tabs apply progressive disclosure.
- **Timeline:** five labeled tracks share a single ruler and playhead; icons and labels supplement color.
- **Audio flow:** users can select/upload BGM, set fades/loop/ducking, insert SFX at playhead, drag clips, and tune per-clip gain/pan.
- **Render flow:** preset selection, audio-plan summary, staged progress, cancel, completion feedback.
- **Accessibility:** native controls, SVG icons, visible focus, keyboard shortcuts, reduced motion, and non-drag alternatives.

## Component map
| Legacy surface | Premium component | Improvement |
|---|---|---|
| Header toolbar | Topbar | Action hierarchy + engine/save state |
| Script tab | Left rail + ScenePanel | Stable navigation + better scene scanning |
| Main preview | CanvasViewport | Stronger focal point and safe-area framing |
| Object properties | Tabbed Inspector | Lower cognitive load |
| Bottom playback bar | Multi-track Timeline | Timing and audio become explicit |
| Audio generation controls | AudioInspector + Library | Full BGM/SFX lifecycle |
| Direct render button | RenderModal | Prevents blind exports |

## Interaction audit
- **Playhead sync:** click-to-seek and playback update the same state.
- **Reversibility:** property/timeline actions have undo/redo; deletion confirms.
- **Feedback:** toasts are short and nonblocking; async render shows stage and percentage.
- **Defaults:** old projects hydrate audio safely with BGM OFF.
- **Keyboard:** core production actions work without a pointer.
- **Drag alternative:** BGM timing fields and SFX nudge buttons avoid drag-only operation.

## Remaining production risks
- Uploaded object URLs are session-only in the prototype; production needs durable asset management.
- Library previews are synthesized placeholders until licensed audio assets are connected.
- Timeline waveform is decorative until real peak data is available.
- Render progress is simulated; engine integration must report truthful cancellable stages.
- A full accessibility pass must include screen readers, focus trapping, contrast measurement, and high-zoom testing in the production shell.

## Outcome
The redesign keeps the familiar MathCA workflow but turns audio into a first-class editing surface. The visual hierarchy is quieter, the canvas is dominant, and preview/render state is more trustworthy without changing the existing scene contract.
