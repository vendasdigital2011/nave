import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { AUTH_COOKIE_NAME, AuthUser } from "@/lib/auth-constants";
import { createServiceClient } from "@/lib/supabase/server";

async function getAuthenticatedAdmin(): Promise<{ user: AuthUser | null; errorResponse?: NextResponse }> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(AUTH_COOKIE_NAME);

  if (!sessionCookie || !sessionCookie.value) {
    return { user: null, errorResponse: NextResponse.json({ error: "Não autenticado." }, { status: 401 }) };
  }

  let user: AuthUser;
  try {
    user = JSON.parse(Buffer.from(sessionCookie.value, "base64").toString("utf-8"));
  } catch {
    return { user: null, errorResponse: NextResponse.json({ error: "Sessão inválida." }, { status: 401 }) };
  }

  if (user.role !== "admin") {
    return {
      user: null,
      errorResponse: NextResponse.json({ error: "Acesso restrito a administradores." }, { status: 403 }),
    };
  }

  return { user };
}

// PATCH /api/users/[id] - Atualizar colaborador (papel, status ativo/suspenso, nome)
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user: adminUser, errorResponse } = await getAuthenticatedAdmin();
    if (errorResponse) return errorResponse;

    const { id } = await params;
    const body = await request.json();
    const { display_name, role, is_active } = body;

    // Trava de segurança: admin não pode suspender a si próprio nem revogar o próprio papel de admin
    if (adminUser?.id === id) {
      if (is_active === false) {
        return NextResponse.json(
          { error: "Ação bloqueada: você não pode suspender sua própria conta de administrador." },
          { status: 400 }
        );
      }
      if (role && role !== "admin") {
        return NextResponse.json(
          { error: "Ação bloqueada: você não pode alterar seu próprio papel de administrador." },
          { status: 400 }
        );
      }
    }

    const supabase = createServiceClient();

    const updates: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (display_name !== undefined) updates.display_name = display_name.trim();
    if (role !== undefined && ["admin", "supervisor", "seller"].includes(role)) updates.role = role;
    if (is_active !== undefined) updates.is_active = Boolean(is_active);

    const { data: updatedProfile, error: updateErr } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", id)
      .select()
      .maybeSingle();

    if (updateErr) {
      return NextResponse.json(
        { error: "Erro ao atualizar perfil: " + updateErr.message },
        { status: 500 }
      );
    }

    // Se houve alteração de role ou display_name, sincronizar metadados do auth.users
    if (display_name !== undefined || role !== undefined) {
      await supabase.auth.admin.updateUserById(id, {
        user_metadata: {
          ...(display_name ? { display_name } : {}),
          ...(role ? { role } : {}),
        },
      });
    }

    // Registrar evento de auditoria
    await supabase.from("audit_logs").insert([
      {
        id: "log_" + Date.now() + "_" + Math.random().toString(36).substring(2, 6),
        operator_email: adminUser?.email || "admin@navetech.com.br",
        actor_user_id: adminUser?.id,
        action: `Atualizou colaborador ID ${id}: ${JSON.stringify(updates)}`,
        timestamp: new Date().toISOString(),
      },
    ]);

    return NextResponse.json({ success: true, profile: updatedProfile });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Erro interno." }, { status: 500 });
  }
}
