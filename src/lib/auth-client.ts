"use client";

import { useEffect, useState } from "react";

const TOKEN_KEY = "lingora_access_token";
/** 旧版本把 token 存在这个 key 上；读到后迁移过去，避免已登录用户被登出。 */
const LEGACY_TOKEN_KEY = "access_token";

function readToken() {
  const token = window.localStorage.getItem(TOKEN_KEY);
  if (token) return token;
  const legacy = window.localStorage.getItem(LEGACY_TOKEN_KEY);
  if (!legacy) return null;
  window.localStorage.setItem(TOKEN_KEY, legacy);
  window.localStorage.removeItem(LEGACY_TOKEN_KEY);
  return legacy;
}

export function getToken() {
  return typeof window === "undefined" ? null : readToken();
}

export function setToken(token: string) {
  window.localStorage.setItem(TOKEN_KEY, token);
  window.localStorage.removeItem(LEGACY_TOKEN_KEY);
  window.dispatchEvent(new Event("auth:change"));
}

export function clearToken() {
  window.localStorage.removeItem(TOKEN_KEY);
  window.localStorage.removeItem(LEGACY_TOKEN_KEY);
  window.dispatchEvent(new Event("auth:change"));
}

export async function apiFetch(input: RequestInfo | URL, init: RequestInit = {}) {
  const url = new URL(typeof input === "string" || input instanceof URL ? input : input.url, window.location.href);
  const isProtectedApi = url.origin === window.location.origin &&
    url.pathname.startsWith("/api/") &&
    url.pathname !== "/api/auth";
  const headers = new Headers(input instanceof Request ? input.headers : undefined);
  new Headers(init.headers).forEach((value, key) => headers.set(key, value));

  if (isProtectedApi) {
    const token = getToken();
    if (token) headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(input, { ...init, headers });
  if (isProtectedApi && response.status === 401) {
    clearToken();
    window.dispatchEvent(new Event("auth:expired"));
  }
  return response;
}

export function useAuth() {
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    const sync = () => setAuthed(Boolean(getToken()));
    sync();
    window.addEventListener("auth:change", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("auth:change", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  return authed;
}

export function requestLogin() {
  window.dispatchEvent(new Event("auth:login"));
}
