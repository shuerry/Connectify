import { generateVerificationToken, hashToken, safeEqualHex } from '../../utils/crypto.util';

describe('crypto.util', () => {
  describe('generateVerificationToken', () => {
    it('generates a URL-safe base64 token with default length', () => {
      const token = generateVerificationToken();

      expect(typeof token).toBe('string');
      expect(token.length).toBeGreaterThan(0);

      // Should be URL-safe: only [A-Za-z0-9_-], no "+", "/", or "=" padding
      expect(token).toMatch(/^[A-Za-z0-9_-]+$/);
      expect(token).not.toMatch(/[+/=]/);
    });

    it('respects the custom byte length parameter', () => {
      const token16 = generateVerificationToken(16);
      const token32 = generateVerificationToken(32);

      // Both should be URL-safe
      expect(token16).toMatch(/^[A-Za-z0-9_-]+$/);
      expect(token32).toMatch(/^[A-Za-z0-9_-]+$/);

      // With fewer bytes the encoded string should generally be shorter
      expect(token16.length).toBeLessThan(token32.length);
    });
  });

  describe('hashToken', () => {
    it('produces a deterministic SHA-256 hex string', () => {
      const input = 'my-test-token';

      const h1 = hashToken(input);
      const h2 = hashToken(input);

      expect(h1).toBe(h2); // deterministic
      expect(h1).toMatch(/^[0-9a-f]+$/); // hex
      expect(h1.length).toBe(64); // 256 bits -> 64 hex chars
    });

    it('produces different hashes for different inputs', () => {
      const h1 = hashToken('token-a');
      const h2 = hashToken('token-b');

      expect(h1).not.toBe(h2);
    });
  });

  describe('safeEqualHex', () => {
    it('returns true for equal hex strings', () => {
      const a = 'deadbeef';
      const b = 'deadbeef';

      const result = safeEqualHex(a, b);

      expect(result).toBe(true);
    });

    it('returns false for different hex strings of the same length', () => {
      const a = 'deadbeef';
      const b = 'feedbead'; // same length, different bytes

      const result = safeEqualHex(a, b);

      expect(result).toBe(false);
    });

    it('returns false and does not throw for different-length hex strings', () => {
      const a = 'aa'; // 1 byte
      const b = 'aabb'; // 2 bytes

      // Should not throw, and should short-circuit to false
      const result = safeEqualHex(a, b);

      expect(result).toBe(false);
    });
  });
});
