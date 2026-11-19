"use client";

export type ClientAISettings = {
  baseUrl: string;
  model: string;
};

const apiKeyStorageKey = "englishflow-api-key";
const legacyEncryptedKey = "englishflow-encrypted-api-key";
const legacyEncryptionDatabase = "englishflow-credentials";

function storedAPIKey() {
  if (typeof window === "undefined") return { storage: null, value: "" };
  const local = window.localStorage.getItem(apiKeyStorageKey);
  if (local) return { storage: window.localStorage, value: local };
  const session = window.sessionStorage.getItem(apiKeyStorageKey);
  if (session) return { storage: window.sessionStorage, value: session };
  return { storage: null, value: "" };
}

/** Removes what the previous encrypted-key build left in the browser. */
export function discardLegacyCredential() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(legacyEncryptedKey);
    window.sessionStorage.removeItem(legacyEncryptedKey);
    window.indexedDB.deleteDatabase(legacyEncryptionDatabase);
  } catch {
    // Private mode or blocked storage: nothing to clean up.
  }
}

export function hasClientAPIKey() {
  return Boolean(storedAPIKey().value);
}

export function setClientAPIKeyRemembered(remember: boolean) {
  if (typeof window === "undefined") return;
  const source = remember ? window.sessionStorage : window.localStorage;
  const target = remember ? window.localStorage : window.sessionStorage;
  const stored = source.getItem(apiKeyStorageKey);
  if (!stored) return;
  target.setItem(apiKeyStorageKey, stored);
  source.removeItem(apiKeyStorageKey);
}

export async function saveClientAPIKey(apiKey: string, remember: boolean) {
  const storage = remember ? window.localStorage : window.sessionStorage;
  const otherStorage = remember ? window.sessionStorage : window.localStorage;
  storage.setItem(apiKeyStorageKey, apiKey);
  otherStorage.removeItem(apiKeyStorageKey);
}

export async function getClientAPIKey() {
  return storedAPIKey().value;
}

export async function getClientAISettings(settings: ClientAISettings) {
  return {
    baseUrl: settings.baseUrl,
    model: settings.model,
    apiKey: await getClientAPIKey(),
  };
}
