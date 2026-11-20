"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { getToken } from "@/lib/auth-client";

export function AuthGuard({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    const sync = () => {
      setAuthed(Boolean(getToken()));
      setReady(true);
    };

    sync();
    window.addEventListener("auth:change", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("auth:change", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  useEffect(() => {
    if (pathname !== "/" && ready && !getToken()) router.replace("/");
  }, [pathname, ready, authed, router]);

  if (pathname !== "/" && (!ready || !authed || !getToken())) return null;
  return children;
}
