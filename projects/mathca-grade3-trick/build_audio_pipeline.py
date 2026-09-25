import numpy as np
from scipy.io import wavfile
import subprocess
import os

ffmpeg = r'C:\Users\lexua\AppData\Local\Microsoft\WinGet\Packages\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\ffmpeg-8.1.2-full_build\bin\ffmpeg.exe'

sr = 44100
total_duration = 29.50
total_samples = int(sr * total_duration)

# 1. Assemble Voice Track directly in float32 without destructive amix attenuation
voice_track = np.zeros(total_samples, dtype=np.float32)

sentences = [
    ('assets/sentences/s1_hook.mp3', 0.1),
    ('assets/sentences/s2_vidu.mp3', 4.2),
    ('assets/sentences/s3_buoc1.mp3', 9.0),
    ('assets/sentences/s4_buoc2.mp3', 13.0),
    ('assets/sentences/s5_ketqua.mp3', 17.5),
    ('assets/sentences/s6_thuthach.mp3', 22.5),
]

for path, start_sec in sentences:
    cmd = [ffmpeg, '-y', '-i', path, '-f', 'f32le', '-ac', '1', '-ar', str(sr), '-']
    proc = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.DEVNULL, check=True)
    audio_data = np.frombuffer(proc.stdout, dtype=np.float32)
    start_idx = int(start_sec * sr)
    end_idx = min(start_idx + len(audio_data), total_samples)
    voice_track[start_idx:end_idx] += audio_data[:end_idx - start_idx]

# Normalize voice to standard broadcast level 0.88 (-1.1 dB FS)
voice_peak = np.max(np.abs(voice_track))
if voice_peak > 0:
    voice_track = (voice_track / voice_peak) * 0.88

# Export clean standalone voice
wavfile.write('assets/voice.wav', sr, (voice_track * 32767).astype(np.int16))
cmd_v = [ffmpeg, '-y', '-i', 'assets/voice.wav', '-c:a', 'libmp3lame', '-b:a', '192k', 'assets/voice.mp3']
subprocess.run(cmd_v, check=True)
print("1. Assembled full-volume assets/voice.mp3 successfully!")

# 2. Synthesize Cartoon Sound Effects Track
sfx_track = np.zeros(total_samples, dtype=np.float32)

def add_sfx(clip, start_sec, volume=1.0):
    start_idx = int(start_sec * sr)
    end_idx = min(start_idx + len(clip), total_samples)
    clip_len = end_idx - start_idx
    if clip_len > 0:
        sfx_track[start_idx:end_idx] += clip[:clip_len] * volume

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

def create_bubble(duration=0.09, f0=280, f1=920):
    t = np.linspace(0, duration, int(sr * duration), endpoint=False)
    freq = f0 + (f1 - f0) * (t / duration) ** 0.6
    phase = 2 * np.pi * np.cumsum(freq) / sr
    env = np.sin(np.pi * (t / duration)) ** 1.5 * np.exp(-t * 18)
    s = np.sin(phase) * env
    return s / (np.max(np.abs(s)) + 1e-6)

def create_sparkle(duration=0.55):
    t = np.linspace(0, duration, int(sr * duration), endpoint=False)
    freqs = [2093.0, 2637.0, 3136.0, 4186.0]
    out = np.zeros_like(t)
    for f in freqs:
        env = np.exp(-t * 6.5)
        out += np.sin(2 * np.pi * f * t) * env
    out *= (1 + 0.3 * np.sin(2 * np.pi * 18 * t))
    return out / (np.max(np.abs(out)) + 1e-6)

def create_slide(duration=0.22, f_start=240, f_end=580):
    t = np.linspace(0, duration, int(sr * duration), endpoint=False)
    freq = f_start + (f_end - f_start) * (t / duration)
    phase = 2 * np.pi * np.cumsum(freq) / sr
    env = np.sin(np.pi * (t / duration)) ** 2
    s = np.sin(phase) * env
    return s / (np.max(np.abs(s)) + 1e-6)

def create_ding(duration=0.6, freq=1568.0):
    t = np.linspace(0, duration, int(sr * duration), endpoint=False)
    env = np.exp(-t * 5.5)
    tone = np.sin(2 * np.pi * freq * t) + 0.35 * np.sin(2 * np.pi * freq * 2 * t)
    s = tone * env
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
    idx2 = int(0.012 * sr)
    b2_len = int(0.004 * sr)
    if idx2 + b2_len < len(t):
        s[idx2:idx2+b2_len] += 0.5 * np.random.uniform(-1, 1, b2_len) * np.exp(-np.linspace(0, 1, b2_len)*10)
    return s / (np.max(np.abs(s)) + 1e-6)

# Generate clips
whoosh_intro = create_whoosh(0.38, 250, 1800)
whoosh_trans = create_whoosh(0.30, 300, 1500)
pop1 = create_pop(0.065, 820, 240)
pop2 = create_pop(0.065, 720, 200)
bubble = create_bubble(0.09)
sparkle = create_sparkle(0.55)
slide = create_slide(0.22)
ding = create_ding(0.65, 1568.0)
boing = create_boing(0.60)
chime = create_chime(1.25)
click = create_click(0.04)

# SFX scaled to soft cartoon accents (~12 dB under voice)
scale = 0.22
add_sfx(whoosh_intro, 0.08, volume=0.85 * scale)
add_sfx(pop1, 0.25, volume=0.70 * scale)
add_sfx(pop1, 0.45, volume=0.85 * scale)
add_sfx(sparkle, 0.75, volume=0.75 * scale)
add_sfx(pop2, 1.05, volume=0.65 * scale)

add_sfx(whoosh_trans, 4.15, volume=0.70 * scale)
add_sfx(pop1, 4.60, volume=0.75 * scale)
add_sfx(pop2, 4.75, volume=0.60 * scale)
add_sfx(pop1, 4.90, volume=0.75 * scale)
add_sfx(pop1, 5.20, volume=0.85 * scale)
add_sfx(bubble, 5.80, volume=0.85 * scale)

add_sfx(whoosh_trans, 8.95, volume=0.70 * scale)
add_sfx(slide, 9.35, volume=0.65 * scale)
add_sfx(slide, 9.55, volume=0.65 * scale)
add_sfx(pop2, 9.90, volume=0.70 * scale)

add_sfx(whoosh_trans, 12.95, volume=0.70 * scale)
add_sfx(ding, 13.40, volume=0.75 * scale)
add_sfx(boing, 14.80, volume=0.95 * scale)

add_sfx(whoosh_trans, 17.40, volume=0.70 * scale)
add_sfx(chime, 17.65, volume=0.95 * scale)
add_sfx(sparkle, 18.50, volume=0.75 * scale)

add_sfx(whoosh_trans, 22.40, volume=0.70 * scale)
add_sfx(pop1, 22.80, volume=0.75 * scale)
add_sfx(click, 26.50, volume=0.95 * scale)

wavfile.write("assets/sfx_track.wav", sr, (sfx_track * 32767).astype(np.int16))
print("2. Exported assets/sfx_track.wav successfully!")

# 3. Direct clean float32 mix (Voice 100% full volume + 50% SFX background accents)
master = voice_track + sfx_track
peak = np.max(np.abs(master))
if peak > 0.95:
    master = (master / peak) * 0.95

wavfile.write("assets/audio_master.wav", sr, (master * 32767).astype(np.int16))
cmd_m = [ffmpeg, '-y', '-i', 'assets/audio_master.wav', '-c:a', 'libmp3lame', '-b:a', '192k', 'assets/audio.mp3']
subprocess.run(cmd_m, check=True)
print("3. Mixed master assets/audio.mp3 successfully!")
