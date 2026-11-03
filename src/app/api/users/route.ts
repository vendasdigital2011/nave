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

// GET /api/users - Listar usuários e perfis
export async function GET() {
  try {
    const { user: adminUser, errorResponse } = await getAuthenticatedAdmin();
    if (errorResponse) return errorResponse;

    const supabase = createServiceClient();

    // 1. Buscar lista do auth.users
    const { data: authData, error: authErr } = await supabase.auth.admin.listUsers();
    if (authErr) {
      return NextResponse.json({ error: "Erro ao listar usuários: " + authErr.message }, { status: 500 });
    }

    // 2. Buscar dados da tabela profiles
    const { data: profiles, error: profErr } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: true });

    if (profErr) {
      console.warn("Aviso ao buscar perfis:", profErr.message);
    }

    const profilesMap = new Map((profiles || []).map((p) => [p.id, p]));

    const usersList = (authData.users || []).map((u) => {
      const p = profilesMap.get(u.id);
      return {
        id: u.id,
        email: u.email,
        display_name: p?.display_name || u.user_metadata?.display_name || u.email?.split("@")[0],
        role: p?.role || u.user_metadata?.role || "seller",
        is_active: p ? p.is_active : true,
        created_at: p?.created_at || u.created_at,
        updated_at: p?.updated_at || u.updated_at,
      };
    });

    return NextResponse.json({ success: true, users: usersList });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Erro no servidor." }, { status: 500 });
  }
}

// POST /api/users - Criar novo colaborador
export async function POST(request: Request) {
  try {
    const { user: adminUser, errorResponse } = await getAuthenticatedAdmin();
    if (errorResponse) return errorResponse;

    const body = await request.json();
    const { email, password, display_name, role } = body;

    if (!email || !password || !display_name) {
      return NextResponse.json(
        { error: "E-mail, senha e nome de exibição são obrigatórios." },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "A senha deve conter no mínimo 6 caracteres." },
        { status: 400 }
      );
    }

    const assignedRole = ["admin", "supervisor", "seller"].includes(role) ? role : "seller";
    const cleanEmail = email.trim().toLowerCase();
    const cleanName = display_name.trim();

    const supabase = createServiceClient();

    // Criar usuário no auth.users
    const { data: createdUser, error: createErr } = await supabase.auth.admin.createUser({
      email: cleanEmail,
      password: password,
      email_confirm: true,
      user_metadata: {
        display_name: cleanName,
        role: assignedRole,
      },
    });

    if (createErr || !createdUser.user) {
      return NextResponse.json(
        { error: "Erro ao criar usuário: " + (createErr?.message || "Falha na criação") },
        { status: 400 }
      );
    }

    const userId = createdUser.user.id;

    // Garantir registro em public.profiles
    const { error: profErr } = await supabase.from("profiles").upsert({
      id: userId,
      display_name: cleanName,
      role: assignedRole,
      is_active: true,
    });

    if (profErr) {
      console.warn("Aviso ao criar profile no banco:", profErr.message);
    }

    // Registrar log de auditoria com ator
    await supabase.from("audit_logs").insert([
      {
        id: "log_" + Date.now() + "_" + Math.random().toString(36).substring(2, 6),
        operator_email: adminUser?.email || "admin@navetech.com.br",
        actor_user_id: adminUser?.id,
        action: `Criou novo colaborador: "${cleanName}" (${cleanEmail}) como ${assignedRole}`,
        timestamp: new Date().toISOString(),
      },
    ]);

    return NextResponse.json({
      success: true,
      user: {
        id: userId,
        email: cleanEmail,
        display_name: cleanName,
        role: assignedRole,
        is_active: true,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Erro interno." }, { status: 500 });
  }
}
