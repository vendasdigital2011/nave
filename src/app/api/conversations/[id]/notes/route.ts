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

// POST /api/conversations/[id]/notes - Inserir observação comercial, objeção e agendamento
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
    const { content, commercial_classification, objection, next_followup_at } = body;

    if (!content || !content.trim()) {
      return NextResponse.json({ error: "O conteúdo da nota é obrigatório." }, { status: 400 });
    }

    const supabase = createServiceClient();

    // 1. Buscar a conversa
    const { data: conversation } = await supabase
      .from("conversations")
      .select("id, campaign_lead_id, assigned_user_id")
      .eq("id", conversationId)
      .single();

    if (!conversation) {
      return NextResponse.json({ error: "Conversa não encontrada." }, { status: 404 });
    }

    // 2. Inserir na tabela conversation_notes
    const { data: newNote, error: noteErr } = await supabase
      .from("conversation_notes")
      .insert({
        conversation_id: conversationId,
        author_user_id: user.id || null,
        commercial_classification: commercial_classification || null,
        objection: objection || null,
        content: content.trim(),
        next_followup_at: next_followup_at || null,
      })
      .select(`
        *,
        author:profiles(id, display_name, role)
      `)
      .single();

    if (noteErr) {
      return NextResponse.json({ error: noteErr.message }, { status: 500 });
    }

    // 3. Se foi definido next_followup_at e a conversa está ligada a um lead de campanha, cria a tarefa na agenda!
    if (next_followup_at && conversation.campaign_lead_id) {
      try {
        await supabase.from("lead_tasks").insert({
          campaign_lead_id: conversation.campaign_lead_id,
          assigned_user_id: conversation.assigned_user_id || user.id,
          created_by: user.id,
          type: "followup",
          title: `Retorno pós-conversa: ${commercial_classification || "Follow-up"}`,
          description: content.trim(),
          due_at: next_followup_at,
          status: "pending",
        });
      } catch (taskErr) {
        console.warn("Aviso ao agendar tarefa pós-conversa:", taskErr);
      }
    }

    // 4. Registrar evento na auditoria append-only
    try {
      await supabase.from("conversation_events").insert({
        conversation_id: conversationId,
        actor_user_id: user.id || null,
        event_type: "note_added",
        after_state: {
          classification: commercial_classification,
          objection,
          has_followup: Boolean(next_followup_at),
        },
      });
    } catch {
      // Ignora erro de evento
    }

    return NextResponse.json({
      success: true,
      note: newNote,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Erro ao registrar nota comercial." },
      { status: 500 }
    );
  }
}
