const BASE64_ALPHABET =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

const BASE64_LOOKUP = (() => {
  const table = new Int16Array(256).fill(-1);
  for (let index = 0; index < BASE64_ALPHABET.length; index += 1) {
    table[BASE64_ALPHABET.charCodeAt(index)] = index;
  }
  return table;
})();

/**
 * Decodifica um base64 (sem depender de `atob`, indisponível em todo runtime
 * React Native/Hermes) para bytes. Ignora whitespace/padding.
 */
export function base64ToUint8Array(base64: string): Uint8Array {
  const sanitized = base64.replace(/[^A-Za-z0-9+/]/g, "");
  const byteLength = Math.floor((sanitized.length * 3) / 4);
  const bytes = new Uint8Array(byteLength);

  let buffer = 0;
  let bits = 0;
  let byteIndex = 0;

  for (let index = 0; index < sanitized.length; index += 1) {
    const value = BASE64_LOOKUP[sanitized.charCodeAt(index)];
    if (value === -1) continue;

    buffer = (buffer << 6) | value;
    bits += 6;

    if (bits >= 8) {
      bits -= 8;
      bytes[byteIndex] = (buffer >> bits) & 0xff;
      byteIndex += 1;
    }
  }

  return byteIndex === byteLength ? bytes : bytes.subarray(0, byteIndex);
}
