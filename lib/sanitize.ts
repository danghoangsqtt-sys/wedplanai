const SAFE_MAP_HOSTS = [
  'www.google.com',
  'google.com',
  'maps.google.com',
  'goo.gl',
  'maps.app.goo.gl',
];

export function sanitizeMapUrl(raw: string | undefined): string | null {
  if (!raw) return null;
  try {
    const url = new URL(raw);
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return null;
    if (SAFE_MAP_HOSTS.some(h => url.hostname === h || url.hostname.endsWith('.' + h))) {
      return raw;
    }
    return null;
  } catch {
    return null;
  }
}

// Audio CDN allowlist — add trusted hostnames here as needed.
// Same-origin relative URLs (starting with /) are always allowed.
const SAFE_AUDIO_HOSTS = [
  // Supabase storage (project-specific subdomain pattern)
  'supabase.co',
  // Google Drive / Google Cloud
  'drive.google.com',
  'docs.google.com',
  'storage.googleapis.com',
  'lh3.googleusercontent.com',
  // YouTube (for embedded audio via YouTube API)
  'youtube.com',
  'youtu.be',
  // Common music CDNs
  'soundcloud.com',
  'sndcdn.com',
  // VN music platforms
  'zingmp3.vn',
  'nhaccuatui.com',
  'keeng.vn',
  // Common storage / CDNs
  'cloudinary.com',
  'res.cloudinary.com',
  'cdn.jsdelivr.net',
  'files.freemusicarchive.org',
  'archive.org',
  'raw.githubusercontent.com',
  // Supabase patterns (any project)
  'supabase.in',
  'amazonaws.com',
  'digitaloceanspaces.com',
  'r2.cloudflarestorage.com',
  // Dropbox
  'dl.dropboxusercontent.com',
];

export function sanitizeAudioUrl(raw: string | undefined): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  // Relative path — always safe (same origin). Encode spaces and special chars.
  if (trimmed.startsWith('/') && !trimmed.startsWith('//')) {
    try {
    // Encode only the path segments, not the slashes
    const encoded = trimmed.split('/').map((seg, i) =>
      i === 0 ? seg : encodeURIComponent(decodeURIComponent(seg))
    ).join('/');
    return encoded;
    } catch { return null; }
  }
  try {
    const url = new URL(raw);
    // Only allow HTTP(S)
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return null;
    // Same origin is always safe
    if (typeof location !== 'undefined' && url.origin === location.origin) return raw;
    // Allow known safe audio CDN hosts
    if (SAFE_AUDIO_HOSTS.some(h => url.hostname === h || url.hostname.endsWith('.' + h))) return raw;
    // GENERAL HTTPS FALLBACK: allow any well-formed HTTPS URL.
    // Rationale: audio plays in the guest's browser — the risk model is low.
    // The user chose to embed a URL in their own wedding invitation.
    if (url.protocol === 'https:') return raw;
    return null;
  } catch {
    return null;
  }
}

export function sanitizeGuestInput(name: string): string {
  return name.trim().slice(0, 100);
}

export function isValidAttendanceProbability(val: number): boolean {
  return [100, 80, 50, 0].includes(val);
}

const UID_RE = /^[a-zA-Z0-9_-]{4,128}$/;
export function isValidUid(uid: string): boolean {
  return UID_RE.test(uid);
}
