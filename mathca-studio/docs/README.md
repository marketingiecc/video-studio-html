# Hướng dẫn nhanh MathCA Studio Production

## Khởi động
Chạy `start_studio.bat` hoặc `npm start`, sau đó mở `http://localhost:3300`.

Không mở `public/index.html` bằng `file://` vì import audio, media library, lưu project và render cần server local.

## Flow chỉnh sửa đề xuất
1. Bấm **Mở JSON** và chọn project.
2. Chờ trạng thái **Voiceover sẵn sàng** và Preview hiển thị HTML gốc.
3. Dùng `-`, `+`, slider, **Vừa khung** hoặc `Ctrl/Cmd + wheel` để điều hướng Preview.
4. Thêm Text hoặc mở **Media** để kéo ảnh/video vào Timeline.
5. Kéo dòng layer lên/xuống; dòng trên sẽ nằm trên trong video.
6. Mở tab **Âm thanh** hoặc Media > Audio để chọn BGM và chèn SFX.
7. Chỉnh thuộc tính, nghe Preview, sau đó bấm **RENDER VIDEO MP4**.

## Timeline
- Track cố định: Phân cảnh, Voiceover, BGM, SFX.
- Các dòng bên dưới là layer đối tượng của cảnh đang chọn.
- Timeline cuộn dọc khi có nhiều layer; cột nhãn và vùng clip cuộn đồng bộ.
- Kéo layer để đổi thứ tự hiển thị.

## Media Library
- **Ảnh:** kéo vào Timeline hoặc bấm thêm.
- **Audio:** BGM được chọn làm nhạc nền; SFX được chèn tại playhead.
- **Video:** tạo video layer mới trong cảnh hiện tại.
- Upload được lưu vào kho local; project dùng asset ID/đường dẫn tương đối.

## Phím tắt
- `Space`: Play/Pause.
- `Ctrl/Cmd+S`: Lưu project.
- `Ctrl/Cmd+Z`: Undo.
- `Ctrl/Cmd+Shift+Z` hoặc `Ctrl/Cmd+Y`: Redo.
- `Delete`: Xóa selection phù hợp.

## Kiểm thử
```bash
npm run check
node tests/e2e-import.js
node tests/e2e-media-layers.js
node tests/e2e-redesign.js
node tests/e2e-audio-render.js
```

Báo cáo và ảnh kiểm thử nằm trong `tests/artifacts/`.
