import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const base = (process.env.AUTH_API_URL || "http://localhost:3000").replace(/\/$/, "");
const allowed = /^(roles|permissions|users)(?:\/[0-9a-f-]{36}(?:\/(?:roles|permissions))?)?$|^auth\/me\/permissions$/i;

async function handle(request: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const path = (await params).path.join("/");
  if (!allowed.test(path)) return NextResponse.json({ message: "No encontrado." }, { status: 404 });
  if (request.method !== "GET" && request.headers.get("origin") !== new URL(request.url).origin) return NextResponse.json({ message: "Solicitud no permitida." }, { status: 403 });
  const token = (await cookies()).get("paint_access")?.value;
  if (!token) return NextResponse.json({ message: "Sesión no válida." }, { status: 401 });
  try {
    const response = await fetch(`${base}/${path}${new URL(request.url).search}`, { method: request.method, headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: request.method === "GET" || request.method === "DELETE" ? undefined : await request.text(), cache: "no-store" });
    if (response.status === 204) return new Response(null, { status: 204 });
    return new Response(await response.text(), { status: response.status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });
  } catch { return NextResponse.json({ message: "No pudimos conectar con el servidor." }, { status: 503 }); }
}
export const GET = handle;
export const POST = handle;
export const PATCH = handle;
export const PUT = handle;
export const DELETE = handle;
