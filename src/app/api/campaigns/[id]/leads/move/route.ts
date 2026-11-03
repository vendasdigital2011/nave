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

const REVERSE_STAGE_MAP: Record<string, string> = {
  "10000000-0000-0000-0000-000000000001": "importados",
  "10000000-0000-0000-0000-000000000002": "frio",
  "10000000-0000-0000-0000-000000000003": "morno",
  "10000000-0000-0000-0000-000000000004": "quente",
  "10000000-0000-0000-0000-000000000005": "vendido",
  "10000000-0000-0000-0000-000000000006": "desativado",
};

// POST /api/campaigns/[id]/leads/move - Mover lead de coluna no Kanban
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    }

    const { id: campaignId } = await params;
    const body = await request.json();
    const { lead_id, client_id, new_stage_id } = body;

    if (!new_stage_id || (!lead_id && !client_id)) {
      return NextResponse.json({ error: "lead_id (ou client_id) e new_stage_id são obrigatórios." }, { status: 400 });
    }

    const supabase = createServiceClient();
    const now = new Date().toISOString();

    // 1. Validar que a etapa de destino pertence a esta campanha
    let stageKind = "open";
    let stageName = "Etapa";

    const { data: stageData } = await supabase
      .from("campaign_stages")
      .select("id, name, stage_kind")
      .eq("id", new_stage_id)
      .eq("campaign_id", campaignId)
      .maybeSingle();

    if (stageData) {
      stageKind = stageData.stage_kind;
      stageName = stageData.name;
    }

    // 2. Tentar atualizar na tabela campaign_leads
    const updates: Record<string, any> = {
      stage_id: new_stage_id,
      last_activity_at: now,
      updated_at: now,
    };

    if (stageKind === "won") updates.converted_at = now;
    if (stageKind === "lost") updates.lost_at = now;

    let targetClientId = client_id;

    if (lead_id && !lead_id.startsWith("lead_")) {
      const { data: updatedLead } = await supabase
        .from("campaign_leads")
        .update(updates)
        .eq("id", lead_id)
        .eq("campaign_id", campaignId)
        .select("client_id")
        .maybeSingle();

      if (updatedLead) {
        targetClientId = updatedLead.client_id;
      }
    } else if (client_id) {
      await supabase
        .from("campaign_leads")
        .update(updates)
        .eq("campaign_id", campaignId)
        .eq("client_id", client_id);
    }

    // 3. Compatibilidade Legada Especial:
    // Se for a campanha Upgrade 50 -> 100M, manter o clients.status sincronizado
    if (campaignId === "c0000000-0000-0000-0000-000000000001" && targetClientId) {
      const legacyStatus = REVERSE_STAGE_MAP[new_stage_id];
      if (legacyStatus) {
        const clientUpdates: Record<string, any> = {
          status: legacyStatus,
          updated_at: now,
        };
        if (legacyStatus === "vendido") {
          clientUpdates.sold_at = now;
          clientUpdates.wants_upgrade = true;
        }
        await supabase
          .from("clients")
          .update(clientUpdates)
          .eq("id", targetClientId);
      }
    }

    // 4. Registrar na auditoria
    await supabase.from("audit_logs").insert([
      {
        id: "log_" + Date.now() + "_" + Math.random().toString(36).substring(2, 6),
        operator_email: user.email,
        actor_user_id: user.id,
        target_client_id: targetClientId,
        action: `Moveu lead para a etapa "${stageName}" na campanha ${campaignId === "c0000000-0000-0000-0000-000000000001" ? "Upgrade 100M" : "Hotspot"}`,
        timestamp: now,
      },
    ]);

    return NextResponse.json({ success: true, updated_at: now });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Erro no servidor." }, { status: 500 });
  }
}
