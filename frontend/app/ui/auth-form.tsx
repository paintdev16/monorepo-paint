"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert } from "@/components/ui/alert";

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const register = mode === "register";
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email")).trim();
    const password = String(form.get("password"));
    if (register && password !== form.get("confirmPassword")) {
      setError("Las contraseñas no coinciden.");
      setLoading(false);
      return;
    }
    try {
      const response = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(register ? { email, password, name: String(form.get("name")).trim() } : { email, password }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(
          data.message ||
            "No pudimos completar la solicitud. Inténtalo de nuevo.",
        );
        return;
      }
      router.replace("/dashboard");
      router.refresh();
    } catch {
      setError("No pudimos conectar con el servidor. Inténtalo de nuevo.");
    } finally {
      setLoading(false);
    }
  }
  return (
    <main className="auth-layout">
      <section className="auth-main">
        <header className="auth-header">
          <Link className="brand" href="/">
            <span className="brand-mark">✳</span> paint
            <span className="brand-dot">.</span>
          </Link>
          <Link className="back-link" href="/">
            ← Volver al inicio
          </Link>
        </header>
        <div className="auth-content">
          <div className="eyebrow">
            <span className="status-dot" />{" "}
            {register ? "UN NUEVO COMIENZO" : "QUÉ BUENO VERTE"}
          </div>
          <h1>
            {register ? (
              <>
                Tu próximo
                <br />
                <em>capítulo empieza aquí.</em>
              </>
            ) : (
              <>
                Bienvenido
                <br />
                <em>de vuelta.</em>
              </>
            )}
          </h1>
          <p className="auth-intro">
            {register
              ? "Crea tu cuenta y empieza a darle forma a tus ideas."
              : "Entra a tu espacio y continúa donde lo dejaste."}
          </p>
          <form onSubmit={submit} className="auth-form">
            {register && <><Label htmlFor="name">Nombre</Label><Input id="name" name="name" type="text" autoComplete="name" placeholder="Tu nombre" required maxLength={100} /></>}
            <Label htmlFor="email">Correo electrónico</Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="tu@correo.com"
              required
              maxLength={254}
            />
            <Label htmlFor="password">Contraseña</Label>
            <div className="password-field">
              <Input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete={register ? "new-password" : "current-password"}
                placeholder="Mínimo 12 caracteres"
                minLength={12}
                maxLength={256}
                required
              />
              <Button
                variant="ghost"
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={
                  showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
                }
              >
                {showPassword ? "Ocultar" : "Mostrar"}
              </Button>
            </div>
            {register && (
              <>
                <Label htmlFor="confirmPassword">Confirma tu contraseña</Label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="Repite tu contraseña"
                  minLength={12}
                  maxLength={256}
                  required
                />
                <p className="field-note">Usa al menos 12 caracteres.</p>
              </>
            )}
            {error && (
              <Alert variant="destructive" className="form-error">
                {error}
              </Alert>
            )}
            <Button
              className="button button-dark submit-button"
              disabled={loading}
              type="submit"
            >
              {loading
                ? "Un momento…"
                : register
                  ? "Crear mi cuenta"
                  : "Iniciar sesión"}{" "}
              <span>↗</span>
            </Button>
          </form>
          <p className="auth-switch">
            {register ? "¿Ya tienes una cuenta?" : "¿Aún no tienes una cuenta?"}{" "}
            <Link href={register ? "/login" : "/register"}>
              {register ? "Inicia sesión" : "Crea una cuenta"} →
            </Link>
          </p>
        </div>
        <div className="auth-footer">
          © PAINT STUDIO <span>UN ESPACIO PARA CREAR ✳</span>
        </div>
      </section>
      <aside className="auth-aside">
        <div className="aside-top">
          PAINT STUDIO <span>✳</span>
        </div>
        <div className="aside-art">
          <div className="aside-circle" />
          <div className="aside-arc" />
          <div className="aside-star">✳</div>
        </div>
        <div className="aside-copy">
          <span>UN ESPACIO PARA TI</span>
          <h2>
            Imagina.
            <br />
            <em>Crea.</em>
            <br />
            Repite.
          </h2>
          <p>Las ideas más grandes empiezan con un pequeño paso.</p>
        </div>
        <div className="aside-bottom">
          CREA A TU MANERA <span>001 — ∞</span>
        </div>
      </aside>
    </main>
  );
}
