// AES-256 Encryption for API Keys
import CryptoJS from 'crypto-js';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'default-dev-key-change-in-prod-32';

/**
 * Encrypt a string using AES-256
 */
export function encrypt(text: string): string {
  if (!text) return '';
  const encrypted = CryptoJS.AES.encrypt(text, ENCRYPTION_KEY).toString();
  return encrypted;
}

/**
 * Decrypt an AES-256 encrypted string
 */
export function decrypt(encryptedText: string): string {
  if (!encryptedText) return '';
  try {
    const bytes = CryptoJS.AES.decrypt(encryptedText, ENCRYPTION_KEY);
    const decrypted = bytes.toString(CryptoJS.enc.Utf8);
    return decrypted;
  } catch (error) {
    console.error('Decryption failed:', error);
    return '';
  }
}

/**
 * Get the last N characters of a string (for display)
 */
export function getLast4(text: string): string {
  if (!text || text.length < 4) return '****';
  return text.slice(-4);
}

/**
 * Mask a key for display (show last 4 chars only)
 */
export function maskKey(text: string): string {
  if (!text || text.length < 8) return '••••••••';
  return '••••••••••••' + text.slice(-4);
}
