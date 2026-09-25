# 08. MÃ NGUỒN MẪU CHUẨN BUILD_AUDIO_PIPELINE.PY

Đây là file Python hoàn chỉnh để tạo kênh âm thanh chuẩn cho video. ChatGPT sẽ đặt file này vào thư mục dự án khi đóng gói ZIP để người dùng (hoặc script `render.bat`) tự động thực thi.

```python
import asyncio
import edge_tts
import numpy as np
from scipy.io import wavfile
import subprocess
import os

# Cấu hình tần số lấy mẫu chuẩn phát sóng video
sr = 48000
total_duration = 29.50
total_samples = int(sr * total_duration)

# Tự động tìm FFmpeg trên máy người dùng
ffmpeg = 'ffmpeg'
possible_paths = [
    r'C:\Users\lexua\AppData\Local\Microsoft\WinGet\Packages\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\ffmpeg-8.1.2-full_build\bin\ffmpeg.exe',
    'ffmpeg.exe',
    'ffmpeg'
]
for p in possible_paths:
    if os.path.exists(p):
        ffmpeg = p
        break

os.makedirs('assets/sentences', exist_ok=True)

# 1. Danh sách câu thoại và mốc thời gian
sentences = [
    ('s1_hook.mp3', 'Mẹo nhân nhẩm với 11 trong 2 giây cho học sinh lớp 3!', 0.1),
    ('s2_vidu.mp3', 'Ví dụ: 35 nhân 11. Đừng đặt tính vội nhé!', 4.2),
    ('s3_buoc1.mp3', 'Bước một: Tách đôi số 3 sang trái, số 5 sang phải.', 9.0),
    ('s4_buoc2.mp3', 'Bước hai: Lấy 3 cộng 5 bằng 8, rồi nhét số 8 vào giữa!', 13.0),
    ('s5_ketqua.mp3', 'Ta được ngay kết quả: 385! Chỉ mất đúng 2 giây!', 17.5),
    ('s6_thuthach.mp3', 'Đố các bạn: 42 nhân 11 bằng bao nhiêu? Hãy bình luận đáp án và bấm Follow MathCA nhé!', 22.5),
]

async def generate_all_speech():
    print("[*] Đang sinh giọng đọc AI (Hoài My - Nữ tươi vui)...")
    for fn, txt, _ in sentences:
        outpath = os.path.join('assets/sentences', fn)
        if not os.path.exists(outpath) or os.path.getsize(outpath) == 0:
            comm = edge_tts.Communicate(txt, 'vi-VN-HoaiMyNeural', rate='+10%', pitch='+4Hz')
            await comm.save(outpath)
            print(f"  + Đã sinh: {fn}")
    print("[*] Hoàn tất sinh toàn bộ giọng đọc!")

try:
    asyncio.run(generate_all_speech())
except Exception as e:
    print(f"[!] Chú ý: Không thể kết nối Edge-TTS ({e}). Sẽ sử dụng các file âm thanh có sẵn.")

# 2. Ghép Voice Track trên mảng số thực Stereo Float32
voice_track = np.zeros((total_samples, 2), dtype=np.float32)

for fn, _, start_sec in sentences:
    p = os.path.join('assets/sentences', fn)
    if os.path.exists(p):
        cmd = [ffmpeg, '-y', '-i', p, '-f', 'f32le', '-ac', '2', '-ar', str(sr), '-']
        proc = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.DEVNULL)
        audio_data = np.frombuffer(proc.stdout, dtype=np.float32).reshape(-1, 2)
        start_idx = int(start_sec * sr)
        end_idx = min(start_idx + len(audio_data), total_samples)
        voice_track[start_idx:end_idx] += audio_data[:end_idx - start_idx]

# Chuẩn hóa âm lượng Voice đạt -1.0 dB peak (chuẩn phát thanh to rõ)
voice_peak = np.max(np.abs(voice_track))
if voice_peak > 0:
    voice_track = (voice_track / voice_peak) * 0.90

# 3. Tạo hiệu ứng âm thanh SFX hoạt hình thuần Python
sfx_track = np.zeros((total_samples, 2), dtype=np.float32)

def add_sfx(clip, start_sec, volume=1.0, pan=0.0):
    start_idx = int(start_sec * sr)
    end_idx = min(start_idx + len(clip), total_samples)
    clip_len = end_idx - start_idx
    if clip_len > 0:
        c = clip[:clip_len] * volume
        left_gain = np.cos((pan + 1) * np.pi / 4)
        right_gain = np.sin((pan + 1) * np.pi / 4)
        sfx_track[start_idx:end_idx, 0] += c * left_gain
        sfx_track[start_idx:end_idx, 1] += c * right_gain

def create_whoosh(duration=0.35, f_start=300, f_end=1600):
    t = np.linspace(0, duration, int(sr * duration), endpoint=False)
    noise = np.random.uniform(-1, 1, len(t))
    env = (np.sin(np.pi * (t / duration))) ** 2.2
    sweep = np.sin(2 * np.pi * (f_start + (f_end - f_start) * (t / duration)**2) * t)
    s = (0.75 * noise + 0.25 * sweep) * env
    return s / (np.max(np.abs(s)) + 1e-6)

def create_pop(duration=0.065, f0=750, f1=180):
    t = np.linspace(0, duration, int(sr * duration), endpoint=False)
    freq = f0 * (f1 / f0) ** (t / duration)
    phase = 2 * np.pi * np.cumsum(freq) / sr
    env = np.exp(-t * 60)
    s = np.sin(phase) * env
    return s / (np.max(np.abs(s)) + 1e-6)

def create_boing(duration=0.6):
    t = np.linspace(0, duration, int(sr * duration), endpoint=False)
    pitch = 180 + 280 * np.exp(-t * 6) + 50 * np.sin(2 * np.pi * 16 * t) * np.exp(-t * 4)
    phase = 2 * np.pi * np.cumsum(pitch) / sr
    env = np.exp(-t * 4.8) * (1 - np.exp(-t * 50))
    s = np.sin(phase) * env
    return s / (np.max(np.abs(s)) + 1e-6)

def create_chime(duration=1.25):
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

def create_click(duration=0.04):
    t = np.linspace(0, duration, int(sr * duration), endpoint=False)
    s = np.zeros_like(t)
    burst_len = int(0.003 * sr)
    s[:burst_len] = np.random.uniform(-1, 1, burst_len) * np.exp(-np.linspace(0, 1, burst_len)*10)
    return s / (np.max(np.abs(s)) + 1e-6)

# Sinh các clip âm thanh
whoosh = create_whoosh(0.35)
pop = create_pop(0.065)
boing = create_boing(0.60)
chime = create_chime(1.25)
click = create_click(0.04)

# Bố trí SFX ở mức 50% âm lượng (-12dB dưới giọng đọc)
scale = 0.22
add_sfx(whoosh, 0.08, volume=0.85 * scale)
add_sfx(pop, 0.45, volume=0.85 * scale)
add_sfx(pop, 0.75, volume=0.85 * scale)
add_sfx(whoosh, 4.15, volume=0.70 * scale)
add_sfx(whoosh, 8.95, volume=0.70 * scale)
add_sfx(whoosh, 12.95, volume=0.70 * scale)
add_sfx(boing, 14.80, volume=0.95 * scale)
add_sfx(whoosh, 17.40, volume=0.70 * scale)
add_sfx(chime, 17.65, volume=0.95 * scale)
add_sfx(whoosh, 22.40, volume=0.70 * scale)
add_sfx(click, 26.50, volume=0.95 * scale)

# 4. Trộn kênh trực tiếp trong float32 (Không suy giảm âm lượng)
master = voice_track + sfx_track
peak = np.max(np.abs(master))
if peak > 0.95:
    master = (master / peak) * 0.95

wavfile.write('assets/audio_master.wav', sr, (master * 32767).astype(np.int16))

# Xuất ra assets/audio.mp3 và assets/audio.m4a chuẩn 48kHz Stereo
cmd_mp3 = [ffmpeg, '-y', '-i', 'assets/audio_master.wav', '-c:a', 'libmp3lame', '-b:a', '256k', '-ar', '48000', '-ac', '2', 'assets/audio.mp3']
subprocess.run(cmd_mp3, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

cmd_aac = [ffmpeg, '-y', '-i', 'assets/audio_master.wav', '-c:a', 'aac', '-b:a', '256k', '-ar', '48000', '-ac', '2', 'assets/audio.m4a']
subprocess.run(cmd_aac, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

print("[THÀNH CÔNG] Kênh âm thanh đã được xuất: assets/audio.mp3 (Stereo 48kHz, Voice to rõ chuẩn phát thanh)!")
```
