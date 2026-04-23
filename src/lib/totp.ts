/**
 * totp.ts — RFC 6238 TOTP using otpauth.
 * Includes Base32 secret validation.
 */

import { TOTP, Secret } from "otpauth";

// Valid Base32 alphabet (RFC 4648)
const BASE32_REGEX = /^[A-Z2-7]+=*$/i;

/**
 * Validate a Base32 TOTP secret.
 * Returns null if valid, or an error message if invalid.
 */
export function validateTotpSecret(secret: string): string | null {
  const clean = secret.replace(/\s/g, "").toUpperCase();
  if (!clean) return "Secret key is required";
  if (!BASE32_REGEX.test(clean)) return "Invalid characters — must be Base32 (A-Z, 2-7)";
  if (clean.replace(/=/g, "").length < 8) return "Secret key is too short (min 8 chars)";
  // Try to actually parse it
  try {
    new Secret({ b32: clean });
    return null;
  } catch {
    return "Invalid Base32 secret key";
  }
}

/**
 * Generate a real RFC 6238 TOTP code from a Base32 secret.
 * Returns the formatted 6-digit code ("123 456") and seconds remaining.
 * Supports ±1 window tolerance for clock skew validation.
 */
export function generateTOTP(secret: string): { code: string; secondsLeft: number } {
  try {
    const totp = new TOTP({
      secret: secret.replace(/\s/g, "").toUpperCase(),
      digits: 6,
      period: 30,
      algorithm: "SHA1",
    });
    const code = totp.generate();
    const formatted = code.slice(0, 3) + " " + code.slice(3);
    return { code: formatted, secondsLeft: getSecondsLeft() };
  } catch {
    return { code: "??? ???", secondsLeft: getSecondsLeft() };
  }
}

/**
 * Validate a TOTP token against a secret (±1 window tolerance).
 * Used for verifying a user-entered OTP code.
 */
export function validateTOTP(secret: string, token: string): boolean {
  try {
    const totp = new TOTP({
      secret: secret.replace(/\s/g, "").toUpperCase(),
      digits: 6,
      period: 30,
      algorithm: "SHA1",
    });
    return totp.validate({ token: token.replace(/\s/g, ""), window: 1 }) !== null;
  } catch {
    return false;
  }
}

/**
 * Get seconds remaining in the current 30-second TOTP window.
 */
export function getSecondsLeft(): number {
  return 30 - (Math.floor(Date.now() / 1000) % 30);
}
