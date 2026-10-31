import { NextResponse, type NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const publicPaths = new Set(["/", "/login", "/register"]);
  if (publicPaths.has(request.nextUrl.pathname)) return NextResponse.next();

  const access = request.cookies.get("paint_access")?.value;
  const refresh = request.cookies.get("paint_refresh")?.value;

  // Cookie presence is only a preliminary check; the backend validates sessions.
  if (!access && !refresh) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api(?:/|$)|_next/|favicon\\.ico$|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
