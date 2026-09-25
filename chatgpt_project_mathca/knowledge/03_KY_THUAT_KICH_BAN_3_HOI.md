# 03. KỸ THUẬT SOẠN KỊCH BẢN 3 HỒI & NHỊP ĐIỆU REELS / TIKTOK

Kịch bản video MathCA do ChatGPT sáng tạo phải được tối ưu hóa đặc biệt cho nền tảng video ngắn (TikTok, Facebook Reels, YouTube Shorts). Người xem trên di động có xu hướng lướt rất nhanh; do đó video phải tuân thủ nghiêm ngặt **Quy chuẩn 3 Hồi & Nhịp điệu cảm xúc**.

---

## 1. CẤU TRÚC 3 HỒI KINH ĐIỂN TỐI ƯU CHO REELS & TIKTOK

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ HỒI 1: VIRAL HOOK 3S ĐẦU (0.0s – 3.5s/4.2s) - GIỮ CHÂN 80% NGƯỜI XEM       │
│ • Nhiệm vụ: Chặn ngay quán tính lướt màn hình của học sinh và phụ huynh.    │
│ • Đòn bẩy tâm lý:                                                           │
│   - Sự tò mò cực độ: "Mẹo tính 2 giây", "90% học sinh đặt tính sai bài này!". │
│   - Tương phản mạnh mẽ: Bảng so sánh 2 cột [CÁCH CŨ: 60s] vs [MATHCA: 2s].  │
│   - Cam kết giá trị: "Bí quyết tính nhẩm siêu tốc — Không cần dùng nháp!".   │
│ • Quy tắc vàng Voiceover: Đọc to, dứt khoát, CHÍNH XÁC Title trên màn hình! │
│ • Thị giác: Title to 96px (Teal Dark) + 90px (Coral Red) nảy mạnh pop-punch.│
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ (Chuyển cảnh Whoosh nhẹ nhàng)
┌──────────────────────────────────────▼──────────────────────────────────────┐
│ HỒI 2: DIỄN GIẢI TRỰC QUAN TỪNG BƯỚC & KHOẢNH KHẮC "AHA!" (Thời lượng mở)   │
│ • Nhiệm vụ: Dạy bản chất toán học bằng hình ảnh, giúp người xem "vỡ òa".     │
│ • Độ dài linh hoạt: Tùy bài toán đơn giản hay phức tạp, hồi 2 có thể từ      │
│   15s đến 30s, chia thành 2 đến 4 cảnh nhỏ logic.                            │
│ • Cảnh 2.1 - Đặt bài toán & Cảnh báo: Nêu phép tính hoặc đề bài. Nhắc vui:   │
│   "Đừng vội đặt tính dọc nhé!".                                              │
│ • Cảnh 2.2 & 2.3 - Thao tác tư duy trực quan: Tách số, vẽ sơ đồ đoạn thẳng,  │
│   hoặc ghép cặp số tròn chục. Trực quan 100%, không dùng chữ nghĩa khô khan. │
│ • Cảnh 2.4 - Bùng nổ kết quả (Climax): Số đáp án 148px xuất hiện cực lớn,    │
│   kèm huy hiệu tốc độ và Mascot Cú con nhảy múa ăn mừng rộn ràng.            │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ (Chuyển cảnh Whoosh nhẹ nhàng)
┌──────────────────────────────────────▼──────────────────────────────────────┐
│ HỒI 3: THỬ THÁCH TƯƠNG TÁC & KÊU GỌI HÀNH ĐỘNG (5.0s – 7.0s cuối)           │
│ • Nhiệm vụ: Tạo hành động chuyển đổi (Comment đáp án & Bấm Follow).         │
│ • Thử thách mini: Đưa ra 1 bài toán tương tự để người xem tự nhẩm trong 3s.  │
│ • Kêu gọi bình luận: "Bình luận đáp án của bạn bên dưới xem ai nhanh nhất!".│
│ • Nút bấm Footer: FOLLOW MATHCA ✨ màu cam san hô với con trỏ chuột lướt vào│
│   thực hiện cú click nảy phím vui nhộn.                                      │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. CÔNG THỨC VÀNG TÍNH THỜI LƯỢNG CẢNH & ĐỘ DÀI VOICETEXT

Một lỗi nghiêm trọng thường gặp là lời thoại quá dài khiến âm thanh bị đọc dồn dập hoặc tràn sang cảnh sau làm vỡ bố cục. Trong MathCA Studio, giọng đọc Edge TTS (`vi-VN-HoaiMyNeural` tốc độ +18%) có tốc độ đọc chuẩn xác:

$$\text{Tốc độ đọc trung bình} = 3.8 \text{ từ / giây} \quad (\approx 0.26 \text{ giây / từ})$$

### Công thức tính thời gian đọc ước tính ($D_{voice}$):
$$D_{voice} = \frac{\text{Số từ trong voiceText}}{3.8}$$

### Quy tắc đệm an toàn bắt buộc (Safety Buffer):
Độ dài cảnh $(endTime - startTime)$ phải thỏa mãn:
$$(endTime - startTime) \ge D_{voice} + 0.4\text{s} \text{ đến } 0.8\text{s}$$
*Phần đệm 0.4s - 0.8s này giúp câu thoại có khoảng nghỉ tự nhiên, nhường chỗ cho hiệu ứng âm thanh SFX và mắt người xem tiếp nhận thông tin.*

### Bảng tra cứu số từ tối đa theo thời lượng cảnh:

| Thời lượng cảnh $(endTime - startTime)$ | Thời gian đọc tối đa ($D_{voice}$) | Số từ tối đa trong `voiceText` | Ví dụ câu thoại chuẩn |
| :---: | :---: | :---: | :--- |
| **2.5 giây** | ~1.8 giây | **6 – 7 từ** | "Bước một: Tách đôi số 35." |
| **3.5 giây** | ~2.7 giây | **9 – 11 từ** | "Mẹo nhân nhẩm 11 trong 2 giây cho lớp 3!" |
| **4.5 giây** | ~3.7 giây | **12 – 15 từ** | "Ví dụ: 35 nhân 11. Đừng vội đặt tính dọc nhé!" |
| **6.0 giây** | ~5.0 giây | **17 – 20 từ** | "Bước hai: Lấy 3 cộng 5 bằng 8, rồi nhét số 8 vào giữa!" |
| **7.5 giây** | ~6.5 giây | **22 – 26 từ** | "Đố các bạn: 42 nhân 11 bằng bao nhiêu? Bình luận ngay đáp án và bấm Follow MathCA nhé!" |

---

## 3. NGUYÊN TẮC NHỊP ĐIỆU THỊ GIÁC (VISUAL BEAT MATCHING)

1. **Quy luật 1.5 giây:** Màn hình không bao giờ được tĩnh lặng quá 1.5 giây. Cứ mỗi 1 đến 2 giây phải có một beat chuyển động (chữ nảy ra, số rơi xuống, tia chớp chớp nháy, mascot đổi tư thế).
2. **Khớp Delay với phát âm:**
   - Trong một scene, các element **không xuất hiện cùng lúc**.
   - Element nào được nhắc đến trước sẽ xuất hiện trước (`delay` thấp).
   - Element nào được nhắc đến sau sẽ có `delay` khớp đúng thời điểm giọng đọc vang lên từ khóa đó.
   - *Ví dụ:* Scene dài 4.5s nói "Ví dụ: 35 nhân 11. Đừng đặt tính vội nhé!".
     - Tại `delay: 0.1s`: Thẻ badge "BÀI TOÁN TÍNH NHANH" nảy vào.
     - Tại `delay: 0.35s`: Khối phép tính `35 × 11 = ?` rơi xuống (khớp từ "Ví dụ: 35 nhân 11").
     - Tại `delay: 2.2s`: Thẻ cảnh báo `⚠️ Đừng đặt tính vội` trượt lên kèm lắc lư `wiggle` (khớp từ "Đừng đặt tính vội nhé!").

---

## 4. MẪU XUẤT STORYBOARD BƯỚC 1 ĐỂ DUYỆT VỚI NGƯỜI DÙNG

Trước khi xuất JSON, ChatGPT luôn trình bày kịch bản dưới dạng Bảng Storyboard rõ ràng và khoa học:

| Cảnh | Thời gian (Độ dài) | Lời thoại Voiceover (Số từ) | Thị giác & Chuyển động (Visual & Delay) | SFX tương ứng |
| :--- | :---: | :--- | :--- | :--- |
| **Scene 1: Hook 3s đầu** | `0.0s – 4.2s`<br>*(4.2s)* | *"Mẹo nhân nhẩm với 11 trong 2 giây cho học sinh lớp 3!"*<br>*(13 từ ~ 3.4s)* | • `0.2s`: Badge Kicker `⚡ MẸO TOÁN LỚP 3 ⚡` (pop-punch)<br>• `0.45s`: Title 1 `NHÂN VỚI 11` (pop-punch)<br>• `0.75s`: Title 2 `CHỈ MẤT 2 GIÂY! ⚡` (pop-punch + pulse)<br>• `1.05s`: Bảng so sánh 60s vs 2s (slide-up) | • `0.1s`: whoosh<br>• `0.45s`: pop<br>• `0.75s`: pop |
| **Scene 2: Đặt bài toán** | `4.2s – 9.0s`<br>*(4.8s)* | *"Ví dụ: 35 nhân 11. Đừng đặt tính vội nhé!"*<br>*(10 từ ~ 2.6s)* | • `0.1s`: Thẻ đề bài (pop-punch)<br>• `0.35s`: Phép tính `35 × 11 = ?` (drop-bounce)<br>• `2.2s`: Cảnh báo `⚠️ Đừng đặt tính vội` (slide-up + wiggle) | • `4.2s`: whoosh<br>• `4.55s`: pop |
| **Scene 3: Bước 1 (Tách đôi)** | `9.0s – 13.0s`<br>*(4.0s)* | *"Bước một: Tách đôi số 3 sang trái, số 5 sang phải."*<br>*(12 từ ~ 3.1s)* | • `0.1s`: Thẻ Bước 1 (pop-punch)<br>• `0.4s`: Ô số `[ 3 ] [ ? ] [ 5 ]` bung ra 2 phía (elastic-pop) | • `9.0s`: whoosh<br>• `9.4s`: pop |
| **Scene 4: Bước 2 (Cộng nhét)** | `13.0s – 17.4s`<br>*(4.4s)* | *"Bước hai: Lấy 3 cộng 5 bằng 8, rồi nhét số 8 vào giữa!"*<br>*(14 từ ~ 3.7s)* | • `0.1s`: Thẻ Bước 2 (pop-punch)<br>• `0.35s`: Viên thuốc `3 + 5 = 8` (drop-bounce)<br>• `1.8s`: Quả cầu số 8 rơi đàn hồi vào ô giữa `[ 3 ] [ 8 ] [ 5 ]` | • `13.0s`: whoosh<br>• `14.8s`: boing |
| **Scene 5: Kết quả siêu tốc** | `17.4s – 22.4s`<br>*(5.0s)* | *"Ta được ngay kết quả: 385! Chỉ mất đúng 2 giây!"*<br>*(11 từ ~ 2.9s)* | • `0.1s`: Thẻ kết quả (pop-punch)<br>• `0.35s`: Số `385` bùng nổ 148px phát sáng (zoom-hero)<br>• `1.5s`: Huy hiệu `⚡ CHỈ MẤT ĐÚNG 2 GIÂY!` (pop-punch + pulse) | • `17.4s`: whoosh<br>• `17.75s`: chime (tada!) |
| **Scene 6: Thử thách & CTA** | `22.4s – 29.5s`<br>*(7.1s)* | *"Đố các bạn: 42 nhân 11 bằng bao nhiêu? Hãy bình luận đáp án và bấm Follow MathCA nhé!"*<br>*(19 từ ~ 5.0s)* | • `0.1s`: Thẻ thử thách (pop-punch)<br>• `0.35s`: Câu đố `42 × 11 = ?` (elastic-pop)<br>• `4.1s`: Chuột lướt vào nút `FOLLOW MATHCA ✨` và click nảy phím | • `22.4s`: whoosh<br>• `26.5s`: click |
