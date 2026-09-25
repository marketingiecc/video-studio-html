# 11. CHECKLIST NGHIỆM THU 6 CỔNG CỦA CHATGPT TRƯỚC KHI BÀN GIAO

Trước khi đóng gói file ZIP và cung cấp link tải về cho người dùng, ChatGPT phải tự động rà soát (self-audit) qua 6 cổng kiểm định sau:

---

## 1. CỔNG 1: KIỂM ĐỊNH KỊCH BẢN (SCRIPT AUDIT)
* [ ] Kịch bản có thời lượng chuẩn: **25s – 35s**.
* [ ] Có đủ 3 hồi rõ ràng:
  - Hồi 1: Hook 3-5s (Title cực đại, so sánh 60s vs 2s).
  - Hồi 2: Diễn giải 2 bước trực quan (Tách số, phép tính phụ, quả cầu nảy).
  - Hồi 3: Thử thách bài toán mới + CTA Follow MathCA.
* [ ] **Quy tắc vàng:** Câu thoại Voiceover ở 3s đầu đọc **CHÍNH XÁC 100% dòng chữ Title** trên màn hình.

---

## 2. CỔNG 2: KIỂM ĐỊNH MÃ NGUỒN HTML/CSS (VISUAL AUDIT)
* [ ] Khai báo đủ `#root` với `data-composition-id="main" data-start="0" data-duration="29.5" data-width="1080" data-height="1920"`.
* [ ] Bố cục thẻ `.stage-scene` **BẮT BUỘC** có `justify-content: center;` để mọi phân cảnh tự động căn giữa, không bị dồn lên đỉnh thẻ làm trống đáy.
* [ ] Cỡ chữ Title Hook đạt chuẩn: Dòng 1 `96px` (Teal Dark `#006A63`), Dòng 2 `90px` (Coral Red `#FF5239`).
* [ ] Đúng bảng màu thương hiệu MathCA: Teal `#12ABA0`, Coral Red `#FF5239`, Yellow `#FFBD05`.
* [ ] Có linh vật Cú con MathCA và con trỏ chuột đồ họa click nút Follow.

---

## 3. CỔNG 3: KIỂM ĐỊNH DIỄN HOẠT GSAP (MOTION AUDIT)
* [ ] Có lệnh `gsap.set()` đặt ngay đầu file bên ngoài timeline để ẩn các cảnh sau (`opacity: 0, pointerEvents: "none"`), tránh bị nháy màn hình.
* [ ] Timeline chính khởi tạo với `{ paused: true }` và được đăng ký vào `window.__timelines["main"] = tl;`.
* [ ] Mốc thời gian của từng chuyển động khớp chính xác với mốc thời gian của từng câu thoại audio.

---

## 4. CỔNG 4: KIỂM ĐỊNH ÂM THANH (AUDIO PIPELINE AUDIT)
* [ ] Script `build_audio_pipeline.py` sử dụng thư viện `edge_tts.Communicate()` trong Python UTF-8 (không dùng CLI console).
* [ ] Giọng đọc được chuẩn hóa lên mức phát thanh to rõ: `-1.0 dB peak` / `-17.5 dB mean`.
* [ ] **TUYỆT ĐỐI KHÔNG** dùng lệnh FFmpeg `amix` mà không có `normalize=0`. Bắt buộc mix trên mảng số thực `numpy float32`.
* [ ] Hiệu ứng SFX hoạt hình giảm 50% âm lượng (thấp hơn giọng đọc 12 dB).
* [ ] Nhạc nền (BGM) tắt hoàn toàn. Kênh xuất ra là **Stereo 2 kênh (48,000 Hz)**.

---

## 5. CỔNG 5: KIỂM ĐỊNH GÓI ỨNG DỤNG 1-CLICK (APP PACKAGING AUDIT)
Trong file ZIP phải có đủ 5 thành phần cốt lõi:
1. `index.html` (Mã nguồn giao diện).
2. `SCRIPT.md` (Bản lưu kịch bản).
3. `build_audio_pipeline.py` (Script sinh audio chuẩn).
4. `render.bat` (1-Click runner xuất MP4 tự động).
5. `preview.bat` (1-Click runner mở xem trước).

---

## 6. CỔNG 6: GIAO TIẾP VÀ BÀN GIAO (USER EXPERIENCE)
* [ ] ChatGPT cung cấp **Link tải trực tiếp file ZIP** ngay trong khung chat (do Code Interpreter tạo ra).
* [ ] Kèm theo hướng dẫn 2 bước siêu ngắn:
  > *Bước 1: Tải file ZIP về và giải nén.*  
  > *Bước 2: Nhấp đúp chuột vào file `render.bat` để xuất ngay video thành phẩm.*
