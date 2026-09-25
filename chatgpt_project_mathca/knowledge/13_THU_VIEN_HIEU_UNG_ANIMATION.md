# 13. THƯ VIỆN HIỆU ỨNG CHUYỂN ĐỘNG HYPERFRAMES (ANIMATION LIBRARY CHO GPT)

> **MỤC ĐÍCH**: Tài liệu này định nghĩa danh mục các hiệu ứng chuyển động GSAP chuẩn của HyperFrames mà ChatGPT **phải tích hợp vào từng element** trong file JSON khi sinh ra kịch bản video cho MathCA Video Studio Pro.

---

## 1. Danh Mục Hiệu Ứng Xuất Hiện (Entry Effects)

Mỗi element trong `scenes[].elements` cần được gắn trường `"animation": { "type": "...", "duration": ..., "delay": ... }`:

| Tên Type | Tên Hiển Thị | Cơ Chế GSAP | Áp Dụng Tối Ưu Cho |
|---|---|---|---|
| `pop-punch` | 💥 Bật nảy cực mạnh | `fromTo({ scale: 0.25, opacity: 0 }, { scale: 1, opacity: 1, ease: 'back.out(2.4)' })` | Tiêu đề Hook 3s đầu, Huy hiệu Kicker, Thẻ bước |
| `drop-bounce` | 🏀 Rơi tưng tưng đàn hồi | `fromTo({ y: -260, opacity: 0 }, { y: 0, opacity: 1, ease: 'bounce.out' })` | Phép tính, viên thuốc cộng nhét giữa, biểu tượng |
| `zoom-hero` | 🚀 Phóng to cực đại | `fromTo({ scale: 0.05, opacity: 0 }, { scale: 1, opacity: 1, ease: 'back.out(3.2)' })` | Con số đáp án bùng nổ 148px (ví dụ "385") |
| `slide-up` | ⬆️ Trượt dứt khoát từ dưới lên | `fromTo({ y: 160, opacity: 0 }, { y: 0, opacity: 1, ease: 'power3.out' })` | Bảng so sánh 2 cột, Banner cam kết, Cảnh báo |
| `slide-left` | ➡️ Trượt từ trái sang | `fromTo({ x: -220, opacity: 0 }, { x: 0, opacity: 1, ease: 'power3.out' })` | Thẻ diễn giải, đối tượng từ cạnh trái |
| `slide-right` | ⬅️ Trượt từ phải sang | `fromTo({ x: 220, opacity: 0 }, { x: 0, opacity: 1, ease: 'power3.out' })` | Mascot Cú con, thẻ đối đáp |
| `elastic-pop` | 🎯 Bung đàn hồi giật bật | `fromTo({ scale: 0.1, opacity: 0 }, { scale: 1, opacity: 1, ease: 'elastic.out(1, 0.35)' })` | Các ô số tách đôi `[ 3 ] [ ? ] [ 5 ]`, Khung thử thách |
| `fade-in` | ✨ Mờ dần xuất hiện | `fromTo({ opacity: 0 }, { opacity: 1, ease: 'power2.out' })` | Lời thoại phụ, nhãn thương hiệu nhỏ |

---

## 2. Danh Mục Hiệu Ứng Duy Trì / Nhấn Mạnh (Loop / Emphasis Effects)

Trường `"loop"` được dùng để giữ cho đối tượng luôn sống động và thu hút sự chú ý của người xem (không bị chết hình):

| Tên Loop | Hiệu Ứng | Cơ Chế GSAP | Áp Dụng Cho |
|---|---|---|---|
| `none` | Tĩnh (Mặc định) | Giữ nguyên trạng thái | Các khối nội dung tĩnh |
| `pulse` | 💓 Đập nhịp tim (Heartbeat) | `to({ scale: 1.08, duration: 0.28, yoyo: true, repeat: -1, ease: 'sine.inOut' })` | Tiêu đề phụ Hook ("CHỈ MẤT 2 GIÂY! ⚡"), Nút "FOLLOW MATHCA ✨", Huy hiệu tốc độ |
| `float` | 🌊 Bồng bềnh lơ lửng | `to({ y: '-=16', duration: 0.7, yoyo: true, repeat: -1, ease: 'sine.inOut' })` | Mascot Cú con MathCA |
| `wiggle` | ⚡ Lắc lư nhịp điệu | `to({ rotation: 4, duration: 0.14, yoyo: true, repeat: -1, ease: 'sine.inOut' })` | Thẻ cảnh báo `⚠️ Đừng đặt tính vội` |
| `glow` | 🌟 Nhấp nháy hào quang | `to({ filter: 'drop-shadow(0 0 20px #ffbd05)', duration: 0.45, yoyo: true, repeat: -1, ease: 'sine.inOut' })` | Huy hiệu kết quả vàng |

---

## 3. Cấu Trúc Khai Báo Trong JSON

Khi ChatGPT sinh JSON, mọi phần tử (element) phải có cấu trúc như sau:

```json
{
  "id": "hook-title-2",
  "name": "Tiêu đề phụ dòng 2",
  "type": "text",
  "x": 90,
  "y": 265,
  "fontSize": 90,
  "text": "CHỈ MẤT 2 GIÂY! ⚡",
  "color": "#ff5239",
  "animation": {
    "type": "pop-punch",
    "loop": "pulse",
    "duration": 0.45,
    "delay": 0.75
  }
}
```

Phần mềm **MathCA Video Studio Pro** sẽ tự động:
1. Đọc trường `animation` này để hiển thị chuyển động sống động ngay trên màn hình Live Preview.
2. Cho phép người dùng chọn đổi hiệu ứng, thời lượng, độ trễ trên bảng Inspector bên phải.
3. Nhúng toàn bộ các hoạt ảnh này vào file render HyperFrames để xuất ra video MP4 mượt mà 30fps.
