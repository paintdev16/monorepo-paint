"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { accessRequest } from "@/lib/access/api";
import type { Effective } from "@/lib/access/types";

type ContextValue = { effective: Effective | null; loading: boolean; error: string | null; refresh: () => Promise<void>; can: (permission: string) => boolean; canAny: (permissions: string[]) => boolean; canAll: (permissions: string[]) => boolean; isSuperAdmin: boolean };
const Context = createContext<ContextValue | null>(null);
export function PermissionsProvider({ children }: { children: React.ReactNode }) {
  const [effective, setEffective] = useState<Effective | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const pathname = usePathname();
  const router = useRouter();
  const refresh = useCallback(async () => {
    try { setEffective(await accessRequest<Effective>("auth/me/permissions")); setError(null); }
    catch { setEffective(null); setError("No se pudieron consultar tus permisos."); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { const timer = setTimeout(() => void refresh(), 0); return () => clearTimeout(timer); }, [pathname, refresh]);
  useEffect(() => { const onFocus = () => { void refresh(); }; window.addEventListener("focus", onFocus); return () => window.removeEventListener("focus", onFocus); }, [refresh]);
  useEffect(() => { const onExpired = () => { router.replace("/login"); router.refresh(); }; window.addEventListener("paint:session-expired", onExpired); return () => window.removeEventListener("paint:session-expired", onExpired); }, [router]);
  const value = useMemo(() => {
    const can = (permission: string) => effective?.permissions.includes(permission) ?? false;
    return { effective, loading, error, refresh, can, canAny: (p: string[]) => p.some(can), canAll: (p: string[]) => p.every(can), isSuperAdmin: effective?.roles.some((role) => role.name === "super_admin") ?? false };
  }, [effective, loading, error, refresh]);
  return <Context.Provider value={value}>{children}</Context.Provider>;
}
export function usePermissions() { const context = useContext(Context); if (!context) throw new Error("PermissionsProvider is required"); return context; }
export function Can({ permission, children }: { permission: string; children: React.ReactNode }) { return usePermissions().can(permission) ? children : null; }
