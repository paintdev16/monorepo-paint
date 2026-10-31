"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";

let sessionRequest: Promise<Response> | null = null;

function renewSession() {
  if (!sessionRequest) {
    const request = () => fetch("/api/auth/session", { method: "POST" });
    const pending = navigator.locks
      ? (navigator.locks.request("paint-session", request) as unknown as Promise<Response>)
      : request();
    sessionRequest = pending.finally(() => { sessionRequest = null; });
  }
  return sessionRequest.then((response) => response.clone());
}

export function SessionRefresh() {
  const router = useRouter();
  const [error, setError] = useState(false);
  useEffect(() => {
    let active = true;
    renewSession().then((response) => {
      if (!active) return;
      if (response.status === 401) router.replace("/login");
      else if (response.ok) router.refresh();
      else setError(true);
    }).catch(() => { if (active) setError(true); });
    return () => { active = false; };
  }, [router]);
  return <main className="loading-screen">{error ? <Alert variant="destructive" className="form-error">No pudimos verificar tu sesión. Recarga la página para intentarlo de nuevo.</Alert> : <p>Preparando tu espacio…</p>}</main>;
}

export function useLogout() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  async function logout() {
    setBusy(true); setError(false);
    try {
      const response = await fetch("/api/auth/logout", { method: "POST" });
      if (!response.ok) throw new Error();
      router.replace("/"); router.refresh();
    } catch { setError(true); setBusy(false); }
  }
  return { logout, busy, error };
}

export function LogoutButton() {
  const { logout, busy, error } = useLogout();
  return <><Button variant="ghost" className="logout" onClick={logout} disabled={busy}>{busy ? "Cerrando…" : "Cerrar sesión"} ↗</Button>{error && <Alert variant="destructive" className="form-error">No pudimos cerrar la sesión. Inténtalo de nuevo.</Alert>}</>;
}
