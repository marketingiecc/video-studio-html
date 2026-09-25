# MathCA Video Studio Pro — Premium UI/UX Redesign Package

Gói bàn giao gồm prototype HTML tương tác, 3 mockup premium, ảnh giao diện gốc để so sánh, design contract, prompt triển khai thật, đặc tả tính năng và sample JSON BGM/SFX.

## Cấu trúc
- `index.html` — prototype tương tác chính, không cần build/network.
- `DESIGN.md` — nguồn quyết định product/UI/UX và constraints.
- `images/` — 3 mockup premium từ prototype.
- `reference/source_original.png` — ảnh UI hiện tại.
- `PROMPT_AGENT_REDESIGN.md` — prompt triển khai vào codebase thật.
- `docs/FEATURES_UPDATE.md` — component map, chức năng và acceptance checklist.
- `docs/UI_UX_AUDIT.md` — audit trước/sau và rủi ro.
- `docs/README.md` — cách dùng prototype.
- `docs/E2E_TEST_REPORT.md` — báo cáo E2E 45/45 với project JSON legacy.
- `samples/project_with_audio_extension.json` — project mẫu backward-compatible.

## Prototype hỗ trợ
- Import/export JSON và hydrate project cũ thiếu `audio`.
- Scene selection, Inspector 3 tab, canvas 9:16.
- Timeline 5 track, seek/play, zoom, split/copy/delete.
- BGM: library/upload, OFF mặc định, volume, trim/move, loop, fade, ducking.
- SFX: preset/upload, insert at playhead, drag, master/per-clip volume, pan, nudge.
- Undo/redo, dirty/autosave indicator, keyboard shortcuts.
- Render modal có preset, audio summary, progress, cancel và success state.

## Xem nhanh
Mở `index.html` bằng Chrome/Edge. Chọn **Âm thanh** hoặc bấm **RENDER VIDEO MP4** để xem flow chính. Đọc `docs/README.md` để xem phím tắt và giới hạn prototype.


