import { createHash, randomBytes as nodeRandomBytes } from "crypto";

function base64urlEncode(buffer) {
  let b;
  if (Buffer.isBuffer(buffer)) b = buffer.toString("base64");
  else b = Buffer.from(buffer).toString("base64");

  return b.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function secureRandomBytes(size = 64) {
  if (typeof nodeRandomBytes === "function") {
    return Uint8Array.from(nodeRandomBytes(size));
  }

  if (typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function") {
    const arr = new Uint8Array(size);
    crypto.getRandomValues(arr);
    return arr;
  }

  throw new Error("No cryptographic random function available");
}

async function sha256(buffer) {
  if (typeof crypto !== "undefined" && crypto.subtle && typeof crypto.subtle.digest === "function") {
    return await crypto.subtle.digest("SHA-256", buffer);
  }

  if (typeof createHash === "function") {
    const hash = createHash("sha256");
    hash.update(Buffer.from(buffer));
    return hash.digest();
  }

  throw new Error("No SHA-256 implementation available");
}

export async function generatePKCE() {
  const random = secureRandomBytes(64);
  const code_verifier = base64urlEncode(random);

  const encoder = new TextEncoder();
  const data = encoder.encode(code_verifier);
  const digest = await sha256(data);
  const code_challenge = base64urlEncode(digest);

  return { code_verifier, code_challenge };
}