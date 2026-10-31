import "server-only";

const baseUrl = (process.env.AUTH_API_URL || "http://localhost:3000").replace(/\/$/, "");

export function authRequest(path: string, options: RequestInit = {}) {
  return fetch(`${baseUrl}/auth/${path}`, {
    ...options,
    cache: "no-store",
    headers: { "Content-Type": "application/json", ...options.headers },
  });
}

