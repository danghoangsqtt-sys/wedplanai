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

const SAFE_AUDIO_ORIGINS: string[] =
  typeof location !== 'undefined' ? [location.origin] : [];

export function sanitizeAudioUrl(raw: string | undefined): string | null {
  if (!raw) return null;
  if (raw.startsWith('/')) return raw;
  try {
    const url = new URL(raw);
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return null;
    if (SAFE_AUDIO_ORIGINS.some(o => raw.startsWith(o))) return raw;
    return raw;
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
