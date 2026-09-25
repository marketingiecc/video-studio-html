# 02. QUY CHUẨN THƯƠNG HIỆU MATHCA (BRAND GUIDELINES & SAFE AREA)

Tất cả các video do ChatGPT tạo ra bắt buộc phải thể hiện chính xác 100% nhận diện thương hiệu của Hệ thống Giáo dục Toán MathCA và tuân thủ chuẩn an toàn hiển thị (Safe Area) cho TikTok & Facebook Reels.

---

## 1. BẢNG MÀU CHUẨN MATHCA STUDIO (COLOR PALETTE)

| Tên màu | Mã HEX | Vai trò & Vị trí sử dụng |
| :--- | :--- | :--- |
| **Teal Primary** | `#12ABA0` | Màu thương hiệu cốt lõi. Viền thẻ bài toán, huy hiệu phụ, màu nút phụ, icon Toán. |
| **Teal Dark** | `#006A63` | Màu tiêu đề chính (`NHÂN VỚI 11`), số kết quả lớn. Đạt tương phản WCAG AAA trên nền sáng. |
| **Teal Soft** | `#E6F7F6` | Nền các ô số (`slots`), nền phép tính nổi bật, nền thẻ bài toán mềm mại. |
| **Coral Red** | `#FF5239` | Màu kích thích hành động & cảm xúc mạnh. Dùng cho Tiêu đề nhấn mạnh Hook 3s (`CHỈ MẤT 2 GIÂY! ⚡`), cảnh báo, nút `FOLLOW MATHCA ✨`. |
| **Coral Dark** | `#B91E0C` | Đổ bóng cho chữ đỏ và viền thẻ nhấn mạnh. |
| **Yellow Vibrant** | `#FFBD05` | Màu năng lượng tích cực, sự thông minh. Dùng cho thẻ Kicker `⚡ MẸO TOÁN ⚡`, tia chớp, số rơi đàn hồi, huy hiệu tốc độ. |
| **Navy Dark** | `#1A1C1C` | Màu chữ nội dung chính, phép tính rõ ràng. |
| **Navy Muted** | `#3C4947` | Màu chữ chú thích phụ, giải thích bước tính. |
| **Background Soft**| `#FBFBF9` | Màu nền kem dịu mắt cho toàn bộ khung hình 1080x1920. |
| **Surface White** | `#FFFFFF` | Nền thẻ bài toán trung tâm (`#stage-card`), bóng đổ mềm. |

### Khai báo CSS Tokens chuẩn:
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

## 2. NỀN HỌA TIẾT CHẤM BI HOẠT HÌNH (DOT-GRID BACKGROUND)

Nền video 1080x1920 luôn có họa tiết chấm bi hoạt hình vui tươi tạo chiều sâu:
```css
.bg-container {
  position: absolute;
  inset: 0;
  width: 1080px;
  height: 1920px;
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

## 3. QUY CHUẨN TYPOGRAPHY (FONT CHỮ INTER)

* **Font chữ bắt buộc:** `Inter` (Font không chân hiện đại, nét tròn trịa thân thiện với trẻ em).
* **Phân cấp cỡ chữ trong Stage 940x1080:**
  - **Kicker Badge (Thẻ nhỏ đỉnh):** Cỡ chữ `26px - 30px`, độ đậm `900` (Black), chữ hoa.
  - **Title chính Hook (Dòng 1):** Cỡ chữ `88px - 96px`, độ đậm `900`, màu `#006a63`.
  - **Title phụ Hook (Dòng 2):** Cỡ chữ `80px - 90px`, độ đậm `900`, màu `#ff5239` có hiệu ứng `pulse`.
  - **Khối phép tính (`equation`):** Cỡ chữ `72px - 84px`, độ đậm `900`.
  - **Ô số tách (`slots`):** Cỡ chữ `88px - 104px`, độ đậm `900`.
  - **Con số kết quả bùng nổ (Climax):** Cỡ chữ `130px - 148px`, độ đậm `900`, màu `#006a63`.
  - **Thẻ cảnh báo / ghi chú:** Cỡ chữ `30px - 34px`, độ đậm `800`.

---

## 4. BỐ CỤC KHUNG HÌNH & VÙNG AN TOÀN REELS / TIKTOK (SAFE AREA)

Màn hình video có tỷ lệ **9:16 (1080 × 1920 px)**. TikTok và Instagram Reels có các thành phần giao diện che lấp (nút Like, Comment, Share ở bên phải; caption ở đáy; thanh trạng thái ở đỉnh). Do đó, bố cục MathCA được thiết kế hoàn hảo:

```
0px ─────────────────────────────────────────────────────────────
    [ TOP BARRIER: 0 - 75px ] Tránh notch camera và status bar
    ┌─────────────────────────────────────────────────────────┐
    │ HEADER: Logo MathCA (cao 110px) + Tag Giáo Dục          │ (Top: 75px)
    └─────────────────────────────────────────────────────────┘
380px ───────────────────────────────────────────────────────────
    ┌─────────────────────────────────────────────────────────┐
    │                                                         │
    │  STAGE CARD TRUNG TÂM (VÙNG AN TOÀN TUYỆT ĐỐI)         │
    │  Kích thước: 940px × 1080px (Tọa độ: Left 70px, Top 380px)
    │                                                         │
    │  - TẤT CẢ các phân cảnh bài toán diễn ra ở đây!         │
    │  - Không bao giờ bị bất kỳ nút bấm mạng xã hội nào che! │
    │                                                         │
    └─────────────────────────────────────────────────────────┘
1460px ──────────────────────────────────────────────────────────
    ┌───────────────────────────┐  ┌──────────────────────────┐
    │                           │  │ MASCOT CÚ CON MATHCA     │ (x: 720, y: 1380)
    │                           │  │ Kích thước: 320px         │ (Vẫy tay cổ vũ)
    └───────────────────────────┘  └──────────────────────────┘
    ┌─────────────────────────────────────────────────────────┐
    │ NÚT CTA: "FOLLOW MATHCA ✨" (x: 230, y: 1720, size 38px) │ (Nổi bật rực rỡ)
    └─────────────────────────────────────────────────────────┘
1920px ──────────────────────────────────────────────────────────
```

* **Vùng Stage trung tâm (`top: 380px, left: 70px, width: 940px, height: 1080px`):** Nằm gọn trong vùng vàng không bị che khuất trên mọi kích thước màn hình điện thoại (iPhone, Samsung, Xiaomi).
* **Mascot Cú con (`elem-mascot-wrapper`):** Đặt tại `x: 720, y: 1380, width: 320`. Biểu cảm tươi vui, động tác `float` hoặc `slide-left`.
* **Nút CTA (`elem-cta-btn`):** Đặt tại `x: 230, y: 1720`, kích thước font `38px`, màu nền `#ff5239`, chữ trắng, bo tròn `border-radius: 9999px`.
