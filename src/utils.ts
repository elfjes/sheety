export function signedInt(value: number): string {
  return value >= 0 ? `+${value}` : "" + value;
}
export function hasOwnProperty<T extends object>(
  obj: T,
  key: string | number | symbol,
): key is keyof T {
  return key in obj;
}
function base64ToBytes(base64: string) {
  const binString = atob(base64);
  return Uint8Array.from(binString, (m) => m.codePointAt(0)!);
}

function bytesToBase64(bytes: Uint8Array) {
  const binString = Array.from(bytes, (byte) => String.fromCodePoint(byte)).join("");
  return btoa(binString);
}
export function b64encode(text: string) {
  return bytesToBase64(new TextEncoder().encode(text));
}
export function b64decode(text: string) {
  return new TextDecoder().decode(base64ToBytes(text));
}
