# 04. CÔNG THỨC DIỄN HOẠT GSAP & HYPERFRAMES SPECIFICATION

Mã nguồn HTML và GSAP do ChatGPT sinh ra (khi tạo `html_template` trong JSON) phải tuân thủ nghiêm ngặt các quy tắc kỹ thuật sau của HyperFrames và MathCA Studio để đảm bảo video render 100% mượt mà, không giật lag và không bao giờ bị lỗi.

---

## 1. CẤU TRÚC GỐC HYPERFRAMES BẮT BUỘC (ROOT ATTRIBUTES)

Phần tử `#root` và thẻ `<audio>` phải có đầy đủ các thuộc tính `data-*`:
```html
<div
  id="root"
  data-composition-id="main"
  data-start="0"
  data-duration="29.5"
  data-width="1080"
  data-height="1920"
>
  <!-- Background Pattern -->
  <div class="bg-container"></div>

  <!-- Audio Clip (Bắt buộc có id="soundtrack" và class="clip") -->
  <audio
    id="soundtrack"
    class="clip"
    src="assets/audio.mp3"
    data-start="0"
    data-duration="29.5"
    data-track-index="0"
    data-volume="1"
  ></audio>

  <!-- Header Logo & Brand Tag -->
  <div id="elem-header-brand" data-hf-id="elem-header-brand" class="header-wrapper">...</div>

  <!-- Stage Card trung tâm (940x1080) -->
  <div id="stage" class="stage-card">
    <section id="scene-hook" data-hf-id="scene-hook" class="stage-scene is-active">...</section>
    <section id="scene-vidu" data-hf-id="scene-vidu" class="stage-scene">...</section>
    ...
  </div>

  <!-- Mascot Cú con MathCA -->
  <div id="elem-mascot-wrapper" data-hf-id="elem-mascot-wrapper" class="mascot-stage-box">...</div>

  <!-- Nút Follow CTA -->
  <div id="elem-cta-btn" data-hf-id="elem-cta-btn" class="cta-button">...</div>
</div>
```

---

## 2. NGUYÊN TẮC GSAP TIMELINE & TẤT ĐỊNH (DETERMINISTIC RENDERING)

1. **Khởi tạo Timeline:** Timeline chính BẮT BUỘC có `{ paused: true }` và được đăng ký vào `window.__timelines["main"]`:
   ```javascript
   window.__timelines = window.__timelines || {};
   const tl = gsap.timeline({ paused: true });

   // Thêm các tween chuyển động tại đây...

   window.__timelines["main"] = tl;
   ```
2. **CẤM TUYỆT ĐỐI `repeat: -1`:** Trong quá trình render headless bằng Puppeteer, `repeat: -1` (vòng lặp vô hạn) sẽ khiến trình duyệt không xác định được frame đích và gây treo render. Mọi vòng lặp phải là **hữu hạn**:
   ```javascript
   // ĐÚNG: Tính số lần lặp dựa trên thời lượng khả dụng
   const repeat = Math.max(1, Math.min(20, Math.floor(availableDuration / 0.6)));
   tl.to("#elem-cta-btn", { scale: 1.07, duration: 0.28, yoyo: true, repeat: repeat, ease: "sine.inOut" }, start);

   // SAI: Tuyệt đối không dùng repeat: -1
   // tl.to("#elem-cta-btn", { repeat: -1 }); 
   ```
3. **CẤM `Date.now()` và `Math.random()` unseeded:** HyperFrames chụp frame dựa trên seek timeline. Mọi giá trị ngẫu nhiên hoặc timestamp động sẽ khiến các frame render bị nháy hình hoặc không thể tái lập.

---

## 3. CÔNG THỨC CHUYỂN CẢNH MƯỢT MÀ (SCENE TRANSITION)

Để chuyển cảnh không bị chớp trắng và giữ được độ trơn tru:
* Cảnh trước mờ dần biến mất (`autoAlpha: 0`) trong 0.22s trước mốc chuyển cảnh.
* Cảnh mới hiện lên (`autoAlpha: 1`) trong 0.28s tại đúng mốc `startTime` của cảnh mới.
```javascript
// Ví dụ chuyển từ scene-1 sang scene-2 tại mốc 4.2s:
tl.to("#scene-1", { autoAlpha: 0, duration: 0.22 }, 3.98); // (4.2 - 0.22)
tl.to("#scene-2", { autoAlpha: 1, duration: 0.28 }, 4.2);
```

---

## 4. THƯ VIỆN CÔNG THỨC EASING CHUẨN CỦA MATHCA STUDIO

Các công thức `fromTo` dưới đây là chuẩn mực được MathCA Studio áp dụng cho toàn bộ các element:

```javascript
// 1. pop-punch (Bật nảy dứt khoát - Hook, Title, Badge)
tl.fromTo(target, 
  { scale: 0.25, opacity: 0 }, 
  { scale: 1, opacity: 1, duration: 0.45, ease: "back.out(2.4)" }, 
  startTime
);

// 2. drop-bounce (Rơi tưng tưng đàn hồi - Phép tính, số giữa)
tl.fromTo(target, 
  { y: -220, opacity: 0 }, 
  { y: 0, opacity: 1, duration: 0.55, ease: "bounce.out" }, 
  startTime
);

// 3. zoom-hero (Phóng to cực đại bùng nổ - Đáp án Climax 148px)
tl.fromTo(target, 
  { scale: 0.05, opacity: 0 }, 
  { scale: 1, opacity: 1, duration: 0.5, ease: "back.out(3.2)" }, 
  startTime
);

// 4. slide-up (Trượt dứt khoát từ dưới lên - Thẻ so sánh, Banner, Cảnh báo)
tl.fromTo(target, 
  { y: 150, opacity: 0 }, 
  { y: 0, opacity: 1, duration: 0.4, ease: "power3.out" }, 
  startTime
);

// 5. slide-left (Trượt từ trái sang - Thẻ Bước, ô số bên trái)
tl.fromTo(target, 
  { x: -220, opacity: 0 }, 
  { x: 0, opacity: 1, duration: 0.45, ease: "power3.out" }, 
  startTime
);

// 6. slide-right (Trượt từ phải sang - Mascot, ô số bên phải)
tl.fromTo(target, 
  { x: 220, opacity: 0 }, 
  { x: 0, opacity: 1, duration: 0.45, ease: "power3.out" }, 
  startTime
);

// 7. elastic-pop (Bung giật đàn hồi - Khung tách số, Thử thách)
tl.fromTo(target, 
  { scale: 0.1, opacity: 0 }, 
  { scale: 1, opacity: 1, duration: 0.5, ease: "elastic.out(1, 0.35)" }, 
  startTime
);

// 8. fade-in (Mờ dần mềm mại - Lời giải thích nhỏ)
tl.fromTo(target, 
  { opacity: 0 }, 
  { opacity: 1, duration: 0.4, ease: "power2.out" }, 
  startTime
);
```

---

## 5. QUY TẮC THỨ TỰ LỚP (LAYER ORDER DOCTRINE)

Trong cấu trúc của MathCA Studio:
* **`scene.elements.at(-1)` là phần tử nằm trên cùng (z-index cao nhất).**
* Trong Timeline đa lớp kiểu CapCut của Studio, các dòng Timeline hiển thị theo thứ tự đảo ngược (`reverse`), tức là **dòng trên cùng trên Timeline chính là layer trên cùng trên màn hình Preview**.
* **Nguyên tắc khi GPT xếp mảng `elements` trong JSON:**
  1. Các khối nền, khung bao lớn (`card`, `banner`) xếp ở đầu mảng (layer dưới).
  2. Các khối nội dung, chữ, phép tính xếp ở giữa mảng.
  3. Các huy hiệu nổi bật (`badge`, `kicker`), con số bùng nổ, quả cầu rơi xếp ở cuối mảng (layer trên cùng, không bị các khối khác đè).
