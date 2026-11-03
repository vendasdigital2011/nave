import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { AUTH_COOKIE_NAME, AuthUser } from "@/lib/auth-constants";
import { EvolutionService } from "@/lib/evolution-api";
import { createServiceClient } from "@/lib/supabase/server";

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

// POST /api/evolution/instance/disconnect - Desconectar instância com proteção
export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { instanceName } = body;

    if (!instanceName) {
      return NextResponse.json({ error: "instanceName é obrigatório." }, { status: 400 });
    }

    // REGRA DE SEGURANÇA MÁXIMA: NUNCA permitir desconectar a instância legada principal 'nave'
    if (instanceName === "nave") {
      return NextResponse.json(
        { error: "A instância corporativa principal 'nave' é protegida e não pode ser desconectada pelo painel." },
        { status: 403 }
      );
    }

    const supabase = createServiceClient();

    // Validar propriedade
    const { data: dbInst } = await supabase
      .from("whatsapp_instances")
      .select("*")
      .eq("provider_instance_name", instanceName)
      .maybeSingle();

    if (!dbInst) {
      return NextResponse.json({ error: "Instância não encontrada." }, { status: 404 });
    }

    if (user.role === "seller" && dbInst.owner_user_id !== user.id) {
      return NextResponse.json(
        { error: "Você só pode desconectar sua própria instância de WhatsApp." },
        { status: 403 }
      );
    }

    // Executar logout na Evolution API
    const res = await EvolutionService.logoutInstance(instanceName);

    // Atualizar status no banco
    await supabase
      .from("whatsapp_instances")
      .update({
        status: "close",
        last_seen_at: new Date().toISOString(),
      })
      .eq("id", dbInst.id);

    // Log de auditoria
    try {
      await supabase.from("audit_logs").insert({
        actor_user_id: user.id,
        action: "whatsapp_instance.disconnected",
        target_entity: "whatsapp_instances",
        target_id: dbInst.id,
        details: { instance_name: instanceName },
      });
    } catch {
      // Ignora erro de auditoria
    }

    return NextResponse.json({
      success: true,
      message: `Instância ${instanceName} desconectada com sucesso.`,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Erro ao desconectar instância" },
      { status: 500 }
    );
  }
}
