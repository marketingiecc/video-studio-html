# 06. QUY TRÌNH SỬ DỤNG MATHCA VIDEO STUDIO PRO

MathCA Video Studio Pro là ứng dụng máy trạm hiện đại chạy tại `http://localhost:3300`, tích hợp toàn diện quy trình biên tập, xem trước và render video tự động từ file JSON do ChatGPT tạo ra.

---

## 1. KHỞI ĐỘNG PHẦN MỀM (CHO NGƯỜI DÙNG)
1. **Khởi động / Cài đặt lần đầu (Khuyên dùng số 1):** Nhấp đúp vào file **`Cai_Dat_MathCA_Studio.exe`**. Trình cài đặt đồ họa sẽ tự động kiểm tra/cài đặt môi trường Node.js LTS 22+, cài đặt thư viện phụ thuộc, chuẩn bị bộ render HyperFrames và tạo biểu tượng lối tắt ngoài màn hình Desktop.
2. **Khởi động hàng ngày:** Nhấp đúp vào biểu tượng trên Desktop hoặc file **`MathCA_Studio.exe`** (hoặc `start_studio.bat`). Trình duyệt sẽ tự động mở giao diện Studio tại:
   ```
   http://localhost:3300
   ```

---

## 2. LUỒNG NẠP FILE JSON TỪ CHATGPT VÀO STUDIO

Khi ChatGPT xuất ra khối code JSON:
1. **Cách 1 - Dán trực tiếp:** Người dùng bấm nút **"Dán JSON từ GPT"** (hoặc mở thanh bên trái chọn mục JSON) -> Dán toàn bộ đoạn mã JSON -> Bấm **"Áp dụng JSON"**.
2. **Cách 2 - Kéo thả file:** Lưu nội dung JSON thành file `.json` (Ví dụ: `nhan_11_lop_3.json`) -> Bấm nút **"Mở JSON"** trên thanh công cụ của Studio.

Ngay sau khi nạp JSON thành công, MathCA Studio tự động thực thi chuỗi hành động ngầm:
* **Tự động sinh hoặc nạp Voiceover:** Server gọi API `POST /api/generate-audio`. Nếu câu thoại chưa đổi, server dùng lại cache; nếu là kịch bản mới, server gọi Edge-TTS sinh file giọng đọc từng cảnh và muxing chuẩn 48 kHz stereo.
* **Dựng Live Preview thời gian thực:** Iframe Preview hiển thị ngay bố cục 1080x1920 với chuyển động GSAP mượt mà.
* **Kích hoạt Timeline đa lớp:** Phân cảnh, giọng đọc, BGM, SFX và từng đối tượng trong cảnh hiện lên trên các track riêng biệt.

---

## 3. CÁC TÍNH NĂNG BIÊN TẬP TRỰC QUAN TRÊN STUDIO
* **Preview Zoom & Pan:** Có thanh trượt Zoom, nút **Vừa khung**, hỗ trợ `Ctrl/Cmd + lăn chuột` để phóng to/thu nhỏ vùng làm việc.
* **Kéo thả đối tượng trực tiếp:** Nhấp chuột vào bất kỳ chữ, số, huy hiệu, mascot trên Preview để kéo di chuyển vị trí X, Y trực quan.
* **Quản lý Layer Timeline kiểu CapCut:** Mỗi đối tượng của cảnh đang chọn có 1 dòng Timeline riêng. Kéo thả dòng để thay đổi thứ tự lớp (`z-index`) ngay lập tức.
* **Thanh Inspector bên phải:** Điều chỉnh chi tiết tọa độ X/Y, cỡ chữ, màu sắc, hiệu ứng xuất hiện (`animation`), thời lượng và độ trễ.
* **Media Library & Audio Library:** Cho phép thêm ảnh, video, chọn nhạc nền BGM hoặc chèn các hiệu ứng âm thanh SFX vào đúng mốc thời gian playhead.

---

## 4. XUẤT VIDEO THÀNH PHẨM (RENDER MP4)
1. Bấm nút màu cam san hô nổi bật ở góc trên bên phải: **"RENDER VIDEO MP4"**.
2. Modal tiến trình hiển thị tỷ lệ % render thời gian thực (chụp từng khung hình và ghép âm thanh master).
3. Khi đạt 100%, video MP4 thành phẩm được lưu tại thư mục `mathca-studio/rendered_output/` hoặc tự động tải về máy người dùng.
4. Video sẵn sàng 100% để đăng tải lên TikTok, Facebook Reels, YouTube Shorts!
