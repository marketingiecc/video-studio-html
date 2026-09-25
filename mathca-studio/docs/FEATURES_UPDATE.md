# MathCA Studio - Cập nhật tính năng

Cập nhật: **25/09/2026**

## Đã triển khai

### Preview
- Zoom bằng nút `-` / `+`, slider và nút **Vừa khung**.
- `Ctrl/Cmd + lăn chuột` để zoom tại vị trí đang xem.
- Preview có vùng pan/scroll riêng; không làm tràn toàn bộ trang.
- Giữ tâm nhìn ổn định khi đổi mức zoom.

### Timeline layer kiểu CapCut
- Scene, Voiceover, BGM và SFX là các track cố định.
- Mỗi đối tượng của cảnh đang chọn có một dòng Timeline riêng.
- Thêm Text/Image/Video tạo dòng mới ngay lập tức.
- Có thể kéo nhãn dòng hoặc clip sang dòng khác để đổi thứ tự lớp.
- Dòng nằm trên tương ứng layer có `z-index` cao hơn trong canvas, HTML template preview và composition render.
- Timeline cuộn dọc khi số layer vượt quá chiều cao khả dụng; nhãn và clip cuộn đồng bộ.

### Inspector
- Ba tab Thuộc tính / Hiệu ứng / Âm thanh giữ cố định.
- Nội dung Inspector cuộn độc lập, kể cả tại màn hình thấp `1366x650`.

### Thư viện Media
- Thư viện hợp nhất gồm **Ảnh**, **Âm thanh**, **Video**.
- Có thể kéo asset vào Timeline hoặc bấm **Thêm vào dự án**.
- Ảnh/video upload được chép vào kho media local và lưu bằng đường dẫn tương đối.
- JSON dự án không lưu `blob:` URL.
- Asset mẫu: Logo MathCA, Mascot Cú Con và MathCA Logo Loop.

### BGM và SFX
- Chọn BGM từ thư viện đã hoạt động; hỗ trợ upload, bật/tắt, volume, loop, fade in/out và auto ducking.
- SFX hỗ trợ preset/upload, chèn tại playhead, master volume, per-clip volume và pan.
- Kéo audio từ thư viện vào Timeline: BGM được chọn làm nhạc nền, SFX được chèn tại playhead.
- Preview tách Voiceover và master mix để tránh phát âm thanh hai lần.
- Render mix stereo `48 kHz`, giữ Voiceover rõ và duck BGM theo vùng lời thoại.

### Import và tương thích
- Import JSON tự tạo Voiceover và dựng Preview sẵn sàng chỉnh sửa.
- Giữ nguyên schema, unknown fields và `html_template` gốc.
- Không ghi `metadata.audioFile` vào JSON.
- Block `audio` chỉ xuất hiện sau khi người dùng thay đổi âm thanh.
- Hỗ trợ element `video` trong editor, template preview và composition render.

## Quy ước dữ liệu layer
- `scene.elements.at(-1)` là lớp hình ảnh trên cùng.
- Timeline hiển thị `scene.elements` theo thứ tự đảo ngược.
- Kéo một dòng Timeline sẽ sắp xếp lại mảng `scene.elements` và cập nhật Preview/JSON ngay.

## API Media
- `GET /api/media-assets?kind=image|video`: liệt kê asset.
- `GET /api/media-assets/:assetId`: đọc asset metadata.
- `POST /api/media-assets`: upload ảnh hoặc video.
- `GET /api/audio-assets`: liệt kê BGM/SFX.
- `POST /api/audio-assets`: upload audio bền vững.

## Kiểm thử chấp nhận
- `npm run check`: 42/42 test qua.
- `node tests/e2e-import.js`: import 8 scene, Voiceover, template và Inspector qua.
- `node tests/e2e-media-layers.js`: zoom/scroll, layer, media, BGM/SFX và Inspector scroll qua.
- `node tests/e2e-redesign.js`: responsive, audio, autosave, playback và render cancel/retry qua.
- `node tests/e2e-audio-render.js`: MP4 thật `1080x1080`, `25 FPS`, `29.52s`, stereo `48 kHz` qua.
