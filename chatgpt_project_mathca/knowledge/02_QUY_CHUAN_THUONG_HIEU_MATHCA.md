# 02. QUY CHUẨN THƯƠNG HIỆU MATHCA (BRAND GUIDELINES)

Tất cả các video do ChatGPT tạo ra bắt buộc phải thể hiện chính xác 100% nhận diện thương hiệu của Hệ thống Giáo dục Toán MathCA.

---

## 1. BẢNG MÀU CHUẨN (COLOR PALETTE)

| Tên màu | Mã HEX | Ý nghĩa & Vị trí sử dụng |
| :--- | :--- | :--- |
| **Teal Primary** | `#12ABA0` | Màu thương hiệu cốt lõi. Dùng cho Header tags, viền thẻ bài toán, nút CTA phụ. |
| **Teal Dark** | `#006A63` | Dùng cho Title chính (`NHÂN VỚI 11`) và số kết quả. Đạt chuẩn tương phản WCAG AAA trên nền sáng. |
| **Teal Soft** | `#E6F7F6` | Nền nhẹ của thẻ số, hộp kết quả nhẩm, hiệu ứng highlight. |
| **Coral Red** | `#FF5239` | Màu kích thích hành động. Dùng cho Title nhấn mạnh (`CHỈ MẤT 2 GIÂY!`), cảnh báo, nút `FOLLOW MATHCA`. |
| **Coral Dark** | `#B91E0C` | Đổ bóng nổi bật cho chữ đỏ hoặc viền thẻ cảnh báo. |
| **Yellow Vibrant** | `#FFBD05` | Màu của năng lượng, sự tươi vui. Dùng cho thẻ Kicker `⚡ MẸO TOÁN ⚡`, tia chớp, số rơi đàn hồi. |
| **Navy Dark** | `#1A1C1C` | Màu chữ nội dung chính. |
| **Navy Muted** | `#3C4947` | Màu chữ chú thích phụ. |
| **Background Soft**| `#FBFBF9` | Màu nền tổng thể kem dịu mắt kết hợp chấm bi toán học (`radial-gradient`). |

### Khai báo CSS Tokens bắt buộc:
```css
:root {
  --teal-primary: #12aba0;
  --teal-dark: #006a63;
  --teal-soft: #e6f7f6;
  --coral-red: #ff5239;
  --coral-dark: #b91e0c;
  --yellow-vibrant: #ffbd05;
  --yellow-light: #fff8e1;
  --navy-dark: #1a1c1c;
  --navy-muted: #3c4947;
  --surface-white: #ffffff;
  --bg-soft: #fbfbf9;
}
```

---

## 2. NỀN HỌA TIẾT CHẤM BI TOÁN HỌC (DOT-GRID BACKGROUND)

Nền video không được để trắng trơn mà phải có họa tiết chấm bi hoạt hình:
```css
.bg-container {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  background-color: #fbfbf9;
  background-image: 
    radial-gradient(#12aba0 2px, transparent 2px),
    radial-gradient(#ffbd05 1.5px, transparent 1.5px);
  background-size: 40px 40px, 80px 80px;
  background-position: 0 0, 20px 20px;
  opacity: 0.85;
  z-index: 1;
}
```

---

## 3. QUY CHUẨN FONT CHỮ (TYPOGRAPHY)
* **Font bắt buộc:** `Inter` (hoặc load qua Google Fonts hoặc nhúng cục bộ).
* Không bao giờ dùng font mặc định của máy tính (Arial, Times New Roman).
* Phân bổ cỡ chữ và độ đậm:
  - **Kicker Badge:** Cỡ chữ `28px`, độ đậm `900` (Black), viết hoa.
  - **Title chính Hook (Dòng 1):** Cỡ chữ `96px`, độ đậm `900` (Black), màu `--teal-dark`.
  - **Title phụ Hook (Dòng 2):** Cỡ chữ `90px`, độ đậm `900` (Black), màu `--coral-red`.
  - **Khối số bài toán:** Cỡ chữ `104px - 116px`, độ đậm `900`.
  - **Con số kết quả bùng nổ:** Cỡ chữ `148px - 160px`, độ đậm `900`.
  - **Văn bản hướng dẫn / Bong bóng thoại:** Cỡ chữ `30px - 34px`, độ đậm `700` hoặc `800`.

---

## 4. LINH VẬT CÚ CON (MASCOT) & LOGO
* **Logo MathCA:** Đặt ở giữa đỉnh màn hình (`top: 75px`), chiều cao `110px`, đi kèm tag "HỆ THỐNG GIÁO DỤC TOÁN MATHCA".
* **Mascot Cú con MathCA:** Đặt ở góc dưới bên phải (`bottom: 220px; right: 40px; width: 320px; z-index: 25;`).
* **Hành vi diễn hoạt của Cú con theo các phân cảnh:**
  1. *Hook 3s đầu:* Nhảy cẫng vào góc phải vẫy tay chào mừng vui tươi.
  2. *Cảnh ví dụ:* Nhô lên bóng thoại nhắc nhở: *"Đừng đặt tính vội nhé! 🦉"*.
  3. *Cảnh kết quả:* Nhảy múa ăn mừng hào hứng (`y: -50, repeat: 3`).
* **Con trỏ chuột đồ họa:** Cuối video có con trỏ chuột bay vào nhấp click nút `FOLLOW MATHCA ✨`.
