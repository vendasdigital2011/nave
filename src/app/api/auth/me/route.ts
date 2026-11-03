import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { AUTH_COOKIE_NAME, AuthUser } from "@/lib/auth-constants";
import { createServiceClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(AUTH_COOKIE_NAME);

    if (!sessionCookie || !sessionCookie.value) {
      return NextResponse.json({ success: false, error: "Não autenticado" }, { status: 401 });
    }

    let user: AuthUser;
    try {
      user = JSON.parse(Buffer.from(sessionCookie.value, "base64").toString("utf-8"));
    } catch {
      return NextResponse.json({ success: false, error: "Sessão inválida" }, { status: 401 });
    }

    // Se tiver id, validar se ainda está ativo no banco
    if (user.id) {
      try {
        const supabase = createServiceClient();
        const { data: profile } = await supabase
          .from("profiles")
          .select("id, display_name, role, is_active")
          .eq("id", user.id)
          .maybeSingle();

        if (profile) {
          if (!profile.is_active) {
            cookieStore.delete(AUTH_COOKIE_NAME);
            return NextResponse.json({ success: false, error: "Acesso suspenso" }, { status: 403 });
          }
          user.role = profile.role;
          user.name = profile.display_name;
          user.is_active = profile.is_active;
        }
      } catch (err) {
        // Silencioso em caso de indisponibilidade momentânea
      }
    }

    return NextResponse.json({ success: true, user });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
