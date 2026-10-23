/**
 * A random v4 UUID, for ids (threads, messages, tasks). Not a secret.
 *
 * `crypto.randomUUID` only exists in secure contexts (HTTPS or localhost),
 * so a dashboard served over plain http on a LAN or tailnet host would
 * crash calling it. `crypto.getRandomValues` works in every browser context;
 * React Native runtimes without Web Crypto fall back to `Math.random`.
 */
export function uuid(): string {
  const webCrypto = globalThis.crypto;
  if (typeof webCrypto?.randomUUID === 'function') {
    return webCrypto.randomUUID();
  }
  const bytes = new Uint8Array(16);
  if (typeof webCrypto?.getRandomValues === 'function') {
    webCrypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < bytes.length; i += 1) {
      bytes[i] = Math.floor(Math.random() * 256);
    }
  }
  // RFC 4122 §4.4: version 4, variant 10.
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}
