"use client";

import { useEffect, useState } from "react";

const TOKEN_KEY = "access_token";

export function getToken() {
  return typeof window === "undefined" ? null : window.localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string) {
  window.localStorage.setItem(TOKEN_KEY, token);
  window.dispatchEvent(new Event("auth:change"));
}

export function clearToken() {
  window.localStorage.removeItem(TOKEN_KEY);
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
