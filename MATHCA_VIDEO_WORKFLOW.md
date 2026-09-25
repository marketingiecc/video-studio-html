# HƯỚNG DẪN QUY TRÌNH SẢN XUẤT VIDEO MATHCA (WORKFLOW GUIDE)
*Quy chuẩn tối cao cho AI Agent và Nhà sáng tạo nội dung của Hệ thống Giáo dục Toán MathCA*

---

## 1. TỔNG QUAN HỆ THỐNG
Hệ thống sản xuất video tự động MathCA được xây dựng trên nền tảng **HyperFrames**, kết hợp giữa:
1. **Thiết kế giao diện hoạt hình:** HTML5 + Vanilla CSS + Font chữ Inter chuẩn thương hiệu.
2. **Kỹ thuật diễn hoạt điện ảnh:** GSAP (GreenSock Animation Platform) timeline đồng bộ chính xác từng mili-giây.
3. **Kỹ thuật âm thanh kép:** Giọng đọc AI (Edge-TTS Hoài My) 100% âm lượng + Hiệu ứng âm thanh hoạt hình (SFX) 50% êm dịu + Tắt BGM.
4. **Động cơ xuất video:** Puppeteer headless capture + FFmpeg muxing xuất ra video định dạng 9:16 (1080 × 1920) chuẩn TikTok / Reels / Shorts.

---

## 2. NGUYÊN TẮC THƯƠNG HIỆU MATHCA

| Thành phần | Quy chuẩn thực thi | Ghi chú kỹ thuật |
| :--- | :--- | :--- |
| **Màu chính (Teal)** | `#12ABA0` (Chính), `#006A63` (Đậm - Text), `#E6F7F6` (Nhạt - Nền) | Tạo cảm giác hiện đại, tin cậy, thông thái. |
| **Màu nhấn (Coral Red)** | `#FF5239` (Chính), `#B91E0C` (Viền/Bóng) | Kích thích thị giác, nhấn mạnh từ khóa và nút Follow. |
| **Màu phụ (Yellow)** | `#FFBD05` | Tia chớp ⚡, sao ✨, quả cầu số rơi đàn hồi. |
| **Font chữ (Typography)** | 100% Font **Inter OTF** từ thư mục `Website Mathca\Inter` | Tuyệt đối không dùng font mặc định hệ thống. |
| **Mascot Cú con** | Cú con MathCA giơ tay khích lệ, bong bóng thoại và nhảy múa | Đặt ở góc phải dưới (`bottom: 220px; right: 40px`). |
| **Logo MathCA** | Logo MathCA đặt trên đầu (`top: 75px`) | Đi kèm dải tag "HỆ THỐNG GIÁO DỤC TOÁN MATHCA". |

---

## 3. CẤU TRÚC KỊCH BẢN 3 HỒI BẮT BUỘC (THE 3-ACT DOCTRINE)

Mỗi video MathCA có độ dài vàng **25s – 35s**, bắt buộc tuân theo 3 hồi:

### Hồi 1: Viral Hook 3 - 5 giây đầu (0.0s – 4.2s)
* **Voiceover:** Đọc dứt khoát, âm lượng to rõ, đọc CHÍNH XÁC Title video:
  > *"Mẹo nhân nhẩm với 11 trong 2 giây cho học sinh lớp 3!"*
* **Thị giác bùng nổ:**
  - Thẻ Kicker: `⚡ MẸO TOÁN LỚP 3 ⚡` nảy vào từ `0.25s`.
  - Title cực to: `NHÂN VỚI 11` (96px) dập mạnh xuống ở `0.45s`.
  - Title đòn bẩy: `CHỈ MẤT 2 GIÂY! ⚡` (90px) zoom mạnh và phát sáng nhịp tim (`pulse`) từ `0.75s`.
  - Bảng đối đầu 2 cột: `CÁCH CŨ: ⏳ 60 GIÂY` vs `MẸO MATHCA: ⚡ 2 GIÂY`.
  - Banner cam kết: `🚀 Bí quyết tính nhẩm siêu tốc — Không cần nháp!`.
  - Mascot Cú con: Nhảy cẫng vào góc phải chào đón vui tươi.

### Hồi 2: Diễn giải hướng dẫn từng bước (4.2s – 22.4s)
* **Cảnh 2.1 (4.2s - 9.0s):** Nêu bài toán `35 × 11 = ?` + Cảnh báo `⚠️ Đừng vội lấy giấy bút đặt tính nhé!`. Cú con hiện bong bóng thoại khuyên nhủ.
* **Cảnh 2.2 (9.0s - 13.0s):** Bước 1 - Tách số 3 sang trái, số 5 sang phải `[ 3 ] [ ? ] [ 5 ]`.
* **Cảnh 2.3 (13.0s - 17.4s):** Bước 2 - Lấy 3 + 5 = 8, nhét số 8 vào giữa. Quả cầu số 8 rơi tưng tưng đàn hồi (`bounce.out`) lọt chuẩn vào ô giữa `[ 3 ] [ 8 ] [ 5 ]`.
* **Cảnh 2.4 (17.4s - 22.4s):** Bùng nổ kết quả `385` (Cỡ chữ 148px) kèm huy hiệu `⚡ CHỈ MẤT ĐÚNG 2 GIÂY!` và Cú con nhảy múa ăn mừng.

### Hồi 3: Thử thách & Kêu gọi hành động (22.4s – 29.5s)
* Bài toán tương tự để người xem nhẩm thử: `42 × 11 = ?`.
* Kêu gọi: `👇 Hãy bình luận ngay đáp án nhé!`.
* Nút bấm `FOLLOW MATHCA ✨` màu đỏ san hô rực rỡ, có con trỏ chuột bay vào nhấp click chân thực.

---

## 4. KỸ THUẬT ÂM THANH & CẢNH BÁO LỖI (AUDIO PIPELINE)

### 4.1. Quy tắc âm lượng vàng:
* **Voiceover:** Đạt chuẩn `-17.5 dB` đến `-18.5 dB` mean, `-1.0 dB` đến `-1.5 dB` peak. To, rõ, phát thanh chuẩn.
* **Sound Effects (SFX):** Đạt mức `-28 dB` đến `-32 dB` mean, thấp hơn giọng nói khoảng `-12 dB`.
* **Nhạc nền (BGM):** Tắt hoàn toàn để người xem không bị phân tâm.

### 4.2. Cảnh báo 2 lỗi kỹ thuật cốt tử:
1. **Lỗi mã hóa tiếng Việt trên Windows:**
   - Khi gọi CLI `edge-tts --text "..."`, Windows PowerShell dùng mã hóa `cp1252` làm hỏng dấu tiếng Việt.
   - **Giải pháp:** Luôn dùng code Python `edge_tts.Communicate(text, ...).save()` trong script nội bộ để đảm bảo 100% Unicode UTF-8.
2. **Lỗi suy giảm âm lượng do bộ lọc `amix` của FFmpeg:**
   - Bộ lọc `amix=inputs=N` tự động chia âm lượng cho `N` (chia 6 làm tụt -15.5 dB, chia tiếp 2 làm tụt thêm -6 dB). Điều này khiến video nghe như **không có giọng đọc**.
   - **Giải pháp:** Ghép các câu thoại và mix SFX trực tiếp bằng mảng số thực `numpy float32` trong Python (xem file mẫu `build_audio_pipeline.py`) rồi chuẩn hóa về `-1.0 dB peak`.

---

## 5. MỞ RỘNG 4 HƯỚNG NỘI DUNG (CONTENT VERTICALS)

### Hướng 1: Mẹo tính nhanh siêu tốc (Speed Math Tricks)
* Dành cho các phép tính số học thú vị (nhân 11, nhân 9, nhân 99, bình phương số tận cùng 5, phép trừ nhẩm từ trái sang phải).
* Trọng tâm: Tách số, biến đổi hình học trực quan, ra kết quả trong 2-3 giây.

### Hướng 2: Giải toán đố qua mô hình trực quan (Visual Word Problems)
* Dành cho các bài toán có lời văn lớp 3, 4, 5 (Toán Tổng - Hiệu, Tổng - Tỉ, bài toán tính tuổi, giả thiết tạm).
* Trọng tâm: Dùng các thanh bar đồ họa trực quan (Bar Modeling phong cách Singapore) thay cho đặt ẩn x, y trừu tượng.

### Hướng 3: Minigame đố vui 5 giây (Interactive Speed Quiz)
* Dạng video ngắn dạng game show: Đưa ra câu hỏi logic hoặc quy luật số, đồng hồ cát 5s đếm ngược tick-tack hồi hộp, công bố đáp án.
* Trọng tâm: Kích thích tương tác comment, đua top đáp án nhanh nhất.

### Hướng 4: So sánh phương pháp (Old Way vs MathCA Way)
* Video chia đôi màn hình: Một bên học sinh cặm cụi đặt tính dọc toát mồ hôi mất 60 giây; một bên áp dụng tư duy MathCA nhìn là đọc ngay đáp án trong 2 giây.

---

## 6. GIAO THỨC BÀN GIAO ĐA AGENT (MULTI-AGENT PROTOCOL)

Khi nhiều Agent phối hợp sản xuất video, quy trình chuyển giao diễn ra như sau:

```
  [Agent 1: Scriptwriter]
          │ (Xuất SCRIPT.md + JSON cấu trúc)
          ▼
  [Agent 2: Audio Producer]
          │ (Sinh voice TTS, mix SFX float32, xuất assets/audio.mp3)
          ▼
  [Agent 3: Motion Developer]
          │ (Viết HTML/CSS/GSAP, căn timeline từng mili-giây, xuất index.html)
          ▼
  [Agent 4: QA & Reviewer]
          │ (Chạy 6 cổng nghiệm thu, render video MP4)
          ▼
    [Thành phẩm hoàn tất]
```

### Tiêu chí nghiệm thu 6 cổng (6-Gate Acceptance Checklist):
* [ ] **Cổng 1 (Lint):** Chạy `npx hyperframes lint` đạt 0 error.
* [ ] **Cổng 2 (Snapshot):** Chụp các mốc `1.8s, 6s, 11s, 15.5s, 19s, 26s` kiểm tra bố cục căn giữa hoàn hảo, không có khoảng trắng thừa.
* [ ] **Cổng 3 (Audio Loudness):** Chạy `ffmpeg -af volumedetect` kiểm tra `mean_volume > -20dB` và `max_volume >= -2dB`. Voice phải to rõ 100%.
* [ ] **Cổng 4 (Typography):** 100% font Inter cục bộ, không lỗi hiển thị dấu tiếng Việt.
* [ ] **Cổng 5 (Brand Identity):** Màu Teal `#12ABA0`, Coral Red `#FF5239`, Yellow `#FFBD05`, Mascot Cú con xuất hiện sinh động.
* [ ] **Cổng 6 (Render):** Chạy `npx hyperframes render --fps 30` xuất file MP4 mượt mà không giật lag.

---

## 7. MÃ NGUỒN PIPELINE ÂM THANH MẪU (`build_audio_pipeline.py`)

```python
import numpy as np
from scipy.io import wavfile
import subprocess

ffmpeg = r'ffmpeg.exe'
sr = 44100
total_duration = 29.50
total_samples = int(sr * total_duration)

# 1. Ghép Voice trực tiếp trong float32 (không suy hao âm lượng)
voice_track = np.zeros(total_samples, dtype=np.float32)
sentences = [
    ('assets/sentences/s1_hook.mp3', 0.1),
    ('assets/sentences/s2_vidu.mp3', 4.2),
    ('assets/sentences/s3_buoc1.mp3', 9.0),
    ('assets/sentences/s4_buoc2.mp3', 13.0),
    ('assets/sentences/s5_ketqua.mp3', 17.5),
    ('assets/sentences/s6_thuthach.mp3', 22.5),
]

for path, start_sec in sentences:
    cmd = [ffmpeg, '-y', '-i', path, '-f', 'f32le', '-ac', '1', '-ar', str(sr), '-']
    proc = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.DEVNULL, check=True)
    audio_data = np.frombuffer(proc.stdout, dtype=np.float32)
    start_idx = int(start_sec * sr)
    end_idx = min(start_idx + len(audio_data), total_samples)
    voice_track[start_idx:end_idx] += audio_data[:end_idx - start_idx]

# Chuẩn hóa Voice lên chuẩn phát sóng -1.1 dB FS
voice_peak = np.max(np.abs(voice_track))
if voice_peak > 0:
    voice_track = (voice_track / voice_peak) * 0.88

# 2. Mix cùng track SFX (SFX để ở mức ~12 dB dưới voice)
master = voice_track + sfx_track
peak = np.max(np.abs(master))
if peak > 0.95:
    master = (master / peak) * 0.95

wavfile.write('assets/audio_master.wav', sr, (master * 32767).astype(np.int16))
subprocess.run([ffmpeg, '-y', '-i', 'assets/audio_master.wav', '-c:a', 'libmp3lame', '-b:a', '192k', 'assets/audio.mp3'], check=True)
```
