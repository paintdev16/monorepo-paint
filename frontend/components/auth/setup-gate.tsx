import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { authRequest } from "@/lib/auth-api";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

async function CheckSetup({ children, setup }: { children: React.ReactNode; setup: boolean }) {
  await connection();
  let required: boolean;
  try {
    const response = await authRequest("setup");
    if (!response.ok) throw new Error("Setup status unavailable");
    const data: unknown = await response.json();
    if (typeof data !== "object" || data === null || typeof (data as { setupRequired?: unknown }).setupRequired !== "boolean") throw new Error("Invalid setup status");
    required = (data as { setupRequired: boolean }).setupRequired;
  } catch {
    return <main className="flex min-h-svh items-center justify-center p-6"><div className="w-full max-w-md space-y-4"><Alert variant="destructive">No pudimos comprobar la configuración inicial. Verifica que el backend esté disponible e inténtalo de nuevo.</Alert><Button variant="outline" render={<Link href={setup ? "/setup" : "/"} />} nativeButton={false}>Reintentar</Button></div></main>;
  }
  if (required && !setup) redirect("/setup");
  if (!required && setup) redirect("/login");
  return children;
}

export function SetupGate({ children, setup = false }: { children: React.ReactNode; setup?: boolean }) {
  return <Suspense fallback={<main className="flex min-h-svh items-center justify-center text-sm text-muted-foreground">Comprobando configuración…</main>}><CheckSetup setup={setup}>{children}</CheckSetup></Suspense>;
}
