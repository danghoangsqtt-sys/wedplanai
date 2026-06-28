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
  // Google Drive direct audio
  'drive.google.com',
  'docs.google.com',
  // Common music CDNs used in wedding apps
  'soundcloud.com',
  'storage.googleapis.com',
];

export function sanitizeAudioUrl(raw: string | undefined): string | null {
  if (!raw) return null;
  // Relative path — always safe (same origin)
  if (raw.startsWith('/')) return raw;
  try {
    const url = new URL(raw);
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return null;
    // Same origin is always safe
    if (typeof location !== 'undefined' && url.origin === location.origin) return raw;
    // Allow known safe audio CDN hosts
    if (SAFE_AUDIO_HOSTS.some(h => url.hostname === h || url.hostname.endsWith('.' + h))) return raw;
    // Unknown external source: return null to block autoplay from unverified origins
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
