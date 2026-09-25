# 05. QUY CHUẨN ÂM THANH & CẢNH BÁO LỖI CHẾT NGƯỜI (AUDIO PIPELINE)

Kênh âm thanh là yếu tố sống còn quyết định sự thành bại của video. ChatGPT phải tuân thủ nghiêm ngặt các tiêu chuẩn âm thanh sau để video không bao giờ bị lỗi mất tiếng hoặc tiếng quá nhỏ.

---

## 1. TIÊU CHUẨN ÂM LƯỢNG VÀNG CỦA MATHCA

* **Giọng đọc Voiceover (100% Volume):**
  - Mức âm lượng trung bình: `-17.5 dB` đến `-18.5 dB` mean (chuẩn phát sóng TikTok, YouTube Shorts).
  - Mức âm lượng đỉnh: `-0.7 dB` đến `-1.5 dB` peak (to rõ, trong trẻo, không bị méo/vỡ âm).
  - Giọng đọc mẫu: `vi-VN-HoaiMyNeural` (Nữ miền Bắc, tươi tắn, hoạt bát, tràn đầy năng lượng dạy học) với tham số `rate='+10%'` đến `+15%`, `pitch='+4Hz'`.
* **Hiệu ứng âm thanh SFX (50% Volume):**
  - Giữ ở mức `-10 dB` đến `-14 dB` bên dưới giọng đọc.
  - Đóng vai trò là điểm nhấn hoạt hình bổ trợ (Whoosh lướt cảnh, Pop nảy chữ, Boing rơi bóng, Ting ting thành công, Click chuột).
* **Nhạc nền (BGM):**
  - **TẮT HOÀN TOÀN (NO BGM)** theo tôn chỉ của MathCA để học sinh và phụ huynh tập trung 100% vào logic phép tính và lời giảng.
* **Định dạng kênh:**
  - Bắt buộc là **Stereo 2 kênh (`channels: 2`)**, tần số lấy mẫu **48,000 Hz**, bitrate `192k` hoặc `256k`. Không xuất file mono để tránh lỗi tắt tiếng trên một số thiết bị di động.

---

## 2. HAI (2) LỖI KỸ THUẬT CHẾT NGƯỜI VÀ CÁCH KHẮC PHỤC

### ❌ Lỗi 1: Chạy CLI edge-tts trên PowerShell Windows làm hỏng dấu tiếng Việt
* **Nguyên nhân:** Khi gọi lệnh console `edge-tts --text "Mẹo nhân nhẩm..."`, PowerShell của Windows mặc định dùng bảng mã `cp1252` thay vì UTF-8, làm méo tiếng hoặc vỡ phát âm các từ có dấu tiếng Việt (ơ, ư, ă, đ, ngã, hỏi).
* **Khắc phục:** **BẮT BUỘC** viết code Python dùng thư viện `edge_tts.Communicate(text, voice).save()` trực tiếp để đảm bảo 100% Unicode UTF-8.

### ❌ Lỗi 2: Bộ lọc `amix` của FFmpeg tự động giảm âm lượng làm mất tiếng
* **Nguyên nhân:** Lệnh FFmpeg `amix=inputs=N` mặc định có cơ chế tự động chia nhỏ âm lượng cho `N` luồng đầu vào (`1/N` để tránh vỡ tiếng khi nhiều luồng phát cùng lúc).
  - Nếu ghép 6 câu thoại, âm lượng bị kéo tụt **6 lần (-15.5 dB)**!
  - Qua bước mix SFX bị chia đôi tiếp **(-6 dB)**!
  - Tổng cộng giọng đọc bị kéo tụt **hơn 21.5 dB**, rơi xuống mức **-38.7 dB** (mức thì thầm siêu nhỏ, gần như không thể nghe thấy gì khi mở video).
* **Khắc phục:** **BẮT BUỘC** ghép các câu thoại và mix SFX trực tiếp bằng mảng số thực `numpy float32` trong Python (như trong file mẫu `build_audio_pipeline.py`) rồi chuẩn hóa về `-1.0 dB peak`, sau đó mới xuất file MP3 / M4A.

---

## 3. THƯ VIỆN HIỆU ỨNG ÂM THANH HOẠT HÌNH THUẦN PYTHON (KHÔNG CẦN TẢI FILE NGOÀI)

ChatGPT có thể sinh ra toàn bộ các hiệu ứng âm thanh hoạt hình bằng code Python thuần túy bằng thư viện `numpy` và `scipy.io.wavfile` có sẵn trong môi trường Code Interpreter:

```python
import numpy as np

def create_whoosh(sr=48000, duration=0.35, f_start=300, f_end=1600):
    t = np.linspace(0, duration, int(sr * duration), endpoint=False)
    noise = np.random.uniform(-1, 1, len(t))
    env = (np.sin(np.pi * (t / duration))) ** 2.2
    sweep = np.sin(2 * np.pi * (f_start + (f_end - f_start) * (t / duration)**2) * t)
    s = (0.75 * noise + 0.25 * sweep) * env
    return s / (np.max(np.abs(s)) + 1e-6)

def create_pop(sr=48000, duration=0.065, f0=750, f1=180):
    t = np.linspace(0, duration, int(sr * duration), endpoint=False)
    freq = f0 * (f1 / f0) ** (t / duration)
    phase = 2 * np.pi * np.cumsum(freq) / sr
    env = np.exp(-t * 60)
    s = np.sin(phase) * env
    return s / (np.max(np.abs(s)) + 1e-6)

def create_boing(sr=48000, duration=0.6):
    t = np.linspace(0, duration, int(sr * duration), endpoint=False)
    pitch = 180 + 280 * np.exp(-t * 6) + 50 * np.sin(2 * np.pi * 16 * t) * np.exp(-t * 4)
    phase = 2 * np.pi * np.cumsum(pitch) / sr
    env = np.exp(-t * 4.8) * (1 - np.exp(-t * 50))
    s = np.sin(phase) * env
    return s / (np.max(np.abs(s)) + 1e-6)

def create_chime(sr=48000, duration=1.25):
    t = np.linspace(0, duration, int(sr * duration), endpoint=False)
    freqs = [1046.5, 1318.5, 1568.0, 2093.0]
    delays = [0.0, 0.035, 0.07, 0.105]
    out = np.zeros_like(t)
    for f, d in zip(freqs, delays):
        idx = int(d * sr)
        t_sub = t[:len(t)-idx]
        env = np.exp(-t_sub * 3.2)
        tone = np.sin(2 * np.pi * f * t_sub) + 0.35 * np.sin(2 * np.pi * f * 2 * t_sub)
        out[idx:] += tone * env
    return out / (np.max(np.abs(out)) + 1e-6)

def create_click(sr=48000, duration=0.04):
    t = np.linspace(0, duration, int(sr * duration), endpoint=False)
    s = np.zeros_like(t)
    burst_len = int(0.003 * sr)
    s[:burst_len] = np.random.uniform(-1, 1, burst_len) * np.exp(-np.linspace(0, 1, burst_len)*10)
    idx2 = int(0.012 * sr)
    b2_len = int(0.004 * sr)
    if idx2 + b2_len < len(t):
        s[idx2:idx2+b2_len] += 0.5 * np.random.uniform(-1, 1, b2_len) * np.exp(-np.linspace(0, 1, b2_len)*10)
    return s / (np.max(np.abs(s)) + 1e-6)
```
