"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { ArrowLeft, ArrowUpRight, Eye, EyeOff, Sparkles } from "lucide-react";
import { Form } from "@base-ui/react/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Field, FieldDescription } from "@/components/ui/field";
import { ThemeToggle } from "@/components/theme-toggle";

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const register = mode === "register";
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); setLoading(true);
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email")).trim();
    const password = String(form.get("password"));
    if (register && password !== form.get("confirmPassword")) {
      setError("Las contraseñas no coinciden."); setLoading(false); return;
    }
    try {
      const response = await fetch(`/api/auth/${mode}`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(register ? { email, password, name: String(form.get("name")).trim() } : { email, password }),
      });
      const data = await response.json();
      if (!response.ok) { setError(data.message || "No pudimos completar la solicitud. Inténtalo de nuevo."); return; }
      router.replace("/dashboard"); router.refresh();
    } catch { setError("No pudimos conectar con el servidor. Inténtalo de nuevo."); }
    finally { setLoading(false); }
  }

  return (
    <main className="grid min-h-svh bg-background text-foreground lg:grid-cols-2">
      <section className="flex min-h-svh flex-col px-5 sm:px-10 lg:px-14 xl:px-20">
        <header className="flex h-20 items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2 text-xl font-semibold tracking-tight"><span className="grid size-8 place-items-center rounded-lg bg-primary text-primary-foreground">✳</span>paint<span className="-ml-2 text-muted-foreground">.</span></Link>
          <div className="flex items-center gap-2"><ThemeToggle /><Button variant="ghost" size="sm" render={<Link href="/" />} nativeButton={false}><ArrowLeft /> <span className="hidden sm:inline">Volver al inicio</span><span className="sm:hidden">Inicio</span></Button></div>
        </header>
        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-12">
          <Badge variant="outline" className="mb-6 w-fit gap-2 rounded-full px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[.16em]"><Sparkles className="size-3" /> {register ? "Un nuevo comienzo" : "Qué bueno verte"}</Badge>
          <h1 className="text-4xl font-semibold tracking-[-.045em] sm:text-5xl">{register ? "Crea tu cuenta." : "Bienvenido de vuelta."}</h1>
          <p className="mt-4 text-sm leading-6 text-muted-foreground">{register ? "Un pequeño paso para empezar a darle forma a tus ideas." : "Entra a tu espacio y continúa donde lo dejaste."}</p>

          <Form onSubmit={submit} className="mt-9 flex flex-col gap-5">
            {register && <Field className="gap-2"><Label htmlFor="name">Nombre</Label><Input className="h-11" id="name" name="name" type="text" autoComplete="name" placeholder="Tu nombre" required maxLength={100} /></Field>}
            <Field className="gap-2"><Label htmlFor="email">Correo electrónico</Label><Input className="h-11" id="email" name="email" type="email" autoComplete="email" placeholder="tu@correo.com" required maxLength={254} /></Field>
            <Field className="gap-2"><Label htmlFor="password">Contraseña</Label><div className="relative"><Input className="h-11 pr-12" id="password" name="password" type={showPassword ? "text" : "password"} autoComplete={register ? "new-password" : "current-password"} placeholder="Mínimo 12 caracteres" minLength={12} maxLength={256} required /><Button variant="ghost" size="icon-sm" className="absolute top-1/2 right-1.5 -translate-y-1/2 text-muted-foreground" type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}>{showPassword ? <EyeOff /> : <Eye />}</Button></div></Field>
            {register && <Field className="gap-2"><Label htmlFor="confirmPassword">Confirma tu contraseña</Label><Input className="h-11" id="confirmPassword" name="confirmPassword" type={showPassword ? "text" : "password"} autoComplete="new-password" placeholder="Repite tu contraseña" minLength={12} maxLength={256} aria-describedby="password-hint" required /><FieldDescription id="password-hint">Usa al menos 12 caracteres.</FieldDescription></Field>}
            {error && <Alert variant="destructive">{error}</Alert>}
            <Button className="h-11 w-full justify-between px-4" disabled={loading} type="submit">{loading ? "Un momento…" : register ? "Crear mi cuenta" : "Iniciar sesión"}<ArrowUpRight /></Button>
          </Form>
          <p className="mt-7 border-t pt-6 text-sm text-muted-foreground">{register ? "¿Ya tienes una cuenta?" : "¿Aún no tienes una cuenta?"}{" "}<Link className="font-medium text-foreground underline-offset-4 hover:underline" href={register ? "/login" : "/register"}>{register ? "Inicia sesión" : "Crea una cuenta"} →</Link></p>
        </div>
        <footer className="flex h-16 items-center justify-between text-[10px] font-medium uppercase tracking-[.14em] text-muted-foreground"><span>© Paint Studio</span><span className="hidden sm:inline">Un espacio para crear ✳</span></footer>
      </section>
      <aside className="relative hidden min-h-svh flex-col justify-between overflow-hidden bg-muted/60 p-12 lg:flex xl:p-16">
        <div className="relative z-10 flex justify-between text-[10px] font-semibold uppercase tracking-[.16em] text-muted-foreground"><span>Paint Studio</span><span>✳ &nbsp; 001 / ∞</span></div>
        <div aria-hidden="true" className="absolute inset-0 overflow-hidden"><div className="absolute top-[14%] right-[-7%] aspect-square w-[58%] rounded-full border border-border bg-background/80"/><div className="absolute top-[22%] right-[23%] h-[45%] w-[34%] rotate-45 rounded-t-full border border-border bg-secondary"/><div className="absolute right-[8%] bottom-[14%] aspect-square w-[27%] rounded-full border border-border bg-accent"/><span className="absolute top-[34%] right-[24%] text-8xl text-muted-foreground/40">✳</span></div>
        <div className="relative z-10 max-w-sm"><p className="text-[10px] font-semibold uppercase tracking-[.16em] text-muted-foreground">Un espacio para ti</p><h2 className="mt-6 text-6xl leading-[.95] font-semibold tracking-[-.06em] xl:text-7xl">Imagina.<br/><span className="font-serif font-normal italic text-muted-foreground">Crea.</span><br/>Repite.</h2><p className="mt-6 max-w-xs text-sm leading-6 text-muted-foreground">Las ideas más grandes empiezan con un pequeño paso.</p></div>
        <div className="relative z-10 flex justify-between text-[10px] font-semibold uppercase tracking-[.16em] text-muted-foreground"><span>Crea a tu manera</span><span>Paint ✳</span></div>
      </aside>
    </main>
  );
}
