import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { AUTH_COOKIE_NAME, AuthUser } from "@/lib/auth-constants";
import { createServiceClient } from "@/lib/supabase/server";
import { EvolutionService } from "@/lib/evolution-api";

async function getAuthenticatedUser(): Promise<AuthUser | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(AUTH_COOKIE_NAME);
  if (!sessionCookie || !sessionCookie.value) return null;
  try {
    return JSON.parse(Buffer.from(sessionCookie.value, "base64").toString("utf-8"));
  } catch {
    return null;
  }
}

// GET /api/evolution/instance/my - Retorna a instância WhatsApp do usuário logado
export async function GET() {
  try {
    const user = await getAuthenticatedUser();
    if (!user || !user.id) {
      return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    }

    const supabase = createServiceClient();

    // 1. Buscar instância associada diretamente ao usuário
    const { data: userInstance } = await supabase
      .from("whatsapp_instances")
      .select("*")
      .eq("owner_user_id", user.id)
      .eq("is_active", true)
      .maybeSingle();

    if (userInstance) {
      // Verificar estado ao vivo
      const liveState = await EvolutionService.getConnectionState(userInstance.provider_instance_name);
      return NextResponse.json({
        success: true,
        instance: {
          ...userInstance,
          status: liveState.state || userInstance.status,
          live: liveState.instance || null,
        },
        is_personal: true,
      });
    }

    // 2. Se não tem instância individual, busca a instância padrão da empresa (nave)
    const { data: defaultInstance } = await supabase
      .from("whatsapp_instances")
      .select("*")
      .eq("is_default", true)
      .eq("is_active", true)
      .maybeSingle();

    if (defaultInstance) {
      const liveState = await EvolutionService.getConnectionState(defaultInstance.provider_instance_name);
      return NextResponse.json({
        success: true,
        instance: {
          ...defaultInstance,
          status: liveState.state || defaultInstance.status,
          live: liveState.instance || null,
        },
        is_personal: false,
      });
    }

    // Fallback: instância padrão virtual 'nave'
    return NextResponse.json({
      success: true,
      instance: {
        id: "virtual-nave",
        provider: "evolution",
        provider_instance_name: "nave",
        display_phone_masked: "+55 77 9****-0295",
        profile_name: "Robson Oliveira Macedo - Navetech",
        status: "open",
        is_default: true,
      },
      is_personal: false,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Erro ao consultar instância do usuário." },
      { status: 500 }
    );
  }
}

// POST /api/evolution/instance/my - Provisionar/vincular uma instância individual para o usuário
export async function POST(request: Request) {
  try {
    const user = await getAuthenticatedUser();
    if (!user || !user.id) {
      return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    }

    const supabase = createServiceClient();

    // 1. Verificar se o usuário já tem uma instância ativa
    const { data: existing } = await supabase
      .from("whatsapp_instances")
      .select("*")
      .eq("owner_user_id", user.id)
      .eq("is_active", true)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({
        success: true,
        instance: existing,
        message: "Usuário já possui instância configurada.",
      });
    }

    // 2. Criar nome seguro para a instância (ex: nave_usr_a1b2c3d4)
    const cleanId = user.id.replace(/[^a-zA-Z0-9]/g, "").slice(0, 8);
    const instanceName = `nave_usr_${cleanId}`;

    // 3. Criar na Evolution API de forma idempotente
    const createRes = await EvolutionService.createInstance(instanceName);
    if (!createRes.success && createRes.error && !createRes.error.includes("already in use")) {
      return NextResponse.json(
        { error: `Falha ao criar na Evolution API: ${createRes.error}` },
        { status: 500 }
      );
    }

    // 4. Salvar na tabela whatsapp_instances
    const { data: newDbInstance, error: insErr } = await supabase
      .from("whatsapp_instances")
      .upsert(
        {
          provider: "evolution",
          provider_instance_name: instanceName,
          owner_user_id: user.id,
          profile_name: user.name || "Vendedor Navetech",
          status: "close",
          is_active: true,
          is_default: false,
        },
        { onConflict: "provider_instance_name" }
      )
      .select("*")
      .single();

    if (insErr) {
      return NextResponse.json({ error: insErr.message }, { status: 500 });
    }

    // 5. Registrar auditoria
    try {
      await supabase.from("audit_logs").insert({
        actor_user_id: user.id,
        action: "whatsapp_instance.created",
        target_entity: "whatsapp_instances",
        target_id: newDbInstance.id,
        details: { instance_name: instanceName },
      });
    } catch {
      // Ignora erro se audit_logs não existir
    }

    return NextResponse.json({
      success: true,
      instance: newDbInstance,
      message: "Instância de WhatsApp criada com sucesso! Conecte via QR Code.",
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Erro ao provisionar instância." },
      { status: 500 }
    );
  }
}
