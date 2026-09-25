# 08. QUY CHUẨN ĐỒNG BỘ VOICEOVER, THỜI LƯỢNG CẢNH & HIỆU ỨNG ÂM THANH SFX

> **MỤC ĐÍCH**: Đây là cẩm nang kỹ thuật cốt lõi giúp ChatGPT tính toán chính xác tuyệt đối mối tương quan giữa **Độ dài câu thoại (VoiceText)**, **Thời lượng phân cảnh (Scene Duration)**, **Độ trễ xuất hiện của hiệu ứng (Animation Delay)** và **Mốc nổ âm thanh (SFX StartTime)**.

---

## 1. CÔNG THỨC TOÁN HỌC KHỚP VOICETEXT VỚI THỜI LƯỢNG CẢNH

Trên các nền tảng video ngắn (TikTok, Reels, Shorts), người xem cực kỳ nhạy cảm với sự lệch pha giữa tiếng và hình. Nếu tiếng đọc xong mà hình chưa ra -> cảm giác chậm chạp; nếu hình ra hết mà tiếng đọc tràn sang cảnh kế tiếp -> vỡ nát trải nghiệm.

### 1.1. Tốc độ đọc tiếng Việt của MathCA Studio
Giọng đọc Edge TTS chuẩn `vi-VN-HoaiMyNeural` được cấu hình tốc độ `+18%` trong Studio.
* **Tốc độ đọc trung bình:** **3.8 từ / giây** (tương đương 0.263 giây cho mỗi từ).
* **Thời gian đọc thực tế:**
  $$T_{\text{đọc}} = \frac{\text{Số từ trong } voiceText}{3.8}$$

### 1.2. Quy tắc đệm thở an toàn (Safety Buffer)
Một câu thoại tự nhiên cần có khoảng đệm nghỉ (0.4s – 0.8s) trước khi chuyển cảnh. Do đó:
$$\text{Thời lượng cảnh } (\Delta t = endTime - startTime) \ge T_{\text{đọc}} + 0.4\text{s}$$

### 1.3. Bảng chuẩn hóa số từ theo độ dài cảnh:
* **Cảnh 2.0s – 2.5s:** Tối đa **6 – 7 từ** (Câu lệnh ngắn, chuyển bước).
* **Cảnh 3.0s – 3.5s:** Tối đa **9 – 11 từ** (Hook 3s, nêu câu hỏi).
* **Cảnh 4.0s – 4.5s:** Tối đa **12 – 15 từ** (Đặt bài toán, bước tách số).
* **Cảnh 5.0s – 6.0s:** Tối đa **16 – 20 từ** (Phép tính phụ, kết luận kèm lời khen).
* **Cảnh 7.0s – 8.0s:** Tối đa **22 – 27 từ** (Thử thách cuối + Kêu gọi bình luận và Follow).

---

## 2. KỸ THUẬT PHÂN TÁCH TỪNG TỪ ĐỂ TÍNH DELAY HIỆU ỨNG (VISUAL BEAT MATCHING)

Trong một phân cảnh, không bao giờ để các phần tử xuất hiện cùng một lúc tại giây số 0. Từng đối tượng đồ họa phải nảy ra tương ứng với từ khóa trong câu nói.

### Ví dụ phân tích cảnh thực tế:
* **Thời gian cảnh:** `4.2s – 9.0s` (Độ dài: **4.8 giây**).
* **Câu thoại:** *"Ví dụ: 35 nhân 11. Đừng đặt tính vội nhé!"* (10 từ).
* **Thời gian đọc:** $10 / 3.8 \approx 2.63\text{ giây}$. Thời lượng dư 2.17s đủ cho khán giả nhìn rõ cảnh báo.
* **Bóc tách dòng thời gian phát âm:**
  - `0.0s – 0.5s` (4.2s – 4.7s video): *"Ví dụ..."* $\rightarrow$ Thẻ tiêu đề "BÀI TOÁN TÍNH NHANH" nảy vào tại `delay: 0.1s`.
  - `0.5s – 1.8s` (4.7s – 6.0s video): *"...35 nhân 11..."* $\rightarrow$ Khối phép tính `35 × 11 = ?` rơi tưng tưng xuống tại `delay: 0.35s`.
  - `1.8s – 2.6s` (6.0s – 6.8s video): *"...Đừng đặt tính vội nhé!"* $\rightarrow$ Thẻ cảnh báo `⚠️ Đừng đặt tính vội` trượt lên tại `delay: 2.2s` kèm hiệu ứng lắc lư `wiggle`.

Nhờ sự bóc tách này, hình ảnh và âm thanh hòa quyện vào nhau, tạo cảm giác đạo diễn chuyên nghiệp và giữ chân mắt người xem 100%.

---

## 3. CÔNG THỨC KHÓA MỐC THỜI GIAN SFX (AUDIO SFX TIMING)

Trong file JSON, mảng `audio.sfx` nhận mốc thời gian tuyệt đối `startTime` (tính từ giây 0 của video).

$$\text{startTime của SFX} = \text{startTime của Scene} + \text{delay của Element}$$

### Ma trận ánh xạ Hiệu ứng thị giác $\rightarrow$ SFX Preset:

| Hành động thị giác (Visual Action) | Animation Type | SFX Preset chuẩn | Ghi chú & Cảm xúc |
| :--- | :--- | :--- | :--- |
| **Mở màn / Chuyển cảnh giữa các hồi** | Chuyển cảnh `autoAlpha` | `preset-whoosh` (0.35s) | Đặt tại `scene.startTime - 0.05s` hoặc `+ 0.0s`. |
| **Title / Badge / Ô số nảy ra** | `pop-punch` | `preset-pop` (0.2s) | Đặt chính xác tại `scene.startTime + delay`. |
| **Số rơi đàn hồi / Cảnh báo ngộ nghĩnh** | `drop-bounce` | `preset-boing` (0.6s) | Đặt khi số chạm đáy nảy lên. |
| **Kết quả bùng nổ / Khoảnh khắc "Aha!"** | `zoom-hero` | `preset-chime` (1.25s) | Chuông reo Tada chiến thắng, kích thích hưng phấn. |
| **Con trỏ chuột click nút CTA** | Nhấp click nảy phím | `preset-click` (0.1s) | Âm thanh click cơ học nảy phím dứt khoát. |

---

## 4. BẢN MẪU KHAI BÁO AUDIO.SFX ĐỒNG BỘ 100% TRONG JSON

```json
"audio": {
  "bgm": {
    "enabled": false,
    "assetId": "bgm-happy-math-01",
    "name": "Happy Math",
    "volume": 0.25,
    "startTime": 0,
    "endTime": 29.5,
    "loop": true,
    "fadeIn": 1.0,
    "fadeOut": 1.5,
    "ducking": {
      "enabled": true,
      "underVoiceDb": -12,
      "attack": 0.12,
      "release": 0.35
    }
  },
  "sfxMasterVolume": 0.5,
  "sfx": [
    { "id": "sfx-whoosh-1", "assetId": "preset-whoosh", "name": "Whoosh mở màn", "startTime": 0.08, "duration": 0.35, "volume": 0.45, "pan": 0 },
    { "id": "sfx-pop-1", "assetId": "preset-pop", "name": "Pop Title 1", "startTime": 0.45, "duration": 0.2, "volume": 0.5, "pan": 0 },
    { "id": "sfx-pop-2", "assetId": "preset-pop", "name": "Pop Title 2", "startTime": 0.75, "duration": 0.2, "volume": 0.5, "pan": 0 },
    { "id": "sfx-whoosh-2", "assetId": "preset-whoosh", "name": "Whoosh Cảnh 2", "startTime": 4.15, "duration": 0.35, "volume": 0.4, "pan": 0 },
    { "id": "sfx-pop-3", "assetId": "preset-pop", "name": "Pop Phép tính", "startTime": 4.55, "duration": 0.2, "volume": 0.5, "pan": 0 },
    { "id": "sfx-whoosh-3", "assetId": "preset-whoosh", "name": "Whoosh Cảnh 3", "startTime": 8.95, "duration": 0.35, "volume": 0.4, "pan": 0 },
    { "id": "sfx-pop-4", "assetId": "preset-pop", "name": "Pop Tách số", "startTime": 9.4, "duration": 0.2, "volume": 0.5, "pan": 0 },
    { "id": "sfx-whoosh-4", "assetId": "preset-whoosh", "name": "Whoosh Cảnh 4", "startTime": 12.95, "duration": 0.35, "volume": 0.4, "pan": 0 },
    { "id": "sfx-boing-1", "assetId": "preset-boing", "name": "Boing Số rơi", "startTime": 14.8, "duration": 0.6, "volume": 0.55, "pan": 0 },
    { "id": "sfx-whoosh-5", "assetId": "preset-whoosh", "name": "Whoosh Cảnh 5", "startTime": 17.35, "duration": 0.35, "volume": 0.4, "pan": 0 },
    { "id": "sfx-chime-1", "assetId": "preset-chime", "name": "Chime Kết quả", "startTime": 17.65, "duration": 1.25, "volume": 0.6, "pan": 0 },
    { "id": "sfx-whoosh-6", "assetId": "preset-whoosh", "name": "Whoosh Cảnh 6", "startTime": 22.35, "duration": 0.35, "volume": 0.4, "pan": 0 },
    { "id": "sfx-click-1", "assetId": "preset-click", "name": "Click Follow", "startTime": 26.5, "duration": 0.1, "volume": 0.6, "pan": 0 }
  ]
}
```
