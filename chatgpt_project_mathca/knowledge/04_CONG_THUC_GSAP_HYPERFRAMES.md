# 04. CÔNG THỨC DIỄN HOẠT GSAP & HYPERFRAMES SPECIFICATION

Mã nguồn HTML và GSAP do ChatGPT sinh ra phải tuân thủ nghiêm ngặt các quy tắc kỹ thuật sau của HyperFrames để đảm bảo render 100% không lỗi.

---

## 1. CẤU TRÚC GỐC HYPERFRAMES BẮT BUỘC

Phần tử `#root` phải có đầy đủ các thuộc tính `data-*`:
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

  <!-- Audio Clip (Bắt buộc class="clip") -->
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
  <div class="header-wrapper">...</div>

  <!-- Stage Card trung tâm -->
  <div id="stage" class="stage-card">...</div>

  <!-- Mascot Cú con & Bong bóng thoại -->
  <div id="mascot-wrapper" class="mascot-stage-box">...</div>
  <div id="bubble" class="speech-bubble">...</div>

  <!-- Footer CTA & Con trỏ chuột -->
  <div class="footer-wrapper">...</div>
  <div id="cursor" class="click-cursor">...</div>
</div>
```

---

## 2. BỐ CỤC THẺ TRUNG TÂM CĂN GIỮA (TRÁNH KHOẢNG TRỐNG THỪA)

Thẻ bài toán (`.stage-card`) kích thước cố định `width: 940px; height: 1080px; top: 380px; left: 70px;`.
Các phân cảnh bên trong (`.stage-scene`) **BẮT BUỘC** phải có `justify-content: center;`:

```css
.stage-card {
  position: absolute;
  top: 380px;
  left: 70px;
  width: 940px;
  height: 1080px;
  background: var(--surface-white);
  border-radius: 40px;
  box-shadow: 0 20px 50px rgba(18, 171, 160, 0.12), 0 4px 12px rgba(0, 0, 0, 0.04);
  border: 2.5px solid rgba(18, 171, 160, 0.18);
  z-index: 10;
  overflow: hidden;
}

.stage-scene {
  position: absolute;
  inset: 0;
  padding: 40px 36px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center; /* Tự động căn giữa hoàn hảo */
}
```

---

## 3. NGUYÊN TẮC GSAP TIMELINE VÀ ĐĂNG KÝ BỘ ĐIỀU KHIỂN

1. **Khởi tạo trạng thái ban đầu (Immediate set outside timeline):**
   ```javascript
   window.__timelines = window.__timelines || {};

   // Bắt buộc đặt ngoài timeline để phần tử không bị nháy trước khi diễn hoạt
   gsap.set("#stage", { scale: 0.95, opacity: 0 });
   gsap.set(".header-wrapper", { y: -50, opacity: 0 });
   gsap.set("#mascot-wrapper", { x: 100, opacity: 0 });
   gsap.set("#bubble", { scale: 0, opacity: 0 });
   gsap.set("#cursor", { opacity: 0 });
   gsap.set("#scene-hook", { opacity: 1 });
   gsap.set("#scene-vidu, #scene-buoc1, #scene-buoc2, #scene-ketqua, #scene-thuthach", { 
     opacity: 0, 
     pointerEvents: "none" 
   });
   ```

2. **Master Timeline phải ở chế độ `paused: true` và được đăng ký vào `window.__timelines["main"]`:**
   ```javascript
   const tl = gsap.timeline({ paused: true });

   // --- KHAI BÁO CÁC BEAT CHUYỂN ĐỘNG ---
   // (Đồng bộ mili-giây chính xác với audio)

   // Đăng ký timeline cho Hyperframes engine
   window.__timelines["main"] = tl;
   ```

---

## 4. CÁC CÔNG THỨC EASING CHUẨN HOẠT HÌNH CỦA MATHCA

* **Bùng nổ chữ và số (Pop-punch):** Dùng `ease: "back.out(2.5)"` hoặc `back.out(2.0)`. Giúp khối số văng ra rồi khựng nhẹ rất đáng yêu.
  ```javascript
  tl.from("#hook-title-1", { scale: 0.25, y: 35, opacity: 0, duration: 0.45, ease: "back.out(2.4)" }, 0.45);
  ```
* **Rơi thả bóng số đàn hồi:** Dùng `ease: "bounce.out"`. Áp dụng khi số 8 rơi vào giữa 2 số 3 và 5.
  ```javascript
  tl.from("#slot-mid-filled", { y: -100, scale: 0.2, duration: 0.6, ease: "bounce.out" }, 14.8);
  ```
* **Hiệu ứng phát sáng nhịp tim (Pulse):** Dùng `ease: "sine.inOut"` với `yoyo: true`. Áp dụng cho dòng Title phụ ⚡ và nút CTA.
  ```javascript
  tl.to("#hook-title-2", { scale: 1.06, duration: 0.28, yoyo: true, repeat: 5, ease: "sine.inOut" }, 1.5);
  ```
* **Con trỏ chuột lướt vào click nút:**
  ```javascript
  tl.fromTo("#cursor", 
    { opacity: 0, x: 250, y: 120 }, 
    { opacity: 1, x: 0, y: 0, duration: 0.6, ease: "power3.out" }, 
    25.5
  );
  // Nhấp click nảy phím
  tl.to("#cursor", { scale: 0.8, duration: 0.1, yoyo: true, repeat: 1 }, 26.5);
  tl.to("#cta-btn", { scale: 0.94, duration: 0.1, yoyo: true, repeat: 1 }, 26.5);
  ```
