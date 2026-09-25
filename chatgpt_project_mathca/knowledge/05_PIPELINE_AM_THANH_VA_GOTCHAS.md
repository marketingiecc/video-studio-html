# 05. QUY CHUẨN ÂM THANH & CẤU TRÚC AUDIO ĐA TẦNG (STUDIO PRO PIPELINE)

Kênh âm thanh là yếu tố quyết định 50% cảm xúc và tỷ lệ xem hết video trên TikTok và Reels. MathCA Video Studio Pro sở hữu pipeline âm thanh Node.js + FFmpeg hoàn chỉnh, tự động đồng bộ hóa Giọng đọc (Voiceover), Nhạc nền (BGM) và Hiệu ứng âm thanh (SFX).

---

## 1. PHÂN CẤP ÂM LƯỢNG VÀNG CỦA MATHCA (AUDIO HIERARCHY)

| Kênh âm thanh | Tỷ lệ âm lượng | Mức dB chuẩn | Vai trò & Hành vi |
| :--- | :---: | :---: | :--- |
| **1. Giọng đọc Voiceover** | **100%** | `-1.0 dB peak`<br>`-18.0 dB mean` | **Vị trí số 1 tuyệt đối.** Giọng đọc to, rõ ràng, trong trẻo, không bị bất kỳ âm thanh nào lấn át. |
| **2. Hiệu ứng SFX** | **50%** | `-10 dB` đến `-14 dB`<br>dưới giọng đọc | Điểm nhấn hoạt hình trợ thị giác (Whoosh lướt cảnh, Pop nảy chữ, Boing nảy số, Chime chuông chiến thắng, Click chuột). |
| **3. Nhạc nền BGM** | **25% – 30%** | `-12 dB Ducking` | Nhạc nền vui nhộn tạo nhịp điệu. Khi giọng đọc cất lên, BGM tự động lặn xuống **-12 dB**; khi có khoảng nghỉ, BGM nổi nhẹ lên. |

---

## 2. PROFILE GIỌNG ĐỌC AI TIẾNG VIỆT (VOICE PROFILES)

MathCA Studio tích hợp sẵn công nghệ Edge-TTS tối ưu tốc độ cho video ngắn:
* **Giọng chuẩn (Khuyên dùng số 1):** `vi-VN-HoaiMyNeural`
  - Giọng nữ miền Bắc, phong cách cô giáo trẻ trung, tươi tắn, hoạt bát, tràn đầy năng lượng.
  - Cấu hình Studio: `rate: '+18%'`, `pitch: '+4Hz'`. Tốc độ đọc đạt khoảng **3.8 từ / giây** — cực kỳ vừa vặn với nhịp điệu nhanh, cuốn hút của Reels/TikTok.
* **Giọng nam thân thiện:** `vi-VN-NamMinhNeural`
  - Giọng nam miền Bắc, trầm ấm, truyền cảm. Cấu hình: `rate: '+15%'`, `pitch: '+2Hz'`.
* **Giọng VieNeu AI:** Hỗ trợ giọng đọc cảm xúc qua MCP Client khi kích hoạt trong Studio.

---

## 3. THƯ VIỆN HIỆU ỨNG ÂM THANH CÓ SẴN TRONG STUDIO (SFX PRESETS)

Studio đi kèm 5 preset SFX chất lượng cao được lưu trong `assets/audio-library/presets/`. Khi xuất JSON, ChatGPT sử dụng chính xác các `assetId` này trong mảng `audio.sfx`:

1. `preset-whoosh` (Thời lượng 0.35s):
   - Tiếng gió lướt vút nhẹ êm ái.
   - Dùng khi: Chuyển cảnh giữa các hồi, mở màn video, trượt thẻ nội dung.
2. `preset-pop` (Thời lượng 0.2s):
   - Tiếng bật nảy chữ "bục" vui nhộn.
   - Dùng khi: Xuất hiện Title, rơi thẻ Badge, nảy các ô số.
3. `preset-boing` (Thời lượng 0.6s):
   - Tiếng lò xo nảy tưng tưng hoạt hình.
   - Dùng khi: Quả cầu số rơi đàn hồi vào ô giữa, cảnh báo ngộ nghĩnh.
4. `preset-chime` (Thời lượng 1.25s):
   - Tiếng chuông reo chiến thắng ngân vang (Tada chime).
   - Dùng khi: Bùng nổ kết quả đúng 148px, hoàn thành bài toán.
5. `preset-click` (Thời lượng 0.1s):
   - Tiếng nhấp chuột cơ học nảy phím dứt khoát.
   - Dùng khi: Con trỏ chuột click vào nút `FOLLOW MATHCA ✨`.

---

## 4. CƠ CHẾ DUCKING NHẠC NỀN THÔNG MINH (SMART BGM DUCKING)

Trong file JSON, khối `audio.bgm` hỗ trợ tính năng tự động né giọng đọc (Auto Ducking):
```json
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
}
```
* Khi `enabled: true`, bản nhạc `bgm-happy-math-01` sẽ phát xuyên suốt video.
* Bất cứ giây nào có lời thoại của `voiceText`, âm lượng BGM tự động giảm ngay -12dB trong 0.12s (`attack: 0.12`), giúp người xem nghe rõ 100% từng câu chữ.
* Khi hết câu thoại, BGM nhẹ nhàng tăng trở lại trong 0.35s (`release: 0.35`).

---

## 5. CÁC LỖI KỸ THUẬT ĐÃ ĐƯỢC STUDIO KHẮC PHỤC TRIỆT ĐỂ
* **Lỗi UTF-8 tiếng Việt:** Server Node.js của Studio xử lý trực tiếp stream WebSocket, không qua console PowerShell của Windows, đảm bảo phát âm chuẩn 100% không mất dấu.
* **Lỗi suy hao âm lượng của bộ lọc FFmpeg amix:** Studio sử dụng `amix=normalize=0` kết hợp `alimiter` và tính toán delay mili-giây từng cảnh, đảm bảo âm thanh luôn đạt chuẩn phát thanh `-1.0 dB peak`.
* **Ký tự toán học đặc biệt:** Các ký tự `<`, `>`, `&` trong câu thoại được Studio tự động escape sang XML an toàn trước khi gửi tới TTS engine.
