const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const DEFAULT_MAX_BYTES = 150 * 1024 * 1024;
const SUPPORTED_EXTENSIONS = new Map([
  ['.png', { kind: 'image', mimeType: 'image/png' }],
  ['.jpg', { kind: 'image', mimeType: 'image/jpeg' }],
  ['.jpeg', { kind: 'image', mimeType: 'image/jpeg' }],
  ['.webp', { kind: 'image', mimeType: 'image/webp' }],
  ['.svg', { kind: 'image', mimeType: 'image/svg+xml' }],
  ['.mp4', { kind: 'video', mimeType: 'video/mp4' }],
  ['.webm', { kind: 'video', mimeType: 'video/webm' }],
  ['.mov', { kind: 'video', mimeType: 'video/quicktime' }],
]);

function sanitizeDisplayName(value, fallback = 'Media asset') {
  const cleaned = String(value || '')
    .replace(/[\u0000-\u001f<>:"/\\|?*]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return cleaned.slice(0, 160) || fallback;
}

function normalizeKind(value) {
  const kind = String(value || '').toLowerCase();
  if (kind !== 'image' && kind !== 'video') throw new Error('Loai media phai la image hoac video.');
  return kind;
}

function contentHash(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

function inferMedia(filename, mimeType) {
  const extension = path.extname(String(filename || '')).toLowerCase();
  if (SUPPORTED_EXTENSIONS.has(extension)) return { extension, ...SUPPORTED_EXTENSIONS.get(extension) };
  const normalizedMime = String(mimeType || '').split(';')[0].trim().toLowerCase();
  for (const [candidateExtension, config] of SUPPORTED_EXTENSIONS) {
    if (config.mimeType === normalizedMime) return { extension: candidateExtension, ...config };
  }
  return null;
}

function isPathInside(parentPath, candidatePath) {
  const relative = path.relative(path.resolve(parentPath), path.resolve(candidatePath));
  return relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative));
}

class MediaAssetStore {
  constructor(options = {}) {
    this.publicDir = path.resolve(options.publicDir || path.join(__dirname, 'public'));
    this.libraryDir = path.resolve(options.libraryDir || path.join(this.publicDir, 'assets', 'media-library'));
    this.uploadDir = path.join(this.libraryDir, 'user');
    this.manifestPath = path.resolve(options.manifestPath || path.join(this.libraryDir, 'manifest.json'));
    this.maxBytes = Number(options.maxBytes) || DEFAULT_MAX_BYTES;
    if (!isPathInside(this.publicDir, this.libraryDir) || !isPathInside(this.libraryDir, this.manifestPath)) {
      throw new Error('Thu muc media library phai nam trong public.');
    }
    fs.mkdirSync(this.uploadDir, { recursive: true });
    if (!fs.existsSync(this.manifestPath)) this.writeManifest({ version: 1, assets: [] });
  }

  readManifest() {
    try {
      const manifest = JSON.parse(fs.readFileSync(this.manifestPath, 'utf8'));
      return { version: Number(manifest.version) || 1, assets: Array.isArray(manifest.assets) ? manifest.assets : [] };
    } catch {
      return { version: 1, assets: [] };
    }
  }

  writeManifest(manifest) {
    const next = { version: 1, updatedAt: new Date().toISOString(), assets: Array.isArray(manifest.assets) ? manifest.assets : [] };
    fs.mkdirSync(path.dirname(this.manifestPath), { recursive: true });
    const pendingPath = `${this.manifestPath}.${process.pid}.${Date.now()}.tmp`;
    fs.writeFileSync(pendingPath, `${JSON.stringify(next, null, 2)}\n`, 'utf8');
    fs.renameSync(pendingPath, this.manifestPath);
    return next;
  }

  list(kind) {
    const requestedKind = kind ? normalizeKind(kind) : null;
    return this.readManifest().assets
      .filter((asset) => !requestedKind || asset.kind === requestedKind)
      .map((asset) => ({ ...asset, url: `/${String(asset.src).replace(/\\/g, '/')}` }));
  }

  get(assetId) {
    const id = String(assetId || '').trim();
    const asset = this.readManifest().assets.find((entry) => entry.assetId === id);
    return asset ? { ...asset, url: `/${String(asset.src).replace(/\\/g, '/')}` } : null;
  }

  saveUpload({ buffer, filename, mimeType, kind, name }) {
    if (!Buffer.isBuffer(buffer) || buffer.length === 0) throw new Error('File media tai len dang rong.');
    if (buffer.length > this.maxBytes) throw new Error(`File media vuot qua ${Math.round(this.maxBytes / 1024 / 1024)} MB.`);
    const normalizedKind = normalizeKind(kind);
    const media = inferMedia(filename, mimeType);
    if (!media || media.kind !== normalizedKind) throw new Error('Dinh dang file khong khop voi thu vien media da chon.');

    const hash = contentHash(buffer);
    const assetId = `media-${hash}`;
    const relativePath = path.posix.join('assets', 'media-library', 'user', `${hash}${media.extension}`);
    const absolutePath = path.resolve(this.publicDir, relativePath);
    if (!isPathInside(this.uploadDir, absolutePath)) throw new Error('Duong dan media khong hop le.');
    if (!fs.existsSync(absolutePath)) fs.writeFileSync(absolutePath, buffer);

    const manifest = this.readManifest();
    const existing = manifest.assets.find((entry) => entry.assetId === assetId);
    if (existing) return { asset: { ...existing, url: `/${existing.src}` }, created: false };

    const asset = {
      assetId,
      kind: normalizedKind,
      name: sanitizeDisplayName(name || path.basename(filename, media.extension)),
      src: relativePath,
      filename: sanitizeDisplayName(filename, `${hash}${media.extension}`),
      mimeType: media.mimeType,
      extension: media.extension,
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

module.exports = { MediaAssetStore, inferMedia, normalizeKind };
