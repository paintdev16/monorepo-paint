import "server-only";

export type SessionUser = { id: string; email: string; name: string | null };

// Expose only the fields needed by the UI, even if the backend adds more later.
export function userDto(value: unknown): SessionUser {
  if (typeof value !== "object" || value === null) throw new Error("Invalid user response");
  const user = value as Record<string, unknown>;
  if (typeof user.id !== "string" || typeof user.email !== "string" || (user.name !== null && typeof user.name !== "string")) {
    throw new Error("Invalid user response");
  }
  return { id: user.id, email: user.email, name: user.name };
}
