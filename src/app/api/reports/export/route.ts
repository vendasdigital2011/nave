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

// GET /api/reports/export - Exportação de relatório em CSV compatível com Excel
export async function GET(request: Request) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "leads"; // "leads" | "funnel" | "sellers"
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

    let csvRows: string[] = [];
    const UTF8_BOM = "\uFEFF";

    // Cabeçalho institucional do relatório
    csvRows.push(escapeCsvField("NaveProspect - Relatório Operacional e Comercial"));
    csvRows.push(escapeCsvField(`Data de Emissão: ${emissionDate} (Horário da Bahia)`));
    csvRows.push(escapeCsvField(`Operador Solicitante: ${user.name} (${user.email} - ${user.role})`));
    csvRows.push(escapeCsvField(`Filtros: Campanha=${campaignId} | Período=${period}`));
    csvRows.push(""); // Linha em branco

    let rowCount = 0;

    if (type === "leads") {
      // Exportação da lista de leads
      csvRows.push([
        "ID",
        "Nome do Cliente",
        "Telefone",
        "Plano Atual",
        "Plano Alvo",
        "Condomínio",
        "Campanha",
        "Etapa do Funil",
        "Responsável",
        "Data de Cadastro",
        "Convertido Em",
      ].map(escapeCsvField).join(";"));

      let leadsQuery = supabase
        .from("campaign_leads")
        .select(`
          id,
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

      // Fallback para tabela clients se Upgrade ainda estiver com registros legados
      if (leadsToExport.length === 0) {
        const { data: clients } = await supabase.from("clients").select("*").order("name", { ascending: true });
        leadsToExport = (clients || []).map((c) => ({
          id: c.id,
          created_at: c.created_at,
          converted_at: c.sold_at,
          client: c,
          stage: { name: c.status },
          campaign: { name: "Upgrade 100M" },
          assigned_user: null,
        }));
      }

      rowCount = leadsToExport.length;
      leadsToExport.forEach((l: any) => {
        csvRows.push([
          l.id,
          l.client?.name || "Sem nome",
          l.client?.phone || "",
          l.client?.current_plan || "",
          l.client?.target_plan || "",
          l.client?.condominium || "Geral",
          l.campaign?.name || "Upgrade 100M",
          l.stage?.name || "Importados",
          l.assigned_user?.display_name || "Fila Geral",
          l.created_at ? new Date(l.created_at).toLocaleDateString("pt-BR") : "",
          l.converted_at ? new Date(l.converted_at).toLocaleDateString("pt-BR") : "",
        ].map(escapeCsvField).join(";"));
      });
    } else if (type === "funnel") {
      // Exportação do Funil de Etapas
      csvRows.push([
        "ID da Etapa",
        "Campanha",
        "Nome da Etapa",
        "Classificação",
        "Total de Leads",
      ].map(escapeCsvField).join(";"));

      const { data: stages } = await supabase
        .from("campaign_stages")
        .select("id, name, stage_kind, campaign:campaigns(name)")
        .order("position", { ascending: true });

      const { data: leads } = await supabase.from("campaign_leads").select("stage_id");
      const stageCountMap: Record<string, number> = {};
      (leads || []).forEach((l) => {
        stageCountMap[l.stage_id] = (stageCountMap[l.stage_id] || 0) + 1;
      });

      rowCount = (stages || []).length;
      (stages || []).forEach((s: any) => {
        csvRows.push([
          s.id,
          s.campaign?.name || "Upgrade 100M",
          s.name,
          s.stage_kind,
          stageCountMap[s.id] || 0,
        ].map(escapeCsvField).join(";"));
      });
    }

    // Registrar auditoria da exportação
    try {
      await supabase.from("audit_logs").insert({
        actor_user_id: user.id || null,
        action: "report.exported",
        target_entity: "reports",
        details: {
          report_type: type,
          campaign_id: campaignId,
          period,
          total_rows: rowCount,
        },
      });
    } catch {
      // Ignora erro de auditoria
    }

    const fullCsv = UTF8_BOM + csvRows.join("\r\n");
    const filename = `naveprospect_${type}_${new Date().toISOString().slice(0, 10)}.csv`;

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
