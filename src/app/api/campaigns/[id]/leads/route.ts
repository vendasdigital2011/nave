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

// Map legado para stage_id fixo do Upgrade (UUID hexadecimal válido)
const LEGACY_STAGE_MAP: Record<string, string> = {
  importados: "10000000-0000-0000-0000-000000000001",
  frio: "10000000-0000-0000-0000-000000000002",
  morno: "10000000-0000-0000-0000-000000000003",
  quente: "10000000-0000-0000-0000-000000000004",
  vendido: "10000000-0000-0000-0000-000000000005",
  desativado: "10000000-0000-0000-0000-000000000006",
};

function normalizePhone(raw: string): { formatted: string; rawDigits: string; isValid: boolean } {
  if (!raw) return { formatted: "", rawDigits: "", isValid: false };

  let digits = String(raw).replace(/\D/g, "");

  if (digits.startsWith("55") && (digits.length === 12 || digits.length === 13)) {
    digits = digits.slice(2);
  }

  if (digits.length === 11) {
    const formatted = `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
    return { formatted, rawDigits: digits, isValid: true };
  }

  if (digits.length === 10) {
    const formatted = `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
    return { formatted, rawDigits: digits, isValid: true };
  }

  return { formatted: raw.trim(), rawDigits: digits, isValid: false };
}

// GET /api/campaigns/[id]/leads - Listar leads da campanha para o Kanban
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    }

    const { id: campaignId } = await params;
    const supabase = createServiceClient();

    // 1. Tentar buscar em campaign_leads com join em clients
    try {
      const { data: leads, error: leadErr } = await supabase
        .from("campaign_leads")
        .select(`
          *,
          client:clients(*)
        `)
        .eq("campaign_id", campaignId)
        .order("created_at", { ascending: false });

      if (!leadErr && leads && leads.length > 0) {
        // Enriquecer com dados de perfis dos responsáveis e tarefas pendentes
        const assignedIds = Array.from(new Set(leads.map((l: any) => l.assigned_user_id).filter(Boolean)));
        const profileMap: Record<string, any> = {};
        if (assignedIds.length > 0) {
          try {
            const { data: profiles } = await supabase
              .from("profiles")
              .select("id, display_name, role")
              .in("id", assignedIds);
            (profiles || []).forEach((p: any) => { profileMap[p.id] = p; });
          } catch {
            // Ignora se tabela profiles não responder
          }
        }

        const leadIds = leads.map((l: any) => l.id);
        const taskMap: Record<string, any[]> = {};
        if (leadIds.length > 0) {
          try {
            const { data: tasks } = await supabase
              .from("lead_tasks")
              .select("id, campaign_lead_id, type, title, due_at, status")
              .in("campaign_lead_id", leadIds)
              .eq("status", "pending")
              .order("due_at", { ascending: true });
            (tasks || []).forEach((t: any) => {
              if (!taskMap[t.campaign_lead_id]) taskMap[t.campaign_lead_id] = [];
              taskMap[t.campaign_lead_id].push(t);
            });
          } catch {
            // Ignora se tabela lead_tasks ainda não responder
          }
        }

        const enrichedLeads = leads.map((l: any) => ({
          ...l,
          assigned_to: l.assigned_user_id ? profileMap[l.assigned_user_id] : null,
          tasks: taskMap[l.id] || [],
        }));

        return NextResponse.json({ success: true, leads: enrichedLeads });
      }
    } catch (err) {
      // Ignora erro se tabela campaign_leads ainda não existir e ativa fallback
    }

    // 2. Fallback de Compatibilidade para a Campanha Upgrade (Legado):
    // Se for a campanha de Upgrade e campaign_leads estiver vazio, lê diretamente de clients
    if (campaignId === "c0000000-0000-0000-0000-000000000001" || campaignId === "legacy") {
      const { data: clients, error: clientErr } = await supabase
        .from("clients")
        .select("*")
        .order("name", { ascending: true });

      if (clientErr) {
        return NextResponse.json({ error: clientErr.message }, { status: 500 });
      }

      const virtualLeads = (clients || []).map((c) => ({
        id: "lead_" + c.id,
        campaign_id: "c0000000-0000-0000-0000-000000000001",
        client_id: c.id,
        stage_id: LEGACY_STAGE_MAP[c.status] || "10000000-0000-0000-0000-000000000001",
        notes: c.notes,
        converted_at: c.sold_at,
        last_activity_at: c.updated_at || c.created_at,
        version: 1,
        created_at: c.created_at,
        updated_at: c.updated_at,
        client: c,
      }));

      return NextResponse.json({ success: true, leads: virtualLeads });
    }

    return NextResponse.json({ success: true, leads: [] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Erro no servidor." }, { status: 500 });
  }
}

// POST /api/campaigns/[id]/leads - Cadastrar novo lead manual na campanha e provisionar conversa
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
    const body = await request.json().catch(() => ({}));
    const {
      name,
      phone: rawPhone,
      current_plan,
      target_plan,
      stage_id,
      status,
      notes,
      condominium,
    } = body;

    if (!name?.trim() || !rawPhone?.trim()) {
      return NextResponse.json(
        { error: "Nome e WhatsApp/Telefone são obrigatórios." },
        { status: 400 }
      );
    }

    const supabase = createServiceClient();
    const now = new Date().toISOString();

    // 1. Normalizar telefone
    const { formatted: phone, rawDigits, isValid } = normalizePhone(rawPhone);

    // 2. Verificar se o cliente já existe na base geral (clients) por telefone
    let client: any = null;
    const { data: existingClients } = await supabase
      .from("clients")
      .select("*")
      .or(`phone.eq.${phone},phone.eq.${rawDigits}`);

    if (existingClients && existingClients.length > 0) {
      client = existingClients[0];
      // Atualizar dados cadastrais se aplicável
      const updates: any = { updated_at: now };
      if (name?.trim() && client.name !== name.trim()) updates.name = name.trim();
      if (current_plan && client.current_plan !== current_plan) updates.current_plan = current_plan;
      if (target_plan && client.target_plan !== target_plan) updates.target_plan = target_plan;
      if (notes && !client.notes) updates.notes = notes;

      const { data: updatedClient } = await supabase
        .from("clients")
        .update(updates)
        .eq("id", client.id)
        .select()
        .single();
      if (updatedClient) client = updatedClient;
    } else {
      // Criar novo cliente
      const newClientId = "c_" + Date.now() + "_" + Math.random().toString(36).substring(2, 6);
      const { data: createdClient, error: clientCreateErr } = await supabase
        .from("clients")
        .insert([
          {
            id: newClientId,
            name: name.trim(),
            phone: phone || rawPhone.trim(),
            condominium: condominium || "Geral",
            current_plan: current_plan || "50 Mega",
            target_plan: target_plan || "100 Mega",
            status: (status as any) || "importados",
            notes: notes?.trim() || null,
            operator_email: user.email,
            created_at: now,
            updated_at: now,
          },
        ])
        .select()
        .single();

      if (clientCreateErr || !createdClient) {
        return NextResponse.json(
          { error: "Erro ao cadastrar cliente: " + clientCreateErr?.message },
          { status: 500 }
        );
      }
      client = createdClient;
    }

    // 3. Resolver a etapa (stage_id) da campanha
    let resolvedStageId: string | null = null;
    if (stage_id && stage_id.includes("-")) {
      const { data: stageMatch } = await supabase
        .from("campaign_stages")
        .select("id")
        .eq("id", stage_id)
        .eq("campaign_id", campaignId)
        .maybeSingle();
      if (stageMatch) resolvedStageId = stageMatch.id;
    }

    if (!resolvedStageId && stage_id && LEGACY_STAGE_MAP[stage_id]) {
      resolvedStageId = LEGACY_STAGE_MAP[stage_id];
    }

    if (!resolvedStageId && status && LEGACY_STAGE_MAP[status]) {
      resolvedStageId = LEGACY_STAGE_MAP[status];
    }

    if (!resolvedStageId) {
      const { data: firstStage } = await supabase
        .from("campaign_stages")
        .select("id")
        .eq("campaign_id", campaignId)
        .order("position", { ascending: true })
        .limit(1)
        .maybeSingle();
      resolvedStageId = firstStage?.id || "10000000-0000-0000-0000-000000000001";
    }

    // 4. Inserir ou atualizar em campaign_leads
    let lead: any = null;
    const { data: existingLead } = await supabase
      .from("campaign_leads")
      .select("*")
      .eq("campaign_id", campaignId)
      .eq("client_id", client.id)
      .maybeSingle();

    if (existingLead) {
      lead = existingLead;
      if (resolvedStageId && existingLead.stage_id !== resolvedStageId) {
        const { data: updatedLead } = await supabase
          .from("campaign_leads")
          .update({
            stage_id: resolvedStageId,
            notes: notes || existingLead.notes,
            last_activity_at: now,
            updated_at: now,
          })
          .eq("id", existingLead.id)
          .select()
          .single();
        if (updatedLead) lead = updatedLead;
      }
    } else {
      const { data: createdLead, error: leadCreateErr } = await supabase
        .from("campaign_leads")
        .insert([
          {
            campaign_id: campaignId,
            client_id: client.id,
            stage_id: resolvedStageId,
            assigned_user_id: user.role === "seller" ? user.id : null,
            notes: notes?.trim() || null,
            last_activity_at: now,
            version: 1,
            created_at: now,
            updated_at: now,
          },
        ])
        .select()
        .single();

      if (leadCreateErr) {
        console.error("Erro ao vincular lead à campanha:", leadCreateErr);
      } else {
        lead = createdLead;
      }
    }

    // 5. Garantir que a conversa existe em conversations (para abrir no Kanban e no chat)
    let conversation: any = null;
    const { data: existingConvs } = await supabase
      .from("conversations")
      .select("*")
      .or(`contact_client_id.eq.${client.id},contact_phone.eq.${phone},contact_phone.eq.${rawDigits}`);

    if (existingConvs && existingConvs.length > 0) {
      conversation = existingConvs[0];
      // Atualizar vínculo se necessário
      if (!conversation.contact_client_id || !conversation.campaign_lead_id) {
        const { data: updConv } = await supabase
          .from("conversations")
          .update({
            contact_client_id: client.id,
            campaign_lead_id: lead?.id || conversation.campaign_lead_id,
            updated_at: now,
          })
          .eq("id", conversation.id)
          .select()
          .single();
        if (updConv) conversation = updConv;
      }
    } else {
      // Obter instância padrão ativa do WhatsApp
      const { data: defaultInst } = await supabase
        .from("whatsapp_instances")
        .select("id")
        .eq("is_default", true)
        .limit(1)
        .maybeSingle();

      const instanceId = defaultInst?.id || "6c98699d-3684-4a35-a47f-8dfcaa950476";

      // Checar se já existe por instance_id + phone para respeitar uq_conversations_instance_phone
      const { data: existingPhoneConv } = await supabase
        .from("conversations")
        .select("id")
        .eq("instance_id", instanceId)
        .or(`contact_phone.eq.${phone},contact_phone.eq.${rawDigits}`)
        .limit(1)
        .maybeSingle();

      if (existingPhoneConv) {
        const { data: updConv } = await supabase
          .from("conversations")
          .update({
            contact_client_id: client.id,
            campaign_lead_id: lead?.id || null,
            contact_name: client.name,
            updated_at: now,
          })
          .eq("id", existingPhoneConv.id)
          .select()
          .single();
        conversation = updConv || existingPhoneConv;
      } else {
        const { data: newConv, error: convErr } = await supabase
          .from("conversations")
          .insert([
            {
              instance_id: instanceId,
              contact_client_id: client.id,
              campaign_lead_id: lead?.id || null,
              assigned_user_id: user.role === "seller" ? user.id : null,
              contact_phone: phone || rawPhone.trim(),
              contact_name: client.name,
              status: "waiting_user",
              unread_count: 0,
              last_message_text: "Lead adicionado manualmente",
              last_message_at: now,
              created_at: now,
              updated_at: now,
            },
          ])
          .select()
          .single();

        if (convErr) {
          console.error("Erro ao criar conversa do lead:", convErr);
        } else {
          conversation = newConv;
        }
      }
    }

    // 6. Registrar em audit_logs
    await supabase.from("audit_logs").insert([
      {
        id: "log_" + Date.now() + "_" + Math.random().toString(36).substring(2, 6),
        operator_email: user.email,
        action: "Cadastrou novo cliente/lead manual",
        target_client_id: client.id,
        target_client_name: client.name,
        details: JSON.stringify({
          campaign_id: campaignId,
          stage_id: resolvedStageId,
          phone,
          lead_id: lead?.id,
          conversation_id: conversation?.id,
        }),
        created_at: now,
      },
    ]);

    return NextResponse.json({
      success: true,
      client,
      lead,
      conversation,
    });
  } catch (err: any) {
    console.error("Erro no cadastro de lead manual:", err);
    return NextResponse.json({ error: err.message || "Erro no servidor." }, { status: 500 });
  }
}
