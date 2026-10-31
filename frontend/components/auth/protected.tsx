import { Suspense } from "react";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { Alert } from "@/components/ui/alert";
import { SessionRefresh } from "@/app/ui/session-actions";
import { getSession, type SessionUser } from "@/lib/session";

type ProtectedProps = {
  children: React.ReactNode | ((user: SessionUser) => React.ReactNode);
};

async function SessionGuard({ children }: ProtectedProps) {
  await connection();
  const session = await getSession();
  if (session.status === "unauthenticated") redirect("/login");
  if (session.status === "refresh") return <SessionRefresh />;
  if (session.status === "unavailable") {
    return <main className="loading-screen"><Alert variant="destructive" className="form-error">No pudimos verificar tu sesión. Recarga la página para intentarlo de nuevo.</Alert></main>;
  }
  return typeof children === "function" ? children(session.user) : children;
}

export function Protected({ children }: ProtectedProps) {
  return <Suspense fallback={null}><SessionGuard>{children}</SessionGuard></Suspense>;
}
