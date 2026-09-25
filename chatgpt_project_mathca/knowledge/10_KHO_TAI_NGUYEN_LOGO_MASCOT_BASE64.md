# 10. KHO TÀI NGUYÊN LOGO, MASCOT VÀ ĐỒ HỌA (STUDIO ASSETS)

Trong **MathCA Video Studio Pro**, toàn bộ tài nguyên thương hiệu cốt lõi đã được lưu trữ bền vững tại thư mục `public/assets/`:
- `assets/logo.png`: Logo nhận diện chính thức của MathCA.
- `assets/mascot.png`: Mascot Cú con thông thái của MathCA.
- `assets/fonts/Inter-*.otf`: Trọn bộ font chữ Inter bản quyền hiển thị offline.

Khi GPT tạo mã HTML hoặc các phần tử `type: "image"` trong JSON, chỉ cần trỏ đường dẫn tới `assets/logo.png` và `assets/mascot.png`. Ngoài ra, nếu muốn hiển thị vector độc lập tuyệt đối, GPT có thể sử dụng các mã SVG chuẩn dưới đây:

### 1. Vector Logo MathCA (Chuẩn màu Teal `#12ABA0` + Coral `#FF5239` + Puzzle):
```html
<div class="logo-brand-svg" style="height: 110px; display: flex; align-items: center; justify-content: center; gap: 14px;">
  <!-- Biểu tượng chữ M ghép mảnh ghép Puzzle -->
  <svg width="90" height="90" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M15 85V25C15 19.4772 19.4772 15 25 15H38C43.5228 15 48 19.4772 48 25V42L52 38C55 35 60 35 63 38L75 50V25C75 19.4772 79.4772 15 85 15C90.5228 15 95 19.4772 95 25V85H80V60L65 75L50 60V85H15Z" fill="#12ABA0"/>
    <circle cx="35" cy="45" r="10" fill="#FF5239"/>
    <circle cx="65" cy="45" r="10" fill="#FFBD05"/>
  </svg>
  <span style="font-size: 72px; font-weight: 900; letter-spacing: -0.03em; color: #12ABA0;">math<span style="color: #FF5239;">CA</span></span>
</div>
```

### 2. Vector Mascot Cú Con MathCA (Cú đeo kính tri thức, đội mũ cử nhân, vẫy ngón tay cái):
```html
<div id="mascot-wrapper" class="mascot-stage-box" style="position: absolute; bottom: 220px; right: 40px; width: 300px; z-index: 25;">
  <svg viewBox="0 0 300 320" fill="none" xmlns="http://www.w3.org/2000/svg" style="width: 100%; filter: drop-shadow(0 14px 28px rgba(0,0,0,0.15));">
    <!-- Mũ cử nhân -->
    <polygon points="150,20 260,65 150,110 40,65" fill="#1C1838"/>
    <rect x="110" y="85" width="80" height="35" rx="8" fill="#14112B"/>
    <path d="M245 75V150C245 155 240 160 235 160C230 160 225 155 225 150V80" stroke="#FFBD05" stroke-width="5" stroke-linecap="round"/>
    <circle cx="230" cy="165" r="10" fill="#FFBD05"/>
    
    <!-- Thân Cú ngọc Teal -->
    <ellipse cx="150" cy="190" rx="95" ry="105" fill="#12ABA0"/>
    <!-- Bụng Cú vàng cam -->
    <ellipse cx="150" cy="215" rx="65" ry="70" fill="#FFBD05"/>
    
    <!-- Mắt kính to tròn thông thái -->
    <circle cx="105" cy="160" r="42" fill="#1A1C1C"/>
    <circle cx="195" cy="160" r="42" fill="#1A1C1C"/>
    <circle cx="105" cy="160" r="35" fill="#FFFFFF"/>
    <circle cx="195" cy="160" r="35" fill="#FFFFFF"/>
    <circle cx="112" cy="160" r="20" fill="#1A1C1C"/>
    <circle cx="188" cy="160" r="20" fill="#1A1C1C"/>
    <circle cx="120" cy="152" r="8" fill="#FFFFFF"/>
    <circle cx="196" cy="152" r="8" fill="#FFFFFF"/>
    <!-- Cầu nối gọng kính -->
    <rect x="140" y="156" width="20" height="8" rx="4" fill="#1A1C1C"/>
    
    <!-- Mỏ cam -->
    <polygon points="150,185 138,205 162,205" fill="#FF5239"/>
    
    <!-- Cánh trái ôm sách đỏ -->
    <rect x="55" y="190" width="35" height="55" rx="6" fill="#FF5239"/>
    <rect x="62" y="195" width="25" height="45" fill="#FFFFFF"/>
    <path d="M45 175C45 175 60 230 90 230" stroke="#0D8A81" stroke-width="12" stroke-linecap="round"/>
    
    <!-- Cánh phải giơ ngón tay cái Like khích lệ -->
    <path d="M255 175C255 175 240 230 210 230" stroke="#0D8A81" stroke-width="12" stroke-linecap="round"/>
    <ellipse cx="260" cy="180" rx="14" ry="18" fill="#0D8A81"/>
    
    <!-- Chân vàng -->
    <ellipse cx="115" cy="295" rx="20" ry="10" fill="#FFBD05"/>
    <ellipse cx="185" cy="295" rx="20" ry="10" fill="#FFBD05"/>
  </svg>
</div>
```

---

## PHƯƠNG ÁN 2: DÙNG TỆP ẢNH PNG CỤC BỘ
Nếu người dùng có sẵn tệp ảnh trong máy tính, ChatGPT cấu hình đường dẫn `assets/logo.png` và `assets/mascot.png` trong mã nguồn `index.html`. File `render.bat` sẽ tự động đọc các file này.
