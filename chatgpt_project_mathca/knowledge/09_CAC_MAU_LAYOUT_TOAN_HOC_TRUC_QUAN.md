# 09. CÁC MẪU BỐ CỤC TOÁN HỌC TRỰC QUAN (VISUAL MATH LAYOUT PATTERNS)

> **MỤC ĐÍCH**: Đây là thư viện các mẫu bố cục thị giác (Visual UI Patterns) được thiết kế riêng cho MathCA Video Studio Pro. ChatGPT hãy sử dụng các khối này khi dựng `scenes.elements` và `html_template` để biến các công thức toán học trừu tượng thành hình ảnh sinh động, dễ hiểu trong 3 giây.

---

## MẪU 1: Ô SỐ SLOTS & TÁCH SỐ ĐÀN HỒI (CHO MẸO TÍNH NHANH)
* **Áp dụng cho:** Nhân với 11, nhân 9, bình phương số đuôi 5, tính nhẩm 2-3 chữ số.
* **Cơ chế thị giác:** Số ban đầu tách đôi sang hai bên, để lại ô trống ở giữa. Quả cầu số phép cộng rơi tưng tưng (`bounce.out`) vào giữa.

### Cấu trúc Elements trong JSON:
```json
[
  {
    "id": "badge-step1",
    "name": "Thẻ Bước 1",
    "type": "badge",
    "x": 220, "y": 60, "fontSize": 32,
    "text": "BƯỚC 1: TÁCH ĐÔI SỐ 35",
    "color": "#1a1c1c", "bgColor": "#ffbd05",
    "animation": { "type": "pop-punch", "duration": 0.35, "delay": 0.1 }
  },
  {
    "id": "split-stage",
    "name": "Ô số tách đôi 3 ? 5",
    "type": "slots",
    "x": 120, "y": 300, "fontSize": 88,
    "text": "3 ? 5",
    "animation": { "type": "elastic-pop", "duration": 0.5, "delay": 0.35 }
  },
  {
    "id": "calc-pill",
    "name": "Viên thuốc 3 + 5 = 8",
    "type": "pill",
    "x": 270, "y": 230, "fontSize": 48,
    "text": "3 + 5 = 8",
    "color": "#ffffff", "bgColor": "#12aba0",
    "animation": { "type": "drop-bounce", "duration": 0.45, "delay": 0.3 }
  }
]
```

---

## MẪU 2: SƠ ĐỒ ĐOẠN THẲNG SINGAPORE BAR MODEL (CHO TOÁN ĐỐ)
* **Áp dụng cho:** Bài toán Tổng - Hiệu, Tổng - Tỉ, bài toán về tuổi (Lớp 3, 4, 5).
* **Cơ chế thị giác:** Hai thanh bar nằm ngang biểu diễn Số Lớn và Số Bé. Phần "Hiệu" được bôi đỏ nổi bật, trực quan hóa việc cắt bỏ phần thừa để đưa về 2 đoạn bằng nhau.

### Cấu trúc Markup trong `html_template`:
```html
<div class="bar-model-container" style="display:flex; flex-direction:column; gap:24px; width:800px; margin:40px auto;">
  <!-- Thanh Số Lớn -->
  <div style="display:flex; align-items:center; gap:16px;">
    <span style="font-size:32px; font-weight:900; width:140px; color:#006a63;">Số Lớn:</span>
    <div style="display:flex; height:70px; border-radius:18px; overflow:hidden; box-shadow:0 8px 20px rgba(0,0,0,0.1);">
      <div style="width:380px; background:#12aba0; display:flex; align-items:center; justify-content:center; color:#fff; font-size:30px; font-weight:900;">Số Bé</div>
      <div style="width:180px; background:#ff5239; display:flex; align-items:center; justify-content:center; color:#fff; font-size:30px; font-weight:900;">Hiệu: 12</div>
    </div>
  </div>

  <!-- Thanh Số Bé -->
  <div style="display:flex; align-items:center; gap:16px;">
    <span style="font-size:32px; font-weight:900; width:140px; color:#006a63;">Số Bé:</span>
    <div style="width:380px; height:70px; background:#12aba0; border-radius:18px; display:flex; align-items:center; justify-content:center; color:#fff; font-size:30px; font-weight:900; box-shadow:0 8px 20px rgba(0,0,0,0.1);">
      ?
    </div>
  </div>

  <!-- Thẻ Tổng -->
  <div style="margin-top:20px; background:#fff8e1; border:3px dashed #ffbd05; border-radius:24px; padding:16px 30px; text-align:center; font-size:36px; font-weight:900; color:#b78103;">
    Tổng 2 số = 48
  </div>
</div>
```

---

## MẪU 3: BẢNG SO SÁNH 2 CỘT ĐỐI ĐẦU (OLD WAY vs MATHCA WAY)
* **Áp dụng cho:** Hook 3s đầu bùng nổ, video so sánh phương pháp, video tuyển sinh.
* **Cơ chế thị giác:** Cột đỏ (Cách cũ) chậm chạp 60s vs Cột xanh MathCA siêu tốc 2s.

### Cấu trúc Elements trong JSON:
```json
{
  "id": "hook-vs-box",
  "name": "Bảng so sánh đối đầu",
  "type": "card",
  "x": 50,
  "y": 410,
  "width": 840,
  "fontSize": 32,
  "text": "⏳ CÁCH CŨ: 60 GIÂY  vs  ⚡ MẸO MATHCA: 2 GIÂY",
  "color": "#006a63",
  "bgColor": "#f8fcfb",
  "animation": { "type": "slide-up", "duration": 0.4, "delay": 1.05 }
}
```

---

## MẪU 4: MINIGAME ĐẾM NGƯỢC 5 GIÂY & DÃY SỐ QUY LUẬT
* **Áp dụng cho:** Đố vui toán học, kích thích comment đua top, tăng tỷ lệ xem hết (Completion Rate).
* **Cơ chế thị giác:** Dãy số câu đố `2, 4, 8, 16, [ ? ]` kèm đồng hồ đếm ngược 5 giây. Giọng đọc đếm dồn dập "5, 4, 3, 2, 1... Hết giờ!".

### Cấu trúc Markup trong `html_template`:
```html
<div class="quiz-container" style="display:flex; flex-direction:column; align-items:center; gap:30px; margin-top:40px;">
  <!-- Dãy số -->
  <div style="display:flex; gap:18px;">
    <span class="num-box" style="width:110px; height:130px; background:#e6f7f6; border:3px solid #12aba0; border-radius:22px; display:flex; align-items:center; justify-content:center; font-size:64px; font-weight:900; color:#006a63;">2</span>
    <span class="num-box" style="width:110px; height:130px; background:#e6f7f6; border:3px solid #12aba0; border-radius:22px; display:flex; align-items:center; justify-content:center; font-size:64px; font-weight:900; color:#006a63;">4</span>
    <span class="num-box" style="width:110px; height:130px; background:#e6f7f6; border:3px solid #12aba0; border-radius:22px; display:flex; align-items:center; justify-content:center; font-size:64px; font-weight:900; color:#006a63;">8</span>
    <span class="num-box" style="width:110px; height:130px; background:#e6f7f6; border:3px solid #12aba0; border-radius:22px; display:flex; align-items:center; justify-content:center; font-size:64px; font-weight:900; color:#006a63;">16</span>
    <span class="num-box quiz-target" style="width:110px; height:130px; background:#fff5f3; border:3.5px dashed #ff5239; border-radius:22px; display:flex; align-items:center; justify-content:center; font-size:64px; font-weight:900; color:#ff5239;">?</span>
  </div>

  <!-- Đồng hồ đếm ngược 5s -->
  <div id="countdown-badge" style="background:#ffbd05; color:#1a1c1c; font-size:36px; font-weight:900; padding:14px 44px; border-radius:9999px; box-shadow:0 10px 24px rgba(255,189,5,0.4);">
    ⏳ 5 GIÂY ĐẾM NGƯỢC...
  </div>
</div>
```

---

## MẪU 5: CON SỐ ĐÁP ÁN BÙNG NỔ 148PX (CLIMAX ANSWER)
* **Áp dụng cho:** Khoảnh khắc công bố kết quả của mọi video MathCA.
* **Cơ chế thị giác:** Cỡ chữ siêu lớn `148px`, phóng to từ tâm `zoom-hero`, đổ bóng hào quang, đi kèm hiệu ứng chuông reo `preset-chime`.

```json
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
}
```
