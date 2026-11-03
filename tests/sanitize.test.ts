import { describe, expect, it } from 'vitest';
import { isValidUid, sanitizeMapUrl } from '../lib/sanitize';

describe('public URL boundaries', () => {
  it('rejects executable map links and unrelated hosts', () => {
    expect(sanitizeMapUrl('javascript:alert(1)')).toBeNull();
    expect(sanitizeMapUrl('https://google.com.attacker.invalid/location')).toBeNull();
    expect(sanitizeMapUrl('https://maps.google.com/?q=Hanoi')).toContain('maps.google.com');
  });
  it('accepts legacy owner IDs without accepting query fragments', () => {
    expect(isValidUid('e8a57bf1-58c2-45ae-b1ab-65c1e6921ad9')).toBe(true);
    expect(isValidUid("owner';drop table user_data")).toBe(false);
  });
});
