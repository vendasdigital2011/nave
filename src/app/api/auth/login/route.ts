import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { AUTH_COOKIE_NAME, AuthUser } from "@/lib/auth-constants";
import { createServiceClient } from "@/lib/supabase/server";

const DEFAULT_ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@navetech.com.br";
const DEFAULT_ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123456";

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: "E-mail e senha são obrigatórios." },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();
    const validAdminEmail = (process.env.ADMIN_EMAIL || DEFAULT_ADMIN_EMAIL).toLowerCase();
    const validAdminPassword = process.env.ADMIN_PASSWORD || DEFAULT_ADMIN_PASSWORD;

    const supabase = createServiceClient();

    // 1. Tentar login direto via Supabase Auth
    let authUser: any = null;
    let authError: string | null = null;

    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password: cleanPassword,
    });

    if (!signInError && signInData?.user) {
      authUser = signInData.user;
    } else {
      authError = signInError?.message || null;
    }

    // 2. Fallback de Compatibilidade Administrativa:
    // Se for a credencial do administrador oficial do sistema e o usuário ainda não existir no Auth
    if (!authUser && cleanEmail === validAdminEmail && cleanPassword === validAdminPassword) {
      try {
        // Verificar se usuário já existe em auth.users
        const { data: userList } = await supabase.auth.admin.listUsers();
        const existingAdmin = userList?.users?.find(
          (u) => u.email?.toLowerCase() === validAdminEmail
        );

        if (existingAdmin) {
          // Atualizar senha se divergente
          const { data: updatedAdmin, error: updateErr } = await supabase.auth.admin.updateUserById(
            existingAdmin.id,
            { password: validAdminPassword }
          );
          if (!updateErr && updatedAdmin?.user) {
            authUser = updatedAdmin.user;
          } else {
            authUser = existingAdmin;
          }
        } else {
          // Criar admin no auth.users
          const { data: newAdmin, error: createErr } = await supabase.auth.admin.createUser({
            email: validAdminEmail,
            password: validAdminPassword,
            email_confirm: true,
            user_metadata: { display_name: "Administrador Geral", role: "admin" },
          });

          if (!createErr && newAdmin?.user) {
            authUser = newAdmin.user;
          }
        }
      } catch (err: any) {
        console.error("Erro no auto-provisioning do admin:", err.message);
      }
    }

    // Se nem Supabase Auth nem fallback validaram
    if (!authUser) {
      // Se era credencial admin legada sem Supabase Auth conectado
      if (cleanEmail === validAdminEmail && cleanPassword === validAdminPassword) {
        const legacyUser: AuthUser = {
          email: cleanEmail,
          name: "Administrador Geral",
          role: "admin",
          is_active: true,
        };
        const sessionValue = Buffer.from(JSON.stringify(legacyUser)).toString("base64");
        const cookieStore = await cookies();
        cookieStore.set(AUTH_COOKIE_NAME, sessionValue, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          maxAge: 60 * 60 * 24 * 7,
          path: "/",
          sameSite: "lax",
        });
        return NextResponse.json({ success: true, user: legacyUser });
      }

      return NextResponse.json(
        { success: false, error: authError || "E-mail ou senha incorretos." },
        { status: 401 }
      );
    }

    // 3. Obter ou sincronizar o Profile do Usuário
    let role: 'admin' | 'supervisor' | 'seller' = 'seller';
    let displayName = authUser.user_metadata?.display_name || cleanEmail.split("@")[0];
    let isActive = true;

    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", authUser.id)
        .maybeSingle();

      if (profile) {
        role = profile.role;
        displayName = profile.display_name || displayName;
        isActive = profile.is_active;

        if (!isActive) {
          return NextResponse.json(
            { success: false, error: "Acesso suspenso. Contate o administrador do sistema." },
            { status: 403 }
          );
        }
      } else {
        // Criar profile se ainda não existir
        if (cleanEmail === validAdminEmail) {
          role = "admin";
        }
        await supabase.from("profiles").upsert({
          id: authUser.id,
          display_name: displayName,
          role: role,
          is_active: true,
        });
      }
    } catch (profileErr: any) {
      console.warn("Aviso ao ler tabela profiles:", profileErr.message);
      if (cleanEmail === validAdminEmail) role = "admin";
    }

    // 4. Montar Sessão Individual e Gravar Cookie
    const userSession: AuthUser = {
      id: authUser.id,
      email: cleanEmail,
      name: displayName,
      role: role,
      is_active: isActive,
    };

    const sessionValue = Buffer.from(JSON.stringify(userSession)).toString("base64");
    const cookieStore = await cookies();
    cookieStore.set(AUTH_COOKIE_NAME, sessionValue, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
      sameSite: "lax",
    });

    // 5. Registrar evento de auditoria com ID do ator
    try {
      await supabase.from("audit_logs").insert([
        {
          id: "log_" + Date.now() + "_" + Math.random().toString(36).substring(2, 6),
          operator_email: cleanEmail,
          actor_user_id: authUser.id,
          action: "Login efetuado no sistema",
          details: JSON.stringify({ role, ip_check: "OK" }),
          timestamp: new Date().toISOString(),
        },
      ]);
    } catch (auditErr: any) {
      console.warn("Aviso ao salvar log de login:", auditErr.message);
    }

    return NextResponse.json({ success: true, user: userSession });
  } catch (err: any) {
    console.error("Erro inesperado no login:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Erro interno no servidor." },
      { status: 500 }
    );
  }
}
