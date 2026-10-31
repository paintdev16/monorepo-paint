import Link from "next/link";
import { ArrowDownRight, ArrowRight, ArrowUpRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ThemeToggle } from "@/components/theme-toggle";

export default function Home() {
  return (
    <main className="min-h-svh bg-background text-foreground">
      <header className="mx-auto flex h-20 w-full max-w-7xl items-center justify-between border-b px-5 sm:px-8 lg:px-12">
        <Link href="/" className="flex items-center gap-2 text-xl font-semibold tracking-tight"><span className="grid size-8 place-items-center rounded-lg bg-primary text-primary-foreground">✳</span>paint<span className="-ml-2 text-muted-foreground">.</span></Link>
        <nav aria-label="Navegación principal" className="flex items-center gap-2 sm:gap-4">
          <ThemeToggle />
          <Button variant="ghost" size="sm" render={<Link href="/login" />} nativeButton={false}>Iniciar sesión</Button>
          <Button size="sm" render={<Link href="/register" />} nativeButton={false}>Crear cuenta <ArrowUpRight /></Button>
        </nav>
      </header>

      <section className="mx-auto grid min-h-[min(740px,calc(100svh-10rem))] w-full max-w-7xl items-center gap-14 px-5 py-16 sm:px-8 md:py-24 lg:grid-cols-[1.05fr_.95fr] lg:gap-20 lg:px-12">
        <div className="max-w-2xl">
          <Badge variant="outline" className="mb-7 gap-2 rounded-full px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[.16em]"><Sparkles className="size-3" /> Un espacio para crear</Badge>
          <h1 className="text-5xl leading-[1.05] font-semibold tracking-[-.055em] sm:text-6xl xl:text-[5.1rem]">Las buenas ideas <span className="font-serif font-normal italic text-muted-foreground">empiezan aquí.</span></h1>
          <p className="mt-7 max-w-md text-base leading-7 text-muted-foreground sm:text-lg">Un espacio en blanco, infinitas posibilidades. Entra a tu cuenta y dale forma a lo que imaginas.</p>
          <div className="mt-9 flex flex-wrap items-center gap-3"><Button size="lg" className="h-11 gap-5 px-5" render={<Link href="/register" />} nativeButton={false}>Comenzar ahora <ArrowUpRight /></Button><Button variant="ghost" size="lg" className="h-11" render={<Link href="/login" />} nativeButton={false}>Ya tengo una cuenta <ArrowRight /></Button></div>
          <div className="mt-16 flex items-center gap-3 text-[10px] font-medium uppercase tracking-[.16em] text-muted-foreground"><span className="grid size-8 place-items-center rounded-full border text-base text-foreground">✳</span> Hecho para tus próximas ideas</div>
        </div>

        <Card className="relative min-h-[400px] overflow-hidden rounded-2xl bg-muted/40 py-0 sm:min-h-[500px]" aria-label="Composición abstracta de formas geométricas">
          <CardContent className="relative flex min-h-[400px] flex-col justify-between p-6 sm:min-h-[500px] sm:p-8">
            <div className="relative z-10 flex items-center justify-between text-[10px] font-medium uppercase tracking-[.16em] text-muted-foreground"><span>Una nueva idea</span><span>001 / ∞</span></div>
            <div aria-hidden="true" className="absolute inset-0 overflow-hidden"><div className="absolute top-[20%] left-[11%] h-[55%] w-[48%] -rotate-12 rounded-t-full border border-border bg-background"/><div className="absolute top-[18%] right-[13%] aspect-square w-[36%] rounded-full border border-border bg-secondary"/><div className="absolute right-[22%] bottom-[15%] h-[43%] w-[29%] rotate-45 rounded-t-full border border-border bg-accent"/><div className="absolute bottom-[18%] left-[16%] h-[20%] w-[40%] rotate-12 rounded-t-full border border-border bg-card"/><span className="absolute top-[39%] left-[37%] -rotate-6 text-[clamp(3rem,7vw,5.5rem)] leading-[.85] font-semibold tracking-[-.08em]">hazlo<br/><i className="font-serif font-normal">tuyo.</i></span></div>
            <div className="relative z-10 flex items-center justify-between text-[10px] font-medium uppercase tracking-[.16em] text-muted-foreground"><span>Un poco de inspiración</span><ArrowDownRight className="size-4" /></div>
          </CardContent>
        </Card>
      </section>
      <footer className="mx-auto flex h-20 w-full max-w-7xl items-center justify-between border-t px-5 text-[10px] font-medium uppercase tracking-[.14em] text-muted-foreground sm:px-8 lg:px-12"><span>© Paint Studio</span><span className="hidden sm:inline">Un lugar para empezar &nbsp; ✳</span><span>Hecho con creatividad</span></footer>
    </main>
  );
}
