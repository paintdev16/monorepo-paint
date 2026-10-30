import { Suspense } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Dashboard from "./dashboard-client";

async function DashboardSession() {
  const store = await cookies();
  const access = store.get("paint_access")?.value;
  const refresh = store.get("paint_refresh")?.value;
  if (!access && !refresh) redirect("/login");

  if (access) {
    let response: Response;
    try {
      const baseUrl = (process.env.AUTH_API_URL || "http://localhost:3000").replace(/\/$/, "");
      response = await fetch(`${baseUrl}/auth/me`, {
        headers: { Authorization: `Bearer ${access}` },
        cache: "no-store",
      });
    } catch {
      return <Dashboard initialUser={null} initialError />;
    }
    if (response.ok) return <Dashboard initialUser={await response.json()} />;
    if (response.status !== 401) return <Dashboard initialUser={null} initialError />;
  }
  if (!refresh) redirect("/login");
  return <Dashboard initialUser={null} />;
}

export default function DashboardPage() {
  return <Suspense fallback={null}><DashboardSession /></Suspense>;
}
