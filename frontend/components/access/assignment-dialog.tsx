"use client";
import { useEffect, useState } from "react";
import { accessRequest, allPages } from "@/lib/access/api";
import type { Effective, Permission, Role, User } from "@/lib/access/types";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";

type Target = { type: "role"; value: Role } | { type: "user"; value: User };
export function AssignmentDialog({ target, close, saved, editable }: { target: Target | null; close: () => void; saved: () => void; editable: boolean }) {
  const [options, setOptions] = useState<{ id: string; label: string; group: string }[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [effective, setEffective] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    if (!target) return;
    let active = true;
    Promise.resolve().then(() => { if (active) { setLoading(true); setError(""); } });
    const load = async () => {
      if (target.type === "role") {
        const role = await accessRequest<Role>(`roles/${target.value.id}`);
        const permissions = editable ? await allPages<Permission>("permissions") : role.permissions ?? [];
        if (active) { setOptions(permissions.map((item) => ({ id: item.id, label: item.key, group: item.key.split(".")[0] }))); setSelected((role.permissions ?? []).map((item) => item.id)); }
      } else {
        const [current, permissions] = await Promise.all([accessRequest<{ roles: Role[] }>(`users/${target.value.id}/roles`), accessRequest<Effective>(`users/${target.value.id}/permissions`)]);
        const roles = editable ? await allPages<Role>("roles") : current.roles;
        if (active) { setOptions(roles.map((item) => ({ id: item.id, label: item.name, group: "Roles" }))); setSelected(current.roles.map((item) => item.id)); setEffective(permissions.permissions); }
      }
    };
    void load().catch((err) => { if (active) setError(err instanceof Error ? err.message : "Error al cargar datos."); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [target, editable]);
  if (!target) return null;
  const locked = target.type === "role" ? target.value.name === "super_admin" : target.value.roles.some((role) => role.name === "super_admin");
  const groups = [...new Set(options.map((item) => item.group))];
  const toggle = (ids: string[], checked: boolean) => setSelected((current) => checked ? [...new Set([...current, ...ids])] : current.filter((id) => !ids.includes(id)));
  const save = async () => {
    setBusy(true); setError("");
    try { await accessRequest(`${target.type === "role" ? "roles" : "users"}/${target.value.id}/${target.type === "role" ? "permissions" : "roles"}`, { method: "PUT", body: JSON.stringify({ ids: selected }) }); saved(); close(); }
    catch (err) { setError(err instanceof Error ? err.message : "No se pudieron guardar los cambios."); }
    finally { setBusy(false); }
  };
  return <Dialog open onOpenChange={(open) => { if (!open && !busy) close(); }}><DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg"><DialogHeader><DialogTitle>{target.type === "role" ? "Permisos del rol" : "Roles del usuario"}</DialogTitle><DialogDescription>{target.type === "role" ? target.value.name : target.value.email}</DialogDescription></DialogHeader>
    {error && <Alert variant="destructive">{error}</Alert>}{locked && <Alert>La asignación de superadministrador está protegida. {target.type === "role" ? "Este rol tiene todos los permisos registrados." : "No se puede modificar desde esta pantalla."}</Alert>}
    {loading ? <Skeleton className="h-32 w-full" /> : groups.map((group) => { const entries = options.filter((item) => item.group === group); const ids = entries.map((item) => item.id); return <fieldset key={group} className="space-y-3 rounded-lg border p-3"><legend className="px-1 text-sm font-medium capitalize">{group}</legend>{target.type === "role" && editable && !locked && <label className="flex items-center gap-2 text-sm"><Checkbox checked={ids.every((id) => selected.includes(id))} onCheckedChange={(checked) => toggle(ids, checked)} /> Seleccionar grupo</label>}{entries.map((entry) => <label className="flex items-center gap-2 text-sm" key={entry.id}><Checkbox checked={selected.includes(entry.id)} disabled={!editable || locked || (target.type === "user" && entry.label === "super_admin")} onCheckedChange={(checked) => toggle([entry.id], checked)} />{entry.label}</label>)}</fieldset>; })}
    {!loading && options.length === 0 && !error && <p className="text-sm text-muted-foreground">No hay elementos disponibles.</p>}
    {target.type === "user" && !loading && <div className="space-y-2"><p className="text-sm font-medium">Permisos efectivos actuales</p><div className="flex flex-wrap gap-1">{effective.length ? effective.map((permission) => <Badge key={permission} variant="secondary">{permission}</Badge>) : <span className="text-sm text-muted-foreground">Sin permisos.</span>}</div></div>}
    <DialogFooter><Button variant="outline" onClick={close} disabled={busy}>Cerrar</Button>{editable && !locked && <Button onClick={() => void save()} disabled={busy || loading || !!error}>{busy ? "Guardando…" : "Guardar cambios"}</Button>}</DialogFooter>
  </DialogContent></Dialog>;
}
