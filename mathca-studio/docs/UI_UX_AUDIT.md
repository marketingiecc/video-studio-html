# UI/UX Audit - Trước và sau nâng cấp

Cập nhật: **25/09/2026**

## Bằng chứng
- Giao diện gốc: `MathCA_Studio_UIUX_Redesign/reference/source_original.png`.
- Giao diện production hiện tại: `tests/artifacts/premium-1366x768.png`, `tests/artifacts/premium-1440x900.png`, `tests/artifacts/premium-1920x1080.png`.
- Flow media/layer: `tests/artifacts/e2e-media-layers.png`.
- Fixture E2E: `C:\Users\lexua\Downloads\MathCA_Lop3_5PhepTinhNangCao.json`.

## Trước nâng cấp
1. Preview không có zoom/pan đầy đủ nên khó chỉnh chi tiết.
2. Timeline chưa biểu diễn từng đối tượng như một layer độc lập.
3. Thứ tự lớp hình ảnh không thể quản lý trực quan như CapCut.
4. Inspector dài nhưng không có vùng cuộn ổn định ở màn hình thấp.
5. Chọn BGM chưa đi hết flow chọn asset -> preview -> Timeline -> render.
6. Chưa có thư viện ảnh/video kéo-thả vào dự án.
7. Trạng thái giữa JSON, Preview, Timeline và render có nguy cơ lệch nhau.

## Sau nâng cấp
- Preview có zoom, Fit, Ctrl/Cmd + wheel và scroll riêng.
- Timeline có một dòng cho từng object; row trên là visual layer trên.
- Kéo row/clip đổi layer và đồng bộ ngay vào JSON lẫn Preview.
- Inspector giữ tab/header cố định và cuộn phần nội dung.
- Media Library hợp nhất Image/Audio/Video, hỗ trợ nút thêm và drag-and-drop.
- BGM/SFX dùng asset bền vững, không lưu `blob:` URL.
- Video element hiển thị nhất quán trong canvas, template preview và render.
- Import tự tạo Voiceover nhưng vẫn bảo toàn `html_template` và schema gốc.

## Đánh giá bố cục responsive
| Kích thước | Kết quả |
|---|---|
| 1366x768 | Không tràn ngang; Preview, Inspector và layer Timeline còn hoạt động |
| 1440x900 | Bố cục cân bằng, đủ không gian chỉnh và Timeline |
| 1920x1080 | Tăng không gian Preview/Timeline, không kéo giãn control quá mức |
| 1366x650 | Inspector cuộn nội bộ; Timeline layer cuộn thay vì tăng chiều cao trang |

## Tính nhất quán chức năng
- Canonical playback clock điều khiển Preview, Voiceover, BGM, SFX và playhead.
- Undo/redo và autosave hoạt động với thay đổi audio/layer.
- Render progress có cancel/retry và không đóng modal khi job đang chạy.
- Composition generator dùng chung cho browser/server, giảm lệch Preview và MP4.

## Khả năng truy cập
- Studio chrome dùng control native, focus rõ và không phụ thuộc màu duy nhất.
- Zoom có nhiều phương thức; kéo layer/media có nút thêm hoặc Inspector làm phương án thay thế.
- HyperFrames runtime/layout check qua.
- Full contrast check phát hiện màu tương phản thấp nằm trong `html_template` gốc của fixture. Đây là nội dung nhập vào, được giữ nguyên theo yêu cầu bảo toàn source; chưa tự động recolor.

## Kết luận
Bản production đã chuyển từ giao diện chỉnh scene tuyến tính sang workspace dựng video có Preview điều hướng được, Timeline layer rõ ràng và thư viện media thực. Các chức năng gốc vẫn được giữ, trong khi BGM/SFX, layer order và media drag-drop đã đi hết flow đến MP4 render thật.
