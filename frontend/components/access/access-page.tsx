"use client";
import { Alert } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { usePermissions } from "./permissions-provider";
export function AccessPage({ permission, children }: { permission: string; children: React.ReactNode }) {
  const { can, loading, error } = usePermissions();
  if (loading) return <main className="mx-auto w-full max-w-6xl p-8"><Skeleton className="h-48 w-full" /></main>;
  if (error || !can(permission)) return <main className="mx-auto w-full max-w-6xl p-8"><Alert variant="destructive">{error ?? "No tienes permiso para ver esta sección."}</Alert></main>;
  return children;
}
