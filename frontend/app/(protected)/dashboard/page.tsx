import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Protected } from "@/components/auth/protected";
import type { SessionUser } from "@/lib/session";

function Dashboard({ user }: { user: SessionUser }) {
  const name = user.name || user.email.split("@")[0];
  return (
    <div className="mx-auto w-full max-w-6xl space-y-8 px-4 py-8 md:px-8 md:py-12">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Tu espacio personal</p>
          <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">Hola, {name}.</h1>
          <p className="text-sm text-muted-foreground">Bienvenido a tu espacio. Aquí empieza lo que viene.</p>
        </div>
        <Avatar size="lg"><AvatarFallback>{name.charAt(0).toUpperCase()}</AvatarFallback></Avatar>
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="min-h-72 justify-between bg-secondary lg:col-span-2">
          <CardHeader><p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Un nuevo comienzo</p></CardHeader>
          <CardContent className="space-y-4">
            <span className="text-3xl" aria-hidden="true">✳</span>
            <CardTitle className="max-w-lg text-3xl font-semibold tracking-tight md:text-4xl">Una idea puede ser el comienzo de todo.</CardTitle>
            <p className="max-w-md text-sm leading-6 text-muted-foreground">Este espacio está listo para acompañarte en lo que quieras crear.</p>
          </CardContent>
        </Card>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
          <Card>
            <CardHeader><p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Tu cuenta</p></CardHeader>
            <CardContent className="space-y-2"><CardTitle className="text-xl">Todo listo.</CardTitle><p className="text-sm text-muted-foreground">Has iniciado sesión como</p><p className="break-all text-sm font-medium">{user.email}</p></CardContent>
          </Card>
          <Card className="bg-muted">
            <CardHeader><p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Para recordar</p></CardHeader>
            <CardContent><p className="text-lg leading-7">Las mejores ideas no tienen que ser perfectas, solo tienen que empezar.</p></CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return <Protected>{(user) => <Dashboard user={user} />}</Protected>;
}
