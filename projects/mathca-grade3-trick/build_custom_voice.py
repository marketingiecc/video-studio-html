import subprocess
import os
import sys

# Ensure UTF-8 output
sys.stdout.reconfigure(encoding='utf-8')

sentences = [
    ('s1_hook.mp3', 'Mẹo nhân nhẩm với 11 trong 2 giây cho học sinh lớp 3!'),
    ('s2_vidu.mp3', 'Ví dụ: 35 nhân 11. Đừng đặt tính vội nhé!'),
    ('s3_buoc1.mp3', 'Bước một: Tách đôi số 3 sang trái, số 5 sang phải.'),
    ('s4_buoc2.mp3', 'Bước hai: Lấy 3 cộng 5 bằng 8, rồi nhét số 8 vào giữa!'),
    ('s5_ketqua.mp3', 'Ta được ngay kết quả: 385! Chỉ mất đúng 2 giây!'),
    ('s6_thuthach.mp3', 'Đố các bạn: 42 nhân 11 bằng bao nhiêu? Hãy bình luận đáp án và bấm Follow MathCA nhé!'),
]

os.makedirs('assets/sentences', exist_ok=True)
ffprobe = r'C:\Users\lexua\AppData\Local\Microsoft\WinGet\Packages\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\ffmpeg-8.1.2-full_build\bin\ffprobe.exe'

durations = {}
for fn, txt in sentences:
    p = os.path.join('assets/sentences', fn)
    subprocess.run(['edge-tts', '--voice', 'vi-VN-HoaiMyNeural', '--rate=+10%', '--pitch=+4Hz', '--text', txt, '--write-media', p], check=True)
    res = subprocess.check_output([ffprobe, '-i', p, '-show_entries', 'format=duration', '-of', 'default=noprint_wrappers=1:nokey=1'], stderr=subprocess.DEVNULL, text=True)
    dur = float(res.strip())
    durations[fn] = dur
    print(f'{fn}: {dur:.2f}s')

print('All sentences generated!')
