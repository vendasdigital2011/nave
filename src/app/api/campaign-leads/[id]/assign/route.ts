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

// POST /api/campaign-leads/[id]/assign - Atribuir ou transferir lead com controle de concorrência e auditoria
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    }

    const { id: leadId } = await params;
    const body = await request.json();
    const {
      assigned_user_id, // UUID do novo responsável (ou null para devolver à fila sem dono)
      reason = "Atribuição operacional",
      expected_version,
    } = body;

    const supabase = createServiceClient();

    // 1. Buscar o lead atual
    const { data: currentLead, error: findErr } = await supabase
      .from("campaign_leads")
      .select("*")
      .eq("id", leadId)
      .single();

    if (findErr || !currentLead) {
      return NextResponse.json({ error: "Lead não encontrado." }, { status: 404 });
    }

    // 2. Proteção de concorrência otimista (Optimistic Concurrency Control)
    if (expected_version !== undefined && expected_version !== null) {
      if (currentLead.version !== expected_version) {
        return NextResponse.json(
          {
            error: "Conflito de concorrência: Este lead foi atualizado por outro usuário simultaneamente. Atualize a tela.",
            current_version: currentLead.version,
          },
          { status: 409 }
        );
      }
    }

    // 3. Se for vendedor, só pode transferir se for o atual responsável (ou se admin/supervisor)
    if (
      user.role === "seller" &&
      currentLead.assigned_user_id &&
      currentLead.assigned_user_id !== user.id
    ) {
      return NextResponse.json(
        { error: "Apenas supervisores/administradores podem redistribuir leads de outros vendedores." },
        { status: 403 }
      );
    }

    const fromUserId = currentLead.assigned_user_id || null;
    const toUserId = assigned_user_id || null;

    // Se não mudou o responsável, encerra sem alterações
    if (fromUserId === toUserId) {
      return NextResponse.json({ success: true, lead: currentLead, message: "Responsável inalterado." });
    }

    // 4. Validar se o novo responsável está ativo caso informado
    if (toUserId) {
      const { data: targetProfile } = await supabase
        .from("profiles")
        .select("id, display_name, is_active")
        .eq("id", toUserId)
        .single();

      if (targetProfile && targetProfile.is_active === false) {
        return NextResponse.json(
          { error: "O vendedor de destino está inativo/suspenso e não pode receber novos leads." },
          { status: 400 }
        );
      }
    }

    // 5. Atualizar o lead incrementando a versão
    const nextVersion = (currentLead.version || 1) + 1;
    const { data: updatedLead, error: updateErr } = await supabase
      .from("campaign_leads")
      .update({
        assigned_user_id: toUserId,
        version: nextVersion,
        last_activity_at: new Date().toISOString(),
      })
      .eq("id", leadId)
      .select(`
        *,
        client:clients(*)
      `)
      .single();

    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }

    // 6. Registrar histórico na tabela lead_transfers
    try {
      await supabase.from("lead_transfers").insert({
        campaign_lead_id: leadId,
        from_user_id: fromUserId,
        to_user_id: toUserId,
        transferred_by: user.id,
        reason: reason.trim(),
      });
    } catch (transferLogErr) {
      console.warn("Aviso ao registrar lead_transfer:", transferLogErr);
    }

    // 7. Registrar auditoria em audit_logs se existir
    try {
      await supabase.from("audit_logs").insert({
        actor_user_id: user.id,
        action: "lead.transferred",
        target_entity: "campaign_leads",
        target_id: leadId,
        details: {
          from_user_id: fromUserId,
          to_user_id: toUserId,
          reason,
          previous_version: currentLead.version,
          new_version: nextVersion,
        },
      });
    } catch {
      // Ignora se tabela audit_logs não existir
    }

    return NextResponse.json({
      success: true,
      lead: updatedLead,
      message: "Lead transferido com sucesso.",
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Erro ao transferir lead." },
      { status: 500 }
    );
  }
}
