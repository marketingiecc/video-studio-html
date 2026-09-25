# E2E Test Report — MathCA Studio Premium Prototype

## Summary
- **Date:** September 25, 2026
- **Source JSON:** `C:\Users\lexua\Downloads\MathCA_Lop3_5PhepTinhNangCao.json`
- **Result:** **45/45 passed**, 0 failed.
- **Browser:** Google Chrome headless, viewport 1366x768.
- **Runtime exceptions:** 0.
- **Console errors:** 0.
- **Visual evidence:** `reference/e2e_json_loaded.png`.
- **Machine-readable result:** `docs/E2E_TEST_RESULT.json`.

## Coverage
1. Load baseline prototype and verify default state.
2. Import legacy JSON with 8 scenes and no `audio` block.
3. Map `name/startTime/endTime/voiceText` into the UI without replacing the original schema.
4. Scene selection, Inspector synchronization, property edit, Undo and Redo.
5. Effects tab and property selection.
6. Timeline zoom, seek, split, duplicate, add, delete and Undo.
7. Legacy audio defaults: BGM OFF and empty SFX list.
8. Audio library search/empty state and BGM selection.
9. BGM volume, Undo/Redo, fade, loop, ducking and trim handle.
10. SFX preset insertion, nudge, volume, pan, drag, duplicate and delete.
11. Upload BGM/SFX using generated stereo 48kHz WAV files.
12. Space-key playback and playhead/timecode synchronization.
13. Render preset/settings, progress, cancel and success state.
14. Project JSON download and schema round-trip inspection.
15. HTML export and file-size validation.
16. Runtime exception and console error monitoring.

## Compatibility fixes applied
- Added a legacy-scene adapter for `name`, `startTime`, `endTime` and `voiceText`.
- UI aliases are non-enumerable, so exported scenes preserve the original keys instead of writing parallel `title/start/end/voiceover` fields.
- Projects without `audio` now hydrate to BGM OFF, SFX master 0.5 and an empty SFX list.
- Canvas preview now derives badge/title/equation/tip content from each legacy scene's `elements`.
- Timeline scene count updates from the imported project instead of remaining hardcoded.

## Results
| Status | Check | Evidence |
|---|---|---|
| PASS | Baseline prototype loads | {"scenes":6,"sfx":5,"bgmOff":true} |
| PASS | Legacy JSON import completes |  |
| PASS | Metadata and 8 scenes mapped | {"title":"5 phút luyện tập toán lớp 3 với 5 phép tính nâng cao","cards":8,"first":"Hồi 1 - Hook bùng nổ","firstTime":"00:00.0 – 00:04.2","bgmOff":true,"sfx":0,"nan":false,"sceneCount":"(8 cảnh)"} |
| PASS | Missing audio hydrates safely | bgmOff=true, sfx=0 |
| PASS | Timeline has finite layout |  |
| PASS | Scene selection syncs Inspector | {"name":"Câu 1","start":"4.2","end":"7.0","voice":"Câu một: 48 nhân 2 bằng bao nhiêu? Nhẩm nhanh!"} |
| PASS | Property edit updates scene card |  |
| PASS | Undo restores property |  |
| PASS | Redo reapplies property |  |
| PASS | Effects inspector opens and edits |  |
| PASS | Timeline zoom expands content | 1134 -> 1588 |
| PASS | Timeline click seeks playhead | 00:14.2 / 00:29.5 |
| PASS | Split scene at playhead | 8 -> 9 |
| PASS | Undo split |  |
| PASS | Duplicate scene | 8 -> 9 |
| PASS | Add scene | 8 -> 9 |
| PASS | Delete scene with confirmation | 8 -> 7 |
| PASS | Audio inspector opens with legacy defaults | {"visible":true,"bgmOff":true,"sfx":0} |
| PASS | Audio library empty state |  |
| PASS | Choose BGM from library | {"modalClosed":true,"enabled":true,"name":"Happy Kids 01","bgmClip":true} |
| PASS | BGM volume updates |  |
| PASS | Undo BGM volume |  |
| PASS | Redo BGM volume |  |
| PASS | BGM fade inputs update |  |
| PASS | Loop and ducking toggles |  |
| PASS | BGM trim handle changes start time | 0 -> 3.1 |
| PASS | Insert preset SFX at playhead | count=1 |
| PASS | Nudge selected SFX | 47.4576% -> 47.7966% |
| PASS | Per-clip volume and pan update |  |
| PASS | Drag SFX clip on timeline | 47.7966% -> 56.615% |
| PASS | Duplicate selected SFX | 1 -> 2 |
| PASS | Delete selected SFX | 2 -> 1 |
| PASS | Upload BGM WAV |  |
| PASS | Upload custom SFX WAV |  |
| PASS | Space toggles timeline playback | 00:14.4 / 00:29.5 |
| PASS | Render preset/settings update |  |
| PASS | Render progress starts |  |
| PASS | Render cancel state |  |
| PASS | Render reaches success |  |
| PASS | Save project downloads JSON | C:\Users\lexua\AppData\Local\Temp\mathca-full-e2e-1790298830814\downloads\mathca_project_with_audio.json |
| PASS | Saved JSON preserves original scene schema | id, name, startTime, endTime, voiceText, elements |
| PASS | Saved JSON contains audio extension | sfx=3 |
| PASS | Export HTML downloads file | 96857 |
| PASS | No runtime exceptions |  |
| PASS | No console errors |  |

## Output validation
- Saved JSON preserved first-scene keys: `id, name, startTime, endTime, voiceText, elements`.
- Saved JSON included the optional `audio` extension after BGM/SFX editing.
- Exported prototype HTML size: 96,857 bytes during the final run.
- No serious console error or unhandled runtime exception occurred.

## Scope boundary
The prototype's Render action intentionally simulates validation, audio-plan generation and encode progress. This E2E run validates the complete prototype interaction/state/serialization flow, but it does **not** claim that the production HyperFrames/FFmpeg pipeline generated a real MP4. Production render integration remains an implementation task described in `PROMPT_AGENT_REDESIGN.md`.
