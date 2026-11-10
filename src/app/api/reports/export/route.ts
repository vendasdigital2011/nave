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

function escapeCsvField(val: any): string {
  if (val === null || val === undefined) return '""';
  const str = String(val).replace(/"/g, '""');
  return `"${str}"`;
}

// GET /api/reports/export - Exportação de relatório em CSV compatível com Excel por Campanha
export async function GET(request: Request) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "leads"; // "leads" | "funnel"
    const campaignId = searchParams.get("campaign_id") || "all";
    const period = searchParams.get("period") || "all";

    const supabase = createServiceClient();

    const emissionDate = new Date().toLocaleString("pt-BR", {
      timeZone: "America/Bahia",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    // 1. Obter detalhes da campanha selecionada
    let campaignInfo: any = null;
    if (campaignId !== "all") {
      const { data: camp } = await supabase
        .from("campaigns")
        .select("id, name, type, created_at")
        .eq("id", campaignId)
        .maybeSingle();
      campaignInfo = camp;
    }

    const campaignTitle = campaignInfo ? campaignInfo.name : "Todas as Campanhas";
    const campaignType = campaignInfo ? campaignInfo.type : "Geral";

    let csvRows: string[] = [];
    const UTF8_BOM = "\uFEFF";

    // Cabeçalho institucional do relatório
    csvRows.push(escapeCsvField("NAVETECH TELECOM - RELATÓRIO DE CAMPANHA"));
    csvRows.push(escapeCsvField(`Campanha: ${campaignTitle}`));
    csvRows.push(escapeCsvField(`Tipo de Campanha: ${campaignType}`));
    csvRows.push(escapeCsvField(`Data de Emissão: ${emissionDate} (Horário da Bahia)`));
    csvRows.push(escapeCsvField(`Operador Solicitante: ${user.name} (${user.email} - ${user.role})`));
    csvRows.push(escapeCsvField(`Filtro de Período: ${period === "all" ? "Histórico Completo" : period === "30d" ? "Últimos 30 Dias" : "Últimos 7 Dias"}`));
    csvRows.push(""); // Linha em branco

    let rowCount = 0;

    if (type === "leads") {
      // Exportação da lista de leads da campanha
      csvRows.push([
        "ID do Lead",
        "Campanha",
        "Nome do Cliente",
        "Telefone",
        "Condomínio",
        "Plano Atual",
        "Plano Alvo",
        "Etapa no Funil",
        "Vendedor Responsável",
        "Data de Cadastro",
        "Data de Conversão",
        "Observações",
      ].map(escapeCsvField).join(";"));

      let leadsQuery = supabase
        .from("campaign_leads")
        .select(`
          id,
          notes,
          created_at,
          converted_at,
          client:clients(*),
          stage:campaign_stages(name),
          campaign:campaigns(name),
          assigned_user:profiles!campaign_leads_assigned_user_id_fkey(display_name)
        `)
        .order("created_at", { ascending: false });

      if (campaignId !== "all") {
        leadsQuery = leadsQuery.eq("campaign_id", campaignId);
      }

      const { data: leads } = await leadsQuery;
      let leadsToExport: any[] = leads || [];

      // Fallback estrito apenas se selecionado "all" ou a campanha legado Upgrade
      if (leadsToExport.length === 0 && (campaignId === "all" || campaignId === "c0000000-0000-0000-0000-000000000001")) {
        const { data: clients } = await supabase.from("clients").select("*").order("name", { ascending: true });
        leadsToExport = (clients || []).map((c) => ({
          id: c.id,
          notes: c.notes,
          created_at: c.created_at,
          converted_at: c.sold_at,
          client: c,
          stage: { name: c.status },
          campaign: { name: "Upgrade 50 → 100 Mega" },
          assigned_user: null,
        }));
      }

      rowCount = leadsToExport.length;
      leadsToExport.forEach((l: any) => {
        csvRows.push([
          l.id,
          l.campaign?.name || campaignTitle,
          l.client?.name || "Sem nome",
          l.client?.phone || "",
          l.client?.condominium || "Geral",
          l.client?.current_plan || "",
          l.client?.target_plan || "",
          l.stage?.name || "Importados",
          l.assigned_user?.display_name || "Fila Geral",
          l.created_at ? new Date(l.created_at).toLocaleDateString("pt-BR") : "",
          l.converted_at ? new Date(l.converted_at).toLocaleDateString("pt-BR") : "",
          l.notes || "",
        ].map(escapeCsvField).join(";"));
      });
    } else if (type === "funnel") {
      // Exportação do Funil de Etapas por Campanha
      csvRows.push([
        "Posição",
        "Campanha",
        "Nome da Etapa",
        "Classificação",
        "Total de Leads",
      ].map(escapeCsvField).join(";"));

      let stagesQuery = supabase
        .from("campaign_stages")
        .select("id, name, stage_kind, position, campaign:campaigns(name)")
        .order("position", { ascending: true });

      if (campaignId !== "all") {
        stagesQuery = stagesQuery.eq("campaign_id", campaignId);
      }

      const { data: stages } = await stagesQuery;

      let leadCountsQuery = supabase.from("campaign_leads").select("stage_id");
      if (campaignId !== "all") {
        leadCountsQuery = leadCountsQuery.eq("campaign_id", campaignId);
      }
      const { data: leads } = await leadCountsQuery;

      const stageCountMap: Record<string, number> = {};
      (leads || []).forEach((l) => {
        stageCountMap[l.stage_id] = (stageCountMap[l.stage_id] || 0) + 1;
      });

      rowCount = (stages || []).length;
      (stages || []).forEach((s: any, idx: number) => {
        csvRows.push([
          s.position ?? idx + 1,
          s.campaign?.name || campaignTitle,
          s.name,
          s.stage_kind,
          stageCountMap[s.id] || 0,
        ].map(escapeCsvField).join(";"));
      });
    }

    // Registrar auditoria da exportação
    try {
      await supabase.from("audit_logs").insert({
        id: "log_" + Date.now() + "_" + Math.random().toString(36).substring(2, 6),
        actor_user_id: user.id || null,
        action: `report.exported.${type}`,
        target_entity: "reports",
        details: {
          report_type: type,
          campaign_id: campaignId,
          campaign_name: campaignTitle,
          period,
          total_rows: rowCount,
        },
      });
    } catch {
      // Ignora erro de auditoria
    }

    const fullCsv = UTF8_BOM + csvRows.join("\r\n");
    const safeCampName = campaignTitle.toLowerCase().replace(/[^a-z0-9]/g, "_").slice(0, 30);
    const filename = `relatorio_${safeCampName}_${type}_${new Date().toISOString().slice(0, 10)}.csv`;

    return new Response(fullCsv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Erro ao exportar relatório." },
      { status: 500 }
    );
  }
}
