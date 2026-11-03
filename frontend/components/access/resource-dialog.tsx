"use client";
import { useEffect, useState } from "react";
import { accessRequest, allPages } from "@/lib/access/api";
import type { Permission, Role } from "@/lib/access/types";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Target = { type: "roles"; value?: Role } | { type: "permissions"; value?: Permission };
export function ResourceDialog({ target, close, saved }: { target: Target | null; close: () => void; saved: () => void }) {
  const [name, setName] = useState(""); const [description, setDescription] = useState("");
  const [id, setId] = useState<string>(); const [permissions, setPermissions] = useState<Permission[]>([]); const [selected, setSelected] = useState<string[]>([]);
  const [isRequired, setIsRequired] = useState(false); const [nameLocked, setNameLocked] = useState(false);
  const [busy, setBusy] = useState(false); const [loading, setLoading] = useState(false); const [loadFailed, setLoadFailed] = useState(false); const [error, setError] = useState("");
  useEffect(() => {
    if (!target) return;
    Promise.resolve().then(() => {
      setName(target.value ? (target.type === "roles" ? (target.value as Role).name : (target.value as Permission).key) : "");
      setDescription(target.value?.description ?? ""); setId(target.value?.id); setIsRequired(target.value?.isRequired ?? false); setNameLocked(target.value?.isRequired ?? false); setError(""); setLoadFailed(false); setSelected([]);
    });
    if (target.type !== "roles") return;
    let active = true; Promise.resolve().then(() => { if (active) setLoading(true); });
    void Promise.all([allPages<Permission>("permissions"), target.value ? accessRequest<Role>(`roles/${target.value.id}`) : Promise.resolve(null)]).then(([items, role]) => { if (active) { setPermissions(items); setSelected((role?.permissions ?? []).map((item) => item.id)); } }).catch((err) => { if (active) { setLoadFailed(true); setError(err instanceof Error ? err.message : "Error al cargar permisos."); } }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [target]);
  if (!target) return null;
  const groups = [...new Set(permissions.map((permission) => permission.key.split(".")[0]))];
  const toggle = (ids: string[], checked: boolean) => setSelected((current) => checked ? [...new Set([...current, ...ids])] : current.filter((value) => !ids.includes(value)));
  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setBusy(true); setError("");
    try {
      const payload = target.type === "roles" ? { name, description, isRequired } : { key: name, description, isRequired };
      const result = await accessRequest<{ id: string }>(id ? `${target.type}/${id}` : target.type, { method: id ? "PATCH" : "POST", body: JSON.stringify(payload) });
      const resourceId = id ?? result.id; setId(resourceId); setNameLocked(isRequired);
      if (target.type === "roles") {
        try { await accessRequest(`roles/${resourceId}/permissions`, { method: "PUT", body: JSON.stringify({ ids: selected }) }); }
        catch (err) { throw new Error(`El rol se guardó, pero no se pudieron sincronizar los permisos: ${err instanceof Error ? err.message : "error"}`); }
      }
      saved(); close();
    } catch (err) { saved(); setError(err instanceof Error ? err.message : "No se pudo guardar."); }
    finally { setBusy(false); }
  };
  return <Dialog open onOpenChange={(open) => { if (!open && !busy) close(); }}><DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg"><DialogHeader><DialogTitle>{id ? "Editar" : "Crear"} {target.type === "roles" ? "rol" : "permiso"}</DialogTitle><DialogDescription>Los cambios se guardan en el servidor.</DialogDescription></DialogHeader>
    <form onSubmit={submit} className="space-y-4">{error && <Alert variant="destructive">{error}</Alert>}<div className="space-y-2"><Label htmlFor="resource-name">{target.type === "roles" ? "Nombre" : "Clave"}</Label><Input id="resource-name" value={name} onChange={(event) => setName(event.target.value)} required readOnly={nameLocked} aria-describedby={nameLocked ? "required-name-hint" : undefined} maxLength={target.type === "roles" ? 64 : 100} pattern={target.type === "roles" ? "[a-z][a-z0-9_]*" : "[a-z][a-z0-9_]*(\\.[a-z][a-z0-9_]*)+"} placeholder={target.type === "roles" ? "editor" : "projects.view"} />{nameLocked && <p id="required-name-hint" className="text-xs text-muted-foreground">Para cambiar {target.type === "roles" ? "el nombre" : "la clave"}, desmarca Indispensable y guarda primero.</p>}</div><div className="space-y-2"><Label htmlFor="resource-description">Descripción</Label><Input id="resource-description" value={description} onChange={(event) => setDescription(event.target.value)} maxLength={500} /></div>
    <div className="flex items-start gap-3 rounded-lg border p-3"><Checkbox id="resource-required" checked={isRequired} onCheckedChange={setIsRequired} /><div className="space-y-1"><Label htmlFor="resource-required">Indispensable</Label><p className="text-xs text-muted-foreground">Impide eliminar o cambiar {target.type === "roles" ? "el nombre del rol" : "la clave del permiso"} mientras esté activo.</p></div></div>
    {target.type === "roles" && <div className="space-y-3"><p className="text-sm font-medium">Permisos</p>{loading && <p className="text-sm text-muted-foreground">Cargando permisos…</p>}{groups.map((group) => { const items = permissions.filter((item) => item.key.split(".")[0] === group); const ids = items.map((item) => item.id); return <fieldset key={group} className="space-y-2 rounded-lg border p-3"><legend className="px-1 text-sm font-medium capitalize">{group}</legend><label className="flex gap-2 text-sm"><Checkbox checked={ids.every((value) => selected.includes(value))} onCheckedChange={(checked) => toggle(ids, checked)} /> Seleccionar grupo</label>{items.map((item) => <label key={item.id} className="flex gap-2 text-sm"><Checkbox checked={selected.includes(item.id)} onCheckedChange={(checked) => toggle([item.id], checked)} />{item.key}</label>)}</fieldset>; })}</div>}
    <DialogFooter><Button type="button" variant="outline" disabled={busy} onClick={close}>Cancelar</Button><Button type="submit" disabled={busy || loading || loadFailed}>{busy ? "Guardando…" : "Guardar"}</Button></DialogFooter></form>
  </DialogContent></Dialog>;
}
