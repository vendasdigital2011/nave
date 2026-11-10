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
 * Detecta se uma mensagem de erro da Evolution API indica que o número não possui WhatsApp cadastrado
 */
export function isWhatsAppNonExistentError(errorMessage?: string | null): boolean {
  if (!errorMessage) return false;
  const msg = String(errorMessage).toLowerCase();
  return (
    msg.includes("not exists") ||
    msg.includes("is not exists") ||
    msg.includes("does not exist") ||
    msg.includes("not on whatsapp") ||
    msg.includes("not registered") ||
    msg.includes("contact not found") ||
    msg.includes("invalid number") ||
    msg.includes("não existe") ||
    msg.includes("não possui whatsapp") ||
    msg.includes("numero invalido") ||
    msg.includes("número inválido") ||
    msg.includes("not-found") ||
    msg.includes("exists: false") ||
    msg.includes("isexists: false") ||
    msg.includes("number is not exists") ||
    msg.includes("bad request") && (msg.includes("number") || msg.includes("exists"))
  );
}

/**
 * Identifica se a resposta do cliente demonstra interesse real ou pedido de planos
 */
export function isInterestedReply(text?: string | null): boolean {
  if (!text) return false;
  const lower = text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();

  const interestPatterns = [
    /planos?/,
    /qual.*valor/,
    /quanto.*custa/,
    /quanto.*fica/,
    /qual.*pre[cç]o/,
    /pre[cç]o/,
    /valor/,
    /interess/,
    /quero.*ver/,
    /mand.*plano/,
    /mand.*propost/,
    /pode.*mandar/,
    /me.*manda/,
    /como.*funciona/,
    /quero.*saber/,
    /quero.*sim/,
    /gostaria/,
    /assinar/,
    /contratar/,
    /fechar/,
    /oferta/,
    /promoc/,
    /velocidade/,
    /mega/,
    /roteador/,
    /fibra/,
    /upgrade/,
    /\bsim\b/,
    /\bvamos\b/,
    /\btopo\b/,
    /\bquero\b/,
  ];

  return interestPatterns.some((pattern) => pattern.test(lower));
}

/**
 * Trata número inválido/sem WhatsApp: move automaticamente o lead para a coluna de Desativados / Inválidos
 */
export async function handleInvalidWhatsAppNumber(
  supabase: SupabaseClient,
  params: {
    conversationId?: string | null;
    campaignLeadId?: string | null;
    contactClientId?: string | null;
    phone?: string | null;
    actorUserId?: string | null;
    rawError?: string | null;
  }
) {
  try {
    const now = new Date().toISOString();
    let leadId = params.campaignLeadId;
    let clientId = params.contactClientId;

    if (!leadId && clientId) {
      const { data: lead } = await supabase
        .from("campaign_leads")
        .select("id, campaign_id")
        .eq("client_id", clientId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (lead) leadId = lead.id;
    }

    let campaignId = LEGACY_CAMPAIGN_ID;
    if (leadId) {
      const { data: leadData } = await supabase
        .from("campaign_leads")
        .select("id, campaign_id, client_id")
        .eq("id", leadId)
        .maybeSingle();
      if (leadData) {
        campaignId = leadData.campaign_id;
        clientId = clientId || leadData.client_id;
      }
    }

    // 1. Encontrar etapa "Desativado" / "Perdidos" da campanha (stage_kind = 'lost' ou posição 5)
    let lostStageId: string | null = null;
    let lostStageName = "Desativado";

    const { data: lostStages } = await supabase
      .from("campaign_stages")
      .select("id, name, stage_kind, position")
      .eq("campaign_id", campaignId)
      .order("position", { ascending: false });

    if (lostStages && lostStages.length > 0) {
      const match =
        lostStages.find((s) => s.stage_kind === "lost") ||
        lostStages.find((s) => s.name.toLowerCase().includes("desativad")) ||
        lostStages.find((s) => s.name.toLowerCase().includes("perdid")) ||
        lostStages[lostStages.length - 1];
      if (match) {
        lostStageId = match.id;
        lostStageName = match.name;
      }
    }

    // 2. Mover campaign_lead para a etapa de perda/inválido
    if (leadId && lostStageId) {
      await supabase
        .from("campaign_leads")
        .update({
          stage_id: lostStageId,
          lost_at: now,
          last_activity_at: now,
          updated_at: now,
          notes: "Número sem WhatsApp ativo detectado na tentativa de envio",
        })
        .eq("id", leadId);
    }

    // 3. Atualizar status na tabela clients para 'desativado'
    if (clientId) {
      await supabase
        .from("clients")
        .update({
          status: "desativado",
          feedback_first_contact: "Número sem WhatsApp ativo (Inválido)",
          updated_at: now,
        })
        .eq("id", clientId);
    }

    // 4. Fechar conversa se existir
    if (params.conversationId) {
      await supabase
        .from("conversations")
        .update({
          status: "closed",
          last_message_text: "❌ Número sem WhatsApp ativo",
          updated_at: now,
        })
        .eq("id", params.conversationId);

      await supabase.from("conversation_events").insert({
        conversation_id: params.conversationId,
        actor_user_id: params.actorUserId || null,
        event_type: "invalid_number",
        after_state: {
          stage_name: lostStageName,
          reason: "whatsapp_not_registered",
          error: params.rawError || "Número não cadastrado no WhatsApp",
        },
      });
    }

    // 5. Registrar log de auditoria
    await supabase.from("audit_logs").insert({
      id: "log_" + Date.now() + "_" + Math.random().toString(36).substring(2, 6),
      actor_user_id: params.actorUserId || null,
      target_client_id: clientId || null,
      action: `Lead movido automaticamente para "${lostStageName}" (Número sem WhatsApp ativo)`,
      timestamp: now,
    });

    return { success: true, lostStageName };
  } catch (err: any) {
    console.warn("[KanbanAutomation] Erro ao tratar número sem WhatsApp:", err?.message || err);
    return { success: false, error: err?.message };
  }
}

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

    // Apenas avança se o lead estiver na etapa inicial (posição 0)
    if (currentPosition === 0) {
      const { data: nextStage } = await supabase
        .from("campaign_stages")
        .select("id, name, position, stage_kind")
        .eq("campaign_id", campaignId)
        .eq("position", 1)
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
          const legacyStatus = STAGE_POSITION_MAP[1] || "frio";
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
          actor_user_id: params.actorUserId || null,
          event_type: "stage_advanced",
          after_state: {
            from_position: currentPosition,
            to_position: 1,
            stage_name: nextStage.name,
            reason: "auto_outbound_message_sent",
          },
        });

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
 * Trata o recebimento de mensagem (inbound):
 * Regra do Usuário:
 * 1. Só avança para "Interessados" (posição 2) se o cliente disser que quer ver planos ou demonstrar interesse.
 * 2. Se for resposta genérica e o lead estiver na etapa 0 ("Novos Leads"), avança para "Em Contato" (posição 1).
 * 3. Se já estiver na etapa 1 ("Em Contato"), PERMANECE na etapa 1 ("Em Contato").
 */
export async function advanceStageOnMessageReceived(
  supabase: SupabaseClient,
  params: {
    conversationId: string;
    campaignLeadId?: string | null;
    contactClientId?: string | null;
    messageText?: string | null;
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

    const isInterested = isInterestedReply(params.messageText);

    if (isInterested) {
      // Cliente demonstrou interesse explícito: avançar para posição 2 ("Interessados" / "Em Negociação")
      if (currentPosition < 2) {
        const { data: interestStage } = await supabase
          .from("campaign_stages")
          .select("id, name, position, stage_kind")
          .eq("campaign_id", campaignId)
          .eq("position", 2)
          .maybeSingle();

        if (interestStage) {
          await supabase
            .from("campaign_leads")
            .update({
              stage_id: interestStage.id,
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
              stage_name: interestStage.name,
              reason: "client_expressed_interest",
              message_snippet: params.messageText?.slice(0, 100),
            },
          });

          await supabase.from("audit_logs").insert({
            id: "log_" + Date.now() + "_" + Math.random().toString(36).substring(2, 6),
            target_client_id: clientId,
            action: `Lead avançou para "${interestStage.name}" ao demonstrar interesse na resposta`,
            timestamp: now,
          });

          return interestStage;
        }
      }
    } else {
      // Resposta comum (não explícita de planos): se ainda estiver em posição 0, move para posição 1 ("Em Contato")
      if (currentPosition === 0) {
        const { data: contactStage } = await supabase
          .from("campaign_stages")
          .select("id, name, position, stage_kind")
          .eq("campaign_id", campaignId)
          .eq("position", 1)
          .maybeSingle();

        if (contactStage) {
          await supabase
            .from("campaign_leads")
            .update({
              stage_id: contactStage.id,
              last_activity_at: now,
              updated_at: now,
            })
            .eq("id", leadId);

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

          await supabase.from("conversation_events").insert({
            conversation_id: params.conversationId,
            event_type: "stage_advanced",
            after_state: {
              from_position: 0,
              to_position: 1,
              stage_name: contactStage.name,
              reason: "inbound_reply_contact_made",
            },
          });

          return contactStage;
        }
      }
      // Se já estava em posição 1 ("Em Contato"), não faz nada, continua em "Em Contato"!
    }
  } catch (err: any) {
    console.warn("[KanbanAutomation] Erro ao avançar etapa na resposta:", err?.message || err);
  }
  return null;
}
