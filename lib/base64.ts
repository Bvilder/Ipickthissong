/** URL 安全的 base64 编解码（支持中文，浏览器环境） */

export function toBase64Url(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let bin = '';
  bytes.forEach((b) => {
    bin += String.fromCharCode(b);
  });
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function fromBase64Url(code: string): string {
  const b64 = code.replace(/-/g, '+').replace(/_/g, '/');
  const bin = atob(b64);
  const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

export function encodeJson(payload: unknown): string {
  return toBase64Url(JSON.stringify(payload));
}

export function decodeJson<T>(code: string | null | undefined): T | null {
  if (!code) return null;
  try {
    return JSON.parse(fromBase64Url(code)) as T;
  } catch {
    return null;
  }
}
