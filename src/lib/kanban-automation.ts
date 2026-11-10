import { SupabaseClient } from "@supabase/supabase-js";

export const LEGACY_CAMPAIGN_ID = "c0000000-0000-0000-0000-000000000001";

export const STAGE_POSITION_MAP: Record<number, string> = {
  0: "importados",
  1: "frio",
  2: "morno",
  3: "quente",
  4: "vendido",
  5: "desativado",
};

/**
 * Avança automaticamente a etapa do lead no Kanban quando uma mensagem é enviada (outbound).
 * Se o lead estiver na etapa inicial (posição 0, ex: "Novos Leads" / "Importados"),
 * ele avança automaticamente para a etapa de contato (posição 1, ex: "Em Contato" / "Contato Iniciado").
 */
export async function advanceStageOnMessageSent(
  supabase: SupabaseClient,
  params: {
    conversationId: string;
    campaignLeadId?: string | null;
    contactClientId?: string | null;
    actorUserId?: string | null;
  }
) {
  try {
    const now = new Date().toISOString();
    let leadId = params.campaignLeadId;
    let clientId = params.contactClientId;

    // 1. Resolver leadId se não fornecido diretamente
    if (!leadId && clientId) {
      const { data: lead } = await supabase
        .from("campaign_leads")
        .select("id, campaign_id, stage_id")
        .eq("client_id", clientId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (lead) {
        leadId = lead.id;
      }
    }

    if (!leadId) return null;

    // 2. Buscar o lead e a etapa atual
    const { data: leadData } = await supabase
      .from("campaign_leads")
      .select("id, campaign_id, client_id, stage_id, stage:campaign_stages(id, name, position)")
      .eq("id", leadId)
      .single();

    if (!leadData) return null;

    clientId = clientId || leadData.client_id;
    const campaignId = leadData.campaign_id;
    const currentPosition = (leadData.stage as any)?.position ?? 0;

    // Apenas avança se o lead estiver na etapa inicial (posição 0)
    if (currentPosition === 0) {
      // Buscar a etapa de posição 1 ("Em Contato" / "Contato Iniciado")
      const { data: nextStage } = await supabase
        .from("campaign_stages")
        .select("id, name, position, stage_kind")
        .eq("campaign_id", campaignId)
        .eq("position", 1)
        .maybeSingle();

      if (nextStage) {
        // Atualizar etapa na tabela campaign_leads
        await supabase
          .from("campaign_leads")
          .update({
            stage_id: nextStage.id,
            last_activity_at: now,
            updated_at: now,
          })
          .eq("id", leadId);

        // Atualizar status na tabela clients para coerência do Kanban
        if (clientId) {
          const legacyStatus = STAGE_POSITION_MAP[1] || "frio";
          await supabase
            .from("clients")
            .update({
              status: legacyStatus,
              updated_at: now,
            })
            .eq("id", clientId);
        }

        // Registrar evento na conversa
        await supabase.from("conversation_events").insert({
          conversation_id: params.conversationId,
          actor_user_id: params.actorUserId || null,
          event_type: "stage_advanced",
          after_state: {
            from_position: currentPosition,
            to_position: 1,
            stage_name: nextStage.name,
            reason: "auto_outbound_message_sent",
          },
        });

        // Registrar auditoria
        await supabase.from("audit_logs").insert({
          id: "log_" + Date.now() + "_" + Math.random().toString(36).substring(2, 6),
          actor_user_id: params.actorUserId || null,
          target_client_id: clientId,
          action: `Lead avançou automaticamente para a etapa "${nextStage.name}" ao enviar mensagem`,
          timestamp: now,
        });

        return nextStage;
      }
    }
  } catch (err: any) {
    console.warn("[KanbanAutomation] Erro ao avançar etapa no envio:", err?.message || err);
  }
  return null;
}

/**
 * Avança automaticamente a etapa do lead no Kanban quando o cliente responde (inbound).
 * Se o lead estiver na etapa inicial (0) ou em contato (1),
 * ele avança automaticamente para negociação/interessados (posição 2, ex: "Interessados" / "Em Negociação").
 */
export async function advanceStageOnMessageReceived(
  supabase: SupabaseClient,
  params: {
    conversationId: string;
    campaignLeadId?: string | null;
    contactClientId?: string | null;
  }
) {
  try {
    const now = new Date().toISOString();
    let leadId = params.campaignLeadId;
    let clientId = params.contactClientId;

    if (!leadId && clientId) {
      const { data: lead } = await supabase
        .from("campaign_leads")
        .select("id, campaign_id, stage_id")
        .eq("client_id", clientId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (lead) {
        leadId = lead.id;
      }
    }

    if (!leadId) return null;

    const { data: leadData } = await supabase
      .from("campaign_leads")
      .select("id, campaign_id, client_id, stage_id, stage:campaign_stages(id, name, position)")
      .eq("id", leadId)
      .single();

    if (!leadData) return null;

    clientId = clientId || leadData.client_id;
    const campaignId = leadData.campaign_id;
    const currentPosition = (leadData.stage as any)?.position ?? 0;

    // Se estiver em etapa 0 ("Novos Leads") ou 1 ("Em Contato"), avança para 2 ("Interessados" / "Em Negociação")
    if (currentPosition === 0 || currentPosition === 1) {
      const { data: nextStage } = await supabase
        .from("campaign_stages")
        .select("id, name, position, stage_kind")
        .eq("campaign_id", campaignId)
        .eq("position", 2)
        .maybeSingle();

      if (nextStage) {
        await supabase
          .from("campaign_leads")
          .update({
            stage_id: nextStage.id,
            last_activity_at: now,
            updated_at: now,
          })
          .eq("id", leadId);

        if (clientId) {
          const legacyStatus = STAGE_POSITION_MAP[2] || "morno";
          await supabase
            .from("clients")
            .update({
              status: legacyStatus,
              updated_at: now,
            })
            .eq("id", clientId);
        }

        await supabase.from("conversation_events").insert({
          conversation_id: params.conversationId,
          event_type: "stage_advanced",
          after_state: {
            from_position: currentPosition,
            to_position: 2,
            stage_name: nextStage.name,
            reason: "auto_inbound_reply_received",
          },
        });

        await supabase.from("audit_logs").insert({
          id: "log_" + Date.now() + "_" + Math.random().toString(36).substring(2, 6),
          target_client_id: clientId,
          action: `Lead avançou automaticamente para a etapa "${nextStage.name}" ao responder no WhatsApp`,
          timestamp: now,
        });

        return nextStage;
      }
    }
  } catch (err: any) {
    console.warn("[KanbanAutomation] Erro ao avançar etapa na resposta:", err?.message || err);
  }
  return null;
}
