import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { AUTH_COOKIE_NAME, AuthUser } from "@/lib/auth-constants";
import { createServiceClient } from "@/lib/supabase/server";
import { EvolutionService } from "@/lib/evolution-api";
import { advanceStageOnMessageSent } from "@/lib/kanban-automation";

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

// GET /api/conversations/[id]/messages - Listar histórico de mensagens da conversa
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    }

    const { id: conversationId } = await params;
    const supabase = createServiceClient();

    // 1. Buscar a conversa
    const { data: conversation, error: convErr } = await supabase
      .from("conversations")
      .select("*, instance:whatsapp_instances(provider_instance_name)")
      .eq("id", conversationId)
      .single();

    if (convErr || !conversation) {
      return NextResponse.json({ error: "Conversa não encontrada." }, { status: 404 });
    }

    // 2. Buscar mensagens no banco
    const { data: dbMessages, error: msgErr } = await supabase
      .from("messages")
      .select(`
        *,
        created_by_user:profiles!messages_created_by_user_id_fkey(
          id,
          display_name,
          role
        )
      `)
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });

    // 3. Marcar conversa como lida pelo operador
    if (conversation.unread_count > 0) {
      await supabase
        .from("conversations")
        .update({ unread_count: 0 })
        .eq("id", conversationId);
    }

    return NextResponse.json({
      success: true,
      conversation,
      messages: dbMessages || [],
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Erro ao carregar mensagens." },
      { status: 500 }
    );
  }
}

// POST /api/conversations/[id]/messages - Envio manual de mensagem com auditoria
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    }

    const { id: conversationId } = await params;
    const body = await request.json();
    const { text } = body;

    if (!text || !text.trim()) {
      return NextResponse.json({ error: "O texto da mensagem é obrigatório." }, { status: 400 });
    }

    const supabase = createServiceClient();

    // 1. Buscar conversa e instância
    const { data: conversation, error: convErr } = await supabase
      .from("conversations")
      .select("*, instance:whatsapp_instances(provider_instance_name)")
      .eq("id", conversationId)
      .single();

    if (convErr || !conversation) {
      return NextResponse.json({ error: "Conversa não encontrada." }, { status: 404 });
    }

    const instanceName = conversation.instance?.provider_instance_name || "nave";
    const phone = conversation.contact_phone;

    // 2. Enviar mensagem na Evolution API
    const result = await EvolutionService.sendTextMessage(phone, text.trim(), instanceName);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Falha no envio da mensagem pela Evolution API." },
        { status: 502 }
      );
    }

    const providerMsgId = (result.data as any)?.key?.id || `crm_msg_${Date.now()}`;

    // 3. Gravar na tabela messages (auditável e imutável)
    const { data: newMessage, error: msgInsErr } = await supabase
      .from("messages")
      .insert({
        conversation_id: conversationId,
        provider_message_id: providerMsgId,
        direction: "outbound",
        sender_ref: user.name || user.email,
        body: text.trim(),
        content_type: "text",
        delivery_status: "sent",
        created_by_user_id: user.id || null,
      })
      .select("*")
      .single();

    if (msgInsErr) {
      console.warn("Aviso ao persistir mensagem:", msgInsErr.message);
    }

    // 4. Atualizar conversa
    await supabase
      .from("conversations")
      .update({
        status: "waiting_client",
        unread_count: 0,
        last_message_text: text.trim(),
        last_message_at: new Date().toISOString(),
      })
      .eq("id", conversationId);

    // 5. Automação do Kanban: avançar etapa automaticamente no envio da mensagem
    await advanceStageOnMessageSent(supabase, {
      conversationId,
      campaignLeadId: conversation.campaign_lead_id,
      contactClientId: conversation.contact_client_id,
      actorUserId: user.id || null,
    });

    // 6. Registrar evento na auditoria append-only
    try {
      await supabase.from("conversation_events").insert({
        conversation_id: conversationId,
        actor_user_id: user.id || null,
        event_type: "message_sent",
        after_state: {
          provider_message_id: providerMsgId,
          instance: instanceName,
          text_snippet: text.trim().slice(0, 80),
        },
      });
    } catch {
      // Ignora erro de auditoria
    }

    // 7. Auditoria geral
    try {
      await supabase.from("audit_logs").insert({
        actor_user_id: user.id || null,
        action: "whatsapp_message.sent_via_crm",
        target_entity: "messages",
        target_id: newMessage?.id || conversationId,
        details: {
          conversation_id: conversationId,
          instance_name: instanceName,
          recipient: phone,
        },
      });
    } catch {
      // Ignora
    }

    return NextResponse.json({
      success: true,
      message: newMessage,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Erro ao enviar mensagem." },
      { status: 500 }
    );
  }
}
