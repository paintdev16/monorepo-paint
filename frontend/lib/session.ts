import "server-only";

import { cache } from "react";
import { cookies } from "next/headers";
import { authRequest } from "@/lib/auth-api";
import { userDto, type SessionUser } from "@/lib/user-dto";

export type { SessionUser } from "@/lib/user-dto";
type Session =
  | { status: "authenticated"; user: SessionUser }
  | { status: "refresh" }
  | { status: "unauthenticated" }
  | { status: "unavailable" };

// Cached only for the current server render, never shared between users.
export const getSession = cache(async (): Promise<Session> => {
  const store = await cookies();
  const access = store.get("paint_access")?.value;
  const refresh = store.get("paint_refresh")?.value;

  if (access) {
    try {
      const response = await authRequest("me", {
        headers: { Authorization: `Bearer ${access}` },
      });
      if (response.ok) return { status: "authenticated", user: userDto(await response.json()) };
      if (response.status !== 401) return { status: "unavailable" };
    } catch {
      return { status: "unavailable" };
    }
  }
  return { status: refresh ? "refresh" : "unauthenticated" };
});
