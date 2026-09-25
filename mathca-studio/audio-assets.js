const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const DEFAULT_MAX_BYTES = 50 * 1024 * 1024;
const SUPPORTED_EXTENSIONS = new Map([
  ['.mp3', 'audio/mpeg'],
  ['.wav', 'audio/wav'],
  ['.m4a', 'audio/mp4'],
  ['.aac', 'audio/aac'],
  ['.ogg', 'audio/ogg'],
]);

function sanitizeDisplayName(value, fallback = 'Audio asset') {
  const cleaned = String(value || '')
    .replace(/[\u0000-\u001f<>:"/\\|?*]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return cleaned.slice(0, 160) || fallback;
}

function normalizeKind(value) {
  const kind = String(value || '').toLowerCase();
  if (kind !== 'bgm' && kind !== 'sfx') {
    throw new Error('Loại audio phải là bgm hoặc sfx.');
  }
  return kind;
}

function normalizeAssetId(value) {
  const assetId = String(value || '').trim();
  if (!/^[a-z0-9][a-z0-9._:-]{2,160}$/i.test(assetId)) return null;
  return assetId;
}

function contentHash(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

function inferExtension(filename, mimeType) {
  const extension = path.extname(String(filename || '')).toLowerCase();
  if (SUPPORTED_EXTENSIONS.has(extension)) return extension;

  const normalizedMime = String(mimeType || '').split(';')[0].trim().toLowerCase();
  for (const [candidateExtension, candidateMime] of SUPPORTED_EXTENSIONS) {
    if (candidateMime === normalizedMime) return candidateExtension;
  }
  return null;
}

function isPathInside(parentPath, candidatePath) {
  const relative = path.relative(path.resolve(parentPath), path.resolve(candidatePath));
  return relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative));
}

class AudioAssetStore {
  constructor(options = {}) {
    this.publicDir = path.resolve(options.publicDir || path.join(__dirname, 'public'));
    this.libraryDir = path.resolve(
      options.libraryDir || path.join(this.publicDir, 'assets', 'audio-library'),
    );
    this.uploadDir = path.join(this.libraryDir, 'user');
    this.manifestPath = path.resolve(options.manifestPath || path.join(this.libraryDir, 'manifest.json'));
    this.maxBytes = Number(options.maxBytes) || DEFAULT_MAX_BYTES;

    if (!isPathInside(this.publicDir, this.libraryDir) || !isPathInside(this.libraryDir, this.manifestPath)) {
      throw new Error('Thư mục audio library phải nằm trong public.');
    }

    fs.mkdirSync(this.uploadDir, { recursive: true });
    if (!fs.existsSync(this.manifestPath)) this.writeManifest({ version: 1, assets: [] });
  }

  readManifest() {
    try {
      const manifest = JSON.parse(fs.readFileSync(this.manifestPath, 'utf8'));
      return {
        version: Number(manifest.version) || 1,
        assets: Array.isArray(manifest.assets) ? manifest.assets : [],
      };
    } catch {
      return { version: 1, assets: [] };
    }
  }

  writeManifest(manifest) {
    const nextManifest = {
      version: 1,
      updatedAt: new Date().toISOString(),
      assets: Array.isArray(manifest.assets) ? manifest.assets : [],
    };
    fs.mkdirSync(path.dirname(this.manifestPath), { recursive: true });
    const pendingPath = `${this.manifestPath}.${process.pid}.${Date.now()}.tmp`;
    fs.writeFileSync(pendingPath, `${JSON.stringify(nextManifest, null, 2)}\n`, 'utf8');
    fs.renameSync(pendingPath, this.manifestPath);
    return nextManifest;
  }

  list(kind) {
    const requestedKind = kind ? normalizeKind(kind) : null;
    return this.readManifest().assets
      .filter((asset) => !requestedKind || asset.kind === requestedKind)
      .map((asset) => ({ ...asset, url: `/${asset.src.replace(/\\/g, '/')}` }));
  }

  get(assetId) {
    const normalizedId = normalizeAssetId(assetId);
    if (!normalizedId) return null;
    const asset = this.readManifest().assets.find((entry) => entry.assetId === normalizedId);
    return asset ? { ...asset, url: `/${asset.src.replace(/\\/g, '/')}` } : null;
  }

  resolve(assetReference) {
    if (!assetReference) return null;
    const reference = String(assetReference).trim();
    const presetName = reference.startsWith('preset:') ? reference.slice('preset:'.length) : null;
    const assets = this.readManifest().assets;
    const asset = assets.find(
      (entry) =>
        entry.assetId === reference ||
        entry.src === reference.replace(/^\//, '') ||
        (presetName && (entry.preset === presetName || entry.assetId === `preset-${presetName}`)),
    );
    if (!asset) return null;

    const absolutePath = path.resolve(this.publicDir, asset.src);
    if (!isPathInside(this.publicDir, absolutePath) || !fs.existsSync(absolutePath)) return null;
    return { ...asset, absolutePath, url: `/${asset.src.replace(/\\/g, '/')}` };
  }

  saveUpload({ buffer, filename, mimeType, kind, name }) {
    if (!Buffer.isBuffer(buffer) || buffer.length === 0) {
      throw new Error('File audio tải lên đang rỗng.');
    }
    if (buffer.length > this.maxBytes) {
      throw new Error(`File audio vượt quá giới hạn ${Math.round(this.maxBytes / 1024 / 1024)} MB.`);
    }

    const normalizedKind = normalizeKind(kind);
    const extension = inferExtension(filename, mimeType);
    if (!extension) throw new Error('Chỉ hỗ trợ MP3, WAV, M4A, AAC hoặc OGG.');

    const hash = contentHash(buffer);
    const assetId = `sha256-${hash}`;
    const relativePath = path.posix.join('assets', 'audio-library', 'user', `${hash}${extension}`);
    const absolutePath = path.resolve(this.publicDir, relativePath);
    if (!isPathInside(this.uploadDir, absolutePath)) throw new Error('Đường dẫn audio không hợp lệ.');

    if (!fs.existsSync(absolutePath)) fs.writeFileSync(absolutePath, buffer);

    const manifest = this.readManifest();
    const existing = manifest.assets.find((entry) => entry.assetId === assetId);
    if (existing) {
      return { asset: { ...existing, url: `/${existing.src}` }, created: false };
    }

    const asset = {
      assetId,
      kind: normalizedKind,
      name: sanitizeDisplayName(name || path.basename(filename, extension)),
      src: relativePath,
      filename: sanitizeDisplayName(filename, `${hash}${extension}`),
      mimeType: SUPPORTED_EXTENSIONS.get(extension),
      extension,
      bytes: buffer.length,
      contentHash: hash,
      source: 'upload',
      createdAt: new Date().toISOString(),
    };
    manifest.assets.push(asset);
    this.writeManifest(manifest);
    return { asset: { ...asset, url: `/${relativePath}` }, created: true };
  }
}

module.exports = {
  AudioAssetStore,
  contentHash,
  inferExtension,
  isPathInside,
  normalizeAssetId,
  normalizeKind,
};
