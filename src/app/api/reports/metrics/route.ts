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

// GET /api/reports/metrics - Agregação de métricas reais no PostgreSQL
export async function GET(request: Request) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const campaignId = searchParams.get("campaign_id") || "all";
    const sellerId = searchParams.get("seller_id") || (user.role === "seller" ? user.id : "all");
    const period = searchParams.get("period") || "all"; // "7d" | "30d" | "all"

    const supabase = createServiceClient();

    // 1. Calcular datas de corte se houver período
    let periodStartDate: Date | null = null;
    const now = new Date();
    if (period === "7d") {
      periodStartDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else if (period === "30d") {
      periodStartDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    // 2. Buscar campanhas e etapas
    const { data: campaigns } = await supabase.from("campaigns").select("*");
    const { data: stages } = await supabase.from("campaign_stages").select("*").order("position", { ascending: true });

    // Filtrar etapas da campanha selecionada se especificada
    const activeStages = (stages || []).filter((s) =>
      campaignId === "all" ? true : s.campaign_id === campaignId
    );

    // Mapeamento de tipos de etapa
    const stageMap: Record<string, any> = {};
    activeStages.forEach((s) => {
      stageMap[s.id] = s;
    });

    // 3. Buscar leads da campanha
    let leadsQuery = supabase
      .from("campaign_leads")
      .select(`
        id,
        campaign_id,
        client_id,
        stage_id,
        assigned_user_id,
        converted_at,
        lost_at,
        created_at,
        updated_at
      `);

    if (campaignId !== "all") {
      leadsQuery = leadsQuery.eq("campaign_id", campaignId);
    }

    if (sellerId && sellerId !== "all") {
      leadsQuery = leadsQuery.eq("assigned_user_id", sellerId);
    }

    if (periodStartDate) {
      leadsQuery = leadsQuery.gte("created_at", periodStartDate.toISOString());
    }

    const { data: leads, error: leadsErr } = await leadsQuery;
    let leadsList = leads || [];

    // Fallback legado se campaign_leads ainda estiver vazio para Upgrade
    if (leadsList.length === 0 && (campaignId === "all" || campaignId === "c0000000-0000-0000-0000-000000000001")) {
      const { data: clients } = await supabase.from("clients").select("*");
      if (clients && clients.length > 0) {
        leadsList = clients.map((c) => ({
          id: `lead_${c.id}`,
          campaign_id: "c0000000-0000-0000-0000-000000000001",
          client_id: c.id,
          stage_id: c.status === "vendido" ? "10000000-0000-0000-0000-000000000005" : "10000000-0000-0000-0000-000000000001",
          assigned_user_id: null,
          converted_at: c.sold_at,
          lost_at: c.status === "desativado" ? c.updated_at : null,
          created_at: c.created_at,
          updated_at: c.updated_at,
        }));
      }
    }

    const totalLeads = leadsList.length;

    // 4. Calcular Métricas de Funil
    let convertedCount = 0;
    let lostCount = 0;
    let contactedCount = 0;
    let respondedCount = 0;

    const stageCounts: Record<string, number> = {};
    activeStages.forEach((s) => {
      stageCounts[s.id] = 0;
    });

    leadsList.forEach((lead) => {
      const stg = stageMap[lead.stage_id];
      if (stageCounts[lead.stage_id] !== undefined) {
        stageCounts[lead.stage_id]++;
      }

      const stageKind = stg?.stage_kind || "open";
      const stageName = (stg?.name || "").toLowerCase();

      // Conversão: stage_kind = 'won' ou tem converted_at
      if (stageKind === "won" || lead.converted_at || stageName.includes("vendido") || stageName.includes("fechado")) {
        convertedCount++;
      }

      // Perda: stage_kind = 'lost' ou tem lost_at
      if (stageKind === "lost" || lead.lost_at || stageName.includes("desativado") || stageName.includes("não interessado")) {
        lostCount++;
      }

      // Contatado: qualquer etapa além de "importados"
      if (!stageName.includes("importado")) {
        contactedCount++;
      }

      // Respondente: etapa "em conversa", "morno", "interessado", "quente" ou "vendido"
      if (
        stageName.includes("conversa") ||
        stageName.includes("morno") ||
        stageName.includes("interessad") ||
        stageName.includes("quente") ||
        stageKind === "won"
      ) {
        respondedCount++;
      }
    });

    // Taxas calculadas conforme 14_GLOSSARIO_METRICAS_REGRAS.md
    const conversionRate = totalLeads > 0 ? Number(((convertedCount / totalLeads) * 100).toFixed(1)) : 0;
    const contactRate = totalLeads > 0 ? Number(((contactedCount / totalLeads) * 100).toFixed(1)) : 0;
    const responseRate = contactedCount > 0 ? Number(((respondedCount / contactedCount) * 100).toFixed(1)) : 0;
    const lossRate = totalLeads > 0 ? Number(((lostCount / totalLeads) * 100).toFixed(1)) : 0;

    // Array estruturado do funil por etapas
    const funnelStages = activeStages.map((s) => ({
      stage_id: s.id,
      name: s.name,
      stage_kind: s.stage_kind,
      color: s.color || "#FF6A00",
      count: stageCounts[s.id] || 0,
      percentage: totalLeads > 0 ? Number((((stageCounts[s.id] || 0) / totalLeads) * 100).toFixed(1)) : 0,
    }));

    // 5. Desempenho por Vendedor
    const { data: profiles } = await supabase.from("profiles").select("id, display_name, role, is_active");
    const sellersPerformance = (profiles || [])
      .filter((p) => p.is_active !== false)
      .map((seller) => {
        const sellerLeads = leadsList.filter((l) => l.assigned_user_id === seller.id);
        const sTotal = sellerLeads.length;
        const sConverted = sellerLeads.filter((l) => {
          const stg = stageMap[l.stage_id];
          return stg?.stage_kind === "won" || l.converted_at;
        }).length;
        const sContacted = sellerLeads.filter((l) => {
          const sName = (stageMap[l.stage_id]?.name || "").toLowerCase();
          return !sName.includes("importado");
        }).length;

        return {
          id: seller.id,
          name: seller.display_name,
          role: seller.role,
          assigned_leads: sTotal,
          contacted_leads: sContacted,
          converted_leads: sConverted,
          conversion_rate: sTotal > 0 ? Number(((sConverted / sTotal) * 100).toFixed(1)) : 0,
        };
      })
      .sort((a, b) => b.converted_leads - a.converted_leads);

    // 6. Cálculo real do NPS (Net Promoter Score) baseado exclusivamente em clientes respondentes
    const { data: clientsWithNps } = await supabase
      .from("clients")
      .select("nps_score")
      .not("nps_score", "is", null);

    const validNps = (clientsWithNps || [])
      .map((c) => c.nps_score)
      .filter((n): n is number => typeof n === "number" && n >= 0 && n <= 10);

    const totalNpsRespondents = validNps.length;
    let npsScore = 0;
    let promoters = 0;
    let passives = 0;
    let detractors = 0;

    if (totalNpsRespondents > 0) {
      promoters = validNps.filter((n) => n >= 9).length;
      passives = validNps.filter((n) => n === 7 || n === 8).length;
      detractors = validNps.filter((n) => n <= 6).length;

      const promotersPct = (promoters / totalNpsRespondents) * 100;
      const detractorsPct = (detractors / totalNpsRespondents) * 100;
      npsScore = Math.round(promotersPct - detractorsPct);
    }

    // 7. Objeções Mais Frequentes (conversation_notes)
    const { data: objectionNotes } = await supabase
      .from("conversation_notes")
      .select("objection")
      .not("objection", "is", null);

    const objectionCounts: Record<string, number> = {};
    (objectionNotes || []).forEach((n: any) => {
      if (n.objection) {
        objectionCounts[n.objection] = (objectionCounts[n.objection] || 0) + 1;
      }
    });

    const totalObjections = Object.values(objectionCounts).reduce((a, b) => a + b, 0);
    const objectionsBreakdown = Object.entries(objectionCounts)
      .map(([objection, count]) => ({
        objection,
        count,
        percentage: totalObjections > 0 ? Number(((count / totalObjections) * 100).toFixed(1)) : 0,
      }))
      .sort((a, b) => b.count - a.count);

    return NextResponse.json({
      success: true,
      filters: {
        campaign_id: campaignId,
        seller_id: sellerId,
        period,
      },
      kpis: {
        total_leads: totalLeads,
        contacted_leads: contactedCount,
        contact_rate: contactRate,
        responded_leads: respondedCount,
        response_rate: responseRate,
        converted_leads: convertedCount,
        conversion_rate: conversionRate,
        lost_leads: lostCount,
        loss_rate: lossRate,
      },
      funnel: funnelStages,
      sellers: sellersPerformance,
      nps: {
        score: totalNpsRespondents > 0 ? npsScore : null,
        respondents: totalNpsRespondents,
        promoters,
        passives,
        detractors,
        promoters_pct: totalNpsRespondents > 0 ? Number(((promoters / totalNpsRespondents) * 100).toFixed(1)) : 0,
        passives_pct: totalNpsRespondents > 0 ? Number(((passives / totalNpsRespondents) * 100).toFixed(1)) : 0,
        detractors_pct: totalNpsRespondents > 0 ? Number(((detractors / totalNpsRespondents) * 100).toFixed(1)) : 0,
      },
      objections: objectionsBreakdown,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Erro ao gerar métricas." },
      { status: 500 }
    );
  }
}
