"use client";

export type ClientAISettings = {
  baseUrl: string;
  model: string;
};

const apiKeyStorageKey = "englishflow-encrypted-api-key";
const encryptionKeyDatabase = "englishflow-credentials";
const encryptionKeyStore = "keys";
let sessionEncryptionKey: Promise<CryptoKey> | undefined;

function getSessionEncryptionKey() {
  sessionEncryptionKey ??= new Promise<CryptoKey>((resolve, reject) => {
    const request = window.indexedDB.open(encryptionKeyDatabase, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(encryptionKeyStore);
    request.onerror = () => reject(request.error ?? new Error("无法打开加密存储。"));
    request.onsuccess = () => {
      const database = request.result;
      const transaction = database.transaction(encryptionKeyStore, "readonly");
      const store = transaction.objectStore(encryptionKeyStore);
      const read = store.get("api-key");
      read.onsuccess = async () => {
        try {
          const existingKey = read.result as CryptoKey | undefined;
          if (existingKey) {
            resolve(existingKey);
            database.close();
            return;
          }
          const key = await window.crypto.subtle.generateKey({ name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]);
          const write = database.transaction(encryptionKeyStore, "readwrite");
          write.objectStore(encryptionKeyStore).put(key, "api-key");
          write.oncomplete = () => { resolve(key); database.close(); };
          write.onerror = () => reject(write.error ?? new Error("无法保存加密密钥。"));
        } catch (error) {
          database.close();
          reject(error);
        }
      };
      read.onerror = () => { database.close(); reject(read.error ?? new Error("无法读取加密密钥。")); };
    };
  });
  return sessionEncryptionKey;
}

function encode(bytes: Uint8Array) {
  return btoa(String.fromCharCode(...bytes));
}

function decode(value: string) {
  return Uint8Array.from(atob(value), (character) => character.charCodeAt(0));
}

export function hasClientAPIKey() {
  return typeof window !== "undefined" && Boolean(
    window.localStorage.getItem(apiKeyStorageKey) ||
    window.sessionStorage.getItem(apiKeyStorageKey),
  );
}

export function setClientAPIKeyRemembered(remember: boolean) {
  const source = remember ? window.sessionStorage : window.localStorage;
  const target = remember ? window.localStorage : window.sessionStorage;
  const stored = source.getItem(apiKeyStorageKey);
  if (!stored) return;
  target.setItem(apiKeyStorageKey, stored);
  source.removeItem(apiKeyStorageKey);
}

export async function saveClientAPIKey(apiKey: string, remember: boolean) {
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await window.crypto.subtle.encrypt({ name: "AES-GCM", iv }, await getSessionEncryptionKey(), new TextEncoder().encode(apiKey));
  const storage = remember ? window.localStorage : window.sessionStorage;
  const otherStorage = remember ? window.sessionStorage : window.localStorage;
  storage.setItem(apiKeyStorageKey, JSON.stringify({ iv: encode(iv), data: encode(new Uint8Array(encrypted)) }));
  otherStorage.removeItem(apiKeyStorageKey);
}

export async function getClientAPIKey() {
  const storage = window.localStorage.getItem(apiKeyStorageKey)
    ? window.localStorage
    : window.sessionStorage;
  const stored = storage.getItem(apiKeyStorageKey);
  if (!stored) return "";
  try {
    const { iv, data } = JSON.parse(stored) as { iv: string; data: string };
    const decrypted = await window.crypto.subtle.decrypt({ name: "AES-GCM", iv: decode(iv) }, await getSessionEncryptionKey(), decode(data));
    return new TextDecoder().decode(decrypted);
  } catch {
    storage.removeItem(apiKeyStorageKey);
    return "";
  }
}

export async function getClientAISettings(settings: ClientAISettings) {
  return {
    baseUrl: settings.baseUrl,
    model: settings.model,
    credential: await encryptAPIKey(await getClientAPIKey()),
  };
}

export async function encryptAPIKey(apiKey: string) {
  const response = await fetch("/api/crypto-key", { cache: "no-store" });
  if (!response.ok) throw new Error("无法建立加密连接，请刷新页面后重试。");
  const { publicKey } = await response.json() as { publicKey: string };
  const pem = publicKey.replace(/-----BEGIN PUBLIC KEY-----|-----END PUBLIC KEY-----|\s/g, "");
  const der = Uint8Array.from(atob(pem), (character) => character.charCodeAt(0));
  const rsaKey = await window.crypto.subtle.importKey("spki", der, { name: "RSA-OAEP", hash: "SHA-256" }, false, ["encrypt"]);
  const aesKey = await window.crypto.subtle.generateKey({ name: "AES-GCM", length: 256 }, true, ["encrypt"]);
  const rawKey = await window.crypto.subtle.exportKey("raw", aesKey);
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await window.crypto.subtle.encrypt({ name: "AES-GCM", iv }, aesKey, new TextEncoder().encode(apiKey));
  const wrappedKey = await window.crypto.subtle.encrypt({ name: "RSA-OAEP" }, rsaKey, rawKey);
  return { wrappedKey: encode(new Uint8Array(wrappedKey)), iv: encode(iv), data: encode(new Uint8Array(ciphertext)) };
}

