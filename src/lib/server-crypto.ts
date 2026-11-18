import { constants, createDecipheriv, generateKeyPairSync, privateDecrypt } from "node:crypto";

type KeyPair = { publicKey: string; privateKey: string };
const processState = globalThis as typeof globalThis & { __englishFlowTransportKeyPair?: KeyPair };
processState.__englishFlowTransportKeyPair ??= (() => {
  const pair = generateKeyPairSync("rsa", { modulusLength: 2048, publicKeyEncoding: { type: "spki", format: "pem" }, privateKeyEncoding: { type: "pkcs8", format: "pem" } });
  return { publicKey: pair.publicKey, privateKey: pair.privateKey };
})();

function decode(value: string) { return Buffer.from(value, "base64"); }
export function getTransportPublicKey() { return processState.__englishFlowTransportKeyPair!.publicKey; }

export function decryptCredential(payload: unknown): string {
  if (!payload || typeof payload !== "object") throw new Error("Encrypted API credential is required");
  const credential = payload as { wrappedKey?: unknown; iv?: unknown; data?: unknown };
  if (typeof credential.wrappedKey !== "string" || typeof credential.iv !== "string" || typeof credential.data !== "string") throw new Error("Invalid encrypted API credential");
  const aesKey = privateDecrypt({ key: processState.__englishFlowTransportKeyPair!.privateKey, padding: constants.RSA_PKCS1_OAEP_PADDING, oaepHash: "sha256" }, decode(credential.wrappedKey));
  const iv = decode(credential.iv);
  const encrypted = decode(credential.data);
  if (iv.length !== 12 || encrypted.length > 8192 || aesKey.length !== 32) throw new Error("Invalid encrypted API credential");
  const decipher = createDecipheriv("aes-256-gcm", aesKey, iv);
  decipher.setAuthTag(encrypted.subarray(encrypted.length - 16));
  return Buffer.concat([decipher.update(encrypted.subarray(0, -16)), decipher.final()]).toString("utf8");
}
