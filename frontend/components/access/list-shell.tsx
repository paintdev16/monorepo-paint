"use client";
import { Search } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

type Props = { title: string; description: string; search: string; onSearch: (value: string) => void; page: number; total: number; onPage: (page: number) => void; loading: boolean; error: string; action?: React.ReactNode; filter?: React.ReactNode; children: React.ReactNode };
export function ListShell({ title, description, search, onSearch, page, total, onPage, loading, error, action, filter, children }: Props) {
  return <main className="mx-auto w-full max-w-6xl space-y-6 px-4 py-8 md:px-8 md:py-10">
    <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="mb-2 text-xs font-medium uppercase tracking-widest text-muted-foreground">Administración</p><h1 className="text-3xl font-semibold tracking-tight">{title}</h1><p className="mt-2 text-sm text-muted-foreground">{description}</p></div>{action}</div>
    <Card><CardContent className="space-y-4 pt-2"><div className="flex flex-wrap items-center gap-3"><div className="relative w-full max-w-sm"><Search className="absolute top-2.5 left-3 size-4 text-muted-foreground" /><Input value={search} onChange={(event) => onSearch(event.target.value)} placeholder="Buscar…" aria-label={`Buscar ${title.toLowerCase()}`} className="pl-9" /></div>{filter}</div>
    {error && <Alert variant="destructive">{error}</Alert>}
    {loading ? <div className="space-y-3" aria-label="Cargando">{[1, 2, 3].map((item) => <Skeleton key={item} className="h-12 w-full" />)}</div> : children}
    <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-4 text-sm text-muted-foreground"><span>{total} resultados · página {page}</span><div className="flex gap-2"><Button variant="outline" size="sm" disabled={loading || page <= 1} onClick={() => onPage(page - 1)}>Anterior</Button><Button variant="outline" size="sm" disabled={loading || page * 10 >= total} onClick={() => onPage(page + 1)}>Siguiente</Button></div></div>
    </CardContent></Card>
  </main>;
}
