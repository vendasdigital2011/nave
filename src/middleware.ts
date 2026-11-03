import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { AUTH_COOKIE_NAME, AuthUser } from "@/lib/auth-constants";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionCookie = request.cookies.get(AUTH_COOKIE_NAME);

  const isLoginPage = pathname === "/login";
  const isApiAuth = pathname.startsWith("/api/auth");
  const isStatic =
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon.ico") ||
    pathname.endsWith(".png") ||
    pathname.endsWith(".jpg") ||
    pathname.endsWith(".svg") ||
    pathname.endsWith(".webp");

  if (isStatic || isApiAuth) {
    return NextResponse.next();
  }

  // Se não houver sessão e o usuário tenta acessar rota protegida
  if (!sessionCookie && !isLoginPage) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  // Se houver sessão
  if (sessionCookie?.value) {
    let user: AuthUser | null = null;
    try {
      user = JSON.parse(Buffer.from(sessionCookie.value, "base64").toString("utf-8"));
    } catch {
      // Cookie corrompido: limpar e redirecionar
      const response = NextResponse.redirect(new URL("/login", request.url));
      response.cookies.delete(AUTH_COOKIE_NAME);
      return response;
    }

    // Se estiver suspenso
    if (user && user.is_active === false && !isLoginPage) {
      const response = NextResponse.redirect(new URL("/login?error=suspended", request.url));
      response.cookies.delete(AUTH_COOKIE_NAME);
      return response;
    }

    // Se estiver autenticado e tentar acessar a página de login
    if (isLoginPage) {
      return NextResponse.redirect(new URL("/", request.url));
    }

    // Controle de acesso de rota: Tela de Equipe / Usuários restrita a Admin e Supervisor
    if (pathname.startsWith("/usuarios") && user?.role === "seller") {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
