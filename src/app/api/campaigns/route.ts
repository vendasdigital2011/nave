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

// GET /api/campaigns - Listar todas as campanhas
export async function GET() {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    }

    const supabase = createServiceClient();

    // 1. Buscar campanhas
    const { data: campaigns, error: campErr } = await supabase
      .from("campaigns")
      .select("*")
      .order("created_at", { ascending: true });

    if (campErr) {
      // Se a tabela ainda não foi criada no banco, retornar campanhas padrão virtuais
      console.warn("Tabela campaigns não encontrada, retornando fallback virtual:", campErr.message);
      return NextResponse.json({
        success: true,
        campaigns: [
          {
            id: "c0000000-0000-0000-0000-000000000001",
            name: "Upgrade 50 → 100 Mega",
            type: "upgrade",
            description: "Campanha oficial de migração de clientes para 100 Mega.",
            status: "active",
            leads_count: 125,
          },
          {
            id: "c0000000-0000-0000-0000-000000000002",
            name: "Leads Hotspot",
            type: "hotspot",
            description: "Prospecção de novos clientes do Hotspot Wi-Fi Navetech.",
            status: "active",
            leads_count: 0,
          },
        ],
      });
    }

    // 2. Buscar contagem de leads por campanha
    const { data: leadCounts } = await supabase
      .from("campaign_leads")
      .select("campaign_id");

    const countsMap = new Map<string, number>();
    if (leadCounts) {
      leadCounts.forEach((l) => {
        countsMap.set(l.campaign_id, (countsMap.get(l.campaign_id) || 0) + 1);
      });
    }

    const enrichedCampaigns = (campaigns || []).map((c) => ({
      ...c,
      leads_count: countsMap.get(c.id) || 0,
    }));

    return NextResponse.json({ success: true, campaigns: enrichedCampaigns });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Erro no servidor." }, { status: 500 });
  }
}

// POST /api/campaigns - Criar nova campanha
export async function POST(request: Request) {
  try {
    const user = await getAuthenticatedUser();
    if (!user || (user.role !== "admin" && user.role !== "supervisor")) {
      return NextResponse.json({ error: "Apenas administradores e supervisores podem criar campanhas." }, { status: 403 });
    }

    const body = await request.json();
    const { name, type, description, stages } = body;

    if (!name) {
      return NextResponse.json({ error: "O nome da campanha é obrigatório." }, { status: 400 });
    }

    const supabase = createServiceClient();

    // Inserir campanha
    const { data: campaign, error: campErr } = await supabase
      .from("campaigns")
      .insert([
        {
          name: name.trim(),
          type: type || "custom",
          description: description?.trim() || null,
          created_by: user.id || null,
          status: "active",
        },
      ])
      .select()
      .single();

    if (campErr || !campaign) {
      return NextResponse.json({ error: "Erro ao criar campanha: " + campErr?.message }, { status: 500 });
    }

    // Etapas padrão ou customizadas
    const defaultStages = [
      { name: "Novos Leads", position: 0, stage_kind: "open", color: "#64748B" },
      { name: "Em Contato", position: 1, stage_kind: "open", color: "#3B82F6" },
      { name: "Interessados", position: 2, stage_kind: "open", color: "#F59E0B" },
      { name: "Agendados", position: 3, stage_kind: "open", color: "#8B5CF6" },
      { name: "Convertidos", position: 4, stage_kind: "won", color: "#10B981" },
      { name: "Perdidos", position: 5, stage_kind: "lost", color: "#EF4444" },
    ];

    const stagesToInsert = (stages && stages.length > 0 ? stages : defaultStages).map(
      (s: any, idx: number) => ({
        campaign_id: campaign.id,
        name: s.name,
        position: s.position !== undefined ? s.position : idx,
        stage_kind: s.stage_kind || "open",
        color: s.color || "#FF6A00",
        is_active: true,
      })
    );

    await supabase.from("campaign_stages").insert(stagesToInsert);

    // Auditoria
    await supabase.from("audit_logs").insert([
      {
        id: "log_" + Date.now() + "_" + Math.random().toString(36).substring(2, 6),
        operator_email: user.email,
        actor_user_id: user.id,
        action: `Criou nova campanha: "${campaign.name}" (${campaign.type})`,
        timestamp: new Date().toISOString(),
      },
    ]);

    return NextResponse.json({ success: true, campaign });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Erro interno." }, { status: 500 });
  }
}
