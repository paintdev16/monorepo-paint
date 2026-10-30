"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type User = { id: string; email: string; name: string | null };
let sessionRequest: Promise<Response> | null = null;
function getSession() {
  if (!sessionRequest) {
    const request = () => fetch("/api/auth/session", { method: "POST" });
    // Serialize token rotation across tabs when Web Locks is available.
    const pending = navigator.locks
      ? navigator.locks.request("paint-session", request) as unknown as Promise<Response>
      : request();
    sessionRequest = pending.finally(() => {
      sessionRequest = null;
    });
  }
  return sessionRequest.then((response) => response.clone());
}

export default function Dashboard({ initialUser, initialError = false }: { initialUser: User | null; initialError?: boolean }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(initialUser);
  const [error, setError] = useState(initialError ? "No pudimos verificar tu sesión. Recarga la página para intentarlo de nuevo." : "");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (initialUser || initialError) return;
    let active = true;
    getSession()
      .then(async (response) => {
        if (response.status === 401) {
          router.replace("/login");
          return;
        }
        if (!response.ok) throw new Error();
        const data = await response.json();
        if (active) setUser(data.user);
      })
      .catch(() => {
        if (active)
          setError(
            "No pudimos verificar tu sesión. Recarga la página para intentarlo de nuevo.",
          );
      });
    return () => {
      active = false;
    };
  }, [router, initialUser, initialError]);
  async function logout() {
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/auth/logout", { method: "POST" });
      if (!response.ok) throw new Error();
      router.replace("/");
      router.refresh();
    } catch {
      setError("No pudimos cerrar la sesión. Inténtalo de nuevo.");
      setBusy(false);
    }
  }
  if (!user)
    return (
      <main className="loading-screen">
        {error ? <p role="alert">{error}</p> : <p>Preparando tu espacio…</p>}
      </main>
    );
  const name = user.name || user.email.split("@")[0];
  return (
    <main className="dashboard">
      <header className="header wrap">
        <Link className="brand" href="/">
          <span className="brand-mark">✳</span> paint
          <span className="brand-dot">.</span>
        </Link>
        <div className="dashboard-nav">
          <span className="account-dot">{name.charAt(0).toUpperCase()}</span>
          <span className="account-email">{user.email}</span>
          <button className="logout" onClick={logout} disabled={busy}>
            {busy ? "Cerrando…" : "Cerrar sesión"} ↗
          </button>
        </div>
      </header>
      <section className="dashboard-content wrap">
        <div className="eyebrow">
          <span className="status-dot" /> TU ESPACIO PERSONAL
        </div>
        <div className="dashboard-heading">
          <div>
            <h1>
              Hola, <em>{name}.</em>
            </h1>
            <p>Bienvenido a tu espacio. Aquí empieza lo que viene.</p>
          </div>
          <span className="heading-star">✳</span>
        </div>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <div className="dashboard-grid">
          <article className="welcome-card">
            <div className="card-top">
              <span>UN NUEVO COMIENZO</span>
              <span>✳</span>
            </div>
            <div>
              <span className="card-spark">✳</span>
              <h2>
                Una idea puede
                <br />
                <em>
                  ser el comienzo
                  <br />
                  de todo.
                </em>
              </h2>
              <p>
                Este espacio está listo para acompañarte en lo que quieras
                crear.
              </p>
            </div>
            <div className="card-bottom">
              TU ESPACIO, TUS REGLAS <span>↗</span>
            </div>
          </article>
          <div className="side-cards">
            <article className="side-card account-card">
              <div className="card-top">
                <span>01 / TU CUENTA</span>
                <span>↗</span>
              </div>
              <div>
                <span className="side-icon">◌</span>
                <h3>Todo listo.</h3>
                <p>Has iniciado sesión como</p>
                <strong>{user.email}</strong>
              </div>
            </article>
            <article className="side-card little-card">
              <div className="card-top">
                <span>02 / PARA RECORDAR</span>
                <span>✳</span>
              </div>
              <p>
                Las mejores ideas no tienen que ser perfectas, solo tienen que
                empezar.
              </p>
            </article>
          </div>
        </div>
        <div className="dashboard-end">
          <span>HECHO PARA TUS PRÓXIMAS IDEAS</span>
          <span>✳ &nbsp; PAINT STUDIO</span>
        </div>
      </section>
    </main>
  );
}
