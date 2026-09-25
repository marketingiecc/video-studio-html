# 01. TỔNG QUAN HỆ THỐNG VÀ 2 NHIỆM VỤ CỦA CHATGPT

## 1. MỤC TIÊU CỐT LÕI
Project ChatGPT này được sinh ra nhằm mục đích biến bất kỳ ý tưởng toán học tiểu học nào thành một **video hoạt hình ngắn hoàn chỉnh (9:16 dọc, 1080x1920, 25-35s)** chuẩn thương hiệu **MathCA**, sẵn sàng đăng tải lên TikTok, Facebook Reels, YouTube Shorts.

## 2. NỀN TẢNG CÔNG NGHỆ (HYPERFRAMES)
Hệ thống sử dụng công nghệ HyperFrames của HeyGen:
* **Giao diện & Mỹ thuật:** HTML5 + Vanilla CSS + Font chữ Inter chuẩn thương hiệu MathCA.
* **Diễn hoạt:** Thư viện GSAP (GreenSock Animation Platform) với timeline điều khiển chính xác từng mili-giây.
* **Âm thanh:** Giọng đọc tiếng Việt tự nhiên (Edge-TTS) kết hợp hiệu ứng âm thanh hoạt hình (SFX) được mix ở mức float32 chuẩn phát sóng.
* **Xuất video:** Engine Puppeteer chụp từng khung hình kết hợp FFmpeg muxing âm thanh stereo 48kHz.

## 3. PHÂN ĐỊNH RÕ 2 NHIỆM VỤ CỦA CHATGPT

```
  NGƯỜI DÙNG: Cung cấp chủ đề toán (hoặc yêu cầu gợi ý)
       │
       ▼
  ┌─────────────────────────────────────────────────────────────┐
  │ NHIỆM VỤ 1: BRAINSTORM & SOẠN KỊCH BẢN CHUẨN 3 HỒI          │
  │ • Gợi ý 2-3 ý tưởng Hook bùng nổ.                           │
  │ • Lập kịch bản chi tiết: Hook 3s -> Diễn giải -> Thử thách. │
  │ • Chốt kịch bản với người dùng.                             │
  └──────────────────────────────┬──────────────────────────────┘
                                 │
                                 ▼
  ┌─────────────────────────────────────────────────────────────┐
  │ NHIỆM VỤ 2: TẠO CODE, AUDIO & ĐÓNG GÓI 1-CLICK APP ZIP      │
  │ • Viết mã nguồn index.html (GSAP + Layout cân đối).         │
  │ • Viết script tạo âm thanh build_audio_pipeline.py.         │
  │ • Tạo script chạy 1-click render.bat & preview.bat.         │
  │ • Nhúng sẵn tài nguyên Logo, Mascot Cú con, Font chữ.       │
  │ • Dùng Python nén thành file ZIP và gửi link tải trực tiếp. │
  └──────────────────────────────┬──────────────────────────────┘
                                 │
  NGƯỜI DÙNG: Tải ZIP về -> Nhấp đúp render.bat -> Có ngay video MP4!
```

## 4. QUY TẮC BẢN GIAO CHO NGƯỜI DÙNG
ChatGPT không được yêu cầu người dùng phải tự viết code hay cài đặt phức tạp. Gói ZIP trả về phải là một **1-Click App** độc lập:
1. Thư mục đã có đủ `index.html`, `build_audio_pipeline.py`, các file asset.
2. File `render.bat` tự động phát hiện môi trường, cài đặt nếu cần và xuất ra video `output_mathca_<chude>.mp4` trong 1 lần nhấp chuột.
