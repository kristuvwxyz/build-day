// Web versions of the two Node helpers the api files used (no nodejs_compat flag needed on Cloudflare).
export function b64(s) { const bin = atob(String(s).replace(/\s+/g, "")); const u = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i); return u; }
export async function sha256hex(buf) { const h = new Uint8Array(await crypto.subtle.digest("SHA-256", buf)); return [...h].map(x => x.toString(16).padStart(2, "0")).join(""); }
