import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  // Admin routes → require admin/vendedor/operador role → redirect to /login
  const isAdminRoute =
    pathname.startsWith("/admin") ||
    pathname.startsWith("/clientes") ||
    pathname.startsWith("/configuracoes") ||
    pathname.startsWith("/cotacoes") ||
    pathname.startsWith("/impressoras") ||
    pathname.startsWith("/filamentos");

  // Client routes → require cliente role → redirect to /cliente/login
  const isClientRoute =
    pathname === "/cliente" ||
    pathname.startsWith("/cliente/novo") ||
    pathname.startsWith("/cliente/perfil");

  if (isAdminRoute) {
    if (!token || (token.role !== "admin" && token.role !== "vendedor" && token.role !== "operador")) {
      const loginUrl = req.nextUrl.clone();
      loginUrl.pathname = "/login";
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  if (isClientRoute) {
    if (!token || token.role !== "cliente") {
      const loginUrl = req.nextUrl.clone();
      loginUrl.pathname = "/cliente/login";
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin",
    "/admin/:path*",
    "/clientes/:path*",
    "/configuracoes/:path*",
    "/cotacoes/:path*",
    "/impressoras/:path*",
    "/filamentos/:path*",
    "/cliente",
    "/cliente/novo",
    "/cliente/perfil",
    "/cliente/perfil/:path*",
  ],
};
