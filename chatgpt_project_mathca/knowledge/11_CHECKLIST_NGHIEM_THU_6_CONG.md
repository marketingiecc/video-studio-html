# 11. CHECKLIST NGHIỆM THU 6 CỔNG CỦA CHATGPT TRƯỚC KHI BÀN GIAO JSON

Trước khi xuất khối mã JSON duy nhất cho người dùng nạp vào MathCA Video Studio Pro, ChatGPT bắt buộc phải tự động rà soát (Self-Audit) qua 6 cổng kiểm định chất lượng sau:

---

## CỔNG 1: KIỂM ĐỊNH KỊCH BẢN & CẢM XÚC REELS / TIKTOK
* [ ] Có đủ 3 hồi rõ ràng: Hook 3s đầu bùng nổ -> Diễn giải trực quan "Aha!" -> Thử thách & Kêu gọi Follow.
* [ ] Câu thoại Voiceover ở 3s đầu **đọc CHÍNH XÁC 100% dòng chữ Title** trên màn hình.
* [ ] Đòn bẩy tâm lý mạnh: Có bảng so sánh (60s vs 2s), câu hỏi kích thích tò mò hoặc cam kết "Không cần dùng nháp!".
* [ ] Cung bậc cảm xúc: Tò mò $\rightarrow$ Bất ngờ $\rightarrow$ Thấu hiểu bản chất $\rightarrow$ Hưng phấn $\rightarrow$ Tương tác comment.

---

## CỔNG 2: KIỂM ĐỊNH TƯƠNG QUAN VOICE VÀ THỜI LƯỢNG CẢNH (CHỐNG LỆCH TIẾNG)
* [ ] **Công thức kiểm tra số từ:** $T_{\text{đọc}} = \text{Số từ trong } voiceText / 3.8$.
* [ ] **Điều kiện an toàn:** $\text{Thời lượng cảnh } (endTime - startTime) \ge T_{\text{đọc}} + 0.4\text{s}$ (đệm thở tối thiểu 0.4s – 0.8s).
* [ ] Không có bất kỳ cảnh nào có lời thoại vượt quá thời lượng cảnh.
* [ ] Mốc `startTime` của scene đầu tiên bắt đầu từ `0.0`. Mốc `endTime` của scene cuối cùng bằng đúng `metadata.duration`.
* [ ] Thứ tự thời gian liên tục, không bị chồng chéo thời gian sai logic giữa các cảnh.

---

## CỔNG 3: KIỂM ĐỊNH ĐỒNG BỘ HIỆU ỨNG (VISUAL BEAT MATCHING)
* [ ] Từng phần tử trong mảng `elements` có `animation.delay` khớp chính xác với thời điểm giọng đọc vang lên từ khóa đó.
* [ ] Không để màn hình tĩnh lặng quá 1.5 giây.
* [ ] Các hiệu ứng xuất hiện dùng đúng mã thư viện Studio: `pop-punch`, `drop-bounce`, `zoom-hero`, `slide-up`, `slide-left`, `slide-right`, `elastic-pop`, `fade-in`.
* [ ] Không sử dụng `repeat: -1` trong bất kỳ hiệu ứng loop nào (chỉ dùng số lần lặp hữu hạn để chống treo render).

---

## CỔNG 4: KIỂM ĐỊNH BỐ CỤC & VÙNG AN TOÀN (SAFE AREA & LAYERS)
* [ ] Toạ độ `x, y` của các element trong scene nằm gọn trong Stage Card 940 × 1080px (tọa độ tương đối).
* [ ] Đúng quy chuẩn font chữ `Inter`, kích thước chữ rõ ràng, không có chữ đè lên chữ, không bị tràn ra ngoài hộp (`box overflow`).
* [ ] Thỏa mãn Safe Area cho TikTok/Reels: Nội dung quan trọng không bị nút Like/Share bên phải hoặc caption dưới đáy che khuất.
* [ ] **Quy tắc thứ tự lớp (Layer Order):** Element cuối mảng `elements` là layer trên cùng (`z-index` cao nhất). Các khối nền xếp trước, các chữ/số/huy hiệu nổi bật xếp sau.

---

## CỔNG 5: KIỂM ĐỊNH ÂM THANH ĐA KÊNH (BGM DUCKING & SFX)
* [ ] Mảng `audio.sfx` có đầy đủ các mốc `startTime` khớp đúng hành động thị giác (`whoosh` chuyển cảnh, `pop` nảy chữ, `boing` số rơi, `chime` kết quả, `click` CTA).
* [ ] Sử dụng đúng 5 assetId chuẩn của Studio: `preset-whoosh`, `preset-pop`, `preset-boing`, `preset-chime`, `preset-click`.
* [ ] Cấu hình BGM có ducking giảm -12dB khi có lời thoại để giọng giảng luôn to rõ nhất.

---

## CỔNG 6: KIỂM ĐỊNH CẤU TRÚC JSON MATHCA STUDIO PRO
* [ ] Cấu trúc JSON chuẩn 100%, không lỗi cú pháp cú pháp (parseable).
* [ ] Đủ 6 khối bắt buộc: `metadata`, `brand`, `scenes`, `globalElements`, `audio`, `html_template`.
* [ ] Không chứa các hàm không tất định (`Math.random()`, `Date.now()`).
* [ ] Xuất ra DUY NHẤT 1 khối code JSON kèm hướng dẫn người dùng nạp vào MathCA Studio (http://localhost:3300) để xem Live Preview và bấm Render MP4.
