# 15. QUY TRÌNH SELF-LOOP AUDIT JSON + HTML MATHCA
## Chống lỗi chữ đè nhau, xuống dòng sai, text tràn box và bố cục xấu

> MỤC ĐÍCH:
> Tài liệu này là “cổng kiểm định bắt buộc” sau khi GPT tạo JSON/HTML và TRƯỚC KHI bàn giao cho người dùng.
> GPT KHÔNG ĐƯỢC coi file là hoàn thành chỉ vì JSON parse được hoặc HTML chạy được.
> File chỉ được bàn giao khi qua đủ: JSON Audit -> Text/Layout Audit -> DOM Audit -> Preview Audit -> Final Audit.

---

# 1. NGUYÊN TẮC TỐI CAO

Mỗi lần tạo video MathCA, GPT phải chạy theo vòng lặp:

DRAFT JSON
  ↓
AUDIT CẤU TRÚC JSON
  ↓
AUDIT TEXT + KÍCH THƯỚC BOX
  ↓
SINH / ĐỌC HTML_TEMPLATE
  ↓
AUDIT DOM GEOMETRY
  ↓
PREVIEW 1080x1920 TẠI CÁC MỐC QUAN TRỌNG
  ↓
PHÁT HIỆN LỖI?
  ├─ CÓ  -> SỬA -> CHẠY LẠI TOÀN BỘ AUDIT
  └─ KHÔNG -> FINAL PASS -> BÀN GIAO

Không được bỏ qua vòng lặp này.

Mặc định tối đa 5 vòng sửa.
Nếu sau 5 vòng vẫn còn lỗi layout, KHÔNG tiếp tục vá bằng margin âm / scale tùy tiện.
Phải thiết kế lại scene hoặc rút gọn text rồi audit lại từ đầu.

---

# 2. ĐIỀU KIỆN “FINAL PASS”

Chỉ được xuất file JSON cho người dùng khi TẤT CẢ điều kiện sau cùng đúng:

- JSON hợp lệ, parse được 100%.
- Đủ 5 khối chuẩn:
  - metadata
  - brand
  - scenes
  - globalElements
  - html_template
- duration từ 25s đến 35s.
- Scene đầu bắt đầu tại 0.
- Scene cuối kết thúc đúng metadata.duration.
- Không có scene chồng thời gian sai hoặc khoảng trống ngoài chủ ý.
- Tất cả scene có voiceText.
- Tất cả element có animation.
- Không có chữ đè lên chữ.
- Không có box đè vào box quan trọng.
- Không có text bị cắt.
- Không có text tràn khỏi box.
- Không có badge / button / equation tự xuống dòng.
- Không có câu bị xuống dòng ở vị trí vô nghĩa.
- Không có một từ đơn lẻ bị rơi xuống dòng cuối.
- Hook đọc đúng nội dung Title hiển thị.
- Title Hook rõ, lớn, nhưng không chạm nhau.
- CTA không bị mascot hoặc cursor che.
- Mascot không che nội dung toán.
- Preview đúng khung 1080x1920.
- Không có phần tử nào ra ngoài safe area.

CHỈ CẦN 1 MỤC FAIL -> FILE CHƯA ĐƯỢC BÀN GIAO.

---

# 3. AUDIT CẤU TRÚC JSON

GPT phải tự kiểm:

## 3.1 metadata

Bắt buộc:

- metadata.title: không rỗng.
- metadata.grade: số nguyên.
- metadata.topic: không rỗng.
- metadata.duration: 25 <= duration <= 35.
- metadata.voice: mặc định `vi-VN-HoaiMyNeural`.

## 3.2 brand

Bắt buộc đúng:

- Teal Primary: #12ABA0
- Teal Dark: #006A63
- Coral: #FF5239
- Yellow: #FFBD05
- Font: Inter

Không tự ý dùng Arial / Times New Roman.

## 3.3 scenes

Mỗi scene phải có:

- id
- name
- startTime
- endTime
- voiceText
- elements

Kiểm tra:

- startTime < endTime.
- startTime scene sau >= startTime scene trước.
- Không có scene vượt metadata.duration.
- Scene cuối endTime = metadata.duration.
- Hook nên kết thúc khoảng 4.2s.
- CTA nằm ở phần cuối video.

## 3.4 elements

Mỗi element bắt buộc có tối thiểu:

- id
- name
- type
- x
- y
- width
- fontSize
- text
- color
- bgColor
- animation

animation bắt buộc có:

- type
- loop
- duration
- delay

Không được bỏ `width` ở các phần tử text quan trọng vì Studio cần biết giới hạn box để audit wrap.

---

# 4. QUY TẮC CHỐNG CHỮ ĐÈ LÊN NHAU

## 4.1 Không đặt text lớn bằng tọa độ Y “ước lượng”

Sai:
- Title 1 có khả năng wrap 2 dòng nhưng Title 2 vẫn đặt ở Y cố định ngay bên dưới như thể Title 1 chỉ có 1 dòng.

Đúng:
- Trước khi chốt Y của phần tử tiếp theo, phải biết CHIỀU CAO THỰC TẾ của phần tử trước.
- Ưu tiên flow/flex layout trong HTML.
- Nếu JSON Studio dùng tọa độ tuyệt đối, phải tính bounding box thực tế rồi mới chốt x/y.

## 4.2 Khoảng cách tối thiểu

Giữa hai khối text lớn:
- tối thiểu 18px.

Giữa Title Hook chính và Title nhấn:
- khuyến nghị 24px đến 36px.

Giữa badge và title:
- tối thiểu 24px.

Giữa equation và hint:
- tối thiểu 36px.

Không cho phép bounding box giao nhau dù chỉ 1px.

## 4.3 Cấm dùng negative margin để “vá”

Không được:
- margin-top âm
- translateY âm tùy tiện
- line-height cực thấp
- scaleX nhỏ để nhét chữ

Các cách trên dễ đẹp ở 1 frame nhưng lỗi khi render hoặc thay font.

---

# 5. QUY TẮC XUỐNG DÒNG

## 5.1 Những element TUYỆT ĐỐI KHÔNG ĐƯỢC tự xuống dòng

- badge
- CTA button
- equation
- speed badge
- VS comparison line ngắn
- pill phép tính
- số kết quả
- nhãn “CÂU 1 / 5”
- nhãn “THỬ THÁCH BONUS”
- nhãn bước

CSS bắt buộc:

```css
white-space: nowrap;
overflow-wrap: normal;
word-break: keep-all;
```

Nếu text không vừa:
1. Tăng width.
2. Giảm fontSize trong giới hạn cho phép.
3. Rút gọn câu.
4. Chuyển layout.

KHÔNG cho browser tự wrap.

## 5.2 Title Hook

Title Hook có thể 1 hoặc 2 dòng.

Nhưng:
- Phải xuống dòng CÓ CHỦ Ý.
- Dùng line break thủ công hoặc chia thành 2 element.
- Không để browser tự quyết định điểm xuống dòng.

Ví dụ tốt:

Dòng 1:
`5 PHÚT LUYỆN TOÁN`

Dòng 2:
`LỚP 3`

Sau đó mới đến dòng nhấn:
`5 PHÉP TÍNH NÂNG CAO!`

Ví dụ xấu:

`5 PHÚT LUYỆN`
`TOÁN LỚP 3`

nếu câu bị tách chỉ vì box quá hẹp và làm Title 2 đè lên dòng dưới.

## 5.3 Không được ngắt câu vô nghĩa

Không để:

`THỬ THÁCH`
`BONUS`

nếu badge có thể mở rộng để hiển thị:
`THỬ THÁCH BONUS`

Không để:

`Nhẩm nhanh, phản xạ`
`chuẩn!`

nếu box vẫn còn đủ không gian để giữ cụm nghĩa.

## 5.4 Không có “orphan word”

Một dòng cuối chỉ có 1 từ ngắn là FAIL.

Ví dụ FAIL:

`Không cần nháp — Nhẩm nhanh, phản xạ`
`chuẩn!`

Phải:
- tăng width,
- giảm font nhẹ,
- hoặc viết lại câu ngắn hơn.

---

# 6. QUY TẮC TEXT TRONG BOX

Mọi text trong card/badge/button phải thỏa:

`scrollWidth <= clientWidth`
và
`scrollHeight <= clientHeight`

Nếu không thỏa -> FAIL.

Không được coi “vẫn nhìn thấy chữ” là đạt nếu chữ đã vượt box.

## Thứ tự tự sửa bắt buộc

Khi text không vừa box:

1. Tăng width nếu còn safe area.
2. Giảm padding ngang.
3. Giảm fontSize tối đa khoảng 5% đến 12%.
4. Rút gọn copy.
5. Chuyển box thành layout rộng hơn.

Không được giảm font quá nhỏ chỉ để ép vừa.

Ngưỡng gợi ý:
- Hook title: không dưới 78px nếu vẫn là title chính.
- Hook highlight: không dưới 72px.
- Badge: không dưới 26px.
- Nội dung/hint: không dưới 28px.
- CTA: không dưới 34px.

Nếu cần nhỏ hơn -> thiết kế lại.

---

# 7. AUDIT ƯỚC LƯỢNG NGAY TỪ JSON

Trước khi render HTML, GPT phải đánh dấu các text có nguy cơ wrap.

Công thức cảnh báo sơ bộ:

```text
estimatedTextWidth ≈ số_ký_tự × fontSize × 0.52
```

Với chữ HOA đậm 800/900 có thể dùng hệ số 0.56.

Nếu:

```text
estimatedTextWidth > width × 0.90
```

=> HIGH RISK.

HIGH RISK không có nghĩa chắc chắn lỗi, nhưng BẮT BUỘC kiểm DOM thật.

Ví dụ:

- fontSize 96
- width 780
- text dài 25 ký tự viết hoa

Ước lượng:
25 × 96 × 0.56 = 1344px

=> gần như chắc chắn sẽ wrap nếu ép trong width 780.

GPT phải sửa trước khi bàn giao.

---

# 8. SAFE AREA CỦA STAGE

Stage chuẩn:
- width = 940px
- height = 1080px

Safe area nội dung khuyến nghị:
- left >= 36px
- right <= 904px
- top >= 36px
- bottom <= 1044px

Mọi element chính phải nằm trọn trong safe area.

Kiểm:

```text
x >= 36
y >= 36
x + width <= 904
```

Đối với text có chiều cao:
- bottom của bounding box <= 1044.

Không chỉ kiểm tọa độ gốc.
Phải kiểm bounding box cuối cùng sau font, line-height, transform.

---

# 9. DOM GEOMETRY AUDIT BẮT BUỘC TRONG HTML

HTML MathCA nên có hàm audit layout.

Ví dụ:

```javascript
function auditLayout() {
  const errors = [];
  const stage = document.querySelector('#stage');
  const stageRect = stage.getBoundingClientRect();

  const nodes = [...stage.querySelectorAll('[data-audit="1"]')];

  for (const el of nodes) {
    const r = el.getBoundingClientRect();

    // 1. Tràn khỏi stage
    if (
      r.left < stageRect.left ||
      r.right > stageRect.right ||
      r.top < stageRect.top ||
      r.bottom > stageRect.bottom
    ) {
      errors.push(`OUT_OF_STAGE: ${el.id}`);
    }

    // 2. Text tràn box
    if (el.scrollWidth > el.clientWidth + 1) {
      errors.push(`HORIZONTAL_OVERFLOW: ${el.id}`);
    }

    if (el.scrollHeight > el.clientHeight + 1) {
      errors.push(`VERTICAL_OVERFLOW: ${el.id}`);
    }

    // 3. Element bắt buộc 1 dòng nhưng lại wrap
    if (el.dataset.nowrap === "1") {
      const cs = getComputedStyle(el);
      const lineHeight = parseFloat(cs.lineHeight);
      if (lineHeight && el.scrollHeight > lineHeight * 1.35) {
        errors.push(`UNEXPECTED_WRAP: ${el.id}`);
      }
    }
  }

  // 4. Kiểm tra giao nhau giữa các khối top-level
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const a = nodes[i];
      const b = nodes[j];

      if (a.dataset.allowOverlap === "1" || b.dataset.allowOverlap === "1") continue;

      const A = a.getBoundingClientRect();
      const B = b.getBoundingClientRect();

      const overlap =
        A.left < B.right &&
        A.right > B.left &&
        A.top < B.bottom &&
        A.bottom > B.top;

      if (overlap) {
        errors.push(`OVERLAP: ${a.id} <-> ${b.id}`);
      }
    }
  }

  window.__mathcaAudit = {
    passed: errors.length === 0,
    errors
  };

  return window.__mathcaAudit;
}
```

Các block quan trọng phải gắn:

```html
data-audit="1"
```

Các element bắt buộc 1 dòng thêm:

```html
data-nowrap="1"
```

---

# 10. KHÔNG AUDIT KHI ELEMENT ĐANG ẨN

Nếu scene đang opacity: 0 hoặc display: none thì DOM measurement có thể sai.

Vì vậy phải audit TỪNG SCENE khi scene đó đang active.

Luồng:

1. Bật Scene 1.
2. Audit.
3. Bật Scene 2.
4. Audit.
5. ...
6. Bật Scene cuối.
7. Audit.

Hoặc render tại timestamp giữa mỗi scene.

Không được chỉ audit frame 0.

---

# 11. PREVIEW AUDIT THEO TIMESTAMP

Bắt buộc kiểm preview 1080x1920 ở ít nhất các mốc:

- 0.8s: Hook title đã xuất hiện.
- 2.0s: Hook gần hoàn chỉnh.
- 4.0s: Hook trước chuyển scene.
- midpoint của từng scene.
- lúc kết quả lớn xuất hiện.
- 22.8s: CTA scene.
- 26.5s: cursor click CTA.
- 29.3s: frame cuối.

Với mỗi frame phải kiểm:

- Có chữ đè nhau không?
- Có chữ bị cắt không?
- Có box bị xuống dòng không?
- Có box quá bé so với text không?
- Có quá nhiều khoảng trắng vô nghĩa không?
- Visual hierarchy rõ chưa?
- Equation có nằm chính giữa không?
- Mascot có che bài toán không?
- CTA có nhìn rõ không?
- Header có bị sát stage không?

Nếu bất kỳ frame nào FAIL -> quay lại sửa JSON/HTML -> render lại.

---

# 12. AUDIT RIÊNG HOOK 0s - 4.2s

Hook là vùng dễ lỗi nhất.

Bắt buộc:

- Kicker nằm trên.
- Title chính nằm dưới kicker.
- Title nhấn nằm dưới title chính.
- VS card nằm dưới title nhấn.
- Promise nằm dưới VS card.

Không chồng bất kỳ khối nào.

Ưu tiên xếp dọc bằng flex:

```css
.hook-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 22px;
}
```

Không nên bố trí 5 khối Hook bằng Y tuyệt đối nếu text có thể thay đổi.

Nếu Studio bắt buộc x/y:
- phải đo chiều cao thực tế và tính Y tuần tự.

---

# 13. AUDIT RIÊNG BADGE

Badge thường gặp lỗi:
- text wrap
- padding quá lớn
- width quá hẹp
- chữ sát cạnh

Badge phải:

```css
display: inline-flex;
align-items: center;
justify-content: center;
white-space: nowrap;
min-height: 58px;
padding: 10px 28px;
```

Nếu badge text dài:
- ưu tiên tăng width.
- không cho xuống 2 dòng.

Ví dụ `THỬ THÁCH BONUS` phải là 1 dòng.

---

# 14. AUDIT RIÊNG EQUATION

Equation phải:
- 1 dòng.
- không wrap.
- không tách toán tử.
- không có toán tử bị lệch baseline.
- có khoảng cách dễ đọc.

Ví dụ:
`35 × 11 = ?`

Không được:
`35 ×`
`11 = ?`

CSS:

```css
white-space: nowrap;
display: flex;
align-items: center;
justify-content: center;
```

---

# 15. AUDIT RIÊNG CTA

CTA phải:
- nằm vùng cuối màn hình.
- không bị mascot che.
- không bị cursor che trước thời điểm click.
- text `FOLLOW MATHCA ✨` 1 dòng.
- pulse nhẹ, không rung quá mạnh.

Kiểm ở 25.5s, 26.5s và 29s.

---

# 16. THỨ TỰ TỰ SỬA KHI PHÁT HIỆN OVERLAP

Nếu A đè B:

Bước 1:
- xác định element nào thay đổi chiều cao do wrap.

Bước 2:
- cấm wrap nếu element phải 1 dòng.

Bước 3:
- tăng width hoặc giảm font hợp lý.

Bước 4:
- nếu title cần 2 dòng, chia dòng thủ công.

Bước 5:
- tính lại Y của tất cả element phía dưới.

Bước 6:
- chạy lại DOM audit.

Bước 7:
- preview lại frame lỗi.

Không sửa riêng B bằng cách kéo xuống vài pixel rồi bàn giao ngay.
Phải chạy lại TOÀN BỘ scene audit vì việc kéo B có thể làm B đè C.

---

# 17. SELF-LOOP PSEUDOCODE CHO GPT

```text
MAX_AUDIT_LOOPS = 5

generate_json()

for loop in 1..MAX_AUDIT_LOOPS:

    errors = []

    errors += validate_json_schema()
    errors += validate_scene_timing()
    errors += validate_required_animation()
    errors += preflight_text_width()
    errors += validate_html_template()

    if errors:
        fix_json_and_html(errors)
        continue

    render_or_preview_all_scenes()

    errors += run_dom_geometry_audit_each_scene()
    errors += inspect_critical_frames()

    if errors:
        fix_json_and_html(errors)
        continue

    FINAL_PASS = true
    break

if not FINAL_PASS:
    rebuild_problematic_scene_from_scratch()
    audit_again()

ONLY_AFTER_FINAL_PASS:
    export_json_to_user()
```

---

# 18. CẤM “TỰ CHẤM ĐẠT” CHỈ BẰNG CODE

JSON hợp lệ ≠ Video đẹp.

HTML chạy ≠ Layout đúng.

Không lỗi console ≠ Không có chữ đè nhau.

Bắt buộc phải có kiểm định hình học DOM và preview trực quan.

Nếu môi trường hiện tại KHÔNG THỂ render/preview:
GPT phải nói rõ:
`JSON đã qua static audit nhưng chưa thể xác nhận visual audit bằng frame render.`

GPT KHÔNG ĐƯỢC tuyên bố “100% đẹp / không lỗi” khi chưa kiểm preview.

---

# 19. CHECKLIST SIÊU NHANH TRƯỚC BÀN GIAO

[ ] JSON parse OK  
[ ] 5 khối schema đầy đủ  
[ ] Duration 25–35s  
[ ] Scene timing OK  
[ ] animation đầy đủ  
[ ] Hook voice = Hook title  
[ ] Không title overlap  
[ ] Không badge wrap  
[ ] Không equation wrap  
[ ] Không CTA wrap  
[ ] Không orphan word  
[ ] Không text overflow box  
[ ] Không element ngoài stage  
[ ] Không mascot che nội dung  
[ ] DOM audit = PASS  
[ ] Critical-frame preview = PASS  
[ ] Frame cuối sạch  
[ ] Chỉ bàn giao sau FINAL PASS  

---

# 20. QUY TẮC ÁP DỤNG CHO CÁC LỖI ĐÃ THẤY THỰC TẾ

## Lỗi A: Hook title bị đè

Nguyên nhân thường gặp:
- title chính tự wrap thành 2 dòng,
- title nhấn vẫn nằm tại Y cố định,
- line-height quá nhỏ,
- không đo chiều cao thực.

Cách bắt buộc:
- không auto-wrap Title,
hoặc
- split Title thành line rõ ràng,
- dùng gap,
- tính Y theo chiều cao thực.

## Lỗi B: Badge “THỬ THÁCH BONUS” xuống 2 dòng

Nguyên nhân:
- width quá nhỏ,
- badge không có `white-space: nowrap`.

Cách bắt buộc:
- `white-space: nowrap`,
- tăng width,
- audit `scrollWidth <= clientWidth`.

## Lỗi C: Câu mô tả bị xuống dòng trước khi hết ý

Nguyên nhân:
- width nhỏ,
- font quá lớn,
- copy dài.

Cách bắt buộc:
- ưu tiên giữ cụm nghĩa trên cùng một dòng,
- tăng width hoặc rút gọn copy,
- không chấp nhận một từ lẻ ở dòng cuối.

---

# 21. ƯU TIÊN TÀI LIỆU

Tài liệu này BỔ SUNG cho:
- `11_CHECKLIST_NGHIEM_THU_6_CONG.md`
- `12_SCHEMA_JSON_MATHCA_STUDIO.md`
- `13_THU_VIEN_HIEU_UNG_ANIMATION.md`
- `04_CONG_THUC_GSAP_HYPERFRAMES.md`
- `07_MAU_CHUAN_INDEX_HTML.md`

Nếu có xung đột:
1. Schema JSON và HyperFrames specification được ưu tiên về kỹ thuật.
2. File này được ưu tiên về kiểm định layout/text.
3. Brand guideline được giữ nguyên về màu/font/nhận diện.

---

# 22. MỆNH LỆNH CUỐI CHO GPT

Sau khi sinh JSON, luôn tự hỏi:

1. Tôi đã parse JSON chưa?
2. Tôi đã đo text box chưa?
3. Tôi đã kiểm wrap chưa?
4. Tôi đã kiểm overlap chưa?
5. Tôi đã kiểm từng scene chưa?
6. Tôi đã xem các frame quan trọng chưa?
7. Nếu sửa 1 lỗi, tôi đã chạy lại toàn bộ audit chưa?

Nếu chưa đủ 7 câu trả lời “CÓ”:
KHÔNG ĐƯỢC BÀN GIAO FILE.
