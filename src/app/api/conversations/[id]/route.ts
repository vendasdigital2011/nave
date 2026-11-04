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

// GET /api/conversations/[id] - Detalhes completos da conversa, eventos e notas
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

    // 1. Buscar conversa
    const { data: conversation, error: convErr } = await supabase
      .from("conversations")
      .select(`
        *,
        client:clients(*),
        campaign_lead:campaign_leads(
          id,
          campaign_id,
          stage_id,
          assigned_user_id,
          version,
          stage:campaign_stages(id, name, color, stage_kind),
          campaign:campaigns(id, name, type)
        ),
        assigned_user:profiles!conversations_assigned_user_id_fkey(
          id,
          display_name,
          role
        ),
        instance:whatsapp_instances!conversations_instance_id_fkey(
          id,
          provider_instance_name,
          profile_name,
          display_phone_masked
        )
      `)
      .eq("id", conversationId)
      .single();

    if (convErr || !conversation) {
      return NextResponse.json({ error: "Conversa não encontrada." }, { status: 404 });
    }

    // 2. Buscar notas comerciais
    const { data: notes } = await supabase
      .from("conversation_notes")
      .select(`
        *,
        author:profiles(id, display_name, role)
      `)
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: false });

    // 3. Buscar eventos de auditoria da conversa
    const { data: events } = await supabase
      .from("conversation_events")
      .select(`
        *,
        actor:profiles(id, display_name, role)
      `)
      .eq("conversation_id", conversationId)
      .order("occurred_at", { ascending: false })
      .limit(30);

    return NextResponse.json({
      success: true,
      conversation,
      notes: notes || [],
      events: events || [],
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Erro ao consultar conversa." },
      { status: 500 }
    );
  }
}

// PATCH /api/conversations/[id] - Atualizar atribuição, status ou vincular lead
export async function PATCH(
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
    const { assigned_user_id, status, campaign_lead_id, contact_name } = body;

    const supabase = createServiceClient();

    // 1. Buscar estado anterior
    const { data: currentConv } = await supabase
      .from("conversations")
      .select("*")
      .eq("id", conversationId)
      .single();

    if (!currentConv) {
      return NextResponse.json({ error: "Conversa não encontrada." }, { status: 404 });
    }

    const updates: Record<string, any> = {};
    const eventsToInsert: any[] = [];

    if (assigned_user_id !== undefined) {
      updates.assigned_user_id = assigned_user_id;
      eventsToInsert.push({
        conversation_id: conversationId,
        actor_user_id: user.id || null,
        event_type: "assigned",
        before_state: { assigned_user_id: currentConv.assigned_user_id },
        after_state: { assigned_user_id },
      });
    }

    if (status !== undefined) {
      updates.status = status;
      eventsToInsert.push({
        conversation_id: conversationId,
        actor_user_id: user.id || null,
        event_type: "status_changed",
        before_state: { status: currentConv.status },
        after_state: { status },
      });
    }

    if (campaign_lead_id !== undefined) {
      updates.campaign_lead_id = campaign_lead_id;
      eventsToInsert.push({
        conversation_id: conversationId,
        actor_user_id: user.id || null,
        event_type: "lead_linked",
        before_state: { campaign_lead_id: currentConv.campaign_lead_id },
        after_state: { campaign_lead_id },
      });
    }

    if (contact_name !== undefined) {
      updates.contact_name = contact_name;
    }

    const { data: updatedConv, error: updErr } = await supabase
      .from("conversations")
      .update(updates)
      .eq("id", conversationId)
      .select("*")
      .single();

    if (updErr) {
      return NextResponse.json({ error: updErr.message }, { status: 500 });
    }

    // Inserir eventos na auditoria append-only
    if (eventsToInsert.length > 0) {
      try {
        await supabase.from("conversation_events").insert(eventsToInsert);
      } catch {
        // Ignora
      }
    }

    return NextResponse.json({
      success: true,
      conversation: updatedConv,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Erro ao atualizar conversa." },
      { status: 500 }
    );
  }
}
