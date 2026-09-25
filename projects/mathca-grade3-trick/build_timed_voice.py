import asyncio
import edge_tts
import numpy as np
from scipy.io import wavfile
import subprocess
import shutil
import os

# Voice sentences
sentences = [
    ('s1_hook.mp3', 'Mẹo nhân nhẩm với 11 trong 2 giây cho học sinh lớp 3!'),
    ('s2_vidu.mp3', 'Ví dụ: 35 nhân 11. Đừng đặt tính vội nhé!'),
    ('s3_buoc1.mp3', 'Bước một: Tách đôi số 3 sang trái, số 5 sang phải.'),
    ('s4_buoc2.mp3', 'Bước hai: Lấy 3 cộng 5 bằng 8, rồi nhét số 8 vào giữa!'),
    ('s5_ketqua.mp3', 'Ta được ngay kết quả: 385! Chỉ mất đúng 2 giây!'),
    ('s6_thuthach.mp3', 'Đố các bạn: 42 nhân 11 bằng bao nhiêu? Hãy bình luận đáp án và bấm Follow MathCA nhé!'),
]

os.makedirs('assets/sentences', exist_ok=True)

async def generate_speech():
    for fn, txt in sentences:
        outpath = os.path.join('assets/sentences', fn)
        # Opt 1 voice: Hoài My tươi tắn
        comm = edge_tts.Communicate(txt, 'vi-VN-HoaiMyNeural', rate='+10%', pitch='+4Hz')
        await comm.save(outpath)
        print(f"Generated {fn}")

asyncio.run(generate_speech())

# Concatenate voice with precise pauses using FFmpeg
# Target timeline:
# s1: 0.1s -> ~3.7s
# s2: 4.2s -> ~7.4s
# s3: 7.8s -> ~11.5s
# s4: 12.0s -> ~15.8s
# s5: 16.5s -> ~19.8s
# s6: 20.5s -> ~26.0s
# Total duration: 26.5s

ffmpeg = r'C:\Users\lexua\AppData\Local\Microsoft\WinGet\Packages\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\ffmpeg-8.1.2-full_build\bin\ffmpeg.exe'

# Mix into a continuous master voice.mp3
filter_str = (
    "[0:a]adelay=100|100[a0];"
    "[1:a]adelay=4200|4200[a1];"
    "[2:a]adelay=7800|7800[a2];"
    "[3:a]adelay=12000|12000[a3];"
    "[4:a]adelay=16500|16500[a4];"
    "[5:a]adelay=20500|20500[a5];"
    "[a0][a1][a2][a3][a4][a5]amix=inputs=6:duration=longest:dropout_transition=0,volume=1.0[outa]"
)

inputs = []
for fn, _ in sentences:
    inputs.extend(['-i', os.path.join('assets/sentences', fn)])

cmd = [ffmpeg, '-y'] + inputs + ['-filter_complex', filter_str, '-map', '[outa]', '-c:a', 'libmp3lame', '-b:a', '192k', 'assets/voice.mp3']
subprocess.run(cmd, check=True)
print("Master assets/voice.mp3 assembled with perfect timing!")
