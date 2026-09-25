# MathCA Video Studio Pro

Cập nhật gần nhất: **25/09/2026**

MathCA Studio là ứng dụng web chạy cục bộ để:

1. Nạp kịch bản video MathCA từ JSON.
2. Chỉnh trực quan vị trí, kích thước, nội dung và hiệu ứng của từng đối tượng.
3. Tạo lại giọng đọc tiếng Việt và hiệu ứng âm thanh theo đúng JSON đang mở.
4. Xuất composition HTML tương thích HyperFrames.
5. Render video MP4 bằng HyperFrames ngay trên máy.
6. Zoom/scroll Preview, quản lý layer đối tượng kiểu CapCut và kéo media vào Timeline.
7. Chọn BGM/SFX từ thư viện bền vững, preview đồng bộ và mix vào MP4.

## Điểm mới trong bản production

- Preview có nút zoom, slider, **Vừa khung**, `Ctrl/Cmd + wheel` và vùng scroll riêng.
- Mỗi object của cảnh đang chọn có một dòng Timeline; dòng trên là layer trên.
- Có thể kéo layer để đổi thứ tự và đồng bộ ngay vào JSON, Preview và render.
- Inspector cuộn nội bộ, không đẩy vỡ workspace ở màn hình thấp.
- Media Library gồm Image/Audio/Video; hỗ trợ upload, nút thêm và kéo-thả vào Timeline.
- BGM selection, fade, loop, ducking, SFX volume/pan và stereo 48 kHz đã đi hết flow render thật.

## Khởi động nhanh

### Windows

- Máy mới: nhấp đúp `install_studio.bat` một lần. Script kiểm tra/cài Node.js LTS 22+ bằng Winget khi cần, cài đúng các package đã khóa và tải browser render của HyperFrames.
- Các lần sau: chỉ cần nhấp đúp `start_studio.bat`.

`start_studio.bat` tự chuyển về đúng thư mục, bổ sung package còn thiếu, kiểm tra bộ render, khởi động server tại `http://localhost:3300` và chỉ mở trình duyệt sau khi server thực sự phản hồi.

### macOS / Linux

```bash
chmod +x start_studio.sh
./start_studio.sh
```

Hoặc chạy trực tiếp:

```bash
npm ci
npm run setup
npm start
```

`npm start` cũng tự chạy bước kiểm tra runtime trước khi mở server.

Không mở `public/index.html` trực tiếp bằng `file://`. Các tính năng tạo audio, lưu project và render MP4 cần server Node đang chạy.

## Cài đặt và tính di động

- Yêu cầu duy nhất sau bước cài đặt là Node.js 22+; trên Windows, `install_studio.bat` có thể cài Node LTS bằng Winget.
- FFmpeg và FFprobe được đóng gói bằng `ffmpeg-static` và `ffprobe-static`; máy đích không cần cài FFmpeg toàn hệ thống hoặc thêm PATH.
- HyperFrames `0.8.71` được khóa trong `package-lock.json` và chạy trực tiếp bằng Node, không gọi `npx` tạm thời nên đường dẫn Windows có khoảng trắng vẫn an toàn.
- Browser render chuẩn của HyperFrames được kiểm tra/tải ở lần chạy đầu và lưu trong cache người dùng. Các lần sau không tải lại nếu bản cache còn hợp lệ.
- Cần Internet ở lần cài đầu và khi tạo giọng đọc Edge TTS. Render video sau khi runtime đã được chuẩn bị không phụ thuộc dịch vụ render bên ngoài.
- Sao chép thư mục hoặc file ZIP sang máy khác, chạy `install_studio.bat`, sau đó chạy `start_studio.bat`.

Ứng dụng hiện dùng Node.js cho toàn bộ luồng audio. File `generate_audio.py` là công cụ cũ để tham khảo, không còn được server gọi.

## Kiến trúc

```text
mathca-studio/
├─ server.js                         API, static server, render job
├─ setup-runtime.js                  Kiểm tra Node, binary và browser render
├─ install_studio.bat                Cài đặt một lần trên máy Windows mới
├─ audio-generator.js                Edge TTS + FFmpeg audio mixer
├─ audio-assets.js                   Kho BGM/SFX bền vững
├─ media-assets.js                   Kho ảnh/video bền vững
├─ public/
│  ├─ index.html                     Giao diện Studio
│  ├─ css/studio.css                 Layout, Preview, Inspector, Timeline layer
│  ├─ js/app.js                      State, canvas editor, media/audio/render flow
│  ├─ js/premium-ui.js               Timeline động, Media Library, premium shell
│  ├─ js/composition-generator.js    Nguồn tạo HTML dùng chung browser/server
│  └─ assets/                        Logo, mascot, GSAP, audio và media library
├─ projects/                         Các preset JSON MathCA
├─ render_workspace/                 Workspace riêng cho từng render job
├─ rendered_output/                  Video MP4 hoàn tất
└─ tests/studio.test.js              Kiểm thử API và hồi quy cấu trúc
```

### Nguyên tắc quan trọng

`public/js/composition-generator.js` là **nguồn sự thật duy nhất** để tạo composition HyperFrames. Cả giao diện và server đều dùng file này. Không tạo thêm một bản generator riêng trong `app.js` hoặc `server.js`, vì Preview và video render sẽ lệch nhau.

## Luồng nạp JSON và tạo audio

Khi người dùng mở file, dán JSON, áp dụng JSON trong editor hoặc chọn preset:

1. `loadProjectData()` clone JSON nguyên trạng làm dữ liệu chỉnh sửa; không tự thêm `id`, `globalElements`, `audio` hoặc `metadata.audioFile`.
2. Nếu có `html_template`, Studio dựng ngay HTML gốc trong iframe preview và liên kết các element với Inspector; nếu không có template, canvas gốc vẫn hoạt động như trước.
3. Studio gọi `POST /api/generate-audio` ngay sau import để tạo hoặc lấy Voiceover từ cache.
4. Server tạo hash từ `voice`, `duration`, `startTime`, `endTime` và `voiceText`.
5. Nếu JSON chưa thay đổi, server dùng lại file audio đã cache trong `audio-manifest.json`; nếu thay đổi, `audio-generator.js` tạo TTS từng cảnh, đặt đúng `startTime`, trộn SFX và xuất `audio-<hash>.mp3`.
6. Tên file Voiceover được giữ trong state runtime riêng, tải vào player và chèn vào HTML render/export; JSON gốc và `html_template` không bị ghi đè.
7. Các chỉnh sửa có chủ đích từ Inspector vẫn cập nhật đúng field scene/element. Khi render hoặc xuất HTML, Studio áp các thay đổi đó lên một bản runtime của template.

Nút **Tạo Lại Âm Thanh** buộc server tạo mới ngay cả khi hash không đổi.

## Luồng chọn và chỉnh đối tượng

- Mỗi element trên canvas có `data-element-id` và `data-element-scope`.
- `composition-root` dùng một listener tập trung để chọn/drag. Không gắn listener riêng lặp lại sau mỗi lần đổi cảnh.
- Scene element dùng tọa độ tương đối trong stage 940×1080.
- Global element dùng tọa độ tuyệt đối trong composition 1080×1920.
- Bounding box được tính từ `getBoundingClientRect()` và quy đổi theo scale thực tế của canvas.
- Khi chọn element, tween GSAP của element đó được dừng và transform được đưa về trạng thái ổn định để khung chọn không bị co nhỏ hoặc lệch.

Các global element mặc định:

- `elem-header-brand`
- `elem-mascot-wrapper`
- `elem-cta-btn`

## Cấu trúc JSON tối thiểu

```json
{
  "metadata": {
    "title": "Tên video",
    "grade": 3,
    "duration": 12,
    "voice": "vi-VN-HoaiMyNeural"
  },
  "scenes": [
    {
      "id": "scene-hook",
      "name": "Hook",
      "startTime": 0,
      "endTime": 4,
      "voiceText": "Nội dung giọng đọc của cảnh.",
      "elements": [
        {
          "id": "hook-title",
          "name": "Tiêu đề",
          "type": "text",
          "x": 120,
          "y": 160,
          "fontSize": 84,
          "text": "MẸO TOÁN SIÊU NHANH",
          "color": "#006a63",
          "animation": {
            "type": "pop-punch",
            "loop": "pulse",
            "duration": 0.45,
            "delay": 0.2
          }
        }
      ]
    }
  ],
  "globalElements": []
}
```

Các loại element đang hỗ trợ: `text`, `badge`, `card`, `equation`, `slots`, `pill`, `image`, `video`.

Entry animation: `pop-punch`, `drop-bounce`, `zoom-hero`, `slide-up`, `slide-left`, `slide-right`, `elastic-pop`, `fade-in`.

Loop animation: `none`, `pulse`, `float`, `wiggle`, `glow`.

## API

- `GET /api/health`: kiểm tra server, trạng thái audio/render và cờ runtime sẵn sàng.
- `GET /api/system-check`: kiểm tra Node, HyperFrames, FFmpeg, FFprobe và browser render đi kèm.
- `GET /api/projects`: danh sách preset.
- `GET /api/projects/:filename`: đọc preset JSON.
- `POST /api/projects/save`: lưu JSON vào `projects/`.
- `POST /api/generate-audio`: tạo hoặc lấy audio cache theo JSON.
- `GET /api/audio-status`: trạng thái tạo audio.
- `GET /api/audio-assets` và `POST /api/audio-assets`: liệt kê/upload BGM và SFX.
- `GET /api/media-assets?kind=image|video`: liệt kê ảnh/video trong thư viện.
- `GET /api/media-assets/:assetId`: đọc metadata asset.
- `POST /api/media-assets`: upload ảnh/video vào kho local.
- `POST /api/render`: bắt đầu render MP4.
- `GET /api/render-status`: theo dõi tiến trình render.
- `/rendered/<file>.mp4`: tải video đã render.

Server chỉ cho chạy một audio job và một render job tại một thời điểm.

## Vị trí lưu video

- Mặc định, mọi file MP4 hoàn tất được giữ tại `mathca-studio/rendered_output/` để không mất kết quả nếu trình duyệt bị đóng.
- Trước khi render, bấm **Chọn thư mục lưu** ở thanh trên cùng và cấp quyền ghi. Khi render đạt 100%, Studio tự sao chép MP4 vào thư mục đó bằng File System Access API.
- Tên thư mục đang chọn được hiển thị ngay dưới nút. Quyền chọn thư mục áp dụng cho phiên Studio hiện tại; sau khi tải lại trang có thể cần chọn lại.
- Nút **Tải Video MP4 Về Máy** vẫn luôn khả dụng như phương án dự phòng. Trình duyệt không hỗ trợ chọn thư mục trực tiếp vẫn render bình thường và giữ file trong `rendered_output/`.

## Kiểm thử

Kiểm tra cú pháp và test hồi quy:

```bash
npm run check
```

Chạy riêng test:

```bash
npm test
node tests/e2e-import.js
node tests/e2e-media-layers.js
node tests/e2e-redesign.js
node tests/e2e-audio-render.js
```

Các báo cáo JSON và ảnh responsive nằm trong `tests/artifacts/`.

Kiểm tra composition mẫu bằng HyperFrames:

```bash
npx hyperframes check render_workspace/<validation-job> --json
```

Sau khi sửa logic canvas, cần test tối thiểu các bước sau trong trình duyệt:

1. Chọn text, badge, card, mascot và CTA.
2. Kéo element rồi kiểm tra X/Y trong Inspector.
3. Đổi cảnh và chọn lại element.
4. Dán JSON có `voiceText` mới, chờ trạng thái audio hoàn tất và kiểm tra `audio` đổi URL.
5. Chạy timeline để xác nhận scene và audio đồng bộ.
6. Render video ngắn, chờ 100%, tải MP4 và kiểm tra duration bằng FFprobe.

## Xử lý lỗi thường gặp

### “Không thể kết nối server render”

- Đảm bảo URL là `http://localhost:3300`, không phải `file:///.../index.html`.
- Studio tắt cache cho HTML/JS/CSS/JSON để sau khi nâng cấp không chạy nhầm mã giao diện cũ.
- Chạy lại `start_studio.bat` hoặc `npm start`.
- Mở `http://localhost:3300/api/health`; kết quả phải có `"success": true`.
- Kiểm tra cổng 3300 chưa bị ứng dụng khác chiếm.

### Tạo audio thất bại

- Kiểm tra Internet và `metadata.voice` là voice Edge TTS hợp lệ.
- Studio tự thử lại tối đa 3 lần cho từng cảnh nếu WebSocket TTS bị ngắt; một lỗi TTS không còn làm tiến trình Node dừng.
- Các ký hiệu toán nhạy với XML như `<`, `>` và `&` được escape trước khi gửi sang TTS.
- Nếu giao diện báo **Dev Server đã dừng**, chạy lại `start_studio.bat`. Thanh trạng thái kiểm tra server mỗi 5 giây, tự khóa nút khi mất kết nối và tự phục hồi khi server hoạt động lại.
- Xem log server có tiền tố `[Audio]` để biết cảnh/lần retry cụ thể.

### Render thất bại

- Chạy `npm run setup` rồi mở `http://localhost:3300/api/system-check`; tất cả mục phải có `"ok": true`.
- Có thể chạy `npm exec -- hyperframes doctor --json` để xem chẩn đoán chi tiết.
- Không cần cài FFmpeg/FFprobe/Chrome toàn hệ thống; Studio ưu tiên toàn bộ binary cục bộ đã khóa.
- Xem ba dòng cuối trong modal lỗi hoặc gọi `/api/render-status` để đọc log.
- Mỗi render dùng workspace riêng `render_workspace/job-<timestamp>`, nên render trước không bị xóa hoặc khóa file của render sau.

## Hướng dẫn cho Agent

- Đọc file này trước khi sửa.
- Giữ generator dùng chung; không nhân đôi logic xuất HTML.
- Không đổi package manager hoặc thêm dependency nếu không thật sự cần.
- Không ghi đè JSON/template khi tạo audio; audio mới phải có tên theo hash và được giữ trong state runtime để preview/render.
- Không đưa `repeat: -1` vào composition render; loop trong HTML xuất ra phải hữu hạn.
- Không dùng `Date.now()` hoặc `Math.random()` bên trong composition được render. Timestamp chỉ được dùng ở server để đặt tên job/output.
- Sau khi sửa `.html` hoặc generator, tạo composition mẫu và chạy HyperFrames check hoặc một render E2E tương đương.
- Sau khi sửa server/audio, chạy `npm run check` và một audio E2E thật.
- Sau khi sửa render, chạy `npm run setup`, gọi `/api/system-check`, render ít nhất một MP4 ngắn và xác nhận file tồn tại, dung lượng lớn hơn 0, duration hợp lý.
- Giữ render portable: không quay lại gọi `cmd.exe`, FFmpeg trong PATH hoặc `npx hyperframes@latest` từ server.
