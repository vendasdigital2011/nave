import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    let payload: any = {};
    try {
      payload = JSON.parse(rawBody);
    } catch {
      payload = {};
    }

    const event = payload.event || payload.type || "unknown";
    const instanceName = payload.instance || payload.instanceName || "nave";

    console.log(`[Evolution Webhook] Evento: ${event} | Instância: ${instanceName}`);

    const supabase = createServiceClient();

    // 1. Gravar auditoria em webhook_events
    const payloadHash = crypto.createHash("sha256").update(rawBody || "").digest("hex");
    const eventId = payload.data?.key?.id || payload.id || `evt_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

    try {
      await supabase.from("webhook_events").insert({
        provider_event_id: eventId,
        event_type: event,
        instance_name: instanceName,
        payload_hash: payloadHash,
        payload: payload,
        status: "processed",
      });
    } catch {
      // Ignora erro de chave duplicada no log bruto
    }

    // 2. Tratar mensagens (MESSAGES_UPSERT / messages.upsert)
    if (event === "messages.upsert" || event === "MESSAGES_UPSERT") {
      const data = payload.data;
      const key = data?.key;
      const message = data?.message;
      const providerMsgId = key?.id;

      if (!providerMsgId || !key?.remoteJid) {
        return NextResponse.json({ success: true, note: "Payload sem remoteJid ou messageId" });
      }

      // Deduplicação estrita: se a mensagem já existe no banco, ignora
      const { data: existingMsg } = await supabase
        .from("messages")
        .select("id")
        .eq("provider_message_id", providerMsgId)
        .maybeSingle();

      if (existingMsg) {
        return NextResponse.json({ success: true, deduplicated: true });
      }

      const isFromMe = Boolean(key?.fromMe);
      const rawJid = key.remoteJid;
      const cleanPhone = rawJid.replace(/@.*$/, "").replace(/\D/g, "");

      // Extração de texto da mensagem
      const text =
        message?.conversation ||
        message?.extendedTextMessage?.text ||
        (message?.audioMessage
          ? "🎤 [Áudio]"
          : message?.imageMessage
          ? "📷 [Imagem]"
          : message?.documentMessage
          ? "📄 [Documento]"
          : message?.stickerMessage
          ? "🎨 [Figurinha]"
          : "[Mensagem]");

      // 3. Resolver ID da instância no banco de dados
      let instanceId: string | null = null;
      const { data: instDb } = await supabase
        .from("whatsapp_instances")
        .select("id")
        .eq("provider_instance_name", instanceName)
        .maybeSingle();

      if (instDb) {
        instanceId = instDb.id;
      }

      // 4. Buscar ou Criar Conversa (por par instância + telefone)
      let conversationId: string | null = null;
      let matchedClientId: string | null = null;
      let matchedLeadId: string | null = null;
      let assignedUserId: string | null = null;
      let conversationStatus: string = isFromMe ? "waiting_client" : "unread";

      // Variações de telefone para compatibilidade total (com/sem 55, formatado, com/sem 9º dígito)
      const nationalPhone =
        cleanPhone.startsWith("55") && cleanPhone.length >= 12
          ? cleanPhone.slice(2)
          : cleanPhone;

      let formattedPhone = "";
      if (nationalPhone.length === 11) {
        formattedPhone = `(${nationalPhone.slice(0, 2)}) ${nationalPhone.slice(2, 7)}-${nationalPhone.slice(7)}`;
      } else if (nationalPhone.length === 10) {
        formattedPhone = `(${nationalPhone.slice(0, 2)}) ${nationalPhone.slice(2, 6)}-${nationalPhone.slice(6)}`;
      }

      let altNational = "";
      if (nationalPhone.length === 11 && nationalPhone[2] === "9") {
        altNational = nationalPhone.slice(0, 2) + nationalPhone.slice(3);
      } else if (nationalPhone.length === 10) {
        altNational = nationalPhone.slice(0, 2) + "9" + nationalPhone.slice(2);
      }

      const phoneCandidates = Array.from(
        new Set(
          [
            cleanPhone,
            nationalPhone,
            formattedPhone,
            altNational,
            `55${nationalPhone}`,
            altNational ? `55${altNational}` : "",
          ].filter(Boolean)
        )
      );

      const orFilter = phoneCandidates.map((p) => `contact_phone.eq.${p}`).join(",");

      let convQuery = supabase
        .from("conversations")
        .select("id, contact_client_id, campaign_lead_id, assigned_user_id, status, unread_count, contact_phone")
        .or(orFilter);

      if (instanceId) {
        convQuery = convQuery.eq("instance_id", instanceId);
      }

      const { data: convMatches } = await convQuery.limit(1);
      const existingConv = convMatches && convMatches.length > 0 ? convMatches[0] : null;

      if (existingConv) {
        conversationId = existingConv.id;
        matchedClientId = existingConv.contact_client_id;
        matchedLeadId = existingConv.campaign_lead_id;
        assignedUserId = existingConv.assigned_user_id;
      } else {
        // Nova conversa: fazer matching com clients e campaign_leads
        const { data: matchedClients } = await supabase
          .from("clients")
          .select("id, name, phone, status");

        const clientMatch = (matchedClients || []).find((c: any) => {
          const cPhone = c.phone.replace(/\D/g, "");
          const cNational = cPhone.startsWith("55") && cPhone.length >= 12 ? cPhone.slice(2) : cPhone;
          return phoneCandidates.some(
            (p) => cPhone === p || cNational === p || (p.length >= 8 && cPhone.endsWith(p.slice(-8)))
          );
        });

        if (clientMatch) {
          matchedClientId = clientMatch.id;

          // Verificar campaign_leads para este cliente
          const { data: leads } = await supabase
            .from("campaign_leads")
            .select("id, assigned_user_id, campaign_id")
            .eq("client_id", clientMatch.id);

          if (leads && leads.length === 1) {
            // Correspondência inequívoca com 1 campanha
            matchedLeadId = leads[0].id;
            assignedUserId = leads[0].assigned_user_id;
          } else if (leads && leads.length > 1) {
            // Ambiguidade: cliente participa de mais de 1 campanha!
            // Roteamento para TRIAGEM para evitar contaminação do funil
            conversationStatus = "triagem";
          }
        } else {
          // Cliente não cadastrado previamente -> vai para TRIAGEM
          conversationStatus = "triagem";
        }

        const { data: newConv, error: convErr } = await supabase
          .from("conversations")
          .insert({
            instance_id: instanceId,
            contact_client_id: matchedClientId,
            campaign_lead_id: matchedLeadId,
            assigned_user_id: assignedUserId,
            contact_phone: formattedPhone || nationalPhone || cleanPhone,
            contact_name: clientMatch?.name || cleanPhone,
            status: conversationStatus as any,
            unread_count: isFromMe ? 0 : 1,
            last_message_text: text,
            last_message_at: new Date().toISOString(),
          })
          .select("id")
          .single();

        if (convErr) {
          console.error("[Webhook] Erro ao criar conversa:", convErr.message);
        } else if (newConv) {
          conversationId = newConv.id;
        }
      }

      // 5. Inserir mensagem auditável
      if (conversationId) {
        const timestampSeconds = data?.messageTimestamp || Math.floor(Date.now() / 1000);
        const providerTimestamp = new Date(timestampSeconds * 1000).toISOString();

        await supabase.from("messages").insert({
          conversation_id: conversationId,
          provider_message_id: providerMsgId,
          direction: isFromMe ? "outbound" : "inbound",
          sender_ref: isFromMe ? instanceName : cleanPhone,
          body: text,
          content_type: "text",
          provider_timestamp: providerTimestamp,
          delivery_status: isFromMe ? "sent" : "delivered",
        });

        // 6. Atualizar a conversa
        if (existingConv) {
          const nextUnread = isFromMe ? 0 : (existingConv.unread_count || 0) + 1;
          const nextStatus = isFromMe
            ? "waiting_client"
            : existingConv.status === "closed"
            ? "unread"
            : "waiting_user";

          await supabase
            .from("conversations")
            .update({
              last_message_text: text,
              last_message_at: new Date().toISOString(),
              unread_count: nextUnread,
              status: nextStatus,
            })
            .eq("id", conversationId);
        }

        // 7. Registrar evento na auditoria append-only
        try {
          await supabase.from("conversation_events").insert({
            conversation_id: conversationId,
            event_type: isFromMe ? "message_sent" : "message_received",
            after_state: {
              provider_message_id: providerMsgId,
              text_snippet: text.slice(0, 80),
              is_from_me: isFromMe,
            },
          });
        } catch {
          // Ignora
        }
      }
    }

    return NextResponse.json({ success: true, processed: true });
  } catch (error: any) {
    console.error("[Evolution Webhook Error]:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    status: "online",
    service: "NaveProspect Evolution Webhook v2",
    timestamp: new Date().toISOString(),
  });
}
