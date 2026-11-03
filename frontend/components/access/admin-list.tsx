"use client";
import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { accessRequest, allPages } from "@/lib/access/api";
import type { Permission, Role, User } from "@/lib/access/types";
import { useAccessList } from "@/hooks/use-access-list";
import { Badge } from "@/components/ui/badge";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { usePermissions } from "./permissions-provider";
import { ListShell } from "./list-shell";
import { AssignmentDialog } from "./assignment-dialog";
import { ResourceDialog } from "./resource-dialog";

type Kind = "users" | "roles" | "permissions";
type Target = { type: "role"; value: Role } | { type: "user"; value: User };
type Editing = { type: "roles"; value?: Role } | { type: "permissions"; value?: Permission };
export function AdminList({ kind }: { kind: Kind }) {
  const [resource, setResource] = useState(""); const [resources, setResources] = useState<string[]>([]);
  const list = useAccessList<Role | User | Permission>(kind, resource);
  const { isSuperAdmin, refresh } = usePermissions();
  const [assignment, setAssignment] = useState<Target | null>(null); const [editing, setEditing] = useState<Editing | null>(null);
  const [deleting, setDeleting] = useState<Role | Permission | null>(null); const [busy, setBusy] = useState(false); const [error, setError] = useState("");
  useEffect(() => { if (kind === "permissions") void allPages<Permission>("permissions").then((items) => setResources([...new Set(items.map((item) => item.key.split(".")[0]))].sort())).catch(() => setResources([])); }, [kind, list.result]);
  const reload = () => { void list.reload(); void refresh(); };
  const remove = async () => {
    if (!deleting) return; setBusy(true); setError("");
    try { await accessRequest(`${kind}/${deleting.id}`, { method: "DELETE" }); setDeleting(null); reload(); }
    catch (err) { setError(err instanceof Error ? err.message : "No se pudo eliminar."); }
    finally { setBusy(false); }
  };
  const title = kind === "users" ? "Usuarios" : kind === "roles" ? "Roles" : "Permisos";
  const description = kind === "users" ? "Consulta las cuentas y administra sus roles." : kind === "roles" ? "Organiza los permisos de acceso por rol." : "Consulta y administra los permisos disponibles.";
  return <><ListShell title={title} description={description} search={list.search} onSearch={list.changeSearch} page={list.page} onPage={list.setPage} total={list.result?.total ?? 0} loading={list.loading} error={error || list.error}
    action={isSuperAdmin && kind !== "users" ? <Button onClick={() => setEditing({ type: kind })}><Plus /> Crear {kind === "roles" ? "rol" : "permiso"}</Button> : undefined}
    filter={kind === "permissions" ? <Select value={resource || "all"} onValueChange={(value) => { setResource(value === "all" || value === null ? "" : value); list.setPage(1); }}><SelectTrigger className="w-44" aria-label="Filtrar por recurso"><SelectValue placeholder="Todos los recursos" /></SelectTrigger><SelectContent><SelectItem value="all">Todos los recursos</SelectItem>{resources.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select> : undefined}>
    <Table><TableHeader><TableRow><TableHead>{kind === "users" ? "Usuario" : kind === "roles" ? "Rol" : "Permiso"}</TableHead><TableHead>{kind === "users" ? "Roles" : "Descripción"}</TableHead>{kind !== "users" && <TableHead>{kind === "roles" ? "Usuarios / permisos" : "Roles"}</TableHead>}<TableHead className="text-right">Acciones</TableHead></TableRow></TableHeader><TableBody>
    {list.result?.data.map((item) => {
      if (kind === "users") { const user = item as User; return <TableRow key={user.id}><TableCell><div className="font-medium">{user.name || "Sin nombre"}</div><div className="text-muted-foreground">{user.email}</div></TableCell><TableCell><div className="flex flex-wrap gap-1">{user.roles.map((role) => <Badge key={role.id} variant="secondary">{role.name}</Badge>)}</div></TableCell><TableCell className="text-right"><Button size="sm" variant="outline" onClick={() => setAssignment({ type: "user", value: user })}>{isSuperAdmin ? "Gestionar roles" : "Ver acceso"}</Button></TableCell></TableRow>; }
      if (kind === "roles") { const role = item as Role; const system = ["super_admin", "admin", "client"].includes(role.name); return <TableRow key={role.id}><TableCell className="font-medium">{role.name}</TableCell><TableCell>{role.description || "—"}</TableCell><TableCell>{role.userCount} / {role.permissionCount}</TableCell><TableCell className="text-right"><div className="flex justify-end gap-1"><Button size="sm" variant="ghost" onClick={() => setAssignment({ type: "role", value: role })}>Permisos</Button>{isSuperAdmin && !system && <><Button size="sm" variant="ghost" onClick={() => setEditing({ type: "roles", value: role })}>Editar</Button><Button size="sm" variant="ghost" onClick={() => setDeleting(role)}>Eliminar</Button></>}</div></TableCell></TableRow>; }
      const permission = item as Permission; return <TableRow key={permission.id}><TableCell className="font-medium">{permission.key}</TableCell><TableCell>{permission.description || "—"}</TableCell><TableCell>{permission.roleCount}</TableCell><TableCell className="text-right">{isSuperAdmin && <div className="flex justify-end gap-1"><Button size="sm" variant="ghost" onClick={() => setEditing({ type: "permissions", value: permission })}>Editar</Button><Button size="sm" variant="ghost" onClick={() => setDeleting(permission)}>Eliminar</Button></div>}</TableCell></TableRow>;
    })}
    {list.result?.data.length === 0 && <TableRow><TableCell colSpan={4} className="py-10 text-center text-muted-foreground">No se encontraron resultados.</TableCell></TableRow>}
    </TableBody></Table>
    </ListShell>
    <AssignmentDialog target={assignment} close={() => setAssignment(null)} saved={reload} editable={isSuperAdmin} />
    <ResourceDialog target={editing} close={() => setEditing(null)} saved={reload} />
    <AlertDialog open={!!deleting} onOpenChange={(open) => { if (!open && !busy) { setDeleting(null); setError(""); } }}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>¿Eliminar este elemento?</AlertDialogTitle><AlertDialogDescription>Esta acción no se puede deshacer. El servidor rechazará la eliminación si está protegido o en uso.</AlertDialogDescription></AlertDialogHeader>{error && <Alert variant="destructive">{error}</Alert>}<AlertDialogFooter><AlertDialogCancel disabled={busy}>Cancelar</AlertDialogCancel><AlertDialogAction variant="destructive" disabled={busy} onClick={() => void remove()}>{busy ? "Eliminando…" : "Eliminar"}</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
  </>;
}
