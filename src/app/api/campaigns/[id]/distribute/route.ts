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

// POST /api/campaigns/[id]/distribute - Distribuição automática (Round-Robin ou Balanceada)
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    }

    if (user.role !== "admin" && user.role !== "supervisor") {
      return NextResponse.json(
        { error: "Apenas administradores e supervisores podem distribuir leads." },
        { status: 403 }
      );
    }

    const { id: campaignId } = await params;
    const body = await request.json().catch(() => ({}));
    const {
      method = "round_robin", // "round_robin" | "balanced"
      user_ids, // array de UUIDs específicos ou vazio para todos os vendedores ativos da campanha
      limit = 100,
      stage_id,
      include_already_assigned = false,
    } = body;

    const supabase = createServiceClient();

    // 1. Obter vendedores ativos
    // Primeiro tenta membros da campanha em campaign_members
    const { data: members } = await supabase
      .from("campaign_members")
      .select("user_id")
      .eq("campaign_id", campaignId);

    const memberIds = (members || []).map((m: any) => m.user_id);

    // Buscar perfis ativos dos membros (ou de todos os vendedores se não houver membros explícitos)
    let profileQuery = supabase
      .from("profiles")
      .select("id, display_name, role, is_active")
      .eq("is_active", true);

    if (user_ids && Array.isArray(user_ids) && user_ids.length > 0) {
      profileQuery = profileQuery.in("id", user_ids);
    } else if (memberIds.length > 0) {
      profileQuery = profileQuery.in("id", memberIds);
    }

    const { data: activeProfiles, error: profileErr } = await profileQuery;
    let targetProfiles = activeProfiles && activeProfiles.length > 0 ? [...activeProfiles] : [];

    if (profileErr || targetProfiles.length === 0) {
      // Fallback: se não há vendedores ativos filtrados, busca qualquer perfil ativo do sistema
      const { data: anyProfiles } = await supabase
        .from("profiles")
        .select("id, display_name, role, is_active")
        .eq("is_active", true);

      if (!anyProfiles || anyProfiles.length === 0) {
        return NextResponse.json(
          { error: "Nenhum usuário ativo disponível para receber leads." },
          { status: 400 }
        );
      }
      targetProfiles = anyProfiles;
    }

    const eligibleUsers = targetProfiles.map((p) => ({
      id: p.id,
      name: p.display_name,
      activeLeads: 0,
    }));

    // 2. Se for balanceado, conta leads abertos de cada vendedor na campanha
    if (method === "balanced") {
      for (const u of eligibleUsers) {
        const { count } = await supabase
          .from("campaign_leads")
          .select("id", { count: "exact", head: true })
          .eq("campaign_id", campaignId)
          .eq("assigned_user_id", u.id);
        u.activeLeads = count || 0;
      }
    }

    // 3. Buscar leads elegíveis para distribuição
    let leadsQuery = supabase
      .from("campaign_leads")
      .select("id, assigned_user_id, version")
      .eq("campaign_id", campaignId);

    if (!include_already_assigned) {
      leadsQuery = leadsQuery.is("assigned_user_id", null);
    }

    if (stage_id) {
      leadsQuery = leadsQuery.eq("stage_id", stage_id);
    }

    leadsQuery = leadsQuery.limit(limit);

    const { data: candidateLeads, error: leadsErr } = await leadsQuery;

    if (leadsErr || !candidateLeads || candidateLeads.length === 0) {
      return NextResponse.json({
        success: true,
        distributed_count: 0,
        message: "Nenhum lead pendente de distribuição para os critérios informados.",
      });
    }

    // 4. Executar distribuição
    let distributedCount = 0;
    const distributionSummary: Record<string, number> = {};
    eligibleUsers.forEach((u) => {
      distributionSummary[u.name] = 0;
    });

    const transferInserts: any[] = [];

    for (let i = 0; i < candidateLeads.length; i++) {
      const lead = candidateLeads[i];
      let selectedUser: typeof eligibleUsers[0];

      if (method === "balanced") {
        // Seleciona o usuário com o menor número de leads ativos
        eligibleUsers.sort((a, b) => a.activeLeads - b.activeLeads);
        selectedUser = eligibleUsers[0];
        selectedUser.activeLeads += 1;
      } else {
        // Round-robin simples
        selectedUser = eligibleUsers[i % eligibleUsers.length];
      }

      const nextVersion = (lead.version || 1) + 1;

      const { error: updErr } = await supabase
        .from("campaign_leads")
        .update({
          assigned_user_id: selectedUser.id,
          version: nextVersion,
          last_activity_at: new Date().toISOString(),
        })
        .eq("id", lead.id);

      if (!updErr) {
        distributedCount++;
        distributionSummary[selectedUser.name] = (distributionSummary[selectedUser.name] || 0) + 1;

        transferInserts.push({
          campaign_lead_id: lead.id,
          from_user_id: lead.assigned_user_id,
          to_user_id: selectedUser.id,
          transferred_by: user.id,
          reason: `Distribuição automática (${method})`,
        });
      }
    }

    // Inserir histórico de transferências em lote
    if (transferInserts.length > 0) {
      try {
        await supabase.from("lead_transfers").insert(transferInserts);
      } catch (errLog) {
        console.warn("Aviso ao registrar transferências em lote:", errLog);
      }
    }

    // Auditoria
    try {
      await supabase.from("audit_logs").insert({
        actor_user_id: user.id,
        action: "leads.batch_distributed",
        target_entity: "campaign_leads",
        details: {
          campaign_id: campaignId,
          method,
          total_distributed: distributedCount,
          summary: distributionSummary,
        },
      });
    } catch {
      // Ignora erro se audit_logs não existir
    }

    return NextResponse.json({
      success: true,
      distributed_count: distributedCount,
      summary: distributionSummary,
      message: `${distributedCount} leads distribuídos com sucesso via ${method === "balanced" ? "Balanceamento de Carga" : "Round-Robin"}.`,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Erro na distribuição de leads." },
      { status: 500 }
    );
  }
}
