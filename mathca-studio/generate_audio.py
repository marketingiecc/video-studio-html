#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
MathCA Video Studio Pro - Automatic Audio & Voiceover Generation Pipeline
Synthesizes Vietnamese Edge-TTS voiceover for all scenes in a project JSON,
generates cartoon SFX, and mixes voice (100%) + SFX (50%) in float32.
"""

import sys
import os
import json
import asyncio
import subprocess
import shutil
import argparse
import numpy as np
from scipy.io import wavfile

# Fix Windows Unicode stdout encoding
if sys.platform == 'win32':
    import codecs
    sys.stdout = codecs.getwriter('utf-8')(sys.stdout.detach())
    sys.stderr = codecs.getwriter('utf-8')(sys.stderr.detach())

def find_ffmpeg():
    # 1. PATH
    w = shutil.which("ffmpeg")
    if w:
        return w
    # 2. Known Windows WinGet location
    winget_path = r'C:\Users\lexua\AppData\Local\Microsoft\WinGet\Packages\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\ffmpeg-8.1.2-full_build\bin\ffmpeg.exe'
    if os.path.exists(winget_path):
        return winget_path
    # 3. Global search in LocalAppData
    local_app_data = os.environ.get('LOCALAPPDATA', '')
    if local_app_data:
        import glob
        matches = glob.glob(os.path.join(local_app_data, '**', 'ffmpeg.exe'), recursive=True)
        if matches:
            return matches[0]
    return "ffmpeg"

FFMPEG = find_ffmpeg()
SAMPLE_RATE = 44100

async def synthesize_scenes(scenes, voice, temp_dir):
    import edge_tts
    os.makedirs(temp_dir, exist_ok=True)
    tts_results = []

    for idx, scene in enumerate(scenes):
        text = (scene.get('voiceText') or '').strip()
        if not text:
            continue
        out_file = os.path.join(temp_dir, f"scene_{idx}.mp3")
        start_time = float(scene.get('startTime', 0.0))

        # Hoài My voice pitch and rate optimized for MathCA kids
        rate = "+18%"
        pitch = "+4Hz"
        if "NamMinh" in voice:
            rate = "+15%"
            pitch = "+2Hz"

        communicate = edge_tts.Communicate(text, voice, rate=rate, pitch=pitch)
        await communicate.save(out_file)
        tts_results.append((out_file, start_time, idx))
        print(f"  [TTS] Cảnh {idx + 1} ({start_time}s): \"{text}\" -> OK")

    return tts_results

# Procedural Sound Effects Synthesis in float32
def create_whoosh(duration=0.35, f_start=300, f_end=1600):
    t = np.linspace(0, duration, int(SAMPLE_RATE * duration), endpoint=False)
    noise = np.random.uniform(-1, 1, len(t))
    env = (np.sin(np.pi * (t / duration))) ** 2.2
    sweep = np.sin(2 * np.pi * (f_start + (f_end - f_start) * (t / duration)**2) * t)
    s = (0.75 * noise + 0.25 * sweep) * env
    return s / (np.max(np.abs(s)) + 1e-6)

def create_pop(duration=0.065, f0=750, f1=180):
    t = np.linspace(0, duration, int(SAMPLE_RATE * duration), endpoint=False)
    freq = f0 * (f1 / f0) ** (t / duration)
    phase = 2 * np.pi * np.cumsum(freq) / SAMPLE_RATE
    env = np.exp(-t * 60)
    s = np.sin(phase) * env
    return s / (np.max(np.abs(s)) + 1e-6)

def create_bubble(duration=0.09, f0=280, f1=920):
    t = np.linspace(0, duration, int(SAMPLE_RATE * duration), endpoint=False)
    freq = f0 + (f1 - f0) * (t / duration) ** 0.6
    phase = 2 * np.pi * np.cumsum(freq) / SAMPLE_RATE
    env = np.sin(np.pi * (t / duration)) ** 1.5 * np.exp(-t * 18)
    s = np.sin(phase) * env
    return s / (np.max(np.abs(s)) + 1e-6)

def create_ding(duration=0.6, freq=1568.0):
    t = np.linspace(0, duration, int(SAMPLE_RATE * duration), endpoint=False)
    env = np.exp(-t * 5.5)
    tone = np.sin(2 * np.pi * freq * t) + 0.35 * np.sin(2 * np.pi * freq * 2 * t)
    s = tone * env
    return s / (np.max(np.abs(s)) + 1e-6)

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--project', required=True, help="Path to project JSON file")
    parser.add_argument('--output-dir', default="public/assets", help="Directory to save audio.mp3")
    args = parser.parse_args()

    with open(args.project, 'r', encoding='utf-8') as f:
        project_data = json.load(f)

    meta = project_data.get('metadata', {})
    total_duration = float(meta.get('duration', 29.5))
    voice = meta.get('voice', 'vi-VN-HoaiMyNeural')
    scenes = project_data.get('scenes', [])

    temp_dir = os.path.join(os.path.dirname(args.output_dir), 'temp_tts')
    print(f"=== BẮT ĐẦU TỔNG HỢP ÂM THANH CHO DỰ ÁN: {meta.get('title', 'MathCA')} ===")
    print(f"Giọng đọc AI: {voice} | Thời lượng: {total_duration}s | Số cảnh: {len(scenes)}")

    # 1. Synthesize all scenes with Edge-TTS
    tts_results = asyncio.run(synthesize_scenes(scenes, voice, temp_dir))

    total_samples = int(SAMPLE_RATE * total_duration)
    voice_track = np.zeros(total_samples, dtype=np.float32)

    # 2. Decode each scene MP3 and place into voice_track
    for file_path, start_sec, idx in tts_results:
        cmd = [FFMPEG, '-y', '-i', file_path, '-f', 'f32le', '-ac', '1', '-ar', str(SAMPLE_RATE), '-']
        proc = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.DEVNULL, check=True)
        audio_data = np.frombuffer(proc.stdout, dtype=np.float32)
        start_idx = int(start_sec * SAMPLE_RATE)
        end_idx = min(start_idx + len(audio_data), total_samples)
        voice_track[start_idx:end_idx] += audio_data[:end_idx - start_idx]

    # Normalize voice to -1.1 dB FS (Broadcast standard)
    peak = np.max(np.abs(voice_track))
    if peak > 0:
        voice_track = (voice_track / peak) * 0.88

    # 3. Procedural Cartoon SFX Track
    sfx_track = np.zeros(total_samples, dtype=np.float32)

    def add_sfx(clip, start_sec, vol=1.0):
        start_idx = int(start_sec * SAMPLE_RATE)
        end_idx = min(start_idx + len(clip), total_samples)
        if end_idx > start_idx:
            sfx_track[start_idx:end_idx] += clip[:end_idx - start_idx] * vol

    # Add whooshes at transitions and pops at badges
    for s in scenes:
        t_start = float(s.get('startTime', 0.0))
        add_sfx(create_whoosh(0.3), max(0, t_start - 0.15), 0.6)
        add_sfx(create_pop(0.06), t_start + 0.2, 0.7)

    # Climax ding at 60% mark
    add_sfx(create_ding(0.6), total_duration * 0.6, 0.8)

    # 4. Master Mix: Voice 100% + SFX 50% (-12 dB)
    master_track = voice_track + (sfx_track * 0.35)
    master_peak = np.max(np.abs(master_track))
    if master_peak > 0.95:
        master_track = (master_track / master_peak) * 0.95

    # 5. Export to target assets
    os.makedirs(args.output_dir, exist_ok=True)
    temp_wav = os.path.join(temp_dir, "master_temp.wav")
    wavfile.write(temp_wav, SAMPLE_RATE, (master_track * 32767).astype(np.int16))

    out_mp3 = os.path.join(args.output_dir, "audio.mp3")
    cmd_mp3 = [FFMPEG, '-y', '-i', temp_wav, '-c:a', 'libmp3lame', '-b:a', '192k', out_mp3]
    subprocess.run(cmd_mp3, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=True)

    # Clean up temp
    try:
        shutil.rmtree(temp_dir)
    except:
        pass

    print(f"=== HOÀN TẤT XUẤT FILE ÂM THANH MỚI: {out_mp3} ===")
    print("SUCCESS")

if __name__ == '__main__':
    main()
