import { randomBytes, createHash, timingSafeEqual } from 'crypto';

export function generateVerificationToken(bytes = 32) {
  // URL-safe base64 without padding
  const raw = randomBytes(bytes);
  return raw.toString('base64url'); // node 16+; else manually replace +/=
}

export function hashToken(token: string) {
  return createHash('sha256').update(token, 'utf8').digest('hex');
}

// safe comparison if you need to compare two known-length hex strings
export function safeEqualHex(a: string, b: string) {
  const ba = Buffer.from(a, 'hex');
  const bb = Buffer.from(b, 'hex');
  return ba.length === bb.length && timingSafeEqual(ba, bb);
}
