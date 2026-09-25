import numpy as np
from scipy.io import wavfile
import subprocess
import os

sr = 44100
total_duration = 28.30
total_samples = int(sr * total_duration)
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

# Generate sounds
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

# Place on timeline with 50% reduced volume for gentle, subtle, clean SFX
scale_50 = 0.5

# Beat 1: Hook (0s - 4.2s)
add_sfx(whoosh_intro, 0.10, volume=0.85 * scale_50)
add_sfx(pop1, 0.45, volume=0.60 * scale_50)
add_sfx(pop2, 0.55, volume=0.65 * scale_50)
add_sfx(pop1, 0.75, volume=0.75 * scale_50)
add_sfx(pop2, 0.87, volume=0.60 * scale_50)
add_sfx(pop1, 0.99, volume=0.75 * scale_50)
add_sfx(pop2, 1.11, volume=0.60 * scale_50)
add_sfx(pop1, 1.23, volume=0.85 * scale_50)
add_sfx(pop2, 1.45, volume=0.65 * scale_50)
add_sfx(sparkle, 1.70, volume=0.80 * scale_50)

# Beat 2: Speech bubble & Scene 2 Split (4.2s - 9.3s)
add_sfx(bubble, 4.20, volume=0.85 * scale_50)
add_sfx(whoosh_trans, 6.80, volume=0.70 * scale_50)
add_sfx(slide, 7.25, volume=0.65 * scale_50)
add_sfx(slide, 7.40, volume=0.65 * scale_50)
add_sfx(pop2, 7.80, volume=0.70 * scale_50)

# Beat 3: Step 2 Addition (9.3s - 14.5s)
add_sfx(whoosh_trans, 9.20, volume=0.70 * scale_50)
add_sfx(ding, 9.65, volume=0.75 * scale_50)
add_sfx(boing, 11.20, volume=0.95 * scale_50)

# Beat 4: Climax Result (14.5s - 22.0s)
add_sfx(whoosh_trans, 14.30, volume=0.70 * scale_50)
add_sfx(chime, 14.75, volume=0.95 * scale_50)
add_sfx(sparkle, 15.60, volume=0.75 * scale_50)

# Beat 5: Challenge & CTA (22.0s - 28.3s)
add_sfx(whoosh_trans, 21.80, volume=0.70 * scale_50)
add_sfx(pop1, 22.25, volume=0.75 * scale_50)
add_sfx(click, 25.20, volume=0.95 * scale_50)

# Normalize SFX track so maximum amplitude is well under threshold
wavfile.write("assets/sfx_track.wav", sr, (sfx_track * 32767).astype(np.int16))
print("Exported assets/sfx_track.wav with 50% volume successfully!")
