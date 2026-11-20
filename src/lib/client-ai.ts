"use client";

export type ClientAISettings = {
  model: string;
};

const legacyAPIKey = "englishflow-api-key";
const legacyEncryptedKey = "englishflow-encrypted-api-key";
const legacyEncryptionDatabase = "englishflow-credentials";

/** Removes API keys that earlier builds kept in the browser. */
export function discardLegacyCredential() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(legacyAPIKey);
    window.sessionStorage.removeItem(legacyAPIKey);
    window.localStorage.removeItem(legacyEncryptedKey);
    window.sessionStorage.removeItem(legacyEncryptedKey);
    window.indexedDB.deleteDatabase(legacyEncryptionDatabase);
  } catch {
    // Private mode or blocked storage: nothing to clean up.
  }
}

export async function getClientAISettings(settings: ClientAISettings) {
  return { model: settings.model };
}
