import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { AUTH_COOKIE_NAME, AuthUser } from "@/lib/auth-constants";
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

// GET /api/campaigns/[id] - Obter detalhes e etapas da campanha
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    }

    const { id } = await params;
    const supabase = createServiceClient();

    // 1. Buscar campanha
    const { data: campaign, error: campErr } = await supabase
      .from("campaigns")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (campErr || !campaign) {
      // Fallback para Upgrade legado se ainda não estiver no banco
      if (id === "c0000000-0000-0000-0000-000000000001" || id === "legacy") {
        return NextResponse.json({
          success: true,
          campaign: {
            id: "c0000000-0000-0000-0000-000000000001",
            name: "Upgrade 50 → 100 Mega",
            type: "upgrade",
            status: "active",
          },
          stages: [
            { id: "10000000-0000-0000-0000-000000000001", name: "Importados", position: 0, stage_kind: "open", color: "#64748B" },
            { id: "10000000-0000-0000-0000-000000000002", name: "Contato Iniciado", position: 1, stage_kind: "open", color: "#3B82F6" },
            { id: "10000000-0000-0000-0000-000000000003", name: "Em Negociação", position: 2, stage_kind: "open", color: "#F59E0B" },
            { id: "10000000-0000-0000-0000-000000000004", name: "Proposta Enviada", position: 3, stage_kind: "open", color: "#FF6A00" },
            { id: "10000000-0000-0000-0000-000000000005", name: "Vendido", position: 4, stage_kind: "won", color: "#10B981" },
            { id: "10000000-0000-0000-0000-000000000006", name: "Desativado", position: 5, stage_kind: "lost", color: "#EF4444" },
          ],
        });
      }
      return NextResponse.json({ error: "Campanha não encontrada." }, { status: 404 });
    }

    // 2. Buscar etapas da campanha
    const { data: stages, error: stgErr } = await supabase
      .from("campaign_stages")
      .select("*")
      .eq("campaign_id", id)
      .order("position", { ascending: true });

    return NextResponse.json({
      success: true,
      campaign,
      stages: stages || [],
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Erro no servidor." }, { status: 500 });
  }
}

// DELETE /api/campaigns/[id] - Excluir campanha (com proteção contra exclusão de campanhas com leads ou legado)
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthenticatedUser();
    if (!user || (user.role !== "admin" && user.role !== "supervisor")) {
      return NextResponse.json(
        { error: "Apenas administradores e supervisores podem excluir campanhas." },
        { status: 403 }
      );
    }

    const { id } = await params;
    const supabase = createServiceClient();

    // 1. Proteger campanha legado oficial de upgrade
    if (id === "c0000000-0000-0000-0000-000000000001") {
      return NextResponse.json(
        { error: "A campanha oficial de Upgrade não pode ser excluída." },
        { status: 400 }
      );
    }

    // 2. Verificar se existem leads vinculados a esta campanha
    const { count: leadCount } = await supabase
      .from("campaign_leads")
      .select("id", { count: "exact", head: true })
      .eq("campaign_id", id);

    if (leadCount && leadCount > 0) {
      return NextResponse.json(
        {
          error: `Esta campanha possui ${leadCount} leads vinculados e não pode ser excluída diretamente.`,
        },
        { status: 400 }
      );
    }

    // 3. Remover etapas da campanha e a própria campanha
    await supabase.from("campaign_stages").delete().eq("campaign_id", id);
    const { error: delErr } = await supabase.from("campaigns").delete().eq("id", id);

    if (delErr) {
      return NextResponse.json(
        { error: "Erro ao excluir campanha: " + delErr.message },
        { status: 500 }
      );
    }

    // 4. Registrar auditoria
    await supabase.from("audit_logs").insert([
      {
        id: "log_" + Date.now() + "_" + Math.random().toString(36).substring(2, 6),
        operator_email: user.email,
        actor_user_id: user.id,
        action: `Excluiu campanha (ID: ${id})`,
        timestamp: new Date().toISOString(),
      },
    ]);

    return NextResponse.json({ success: true, message: "Campanha excluída com sucesso." });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Erro no servidor." },
      { status: 500 }
    );
  }
}
