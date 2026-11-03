import { renewSession } from "@/app/ui/session-actions";
import type { Page } from "@/lib/access/types";

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}
export async function accessRequest<T>(
  path: string,
  init: RequestInit = {},
  retry = true,
): Promise<T> {
  const response = await fetch(`/api/access/${path}`, {
    ...init,
    cache: "no-store",
    headers: { "Content-Type": "application/json", ...init.headers },
  });
  if (response.status === 401 && retry) {
    const renewed = await renewSession();
    if (renewed.ok) return accessRequest<T>(path, init, false);
    if (renewed.status === 401) window.dispatchEvent(new Event("paint:session-expired"));
  }
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    const message = Array.isArray(body.message)
      ? body.message.join(". ")
      : body.message;
    throw new ApiError(
      message || "No se pudo completar la solicitud.",
      response.status,
    );
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}
export async function allPages<T>(path: string): Promise<T[]> {
  const items: T[] = [];
  for (let page = 1; ; page++) {
    const result = await accessRequest<Page<T>>(
      `${path}?page=${page}&limit=100`,
    );
    items.push(...result.data);
    if (items.length >= result.total || result.data.length === 0) return items;
  }
}
