import { auth } from "@/server/auth";

export default auth((req) => {
  const { pathname } = req.nextUrl;

  const publicPaths = [
    "/login",
    "/api/auth",
    "/api/webhooks",
    "/api/cron",
    "/api/health",
  ];

  const isPublic = publicPaths.some((path) => pathname.startsWith(path));

  if (!req.auth && !isPublic) {
    const loginUrl = new URL("/login", req.nextUrl.origin);
    return Response.redirect(loginUrl);
  }
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};