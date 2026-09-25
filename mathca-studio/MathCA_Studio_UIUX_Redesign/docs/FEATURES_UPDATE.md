# MathCA Video Studio Pro — UI/UX & Feature Update

## 1. Component mapping
| Hiện tại | Thiết kế mới | Trách nhiệm |
|---|---|---|
| Header nhiều nút ngang hàng | `Topbar` có nhóm project, preview, engine, save state, Render CTA | Phân cấp hành động và trạng thái hệ thống |
| Tab Kịch bản + danh sách thẻ | `RailNavigation` + `ScenePanel` | Chọn module và quản lý scene độc lập |
| Canvas + toolbar rời rạc | `WorkspaceToolbar` + `CanvasViewport` | Tập trung chỉnh nội dung 9:16 |
| Thuộc tính đối tượng dài | `Inspector` 3 tab | Properties / Effects / Audio theo ngữ cảnh |
| Scrubber đơn | `Timeline` 5 track | Scene / Voiceover / BGM / SFX / Elements |
| Audio ở thanh đáy | `AudioInspector` + `AudioLibraryModal` | Chọn, nghe thử, điều chỉnh và chèn tại playhead |
| Render một bước thiếu phản hồi | `RenderModal` + progress stages | Kiểm tra, mix audio, encode, hoàn tất/cancel |

## 2. BGM
- `audio.bgm` là optional; nếu thiếu thì hydrate thành `enabled: false`.
- Nguồn: upload MP3/WAV/M4A hoặc library asset ID.
- Preview play/pause, master volume 0-100%, start/end, loop, fade in/out.
- Auto ducking theo voiceover; mặc định `underVoiceDb: -12`, attack `0.12s`, release `0.35s`.
- Clip BGM trên timeline có body drag và hai trim handle. Inspector là phương án nhập số thay thế cho drag.
- Timeline luôn thể hiện trạng thái OFF thay vì âm thầm ẩn track.

## 3. SFX
- Preset: Whoosh, Pop, Boing, Chime, Click; hỗ trợ upload file riêng.
- Chèn tại playhead hiện tại, chọn clip trên timeline để chỉnh.
- Master SFX volume và per-clip `volume`, `pan`, `startTime`, `duration`.
- Clip kéo ngang được; nút nudge ±0.1s là phương án keyboard/single-pointer thay thế.
- Default per-clip volume khoảng `0.42`, thấp hơn voiceover để tránh che lời.

## 4. Timeline
- Một ruler và playhead dùng chung cho 5 track.
- Click vùng trống để seek; Space để play/pause.
- Split scene tại playhead, duplicate scene/SFX, Delete có xác nhận cho dữ liệu quan trọng.
- Zoom ngang 80-180% và giữ layout track label cố định.
- Scene, Voiceover, BGM, SFX, Elements phân biệt bằng icon + label + geometry + color.

## 5. Inspector và state
- Tab `Thuộc tính`: project metadata, scene timing, voiceover, voice model.
- Tab `Hiệu ứng`: entry animation và transition preview một lần.
- Tab `Âm thanh`: BGM, ducking, fade, library/upload, SFX master, preset, selected clip.
- Mọi state sản phẩm nằm trong project object/JSON; prototype không dùng localStorage làm nguồn dữ liệu chính.
- Undo/redo giữ snapshot tối đa 60 thao tác trong phiên demo.
- Dirty state hiển thị trên topbar; autosave demo kích hoạt sau 6.5 giây không hoạt động.

## 6. Preview và render
- Timeline preview đồng bộ playhead; BGM upload dùng `HTMLAudioElement`.
- Preset SFX dùng Web Audio tổng hợp ngắn trong prototype để chứng minh flow không phụ thuộc mạng.
- Render modal có presets 9:16, 1:1, 16:9; FPS 25/30/60; quality; include audio.
- Progress gồm 4 stage: validate -> audio plan -> encode -> complete; có Cancel.
- Production phải truyền normalized audio plan vào pipeline HyperFrames/FFmpeg, mix float32 và xuất stereo 48kHz.

## 7. Library và trạng thái UX
- Search, filter chips, preview, choose/insert, upload.
- Empty result state rõ ràng.
- Loading/progress/error/success/disabled đều có biểu hiện riêng.
- Tooltip/accessible label cho icon-only controls; focus ring luôn hiển thị.

## 8. Keyboard shortcuts
- `Space`: Play/Pause.
- `Ctrl/Cmd+S`: Save project JSON.
- `Ctrl/Cmd+Z`: Undo.
- `Ctrl/Cmd+Shift+Z` hoặc `Ctrl/Cmd+Y`: Redo.
- `Delete`: Xóa clip SFX đang chọn hoặc scene đang chọn.
- `Escape`: Đóng modal khi không render.

## 9. Backward compatibility
- Không đổi key bắt buộc của scene/element/animation.
- File cũ không có `audio` được hydrate bằng defaults và chạy với BGM OFF.
- App cũ có thể bỏ qua block `audio` mà không ảnh hưởng scene render.
- Upload blob URL chỉ là runtime preview; production phải dùng asset ID hoặc project-relative path bền vững.

## 10. Acceptance checklist
- [x] Prototype desktop high-fidelity, hoạt động không cần build/network.
- [x] Audio inspector, library, BGM/SFX timeline, import/export JSON.
- [x] BGM mặc định OFF và sample JSON backward-compatible.
- [x] Render progress/cancel/success state.
- [x] Undo/redo, autosave indicator và keyboard shortcuts.
- [x] Icon SVG nhất quán, focus visible, reduced-motion CSS.
- [ ] Production integration với project store, waveform service và render engine thật.
- [ ] Unit/E2E tests trong codebase sản phẩm.
