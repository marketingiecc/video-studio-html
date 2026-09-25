/**
 * VieNeu MCP Client — persistent child_process JSON-RPC 2.0 client.
 *
 * Spawns a single Python MCP server process and keeps it alive for the
 * duration of the Node server. Does NOT spawn a new model per scene.
 *
 * Usage:
 *   const { VieNeuMcpClient } = require('./vieneu-mcp-client');
 *   const client = new VieNeuMcpClient();
 *   await client.initialize();
 *   const voices = await client.listVoices();
 *   const result = await client.synthesize({ text: 'Xin chào', voice: 'Mai Anh', outputPath: 'scene-01.wav' });
 *   client.close();
 */

const { spawn } = require('child_process');
const path = require('path');
const { EventEmitter } = require('events');

const DEFAULT_TIMEOUT_MS = 120000;
const HANDSHAKE_TIMEOUT_MS = 30000;

const VOICE_MAP = {
  'vi-VN-HoaiMyNeural': 'Mai Anh',
  'vi-VN-NamMinhNeural': 'Hải Đăng',
};

const DEFAULT_VIENEU_VOICE = 'Mai Anh';

class VieNeuMcpClient extends EventEmitter {
  /**
   * @param {object} [options]
   * @param {string} [options.command] — override the spawn command (for testing)
   * @param {string[]} [options.args] — override the spawn args (for testing)
   * @param {function} [options.spawnFn] — override child_process.spawn (for testing)
   * @param {number} [options.timeoutMs] — default RPC timeout
   * @param {string} [options.outputRoot] — override MATHCA_TTS_OUTPUT_ROOT
   */
  constructor(options = {}) {
    super();
    this._options = options;
    this._child = null;
    this._buffer = '';
    this._requestId = 0;
    this._pending = new Map();
    this._ready = false;
    this._closed = false;
    this._timeoutMs = options.timeoutMs || DEFAULT_TIMEOUT_MS;
    this._outputRoot = options.outputRoot || path.join(__dirname, 'public', 'assets', 'voice-segments');
  }

  /**
   * Whether the MCP server is initialized and ready for tool calls.
   */
  isReady() {
    return this._ready && this._child !== null && this._child.exitCode === null;
  }

  /**
   * Map an Edge TTS voice name to a VieNeu voice name.
   * If the voice is already a VieNeu name, return it as-is.
   */
  static mapVoice(voice) {
    if (!voice) return DEFAULT_VIENEU_VOICE;
    if (VOICE_MAP[voice]) return VOICE_MAP[voice];
    // If it's already a VieNeu preset name, keep it
    return voice;
  }

  /**
   * Spawn the MCP server child process and perform the initialize handshake.
   */
  async initialize() {
    if (this._ready) return;
    if (this._closed) throw new Error('VieNeu MCP client has been closed.');

    const spawnFn = this._options.spawnFn || spawn;
    const studioRoot = path.resolve(__dirname);
    const mcpServerPath = path.join(studioRoot, 'integrations', 'vieneu-mcp', 'server.py');
    const vieneuProject = path.join(studioRoot, 'integrations', 'VieNeu-TTS');

    const command = this._options.command || 'uv';
    const args = this._options.args || [
      'run',
      '--project', vieneuProject,
      'python', mcpServerPath,
    ];
    const env = {
      ...process.env,
      MATHCA_TTS_OUTPUT_ROOT: this._outputRoot,
      VIENEU_MODE: process.env.VIENEU_MODE || 'v3turbo',
      VIENEU_BACKEND: process.env.VIENEU_BACKEND || 'onnx',
      VIENEU_PRECISION: process.env.VIENEU_PRECISION || 'fp32',
      VIENEU_THREADS: process.env.VIENEU_THREADS || '0',
    };

    this._child = spawnFn(command, args, {
      cwd: studioRoot,
      env,
      stdio: ['pipe', 'pipe', 'pipe'],
      windowsHide: true,
      shell: false,
    });

    this._child.stdout.setEncoding('utf8');
    this._child.stdout.on('data', (chunk) => this._onData(chunk));
    this._child.stderr.setEncoding('utf8');
    this._child.stderr.on('data', (chunk) => {
      // Log stderr but never feed it to the JSON parser
      const lines = chunk.split(/\r?\n/).filter(Boolean);
      lines.forEach((line) => console.log(`[VieNeu-MCP] ${line}`));
    });

    this._child.on('error', (error) => {
      console.error('[VieNeu-MCP] Process error:', error.message);
      this._rejectAll(new Error(`VieNeu MCP process error: ${error.message}`));
      this._ready = false;
    });

    this._child.on('close', (code) => {
      console.log(`[VieNeu-MCP] Process exited with code ${code}`);
      this._rejectAll(new Error(`VieNeu MCP process exited with code ${code}`));
      this._ready = false;
      this._child = null;
    });

    // Perform MCP handshake
    try {
      const initResult = await this._request('initialize', {
        protocolVersion: '2024-11-05',
        capabilities: {},
        clientInfo: { name: 'mathca-studio', version: '1.0.0' },
      }, HANDSHAKE_TIMEOUT_MS);

      // Send initialized notification (no response expected)
      this._notify('notifications/initialized', {});
      this._ready = true;
      this.emit('ready', initResult);
      return initResult;
    } catch (error) {
      this.close();
      throw new Error(`VieNeu MCP handshake failed: ${error.message}`);
    }
  }

  /**
   * List available voices.
   */
  async listVoices() {
    await this._ensureReady();
    const result = await this._request('tools/call', {
      name: 'vieneu_list_voices',
      arguments: {},
    });
    return this._parseToolResult(result);
  }

  /**
   * Synthesize text to a WAV file.
   * @param {object} params
   * @param {string} params.text
   * @param {string} [params.voice]
   * @param {string} [params.outputPath] — relative to output root
   * @returns {Promise<{provider, voice, outputPath, bytes, sampleRate, duration?}>}
   */
  async synthesize({ text, voice, outputPath }) {
    await this._ensureReady();
    const mappedVoice = VieNeuMcpClient.mapVoice(voice);
    const result = await this._request('tools/call', {
      name: 'vieneu_synthesize',
      arguments: {
        text,
        voice: mappedVoice,
        output_path: outputPath || 'output.wav',
      },
    });
    const parsed = this._parseToolResult(result);
    if (parsed.error) {
      throw new Error(parsed.error);
    }
    return parsed;
  }

  /**
   * Close the child process and clean up.
   */
  close() {
    this._closed = true;
    this._ready = false;
    this._rejectAll(new Error('VieNeu MCP client closed.'));
    if (this._child && this._child.exitCode === null) {
      try {
        this._child.stdin.end();
        this._child.kill('SIGTERM');
      } catch {}
    }
    this._child = null;
  }

  // --- Internal methods ---

  async _ensureReady() {
    if (this._ready && this._child && this._child.exitCode === null) return;
    // Try to re-initialize
    this._ready = false;
    this._child = null;
    this._closed = false;
    await this.initialize();
  }

  _nextId() {
    this._requestId += 1;
    return this._requestId;
  }

  _request(method, params, timeout) {
    return new Promise((resolve, reject) => {
      if (!this._child || this._child.exitCode !== null) {
        reject(new Error('VieNeu MCP process is not running.'));
        return;
      }

      const id = this._nextId();
      const timeoutMs = timeout || this._timeoutMs;

      const timer = setTimeout(() => {
        this._pending.delete(id);
        reject(new Error(`VieNeu MCP timeout after ${timeoutMs}ms for ${method}`));
      }, timeoutMs);

      this._pending.set(id, { resolve, reject, timer, method });

      const message = JSON.stringify({ jsonrpc: '2.0', id, method, params }) + '\n';
      try {
        this._child.stdin.write(message);
      } catch (error) {
        clearTimeout(timer);
        this._pending.delete(id);
        reject(new Error(`Failed to write to VieNeu MCP: ${error.message}`));
      }
    });
  }

  _notify(method, params) {
    if (!this._child || this._child.exitCode !== null) return;
    const message = JSON.stringify({ jsonrpc: '2.0', method, params }) + '\n';
    try {
      this._child.stdin.write(message);
    } catch {}
  }

  _onData(chunk) {
    this._buffer += chunk;
    let newlineIndex;
    while ((newlineIndex = this._buffer.indexOf('\n')) !== -1) {
      const line = this._buffer.slice(0, newlineIndex).trim();
      this._buffer = this._buffer.slice(newlineIndex + 1);
      if (!line) continue;
      try {
        const message = JSON.parse(line);
        this._handleResponse(message);
      } catch (error) {
        console.warn('[VieNeu-MCP] Invalid JSON from server:', line.slice(0, 200));
      }
    }
  }

  _handleResponse(message) {
    const id = message.id;
    if (id == null) return; // notification, ignore

    const pending = this._pending.get(id);
    if (!pending) return;
    this._pending.delete(id);
    clearTimeout(pending.timer);

    if (message.error) {
      pending.reject(new Error(`VieNeu MCP error [${message.error.code}]: ${message.error.message}`));
    } else {
      pending.resolve(message.result);
    }
  }

  _rejectAll(error) {
    for (const [id, pending] of this._pending) {
      clearTimeout(pending.timer);
      pending.reject(error);
    }
    this._pending.clear();
  }

  _parseToolResult(result) {
    if (!result || !Array.isArray(result.content)) return result;
    const textContent = result.content.find((c) => c.type === 'text');
    if (!textContent) return result;
    try {
      return JSON.parse(textContent.text);
    } catch {
      return textContent.text;
    }
  }
}

module.exports = { VieNeuMcpClient, VOICE_MAP, DEFAULT_VIENEU_VOICE };
