# 06. HƯỚNG DẪN ĐÓNG GÓI 1-CLICK APP ZIP BẰNG PYTHON TRONG CHATGPT

Sau khi thống nhất kịch bản ở Nhiệm vụ 1, ChatGPT sẽ tự động dùng môi trường **Code Interpreter (Python Sandbox)** để thực hiện Nhiệm vụ 2: tạo các tệp mã nguồn và đóng gói thành 1 file ZIP duy nhất chứa **1-Click App** cho người dùng.

---

## 1. CẤU TRÚC THƯ MỤC TRONG FILE ZIP BÀN GIAO

File ZIP trả về (ví dụ: `MathCA_Video_Project_<topic>.zip`) phải có đầy đủ cấu trúc sau:

```
MathCA_Video_Project_<topic>/
├── index.html                   # Giao diện hoạt hình HTML5/CSS/GSAP hoàn chỉnh
├── SCRIPT.md                    # Bản lưu kịch bản chi tiết 3 hồi
├── build_audio_pipeline.py      # Script Python sinh TTS tiếng Việt & mix SFX chuẩn
├── render.bat                   # [1-CLICK APP] Nhấp đúp là tự động xuất video MP4!
├── preview.bat                  # [1-CLICK PREVIEW] Nhấp đúp là mở xem trước trên trình duyệt
├── README.md                    # Hướng dẫn sử dụng 1 bước siêu ngắn cho người dùng
└── assets/
    ├── logo.png                 # Logo MathCA
    ├── mascot.png               # Mascot Cú con MathCA
    ├── audio.mp3                # File âm thanh mẫu đã mix sẵn
    └── fonts/                   # Thư mục font Inter (hoặc nạp online)
```

---

## 2. NỘI DUNG TỆP CHẠY 1-CLICK `render.bat`

Tệp `render.bat` được tạo sẵn trong ZIP giúp người dùng Windows chỉ cần nhấp đúp là có ngay video mà không cần gõ lệnh phức tạp:

```bat
@echo off
chcp 65001 >nul
title MathCA Video 1-Click Render Engine
echo ========================================================
echo       HỆ THỐNG XUẤT VIDEO TỰ ĐỘNG MATHCA - 1-CLICK APP
echo ========================================================
echo.

:: 1. Kiểm tra audio.mp3, nếu chưa có thì chạy build_audio_pipeline.py
if not exist "assets\audio.mp3" (
    echo [*] Đang khởi tạo kênh âm thanh chuẩn (Voice 100%% + SFX 50%%)...
    python build_audio_pipeline.py
    if %errorlevel% neq 0 (
        echo [!] Khong the tao audio.mp3. Vui long kiem tra Python va FFmpeg.
    )
)

:: 2. Kiểm tra npx
where npx >nul 2>nul
if %errorlevel% neq 0 (
    echo [!] Máy tính của bạn chưa có Node.js / npx.
    echo [*] Đang mở trình duyệt xem thử chuyển động index.html...
    start index.html
    echo.
    echo Vui lòng cài đặt Node.js từ https://nodejs.org để xuất file video MP4 tự động.
    pause
    exit /b
)

:: 3. Render video với HyperFrames
echo [*] Đang render video chuẩn 1080x1920 (30 fps)...
echo Quá trình chụp khung hình và ghép âm thanh đang diễn ra...
call npx -y hyperframes render . -o output_mathca_final.mp4 --fps 30

if exist "output_mathca_final.mp4" (
    echo.
    echo ========================================================
    echo [THÀNH CÔNG] Video đã được xuất ra: output_mathca_final.mp4!
    echo ========================================================
    echo [*] Đang mở video thành phẩm...
    start output_mathca_final.mp4
) else (
    echo.
    echo [!] Có lỗi xảy ra trong quá trình render. Đang mở index.html để xem trước...
    start index.html
)

pause
```

---

## 3. NỘI DUNG TỆP XEM TRƯỚC `preview.bat`

```bat
@echo off
title MathCA Video Preview
echo [*] Đang khởi động trình duyệt xem trước chuyển động HyperFrames...
where npx >nul 2>nul
if %errorlevel% equ 0 (
    call npx -y hyperframes preview .
) else (
    start index.html
)
```

---

## 4. CODE PYTHON TRONG CHATGPT ĐỂ ĐÓNG GÓI ZIP

ChatGPT sẽ thực thi đoạn code Python tương tự sau trong sandbox để tạo gói ZIP:

```python
import os
import zipfile

project_name = "MathCA_Nhan11_Lop3"
os.makedirs(f"{project_name}/assets", exist_ok=True)

# 1. Ghi các file index.html, SCRIPT.md, build_audio_pipeline.py, render.bat, preview.bat, README.md
with open(f"{project_name}/index.html", "w", encoding="utf-8") as f:
    f.write(html_content)

with open(f"{project_name}/SCRIPT.md", "w", encoding="utf-8") as f:
    f.write(script_content)

with open(f"{project_name}/build_audio_pipeline.py", "w", encoding="utf-8") as f:
    f.write(audio_script_content)

with open(f"{project_name}/render.bat", "w", encoding="utf-8") as f:
    f.write(render_bat_content)

with open(f"{project_name}/preview.bat", "w", encoding="utf-8") as f:
    f.write(preview_bat_content)

# 2. Đóng gói ZIP
zip_filename = f"{project_name}.zip"
with zipfile.ZipFile(zip_filename, 'w', zipfile.ZIP_DEFLATED) as zipf:
    for root, dirs, files in os.walk(project_name):
        for file in files:
            file_path = os.path.join(root, file)
            arcname = os.path.relpath(file_path, start=project_name)
            zipf.write(file_path, arcname)

print(f"Hoàn tất đóng gói: {zip_filename}")
```
Sau đó ChatGPT trả về đường link tải file `zip_filename` trực tiếp trong khung chat.
