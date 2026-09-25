#!/usr/bin/env python3
"""
VieNeu-TTS MCP Server — JSON-RPC 2.0 over stdio.

Provides two tools:
  - vieneu_list_voices: list available preset voices.
  - vieneu_synthesize: synthesize text to a WAV file.

Protocol: one JSON message per line on stdin/stdout.
All logging goes to stderr. stdout is reserved for protocol only.

Environment variables:
  VIENEU_MODE      — TTS mode (default: v3turbo)
  VIENEU_BACKEND   — inference backend (default: onnx)
  VIENEU_PRECISION — model precision (default: fp32)
  VIENEU_THREADS   — CPU threads (default: 0 = auto)
  MATHCA_TTS_OUTPUT_ROOT — output directory root (required for synthesize)
"""

import json
import os
import sys
import signal
import traceback

# --- Configuration ---
VIENEU_MODE = os.environ.get("VIENEU_MODE", "v3turbo")
VIENEU_BACKEND = os.environ.get("VIENEU_BACKEND", "onnx")
VIENEU_PRECISION = os.environ.get("VIENEU_PRECISION", "fp32")
VIENEU_THREADS = int(os.environ.get("VIENEU_THREADS", "0"))
OUTPUT_ROOT = os.environ.get("MATHCA_TTS_OUTPUT_ROOT", "")

# Force UTF-8 on Windows to prevent charmap codec errors
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8')
if hasattr(sys.stdin, 'reconfigure'):
    sys.stdin.reconfigure(encoding='utf-8')

# Lazy-loaded TTS engine
_tts_instance = None
_tts_load_error = None


def log(msg: str) -> None:
    """Log to stderr only."""
    print(f"[vieneu-mcp] {msg}", file=sys.stderr, flush=True)


def send_response(obj: dict) -> None:
    """Write a JSON-RPC response to stdout."""
    line = json.dumps(obj, ensure_ascii=False)
    sys.stdout.write(line + "\n")
    sys.stdout.flush()


def make_error(request_id, code: int, message: str, data=None) -> dict:
    error = {"code": code, "message": message}
    if data is not None:
        error["data"] = data
    return {"jsonrpc": "2.0", "id": request_id, "error": error}


def make_result(request_id, result) -> dict:
    return {"jsonrpc": "2.0", "id": request_id, "result": result}


def get_tts():
    """Lazy-load the VieNeu TTS engine."""
    global _tts_instance, _tts_load_error
    if _tts_instance is not None:
        return _tts_instance
    if _tts_load_error is not None:
        raise RuntimeError(_tts_load_error)
    try:
        log(f"Loading VieNeu mode={VIENEU_MODE} backend={VIENEU_BACKEND}")
        from vieneu import Vieneu
        kwargs = {"mode": VIENEU_MODE, "backend": VIENEU_BACKEND}
        _tts_instance = Vieneu(**kwargs)
        log("VieNeu TTS engine loaded successfully.")
        return _tts_instance
    except Exception as e:
        _tts_load_error = str(e)
        log(f"Failed to load VieNeu: {e}")
        raise


def list_voices():
    """List available preset voices."""
    try:
        tts = get_tts()
        presets = getattr(tts, "_preset_voices", {})
        result = []
        for item in tts.list_preset_voices():
            if isinstance(item, (list, tuple)) and len(item) >= 2:
                label, name = item[0], item[1]
                meta = presets.get(name, {}) if isinstance(presets, dict) else {}
                result.append({
                    "name": name,
                    "label": label,
                    "description": meta.get("description") or label,
                    "gender": meta.get("gender", ""),
                    "language": "vi",
                })
            elif isinstance(item, str):
                result.append({
                    "name": item,
                    "label": item,
                    "description": f"Giọng {item}",
                    "gender": "",
                    "language": "vi",
                })
            elif isinstance(item, dict):
                result.append(item)
        return result
    except Exception as e:
        log(f"Error in list_voices: {e}")
        return [
            {"name": "Mai Anh", "label": "⭐ Mai Anh — Nữ · Bắc · Tự nhiên, truyền cảm", "language": "vi", "gender": "female", "description": "Nữ · Bắc · Tự nhiên, truyền cảm"},
            {"name": "Hải Đăng", "label": "⭐ Hải Đăng — Nam · Nam · Truyền cảm, ấm áp", "language": "vi", "gender": "male", "description": "Nam · Nam · Truyền cảm, ấm áp"},
        ]


def validate_output_path(output_path: str) -> str:
    """Validate and resolve output path within OUTPUT_ROOT."""
    if not OUTPUT_ROOT:
        raise ValueError("MATHCA_TTS_OUTPUT_ROOT is not set.")

    root = os.path.realpath(OUTPUT_ROOT)
    resolved = os.path.realpath(os.path.join(root, output_path))

    # Security: prevent path traversal outside output root
    if not resolved.startswith(root + os.sep) and resolved != root:
        raise ValueError(f"Output path traverses outside output root: {output_path}")

    # Validate extension
    ext = os.path.splitext(resolved)[1].lower()
    if ext not in (".wav", ".mp3", ".ogg", ".flac"):
        raise ValueError(f"Unsupported output extension: {ext}. Use .wav (recommended).")

    return resolved


def normalize_voice_name(voice: str, tts) -> str:
    """Resolve raw voice string to a valid VieNeu preset voice name."""
    if not voice:
        return "Mai Anh"
    if voice.startswith("vieneu:"):
        voice = voice[7:]
    voice = voice.strip()

    # Direct match or alias
    if hasattr(tts, "resolve_voice_name"):
        resolved = tts.resolve_voice_name(voice)
        if resolved:
            return resolved

    # Label format like "⭐ Name — description" (check before comma because description may have commas)
    clean = voice.replace("⭐", "").strip()
    if "—" in clean:
        clean = clean.split("—")[0].strip()
        if hasattr(tts, "resolve_voice_name"):
            resolved = tts.resolve_voice_name(clean)
            if resolved:
                return resolved

    # Tuple string artifact like "label,name"
    if "," in voice:
        parts = voice.split(",")
        last_part = parts[-1].strip().strip("'\"()[]")
        if hasattr(tts, "resolve_voice_name"):
            resolved = tts.resolve_voice_name(last_part)
            if resolved:
                return resolved

    if hasattr(tts, "resolve_voice_name"):
        resolved = tts.resolve_voice_name(clean)
        if resolved:
            return resolved

    return voice


def synthesize(text: str, voice: str = "Mai Anh", output_path: str = "output.wav"):
    """Synthesize text to audio file."""
    if not text or not text.strip():
        raise ValueError("Text must not be empty.")

    resolved_path = validate_output_path(output_path)

    # Create parent directories safely
    parent = os.path.dirname(resolved_path)
    os.makedirs(parent, exist_ok=True)

    tts = get_tts()
    clean_voice = normalize_voice_name(voice, tts)
    log(f"Synthesizing: raw_voice={voice} -> resolved_voice={clean_voice}, text={text[:60]}...")

    audio = tts.infer(text, voice=clean_voice)
    tts.save(audio, resolved_path)

    stat = os.stat(resolved_path)
    result = {
        "provider": "vieneu",
        "mode": VIENEU_MODE,
        "voice": voice,
        "outputPath": resolved_path,
        "bytes": stat.st_size,
        "sampleRate": 48000,
    }

    # Try to compute duration if possible
    try:
        import wave
        with wave.open(resolved_path, 'rb') as wf:
            frames = wf.getnframes()
            rate = wf.getframerate()
            result["duration"] = round(frames / rate, 3) if rate > 0 else None
            result["sampleRate"] = rate
            result["channels"] = wf.getnchannels()
    except Exception:
        pass

    log(f"Synthesis complete: {stat.st_size} bytes -> {resolved_path}")
    return result


# --- Tool definitions ---
TOOLS = [
    {
        "name": "vieneu_list_voices",
        "description": "List available VieNeu preset voices.",
        "inputSchema": {
            "type": "object",
            "properties": {},
        },
    },
    {
        "name": "vieneu_synthesize",
        "description": "Synthesize Vietnamese text to audio using VieNeu TTS.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "text": {
                    "type": "string",
                    "description": "Text to synthesize (Vietnamese).",
                },
                "voice": {
                    "type": "string",
                    "description": "Voice preset name (e.g. 'Mai Anh', 'Hải Đăng').",
                    "default": "Mai Anh",
                },
                "output_path": {
                    "type": "string",
                    "description": "Output file path relative to MATHCA_TTS_OUTPUT_ROOT.",
                    "default": "output.wav",
                },
            },
            "required": ["text"],
        },
    },
]


# --- JSON-RPC handlers ---
def handle_initialize(request_id, _params):
    send_response(make_result(request_id, {
        "protocolVersion": "2024-11-05",
        "capabilities": {"tools": {}},
        "serverInfo": {
            "name": "vieneu-tts-mcp",
            "version": "1.0.0",
        },
    }))


def handle_tools_list(request_id, _params):
    send_response(make_result(request_id, {"tools": TOOLS}))


def handle_tools_call(request_id, params):
    tool_name = params.get("name", "")
    arguments = params.get("arguments", {})

    try:
        if tool_name == "vieneu_list_voices":
            voices = list_voices()
            send_response(make_result(request_id, {
                "content": [{"type": "text", "text": json.dumps(voices, ensure_ascii=False)}],
            }))
        elif tool_name == "vieneu_synthesize":
            result = synthesize(
                text=arguments.get("text", ""),
                voice=arguments.get("voice", "Mai Anh"),
                output_path=arguments.get("output_path", "output.wav"),
            )
            send_response(make_result(request_id, {
                "content": [{"type": "text", "text": json.dumps(result, ensure_ascii=False)}],
            }))
        else:
            send_response(make_error(request_id, -32601, f"Unknown tool: {tool_name}"))
    except Exception as e:
        log(f"Tool error: {e}")
        send_response(make_result(request_id, {
            "content": [{"type": "text", "text": json.dumps({"error": str(e)}, ensure_ascii=False)}],
            "isError": True,
        }))


def handle_message(message: dict):
    method = message.get("method", "")
    request_id = message.get("id")
    params = message.get("params", {})

    # Notifications (no id) — just acknowledge
    if request_id is None:
        if method == "notifications/initialized":
            log("Client initialized notification received.")
        return

    if method == "initialize":
        handle_initialize(request_id, params)
    elif method == "tools/list":
        handle_tools_list(request_id, params)
    elif method == "tools/call":
        handle_tools_call(request_id, params)
    else:
        send_response(make_error(request_id, -32601, f"Method not found: {method}"))


def main():
    log("VieNeu MCP Server starting (stdio)...")

    def handle_sigterm(_sig, _frame):
        log("Received SIGTERM, shutting down.")
        sys.exit(0)

    signal.signal(signal.SIGTERM, handle_sigterm)

    try:
        for line in sys.stdin:
            line = line.strip()
            if not line:
                continue
            try:
                message = json.loads(line)
                handle_message(message)
            except json.JSONDecodeError as e:
                log(f"Invalid JSON: {e}")
                send_response(make_error(None, -32700, f"Parse error: {e}"))
            except Exception as e:
                log(f"Handler error: {e}\n{traceback.format_exc()}")
                request_id = None
                try:
                    request_id = json.loads(line).get("id")
                except Exception:
                    pass
                send_response(make_error(request_id, -32603, str(e)))
    except (EOFError, BrokenPipeError):
        log("stdin closed, shutting down.")
    except KeyboardInterrupt:
        log("Interrupted, shutting down.")

    sys.exit(0)


if __name__ == "__main__":
    main()
