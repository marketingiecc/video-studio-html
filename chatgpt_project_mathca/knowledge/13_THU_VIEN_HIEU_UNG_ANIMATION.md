# 13. THƯ VIỆN HIỆU ỨNG CHUYỂN ĐỘNG & QUY TẮC LỚP (ANIMATION & LAYER DOCTRINE)

> **MỤC ĐÍCH**: Tài liệu này định nghĩa danh mục các hiệu ứng chuyển động GSAP chuẩn của HyperFrames mà ChatGPT **phải tích hợp vào từng element** trong file JSON khi sinh ra kịch bản video cho MathCA Video Studio Pro.

---

## 1. DANH MỤC 8 HIỆU ỨNG XUẤT HIỆN (ENTRY EFFECTS)

Mỗi element trong `scenes[].elements` cần được gắn trường `"animation": { "type": "...", "duration": ..., "delay": ... }`:

| Tên Type | Tên Hiển Thị | Cơ Chế GSAP | Áp Dụng Tối Ưu Cho |
|---|---|---|---|
| `pop-punch` | 💥 Bật nảy cực mạnh | `fromTo({ scale: 0.25, opacity: 0 }, { scale: 1, opacity: 1, ease: 'back.out(2.4)' })` | Tiêu đề Hook 3s đầu, Huy hiệu Kicker, Thẻ bước |
| `drop-bounce` | 🏀 Rơi tưng tưng đàn hồi | `fromTo({ y: -220, opacity: 0 }, { y: 0, opacity: 1, ease: 'bounce.out' })` | Phép tính, viên thuốc cộng nhét giữa, biểu tượng |
| `zoom-hero` | 🚀 Phóng to cực đại | `fromTo({ scale: 0.05, opacity: 0 }, { scale: 1, opacity: 1, ease: 'back.out(3.2)' })` | Con số đáp án bùng nổ 148px (ví dụ "385") |
| `slide-up` | ⬆️ Trượt dứt khoát từ dưới lên | `fromTo({ y: 150, opacity: 0 }, { y: 0, opacity: 1, ease: 'power3.out' })` | Bảng so sánh 2 cột, Banner cam kết, Cảnh báo |
| `slide-left` | ➡️ Trượt từ trái sang | `fromTo({ x: -220, opacity: 0 }, { x: 0, opacity: 1, ease: 'power3.out' })` | Thẻ diễn giải, đối tượng từ cạnh trái |
| `slide-right` | ⬅️ Trượt từ phải sang | `fromTo({ x: 220, opacity: 0 }, { x: 0, opacity: 1, ease: 'power3.out' })` | Mascot Cú con, thẻ đối đáp bên phải |
| `elastic-pop` | 🎯 Bung đàn hồi giật bật | `fromTo({ scale: 0.1, opacity: 0 }, { scale: 1, opacity: 1, ease: 'elastic.out(1, 0.35)' })` | Các ô số tách đôi `[ 3 ] [ ? ] [ 5 ]`, Khung thử thách |
| `fade-in` | ✨ Mờ dần xuất hiện | `fromTo({ opacity: 0 }, { opacity: 1, ease: 'power2.out' })` | Lời thoại phụ, nhãn chú thích nhỏ |

---

## 2. DANH MỤC 5 HIỆU ỨNG DUY TRÌ / NHẤN MẠNH (LOOP & EMPHASIS EFFECTS)

Trường `"loop"` được dùng để giữ cho đối tượng luôn sống động và thu hút sự chú ý của người xem (không bị chết hình):

| Tên Loop | Hiệu Ứng | Cơ Chế GSAP | Áp Dụng Cho |
|---|---|---|---|
| `none` | Tĩnh (Mặc định) | Giữ nguyên trạng thái | Các khối nội dung tĩnh |
| `pulse` | 💓 Đập nhịp tim (Heartbeat) | `to({ scale: 1.07, duration: 0.28, yoyo: true, repeat: N, ease: 'sine.inOut' })` | Tiêu đề phụ Hook ("CHỈ MẤT 2 GIÂY! ⚡"), Nút "FOLLOW MATHCA ✨", Huy hiệu tốc độ |
| `float` | 🌊 Bồng bềnh lơ lửng | `to({ y: -16, duration: 0.7, yoyo: true, repeat: N, ease: 'sine.inOut' })` | Mascot Cú con MathCA |
| `wiggle` | ⚡ Lắc lư nhịp điệu | `to({ rotation: 4, duration: 0.14, yoyo: true, repeat: N*2, ease: 'sine.inOut' })` | Thẻ cảnh báo `⚠️ Đừng đặt tính vội` |
| `glow` | 🌟 Nhấp nháy hào quang | `to({ filter: 'drop-shadow(0 0 20px #ffbd05)', duration: 0.45, yoyo: true, repeat: N, ease: 'sine.inOut' })` | Huy hiệu kết quả vàng, con số Climax |

*Lưu ý: MathCA Studio tự động tính toán số lần lặp $N$ hữu hạn dựa trên thời lượng cảnh. Tuyệt đối không dùng `repeat: -1`.*

---

## 3. QUY TẮC THỨ TỰ LỚP TRONG STUDIO (LAYER ORDER DOCTRINE)

Trong hệ thống render và Timeline CapCut của MathCA Video Studio Pro:
* **Quy chuẩn mã nguồn:** `scene.elements.at(-1)` là phần tử vẽ sau cùng, tức là **layer trên cùng** (có `z-index` cao nhất).
* **Quy chuẩn hiển thị Timeline:** Studio hiển thị các dòng layer theo thứ tự đảo ngược (`reverse`), tức là **dòng layer trên cùng trong Timeline chính là layer trên cùng trên màn hình Preview**.
* **Thực hành tốt nhất khi GPT tạo mảng `elements`:**
  1. Đặt các khối nền, container, thẻ bài toán lớn (`card`, `banner`) ở các vị trí đầu tiên của mảng (ví dụ index 0, 1).
  2. Đặt các dòng chữ, phép tính ở giữa mảng.
  3. Đặt các huy hiệu (`badge`), viên thuốc (`pill`), số Climax, hiệu ứng giật nảy ở cuối mảng để chúng luôn nổi lên trên, không bao giờ bị khung thẻ che khuất!
