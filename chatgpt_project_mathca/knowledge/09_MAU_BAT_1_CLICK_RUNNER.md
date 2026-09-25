# 09. TẬP LỆNH CHẠY TỰ ĐỘNG 1-CLICK (RENDER.BAT & PREVIEW.BAT)

File batch chạy 1-click là thành phần then chốt giúp biến thư mục mã nguồn thành **một ứng dụng (App) hoàn chỉnh** đối với người dùng phổ thông. Người dùng chỉ cần tải file ZIP về, giải nén và nhấp đúp chuột là có ngay video MP4.

---

## 1. FILE CHÍNH: `render.bat` (XUẤT VIDEO TỰ ĐỘNG)

ChatGPT luôn nhúng file `render.bat` này vào thư mục gốc của file ZIP:

```bat
@echo off
chcp 65001 >nul
title MathCA Video Engine - 1-Click Render
color 0b

echo ===================================================================
echo             HỆ THỐNG XUẤT VIDEO HOẠT HÌNH MATHCA
echo                  (1-Click Autonomous App)
echo ===================================================================
echo.

:: 1. KIỂM TRA & TẠO KÊNH ÂM THANH NẾU CHƯA CÓ
if not exist "assets\audio.mp3" (
    echo [*] Đang khởi tạo kênh âm thanh chuẩn (Voice to rõ 100%% + SFX 50%%)...
    where python >nul 2>nul
    if %errorlevel% equ 0 (
        python build_audio_pipeline.py
    ) else (
        echo [!] Khong tim thay Python. Neu da co file audio.mp3 trong assets, tiep tuc render...
    )
)

:: 2. KIỂM TRA MÔI TRƯỜNG NODE.JS / NPX
where npx >nul 2>nul
if %errorlevel% neq 0 (
    echo.
    echo ===================================================================
    echo [THÔNG BÁO] Máy tính của bạn chưa cài đặt Node.js / npx.
    echo [*] Đang tự động mở trình duyệt để xem trước chuyển động index.html...
    echo ===================================================================
    start index.html
    echo.
    echo Để xuất ra video MP4 tự động, bạn chỉ cần tải nhanh Node.js:
    echo https://nodejs.org (Tải bản LTS và cài đặt Next -> Next là xong).
    echo.
    pause
    exit /b
)

:: 3. RENDER VIDEO VỚI ĐỘNG CƠ HYPERFRAMES
echo [*] Bắt đầu quá trình render video chất lượng cao (1080x1920, 30 fps)...
echo [*] Đang khởi động Headless Chrome để chụp từng khung hình...
echo.

call npx -y hyperframes render . -o output_mathca_final.mp4 --fps 30

:: 4. KIỂM TRA THÀNH PHẨM VÀ TỰ ĐỘNG MỞ VIDEO
if exist "output_mathca_final.mp4" (
    echo.
    echo ===================================================================
    echo [THÀNH CÔNG RỰC RỠ] Video đã được xuất xong: output_mathca_final.mp4!
    echo ===================================================================
    echo [*] Đang mở video thành phẩm để bạn thưởng thức ngay...
    start output_mathca_final.mp4
) else (
    echo.
    echo [!] Quá trình xuất MP4 gặp sự cố. Đang mở index.html để xem trước...
    start index.html
)

echo.
echo Nhấn phím bất kỳ để đóng cửa sổ này.
pause >nul
```

---

## 2. FILE XEM THỬ NHANH: `preview.bat`

Dành cho người dùng muốn mở trình xem trước (live preview) tương tác với thanh timeline trên trình duyệt:

```bat
@echo off
chcp 65001 >nul
title MathCA Video Live Preview
echo [*] Đang khởi động trình duyệt xem trước chuyển động MathCA...
where npx >nul 2>nul
if %errorlevel% equ 0 (
    call npx -y hyperframes preview .
) else (
    start index.html
)
```
