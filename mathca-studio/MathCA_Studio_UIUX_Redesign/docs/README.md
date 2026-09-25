# Sử dụng prototype MathCA Studio Premium

## Mở nhanh
1. Mở `index.html` bằng Chrome hoặc Edge.
2. Chọn tab **Âm thanh** trong Inspector hoặc bấm mục **Âm thanh** ở rail trái.
3. Thử chọn BGM, chèn SFX, kéo clip trên timeline, sau đó bấm **RENDER VIDEO MP4**.

Prototype là HTML/CSS/JS độc lập, không cần build và không tải tài nguyên từ mạng.

## Flow nên thử
- Chọn các scene để xem Inspector và canvas đổi theo.
- Click timeline để đặt playhead; bấm Space hoặc nút Play để chạy.
- Bật BGM, thay volume/fade/loop/ducking; kéo body/trim handle trên track BGM.
- Click preset SFX để chèn tại playhead; chọn clip để chỉnh volume, pan hoặc nudge ±0.1s.
- Tải MP3/WAV/M4A để thử `HTMLAudioElement` preview.
- Bấm `Ctrl/Cmd+S` để tải project JSON; mở lại JSON cũ không có `audio` để kiểm tra default OFF.
- Mở Render, chọn preset/FPS/quality, chạy progress và thử Cancel.

## Phím tắt
- `Space`: Play/Pause.
- `Ctrl/Cmd+S`: Lưu JSON.
- `Ctrl/Cmd+Z`: Undo.
- `Ctrl/Cmd+Shift+Z` hoặc `Ctrl/Cmd+Y`: Redo.
- `Delete`: Xóa selection.
- `Escape`: Đóng modal khi không render.

## Giới hạn của prototype
- Không gọi HyperFrames/FFmpeg thật và không tạo MP4.
- Nhạc thư viện chưa kèm asset có bản quyền; preview library/SFX dùng Web Audio tổng hợp.
- File upload chỉ tồn tại trong phiên trình duyệt; JSON lưu tên/asset reference minh họa.
- Waveform là visual placeholder, chưa phải peak data thật.

## Khi tích hợp sản phẩm
Đọc theo thứ tự: `DESIGN.md` -> `docs/FEATURES_UPDATE.md` -> `samples/project_with_audio_extension.json` -> `PROMPT_AGENT_REDESIGN.md`. Agent triển khai phải map vào project store, asset manager, audio preview engine, HyperFrames preview và render pipeline hiện có.
