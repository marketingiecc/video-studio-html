# 12. CẤU TRÚC FILE JSON CHUẨN MATHCA STUDIO PRO (DEFINITIVE SCHEMA)

> **MỤC ĐÍCH**: Đây là quy chuẩn cấu trúc dữ liệu JSON duy nhất mà ChatGPT phải tạo ra khi người dùng yêu cầu kịch bản & sản xuất video. Phần mềm máy trạm **MathCA Video Studio Pro** sẽ nhận file JSON này để hiển thị Live Preview, tự động tạo giọng đọc AI, quản lý timeline đa lớp kiểu CapCut và render video MP4.

---

## 1. CẤU TRÚC TỔNG QUAN 6 KHỐI DỮ LIỆU
File JSON gồm 6 khối bắt buộc:
1. `metadata`: Thông tin chung (Tiêu đề, Khối lớp, Chủ đề, Tổng thời lượng video, Giọng đọc AI).
2. `brand`: Bảng màu chuẩn nhận diện MathCA và font chữ `Inter`.
3. `scenes`: Mảng các phân cảnh bám sát kịch bản 3 hồi. Mỗi cảnh có `startTime`, `endTime`, `voiceText` (khớp thời lượng) và mảng `elements` có tọa độ `x, y`, thuộc tính và đối tượng `animation`.
4. `globalElements`: Các phần tử cố định trên toàn bộ khung hình 1080x1920 (Header Logo, Mascot Cú con, Nút CTA Follow).
5. `audio`: Hệ thống âm thanh đa kênh gồm `bgm` (nhạc nền kèm Smart Ducking) và mảng `sfx` (các hiệu ứng âm thanh gắn mốc thời gian chính xác).
6. `html_template`: Mã HTML5 HyperFrames hoàn chỉnh có nhúng GSAP timeline để hiển thị Live Preview và render offline.

---

## 2. BẢN MẪU JSON HOÀN CHỈNH (GOLDEN REFERENCE JSON)

```json
{
  "metadata": {
    "title": "Mẹo nhân 11 trong 2 giây - Lớp 3",
    "grade": 3,
    "topic": "Nhân số có 2 chữ số với 11",
    "duration": 29.5,
    "voice": "vi-VN-HoaiMyNeural"
  },
  "brand": {
    "colors": {
      "tealPrimary": "#12aba0",
      "tealDark": "#006a63",
      "tealSoft": "#e6f7f6",
      "coralRed": "#ff5239",
      "yellowVibrant": "#ffbd05"
    },
    "fontFamily": "Inter"
  },
  "scenes": [
    {
      "id": "scene-hook",
      "name": "Hook 3s đầu bùng nổ",
      "startTime": 0.0,
      "endTime": 4.2,
      "voiceText": "Mẹo nhân nhẩm với 11 trong 2 giây cho học sinh lớp 3!",
      "elements": [
        {
          "id": "hook-kicker",
          "name": "Thẻ Kicker",
          "type": "badge",
          "x": 260,
          "y": 60,
          "fontSize": 28,
          "text": "⚡ MẸO TOÁN LỚP 3 ⚡",
          "color": "#1a1c1c",
          "bgColor": "#ffbd05",
          "animation": { "type": "pop-punch", "duration": 0.35, "delay": 0.2 }
        },
        {
          "id": "hook-title-1",
          "name": "Tiêu đề chính dòng 1",
          "type": "text",
          "x": 160,
          "y": 150,
          "fontSize": 96,
          "text": "NHÂN VỚI 11",
          "color": "#006a63",
          "animation": { "type": "pop-punch", "duration": 0.45, "delay": 0.45 }
        },
        {
          "id": "hook-title-2",
          "name": "Tiêu đề phụ dòng 2",
          "type": "text",
          "x": 90,
          "y": 265,
          "fontSize": 90,
          "text": "CHỈ MẤT 2 GIÂY! ⚡",
          "color": "#ff5239",
          "animation": { "type": "pop-punch", "loop": "pulse", "duration": 0.45, "delay": 0.75 }
        },
        {
          "id": "hook-vs-box",
          "name": "Bảng so sánh 2 cột",
          "type": "card",
          "x": 50,
          "y": 410,
          "width": 840,
          "fontSize": 32,
          "text": "CÁCH CŨ: 60 GIÂY vs MẸO MATHCA: 2 GIÂY",
          "color": "#006a63",
          "bgColor": "#f8fcfb",
          "animation": { "type": "slide-up", "duration": 0.4, "delay": 1.05 }
        },
        {
          "id": "hook-bottom",
          "name": "Banner cam kết",
          "type": "card",
          "x": 50,
          "y": 650,
          "width": 840,
          "fontSize": 30,
          "text": "🚀 Bí quyết tính nhẩm siêu tốc — Không cần nháp!",
          "color": "#946200",
          "bgColor": "#fffdf5",
          "animation": { "type": "slide-up", "duration": 0.35, "delay": 1.35 }
        }
      ]
    },
    {
      "id": "scene-vidu",
      "name": "Đặt bài toán 35 x 11",
      "startTime": 4.2,
      "endTime": 9.0,
      "voiceText": "Ví dụ: 35 nhân 11. Đừng đặt tính vội nhé!",
      "elements": [
        {
          "id": "badge-vidu",
          "name": "Thẻ tiêu đề",
          "type": "badge",
          "x": 260,
          "y": 60,
          "fontSize": 32,
          "text": "BÀI TOÁN TÍNH NHANH",
          "color": "#ffffff",
          "bgColor": "#12aba0",
          "animation": { "type": "pop-punch", "duration": 0.35, "delay": 0.1 }
        },
        {
          "id": "equation-display",
          "name": "Phép tính 35 x 11 = ?",
          "type": "equation",
          "x": 150,
          "y": 240,
          "width": 640,
          "fontSize": 76,
          "text": "35 × 11 = ?",
          "animation": { "type": "drop-bounce", "duration": 0.45, "delay": 0.35 }
        },
        {
          "id": "warning-card",
          "name": "Cảnh báo đặt tính",
          "type": "card",
          "x": 90,
          "y": 520,
          "width": 760,
          "fontSize": 32,
          "text": "⚠️ Đừng vội lấy giấy bút đặt tính nhé!",
          "color": "#ff5239",
          "bgColor": "#fff5f3",
          "animation": { "type": "slide-up", "loop": "wiggle", "duration": 0.4, "delay": 2.2 }
        }
      ]
    },
    {
      "id": "scene-buoc1",
      "name": "Bước 1: Tách đôi số 35",
      "startTime": 9.0,
      "endTime": 13.0,
      "voiceText": "Bước một: Tách đôi số 3 sang trái, số 5 sang phải.",
      "elements": [
        {
          "id": "badge-buoc1",
          "name": "Thẻ Bước 1",
          "type": "badge",
          "x": 220,
          "y": 60,
          "fontSize": 32,
          "text": "BƯỚC 1: TÁCH ĐÔI SỐ 35",
          "color": "#1a1c1c",
          "bgColor": "#ffbd05",
          "animation": { "type": "pop-punch", "duration": 0.35, "delay": 0.1 }
        },
        {
          "id": "split-stage",
          "name": "Ô số tách đôi [ 3 ] [ ? ] [ 5 ]",
          "type": "slots",
          "x": 120,
          "y": 300,
          "fontSize": 88,
          "text": "3 ? 5",
          "animation": { "type": "elastic-pop", "duration": 0.5, "delay": 0.4 }
        }
      ]
    },
    {
      "id": "scene-buoc2",
      "name": "Bước 2: Cộng nhét giữa",
      "startTime": 13.0,
      "endTime": 17.4,
      "voiceText": "Bước hai: Lấy 3 cộng 5 bằng 8, rồi nhét số 8 vào giữa!",
      "elements": [
        {
          "id": "badge-buoc2",
          "name": "Thẻ Bước 2",
          "type": "badge",
          "x": 160,
          "y": 60,
          "fontSize": 32,
          "text": "BƯỚC 2: CỘNG NHÉT VÀO GIỮA",
          "color": "#ffffff",
          "bgColor": "#ff5239",
          "animation": { "type": "pop-punch", "duration": 0.35, "delay": 0.1 }
        },
        {
          "id": "calc-pill",
          "name": "Viên thuốc phép tính 3 + 5 = 8",
          "type": "pill",
          "x": 270,
          "y": 230,
          "fontSize": 48,
          "text": "3 + 5 = 8",
          "color": "#ffffff",
          "bgColor": "#12aba0",
          "animation": { "type": "drop-bounce", "duration": 0.45, "delay": 0.35 }
        },
        {
          "id": "split-filled",
          "name": "Ô số hoàn thành [ 3 ] [ 8 ] [ 5 ]",
          "type": "slots",
          "x": 120,
          "y": 450,
          "fontSize": 88,
          "text": "3 8 5",
          "animation": { "type": "elastic-pop", "duration": 0.5, "delay": 1.8 }
        }
      ]
    },
    {
      "id": "scene-ketqua",
      "name": "Kết quả siêu tốc 385",
      "startTime": 17.4,
      "endTime": 22.4,
      "voiceText": "Ta được ngay kết quả: 385! Chỉ mất đúng 2 giây!",
      "elements": [
        {
          "id": "badge-ketqua",
          "name": "Thẻ kết quả",
          "type": "badge",
          "x": 260,
          "y": 60,
          "fontSize": 32,
          "text": "KẾT QUẢ SIÊU TỐC",
          "color": "#ffffff",
          "bgColor": "#12aba0",
          "animation": { "type": "pop-punch", "duration": 0.35, "delay": 0.1 }
        },
        {
          "id": "final-answer",
          "name": "Số đáp án 385",
          "type": "text",
          "x": 290,
          "y": 240,
          "fontSize": 148,
          "text": "385",
          "color": "#006a63",
          "animation": { "type": "zoom-hero", "duration": 0.5, "delay": 0.35 }
        },
        {
          "id": "speed-badge",
          "name": "Huy hiệu 2 giây",
          "type": "badge",
          "x": 210,
          "y": 500,
          "fontSize": 34,
          "text": "⚡ CHỈ MẤT ĐÚNG 2 GIÂY!",
          "color": "#1a1c1c",
          "bgColor": "#ffbd05",
          "animation": { "type": "pop-punch", "loop": "pulse", "duration": 0.4, "delay": 0.8 }
        }
      ]
    },
    {
      "id": "scene-thuthach",
      "name": "Thử thách 42 x 11 & Follow",
      "startTime": 22.4,
      "endTime": 29.5,
      "voiceText": "Đố các bạn: 42 nhân 11 bằng bao nhiêu? Hãy bình luận đáp án và bấm Follow MathCA nhé!",
      "elements": [
        {
          "id": "badge-thuthach",
          "name": "Thẻ thử thách",
          "type": "badge",
          "x": 230,
          "y": 60,
          "fontSize": 32,
          "text": "THỬ THÁCH CHO BẠN",
          "color": "#1a1c1c",
          "bgColor": "#ffbd05",
          "animation": { "type": "pop-punch", "duration": 0.35, "delay": 0.1 }
        },
        {
          "id": "quiz-card",
          "name": "Khung câu đố 42 x 11 = ?",
          "type": "card",
          "x": 60,
          "y": 200,
          "width": 820,
          "fontSize": 76,
          "text": "42 × 11 = ?",
          "color": "#006a63",
          "bgColor": "#f8fcfb",
          "animation": { "type": "elastic-pop", "duration": 0.5, "delay": 0.35 }
        }
      ]
    }
  ],
  "globalElements": [
    {
      "id": "elem-header-brand",
      "name": "Header Logo & Tiêu Đề",
      "x": 0,
      "y": 75,
      "width": 1080,
      "type": "global",
      "animation": { "type": "slide-up", "duration": 0.4, "delay": 0.05 }
    },
    {
      "id": "elem-mascot-wrapper",
      "name": "Mascot Cú con",
      "x": 720,
      "y": 1380,
      "width": 320,
      "type": "global",
      "animation": { "type": "slide-left", "loop": "float", "duration": 0.5, "delay": 0.18 }
    },
    {
      "id": "elem-cta-btn",
      "name": "Nút Follow MathCA",
      "x": 230,
      "y": 1720,
      "fontSize": 38,
      "text": "FOLLOW MATHCA ✨",
      "color": "#ffffff",
      "bgColor": "#ff5239",
      "type": "global",
      "animation": { "type": "pop-punch", "loop": "pulse", "duration": 0.45, "delay": 0.5 }
    }
  ],
  "audio": {
    "bgm": {
      "enabled": false,
      "assetId": "bgm-happy-math-01",
      "name": "Happy Math",
      "volume": 0.25,
      "startTime": 0,
      "endTime": 29.5,
      "loop": true,
      "fadeIn": 1.0,
      "fadeOut": 1.5,
      "ducking": {
        "enabled": true,
        "underVoiceDb": -12,
        "attack": 0.12,
        "release": 0.35
      }
    },
    "sfxMasterVolume": 0.5,
    "sfx": [
      { "id": "sfx-whoosh-1", "assetId": "preset-whoosh", "name": "Whoosh mở màn", "startTime": 0.08, "duration": 0.35, "volume": 0.45, "pan": 0 },
      { "id": "sfx-pop-1", "assetId": "preset-pop", "name": "Pop Title 1", "startTime": 0.45, "duration": 0.2, "volume": 0.5, "pan": 0 },
      { "id": "sfx-pop-2", "assetId": "preset-pop", "name": "Pop Title 2", "startTime": 0.75, "duration": 0.2, "volume": 0.5, "pan": 0 },
      { "id": "sfx-whoosh-2", "assetId": "preset-whoosh", "name": "Whoosh Cảnh 2", "startTime": 4.15, "duration": 0.35, "volume": 0.4, "pan": 0 },
      { "id": "sfx-pop-3", "assetId": "preset-pop", "name": "Pop Phép tính", "startTime": 4.55, "duration": 0.2, "volume": 0.5, "pan": 0 },
      { "id": "sfx-whoosh-3", "assetId": "preset-whoosh", "name": "Whoosh Cảnh 3", "startTime": 8.95, "duration": 0.35, "volume": 0.4, "pan": 0 },
      { "id": "sfx-pop-4", "assetId": "preset-pop", "name": "Pop Tách số", "startTime": 9.4, "duration": 0.2, "volume": 0.5, "pan": 0 },
      { "id": "sfx-whoosh-4", "assetId": "preset-whoosh", "name": "Whoosh Cảnh 4", "startTime": 12.95, "duration": 0.35, "volume": 0.4, "pan": 0 },
      { "id": "sfx-boing-1", "assetId": "preset-boing", "name": "Boing Số rơi", "startTime": 14.8, "duration": 0.6, "volume": 0.55, "pan": 0 },
      { "id": "sfx-whoosh-5", "assetId": "preset-whoosh", "name": "Whoosh Cảnh 5", "startTime": 17.35, "duration": 0.35, "volume": 0.4, "pan": 0 },
      { "id": "sfx-chime-1", "assetId": "preset-chime", "name": "Chime Kết quả", "startTime": 17.65, "duration": 1.25, "volume": 0.6, "pan": 0 },
      { "id": "sfx-whoosh-6", "assetId": "preset-whoosh", "name": "Whoosh Cảnh 6", "startTime": 22.35, "duration": 0.35, "volume": 0.4, "pan": 0 },
      { "id": "sfx-click-1", "assetId": "preset-click", "name": "Click Follow", "startTime": 26.5, "duration": 0.1, "volume": 0.6, "pan": 0 }
    ]
  },
  "html_template": "<!doctype html><html lang=\"vi\">... (Mã HTML HyperFrames hoàn chỉnh có GSAP timeline như file 07_MAU_CHUAN_INDEX_HTML.md) ...</html>"
}
```

---

## 3. TỪ ĐIỂN CÁC TRƯỜNG DỮ LIỆU (DATA DICTIONARY)

1. **`scenes[].elements`**:
   - `x`, `y`: Tọa độ tương đối tính từ góc trên bên trái của Stage Card (kích thước chuẩn 940 × 1080 px).
   - `type`: Thuộc tính phân loại phần tử (`text`, `badge`, `card`, `equation`, `slots`, `pill`, `image`, `video`).
   - `animation.type`: Hiệu ứng xuất hiện (`pop-punch`, `drop-bounce`, `zoom-hero`, `slide-up`, `slide-left`, `slide-right`, `elastic-pop`, `fade-in`).
   - `animation.loop`: Hiệu ứng lặp duy trì (`none`, `pulse`, `float`, `wiggle`, `glow`).
   - `animation.duration`: Thời gian diễn hoạt (tính bằng giây, thường từ 0.3s đến 0.55s).
   - `animation.delay`: Độ trễ xuất hiện tương đối tính từ thời điểm bắt đầu cảnh (`startTime`).
2. **Quy tắc xếp lớp (Layer Stacking)**:
   - Trong Studio, phần tử cuối mảng `elements` là layer trên cùng (`z-index: 100 + index`).
   - Các hộp chứa, thẻ nền phải xếp trước; chữ, số, icon nổi bật xếp sau để không bị đè khuất.
3. **`audio.sfx`**:
   - `startTime`: Mốc giây tuyệt đối trong toàn bộ video ($startTime_{scene} + delay_{element}$).
   - `assetId`: Phải là 1 trong 5 preset có sẵn (`preset-whoosh`, `preset-pop`, `preset-boing`, `preset-chime`, `preset-click`).
