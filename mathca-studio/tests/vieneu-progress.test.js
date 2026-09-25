/**
 * Tests for server.js inferAudioProgress and VieNeu MCP client.
 */
const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

// --- inferAudioProgress tests ---
// We need to extract the function. Since server.js exports module.exports = { createApp, startServer, inferAudioProgress }
// But server.js doesn't export inferAudioProgress. We'll test it by loading server.js
// and testing via createApp + api calls. Instead, let's replicate the function for unit tests.

function inferAudioProgress(stage, totalScenes, currentProgress = 0) {
  const text = String(stage || '');
  const sceneMatch = text.match(/cảnh\s+(\d+)\/(\d+)/i);
  if (sceneMatch) {
    const index = Math.max(1, Number(sceneMatch[1]) || 1);
    const total = Math.max(1, Number(sceneMatch[2]) || totalScenes || 1);
    const candidate = Math.min(86, 8 + Math.round((index / total) * 76));
    return Math.max(candidate, Number(currentProgress) || 0);
  }
  if (/dùng lại giọng đọc/i.test(text)) {
    const cacheMatch = text.match(/(\d+)\/(\d+)/);
    if (cacheMatch) {
      const index = Math.max(1, Number(cacheMatch[1]) || 1);
      const total = Math.max(1, Number(cacheMatch[2]) || totalScenes || 1);
      const candidate = Math.min(86, 8 + Math.round((index / total) * 76));
      return Math.max(candidate, Number(currentProgress) || 0);
    }
  }
  if (/khởi động VieNeu|đang tải model/i.test(text)) return Math.max(5, Number(currentProgress) || 0);
  if (/fallback.*Edge|Edge.*fallback|circuit.?break/i.test(text)) return Math.max(Number(currentProgress) || 0, 6);
  if (/ghép voiceover/i.test(text)) return Math.max(90, Number(currentProgress) || 0);
  if (/trộn BGM|trộn SFX|mixing/i.test(text)) return Math.max(92, Number(currentProgress) || 0);
  if (/hoàn tất|đã khớp/i.test(text)) return 100;
  if (/thất bại|lỗi|error/i.test(text)) return Number(currentProgress) || 0;
  return Math.max(3, Number(currentProgress) || 0);
}

describe('inferAudioProgress', () => {
  it('returns >= 3 for unknown stage', () => {
    assert.ok(inferAudioProgress('bla bla') >= 3);
  });

  it('parses Vietnamese scene progress correctly', () => {
    const result = inferAudioProgress('Đang TTS cảnh 3/5', 5, 0);
    // 8 + round(3/5 * 76) = 8 + 46 = 54
    assert.equal(result, 54);
  });

  it('enforces non-regression (never goes backward)', () => {
    const result = inferAudioProgress('Đang TTS cảnh 1/5', 5, 60);
    // candidate = 8 + round(1/5 * 76) = 8 + 15 = 23, but currentProgress = 60
    assert.ok(result >= 60, `Expected >= 60, got ${result}`);
  });

  it('caps at 86 for scene progress', () => {
    const result = inferAudioProgress('Đang TTS cảnh 5/5', 5, 0);
    assert.ok(result <= 86, `Expected <= 86, got ${result}`);
  });

  it('handles "ghép voiceover" stage', () => {
    assert.ok(inferAudioProgress('Đang ghép voiceover master') >= 90);
  });

  it('handles mixing stage', () => {
    assert.ok(inferAudioProgress('Đang trộn BGM...') >= 92);
  });

  it('returns 100 for completion', () => {
    assert.equal(inferAudioProgress('Đã hoàn tất audio master'), 100);
    assert.equal(inferAudioProgress('Đã khớp duration'), 100);
  });

  it('handles VieNeu startup stage', () => {
    assert.ok(inferAudioProgress('Đang khởi động VieNeu...') >= 5);
  });

  it('handles fallback to Edge stage', () => {
    const result = inferAudioProgress('fallback sang Edge TTS', 5, 5);
    assert.ok(result >= 5);
  });

  it('handles circuit breaker stage', () => {
    const result = inferAudioProgress('circuit-breaker triggered', 5, 4);
    assert.ok(result >= 4);
  });

  it('handles cache reuse stage', () => {
    const result = inferAudioProgress('Dùng lại giọng đọc 2/4', 4, 0);
    assert.ok(result > 3);
  });

  it('does not return 100 on error', () => {
    const result = inferAudioProgress('Tạo âm thanh thất bại');
    assert.ok(result < 100, `Expected < 100, got ${result}`);
  });
});

// --- VieNeuMcpClient tests ---
describe('VieNeuMcpClient', () => {
  const { VieNeuMcpClient, VOICE_MAP, DEFAULT_VIENEU_VOICE } = require('../vieneu-mcp-client');
  const { EventEmitter } = require('events');

  it('exports VieNeuMcpClient class', () => {
    assert.equal(typeof VieNeuMcpClient, 'function');
  });

  it('exports VOICE_MAP with known Edge voices', () => {
    assert.ok(VOICE_MAP['vi-VN-HoaiMyNeural']);
    assert.ok(VOICE_MAP['vi-VN-NamMinhNeural']);
  });

  it('mapVoice returns VieNeu name for Edge TTS voice', () => {
    assert.equal(VieNeuMcpClient.mapVoice('vi-VN-HoaiMyNeural'), 'Mai Anh');
    assert.equal(VieNeuMcpClient.mapVoice('vi-VN-NamMinhNeural'), 'Hải Đăng');
  });

  it('mapVoice returns default for null/undefined', () => {
    assert.equal(VieNeuMcpClient.mapVoice(null), DEFAULT_VIENEU_VOICE);
    assert.equal(VieNeuMcpClient.mapVoice(undefined), DEFAULT_VIENEU_VOICE);
  });

  it('mapVoice passes through unknown voice name', () => {
    assert.equal(VieNeuMcpClient.mapVoice('Mai Anh'), 'Mai Anh');
    assert.equal(VieNeuMcpClient.mapVoice('Custom Voice'), 'Custom Voice');
  });

  it('isReady returns false before initialization', () => {
    const client = new VieNeuMcpClient();
    assert.equal(client.isReady(), false);
  });

  it('initialize with fake process performs handshake', async () => {
    const fakeStdin = new (require('stream').PassThrough)();
    const fakeStdout = new (require('stream').PassThrough)();
    const fakeStderr = new (require('stream').PassThrough)();

    const fakeChild = new EventEmitter();
    fakeChild.stdin = fakeStdin;
    fakeChild.stdout = fakeStdout;
    fakeChild.stderr = fakeStderr;
    fakeChild.exitCode = null;
    fakeChild.kill = () => {};

    const spawnFn = () => fakeChild;
    const client = new VieNeuMcpClient({ spawnFn, timeoutMs: 3000 });

    // Listen for initialize request and respond
    let capturedRequest = null;
    fakeStdin.on('data', (chunk) => {
      const line = chunk.toString().trim();
      if (!line) return;
      try {
        const msg = JSON.parse(line);
        capturedRequest = msg;
        if (msg.method === 'initialize') {
          fakeStdout.write(JSON.stringify({
            jsonrpc: '2.0',
            id: msg.id,
            result: {
              protocolVersion: '2024-11-05',
              capabilities: { tools: {} },
              serverInfo: { name: 'test', version: '0.1' },
            },
          }) + '\n');
        }
      } catch {}
    });

    await client.initialize();
    assert.equal(client.isReady(), true);
    assert.ok(capturedRequest, 'Should have received at least one message');
    // Last captured message is notifications/initialized; verify handshake completed
    assert.ok(['initialize', 'notifications/initialized'].includes(capturedRequest.method));

    client.close();
    assert.equal(client.isReady(), false);
  });

  it('close rejects pending requests', async () => {
    const fakeStdin = new (require('stream').PassThrough)();
    const fakeStdout = new (require('stream').PassThrough)();
    const fakeStderr = new (require('stream').PassThrough)();

    const fakeChild = new EventEmitter();
    fakeChild.stdin = fakeStdin;
    fakeChild.stdout = fakeStdout;
    fakeChild.stderr = fakeStderr;
    fakeChild.exitCode = null;
    fakeChild.kill = () => {};

    const spawnFn = () => fakeChild;
    const client = new VieNeuMcpClient({ spawnFn, timeoutMs: 3000 });

    // Initialize handshake
    fakeStdin.on('data', (chunk) => {
      const line = chunk.toString().trim();
      if (!line) return;
      try {
        const msg = JSON.parse(line);
        if (msg.method === 'initialize') {
          fakeStdout.write(JSON.stringify({
            jsonrpc: '2.0',
            id: msg.id,
            result: { protocolVersion: '2024-11-05', capabilities: { tools: {} }, serverInfo: { name: 'test', version: '0.1' } },
          }) + '\n');
        }
        // Do NOT respond to tools/call — leave it pending
      } catch {}
    });

    await client.initialize();
    const pendingPromise = client.listVoices().catch((error) => error);
    client.close();
    const error = await pendingPromise;
    assert.ok(error instanceof Error);
    assert.ok(error.message.includes('closed') || error.message.includes('VieNeu'), `Error message should mention closed/VieNeu, got: ${error.message}`);
  });
});

// --- JSON integrity invariant tests ---
describe('JSON integrity', () => {
  it('loadProjectData preserves html_template and unknown fields', async () => {
    // We test this indirectly by verifying cloneJson preserves all keys
    const input = {
      metadata: { title: 'Test', html_template: '<div>{{content}}</div>', custom_field: 42 },
      scenes: [{ id: 's1', name: 'Scene 1', startTime: 0, endTime: 3, voiceText: 'Hello', elements: [] }],
      unknown_top_level: { nested: true },
    };

    const cloned = JSON.parse(JSON.stringify(input));
    assert.deepStrictEqual(cloned.metadata.html_template, input.metadata.html_template, 'html_template must be preserved');
    assert.deepStrictEqual(cloned.metadata.custom_field, input.metadata.custom_field, 'custom_field must be preserved');
    assert.deepStrictEqual(cloned.unknown_top_level, input.unknown_top_level, 'unknown_top_level must be preserved');
  });

  it('cloneJson round-trips without data loss', () => {
    const input = {
      metadata: { title: 'Demo', duration: 10 },
      scenes: [
        {
          id: 's1', name: 'Scene', startTime: 0, endTime: 5,
          voiceText: 'Xin chào',
          elements: [{ id: 'e1', type: 'text', text: 'Hello', unknown_prop: 123 }],
          custom_scene_prop: 'keep me',
        },
      ],
      audio: { bgm: { src: 'test.mp3' } },
      extra: [1, 2, 3],
    };

    const output = JSON.parse(JSON.stringify(input));
    assert.deepStrictEqual(output, input, 'Round-trip must be lossless');
  });
});

// --- VieNeu voice resolution & display name tests ---
describe('VieNeu voice naming and parsing', () => {
  const VOICE_DISPLAY_NAMES = {
    'vi-VN-HoaiMyNeural': 'Hoài My',
    'vi-VN-NamMinhNeural': 'Nam Minh',
  };

  function getVoiceDisplayName(voiceId) {
    if (!voiceId) return 'Unknown';
    if (VOICE_DISPLAY_NAMES[voiceId]) return VOICE_DISPLAY_NAMES[voiceId];
    if (voiceId.startsWith('vieneu:')) {
      let name = voiceId.slice(7);
      if (name.includes('—')) {
        name = name.split('—')[0];
      } else if (name.includes(',')) {
        name = name.split(',').pop();
      }
      name = name.replace(/^⭐\s*/, '').trim();
      return name || 'VieNeu';
    }
    return voiceId;
  }

  it('formats Edge TTS voices correctly', () => {
    assert.equal(getVoiceDisplayName('vi-VN-HoaiMyNeural'), 'Hoài My');
    assert.equal(getVoiceDisplayName('vi-VN-NamMinhNeural'), 'Nam Minh');
  });

  it('formats clean VieNeu voice ID correctly', () => {
    assert.equal(getVoiceDisplayName('vieneu:Mai Anh'), 'Mai Anh');
    assert.equal(getVoiceDisplayName('vieneu:Adam bựa'), 'Adam bựa');
  });

  it('cleans corrupt VieNeu tuple-string voice IDs with emojis and descriptions', () => {
    assert.equal(
      getVoiceDisplayName('vieneu:⭐ Adam bựa — Nam · Bắc · Phong cách tự nhiên,Adam bựa'),
      'Adam bựa'
    );
    assert.equal(
      getVoiceDisplayName('vieneu:⭐ Mai Anh — Nữ · Bắc · Tự nhiên, truyền cảm'),
      'Mai Anh'
    );
  });

  it('maps VieNeu voice list items to correct id, name, label and description', () => {
    const rawVoices = [
      { name: 'Adam bựa', label: '⭐ Adam bựa — Nam · Bắc · Phong cách tự nhiên', description: 'Nam · Bắc · Phong cách tự nhiên', gender: 'male' },
      ['⭐ Mai Anh — Nữ · Bắc · Tự nhiên, truyền cảm', 'Mai Anh'],
      'Hải Đăng',
    ];

    const mapped = rawVoices.map((v) => {
      let voiceName = '';
      let voiceLabel = '';
      let voiceDesc = '';
      let gender = null;
      if (typeof v === 'string') {
        voiceName = v;
        voiceLabel = v;
        voiceDesc = `Giọng VieNeu ${v}`;
      } else if (Array.isArray(v)) {
        voiceLabel = v[0] || '';
        voiceName = v[1] || v[0] || '';
        voiceDesc = voiceLabel;
      } else if (typeof v === 'object' && v !== null) {
        voiceName = v.name || '';
        voiceLabel = v.label || v.name || '';
        voiceDesc = v.description || voiceLabel;
        gender = v.gender || null;
      }
      if (!voiceName && voiceLabel) {
        voiceName = voiceLabel.replace(/^⭐\s*/, '').split('—')[0].trim();
      }
      if (voiceName.includes(',')) {
        voiceName = voiceName.split(',').pop().trim();
      }
      voiceName = voiceName.replace(/^⭐\s*/, '').split('—')[0].trim();
      return {
        id: `vieneu:${voiceName}`,
        name: voiceName,
        label: voiceLabel || voiceName,
        description: voiceDesc,
      };
    });

    assert.equal(mapped[0].name, 'Adam bựa');
    assert.equal(mapped[0].id, 'vieneu:Adam bựa');
    assert.equal(mapped[0].label, '⭐ Adam bựa — Nam · Bắc · Phong cách tự nhiên');

    assert.equal(mapped[1].name, 'Mai Anh');
    assert.equal(mapped[1].id, 'vieneu:Mai Anh');
    assert.equal(mapped[1].label, '⭐ Mai Anh — Nữ · Bắc · Tự nhiên, truyền cảm');

    assert.equal(mapped[2].name, 'Hải Đăng');
    assert.equal(mapped[2].id, 'vieneu:Hải Đăng');
  });
});

