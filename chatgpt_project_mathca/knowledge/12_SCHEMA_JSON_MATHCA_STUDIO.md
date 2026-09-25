# 12. CẤU TRÚC FILE JSON MATHCA STUDIO (SCHEMA CHUẨN ĐỂ GPT XUẤT RA)

> **MỤC ĐÍCH**: Đây là quy chuẩn cấu trúc dữ liệu JSON duy nhất mà ChatGPT phải tạo ra khi người dùng yêu cầu kịch bản & sản xuất video. Phần mềm **MathCA Video Studio Pro** sẽ nhận file JSON này để hiển thị Live Preview, cho phép kéo thả chỉnh sửa và bấm Render video.

---

## 1. Cấu Trúc Tổng Quan Của File JSON

File JSON gồm 5 khối chính:
1. `metadata`: Thông tin chung (Tiêu đề, Lớp học, Chủ đề, Thời lượng video, Giọng đọc AI).
2. `brand`: Bảng màu chuẩn MathCA và font chữ.
3. `scenes`: Danh sách các phân cảnh (Bám sát kịch bản 3 hồi, có voiceText và danh sách elements có tọa độ `x, y`).
4. `globalElements`: Các đối tượng dùng chung toàn video (Header, Cú con MathCA, Nút Follow CTA).
5. `html_template`: Mã HTML5 HyperFrames hoàn chỉnh (tích hợp đầy đủ CSS và GSAP animation).

---

## 2. Bản Mẫu JSON Chuẩn (Reference JSON)

```json
{
  "metadata": {
    "title": "Mẹo nhân 11 trong 2 giây - Lớp 3",
    "grade": 3,
    "topic": "Nhân số có 2 chữ số với 11",
    "duration": 29.5,
    "voice": "vi-VN-HoaiMyNeural"
  },
  "brand": {
    "colors": {
      "tealPrimary": "#12aba0",
      "tealDark": "#006a63",
      "tealSoft": "#e6f7f6",
      "coralRed": "#ff5239",
      "yellowVibrant": "#ffbd05"
    },
    "fontFamily": "Inter"
  },
  "scenes": [
    {
      "id": "scene-hook",
      "name": "Hook 3s đầu bùng nổ",
      "startTime": 0.0,
      "endTime": 4.2,
      "voiceText": "Mẹo nhân nhẩm với 11 trong 2 giây cho học sinh lớp 3!",
      "elements": [
        {
          "id": "hook-kicker",
          "name": "Thẻ Kicker",
          "type": "badge",
          "x": 280,
          "y": 60,
          "fontSize": 28,
          "text": "⚡ MẸO TOÁN LỚP 3 ⚡",
          "color": "#1a1c1c",
          "bgColor": "#ffbd05"
        },
        {
          "id": "hook-title-1",
          "name": "Tiêu đề chính dòng 1",
          "type": "text",
          "x": 160,
          "y": 150,
          "fontSize": 96,
          "text": "NHÂN VỚI 11",
          "color": "#006a63"
        },
        {
          "id": "hook-title-2",
          "name": "Tiêu đề phụ dòng 2",
          "type": "text",
          "x": 90,
          "y": 265,
          "fontSize": 90,
          "text": "CHỈ MẤT 2 GIÂY! ⚡",
          "color": "#ff5239"
        },
        {
          "id": "hook-vs-box",
          "name": "Bảng so sánh 2 cột",
          "type": "card",
          "x": 50,
          "y": 410,
          "width": 840,
          "text": "CÁCH CŨ: 60 GIÂY vs MẸO MATHCA: 2 GIÂY"
        },
        {
          "id": "hook-bottom",
          "name": "Banner cam kết",
          "type": "card",
          "x": 50,
          "y": 650,
          "width": 840,
          "text": "🚀 Bí quyết tính nhẩm siêu tốc — Không cần nháp!"
        }
      ]
    },
    {
      "id": "scene-vidu",
      "name": "Đặt bài toán 35 x 11",
      "startTime": 4.2,
      "endTime": 9.0,
      "voiceText": "Ví dụ: 35 nhân 11. Đừng đặt tính vội nhé!",
      "elements": [
        {
          "id": "badge-vidu",
          "name": "Thẻ tiêu đề",
          "type": "badge",
          "x": 280,
          "y": 60,
          "fontSize": 32,
          "text": "BÀI TOÁN TÍNH NHANH",
          "color": "#ffffff",
          "bgColor": "#12aba0"
        },
        {
          "id": "equation-display",
          "name": "Phép tính 35 x 11 = ?",
          "type": "equation",
          "x": 120,
          "y": 240,
          "fontSize": 76,
          "text": "35 × 11 = ?"
        },
        {
          "id": "warning-card",
          "name": "Cảnh báo đặt tính",
          "type": "card",
          "x": 90,
          "y": 520,
          "width": 760,
          "fontSize": 32,
          "text": "⚠️ Đừng vội lấy giấy bút đặt tính nhé!"
        }
      ]
    },
    {
      "id": "scene-buoc1",
      "name": "Bước 1: Tách đôi số 35",
      "startTime": 9.0,
      "endTime": 13.0,
      "voiceText": "Bước một: Tách đôi số 3 sang trái, số 5 sang phải.",
      "elements": [
        {
          "id": "badge-buoc1",
          "name": "Thẻ Bước 1",
          "type": "badge",
          "x": 230,
          "y": 60,
          "fontSize": 32,
          "text": "BƯỚC 1: TÁCH ĐÔI SỐ 35",
          "color": "#1a1c1c",
          "bgColor": "#ffbd05"
        },
        {
          "id": "split-stage",
          "name": "Ô số tách đôi [ 3 ] [ ? ] [ 5 ]",
          "type": "slots",
          "x": 120,
          "y": 300,
          "fontSize": 88,
          "text": "3 ? 5"
        }
      ]
    },
    {
      "id": "scene-buoc2",
      "name": "Bước 2: Cộng nhét giữa",
      "startTime": 13.0,
      "endTime": 17.4,
      "voiceText": "Bước hai: Lấy 3 cộng 5 bằng 8, rồi nhét số 8 vào giữa!",
      "elements": [
        {
          "id": "badge-buoc2",
          "name": "Thẻ Bước 2",
          "type": "badge",
          "x": 190,
          "y": 60,
          "fontSize": 32,
          "text": "BƯỚC 2: CỘNG LẠI NHÉT VÀO GIỮA",
          "color": "#ffffff",
          "bgColor": "#ff5239"
        },
        {
          "id": "calc-pill",
          "name": "Viên thuốc phép tính 3 + 5 = 8",
          "type": "pill",
          "x": 270,
          "y": 230,
          "fontSize": 48,
          "text": "3 + 5 = 8"
        },
        {
          "id": "split-filled",
          "name": "Ô số hoàn thành [ 3 ] [ 8 ] [ 5 ]",
          "type": "slots",
          "x": 120,
          "y": 450,
          "fontSize": 88,
          "text": "3 8 5"
        }
      ]
    },
    {
      "id": "scene-ketqua",
      "name": "Kết quả siêu tốc 385",
      "startTime": 17.4,
      "endTime": 22.4,
      "voiceText": "Ta được ngay kết quả: 385! Chỉ mất đúng 2 giây!",
      "elements": [
        {
          "id": "badge-ketqua",
          "name": "Thẻ kết quả",
          "type": "badge",
          "x": 280,
          "y": 60,
          "fontSize": 32,
          "text": "KẾT QUẢ SIÊU TỐC",
          "color": "#ffffff",
          "bgColor": "#12aba0"
        },
        {
          "id": "final-answer",
          "name": "Số đáp án 385",
          "type": "text",
          "x": 290,
          "y": 240,
          "fontSize": 148,
          "text": "385",
          "color": "#006a63"
        },
        {
          "id": "speed-badge",
          "name": "Huy hiệu 2 giây",
          "type": "badge",
          "x": 230,
          "y": 500,
          "fontSize": 34,
          "text": "⚡ CHỈ MẤT ĐÚNG 2 GIÂY!",
          "color": "#1a1c1c",
          "bgColor": "#ffbd05"
        }
      ]
    },
    {
      "id": "scene-thuthach",
      "name": "Thử thách 42 x 11 & Follow",
      "startTime": 22.4,
      "endTime": 29.5,
      "voiceText": "Đố các bạn: 42 nhân 11 bằng bao nhiêu? Hãy bình luận đáp án và bấm Follow MathCA nhé!",
      "elements": [
        {
          "id": "badge-thuthach",
          "name": "Thẻ thử thách",
          "type": "badge",
          "x": 250,
          "y": 60,
          "fontSize": 32,
          "text": "THỬ THÁCH CHO BẠN",
          "color": "#1a1c1c",
          "bgColor": "#ffbd05"
        },
        {
          "id": "quiz-card",
          "name": "Khung câu đố 42 x 11 = ?",
          "type": "card",
          "x": 60,
          "y": 200,
          "width": 820,
          "fontSize": 76,
          "text": "42 × 11 = ?"
        }
      ]
    }
  ],
  "globalElements": [
    {
      "id": "elem-header-brand",
      "name": "Header Logo & Tiêu Đề",
      "x": 0,
      "y": 75,
      "type": "global"
    },
    {
      "id": "elem-mascot-wrapper",
      "name": "Mascot Cú con",
      "x: 720,
      "y": 1380,
      "width": 320,
      "type": "global"
    },
    {
      "id": "elem-cta-btn",
      "name": "Nút Follow MathCA",
      "x": 230,
      "y": 1720,
      "fontSize": 38,
      "text": "FOLLOW MATHCA ✨",
      "color": "#ffffff",
      "bgColor": "#ff5239",
      "type": "global"
    }
  ],
  "html_template": "<!doctype html><html lang=\"vi\">... (Mã HTML HyperFrames hoàn chỉnh có GSAP timeline) ...</html>"
}
```

---

## 3. Quy Tắc Khi ChatGPT Xuất Dữ Liệu
1. **Toạ độ X, Y**: Hệ trục toạ độ tính từ góc trên bên trái của thẻ trung tâm (`#stage-card`, kích thước 940 × 1080px).
2. **Khối lượng nội dung**: Đảm bảo không quá 3 dòng text trong một màn hình để tránh rối mắt.
3. **Mã HTML tích hợp (`html_template`)**: Nếu người dùng yêu cầu xuất file JSON hoàn chỉnh, hãy nhúng mã HTML HyperFrames đã căn chỉnh GSAP timeline tương ứng với các scene và thời lượng trong trường `html_template`. Nếu không, phần mềm MathCA Studio sẽ tự động sinh HTML từ các elements trong `scenes`.
