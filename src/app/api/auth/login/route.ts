import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { AUTH_COOKIE_NAME, AuthUser } from "@/lib/auth-constants";

const DEFAULT_ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@navetech.com.br";
const DEFAULT_ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123456";

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    const validEmail = (process.env.ADMIN_EMAIL || DEFAULT_ADMIN_EMAIL).toLowerCase();
    const validPassword = process.env.ADMIN_PASSWORD || DEFAULT_ADMIN_PASSWORD;

    if (
      email &&
      password &&
      email.trim().toLowerCase() === validEmail &&
      password.trim() === validPassword
    ) {
      const user: AuthUser = {
        email: email.trim().toLowerCase(),
        name: "Administrador Geral",
        role: "admin",
      };

      const sessionValue = Buffer.from(JSON.stringify(user)).toString("base64");
      const cookieStore = await cookies();
      cookieStore.set(AUTH_COOKIE_NAME, sessionValue, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 60 * 60 * 24 * 7, // 7 dias
        path: "/",
        sameSite: "lax",
      });

      return NextResponse.json({ success: true, user });
    }

    return NextResponse.json(
      { success: false, error: "E-mail ou senha incorretos." },
      { status: 401 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Erro no servidor" },
      { status: 500 }
    );
  }
}
