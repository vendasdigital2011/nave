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

// GET /api/conversations - Listar conversas com filtros e RBAC
export async function GET(request: Request) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const statusFilter = searchParams.get("status") || "all";
    const campaignId = searchParams.get("campaign_id");
    const instanceId = searchParams.get("instance_id");
    const search = searchParams.get("search");
    const limit = parseInt(searchParams.get("limit") || "50", 10);

    const supabase = createServiceClient();

    let query = supabase
      .from("conversations")
      .select(`
        *,
        client:clients(*),
        campaign_lead:campaign_leads(
          id,
          campaign_id,
          stage_id,
          assigned_user_id,
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
      .order("last_message_at", { ascending: false })
      .limit(limit);

    // 1. RBAC: Vendedor vê conversas atribuídas a ele ou sem responsável (fila de triagem)
    if (user.role === "seller" && user.id) {
      query = query.or(`assigned_user_id.eq.${user.id},assigned_user_id.is.null`);
    }

    // 2. Filtro por status
    if (statusFilter && statusFilter !== "all") {
      query = query.eq("status", statusFilter);
    }

    // 3. Filtro por instância
    if (instanceId && instanceId !== "all") {
      query = query.eq("instance_id", instanceId);
    }

    const { data: conversations, error } = await query;

    if (error) {
      // Fallback básico se join falhar antes da migration
      const { data: fallbackConvs } = await supabase
        .from("conversations")
        .select(`
          *,
          client:clients(*)
        `)
        .order("last_message_at", { ascending: false })
        .limit(limit);

      return NextResponse.json({ success: true, conversations: fallbackConvs || [] });
    }

    // 4. Filtro em memória por campanha ou busca se necessário
    let filtered = conversations || [];

    if (campaignId && campaignId !== "all") {
      filtered = filtered.filter(
        (c: any) => c.campaign_lead?.campaign_id === campaignId
      );
    }

    if (search) {
      const term = search.toLowerCase();
      filtered = filtered.filter(
        (c: any) =>
          c.contact_name?.toLowerCase().includes(term) ||
          c.contact_phone?.includes(term) ||
          c.client?.name?.toLowerCase().includes(term) ||
          c.last_message_text?.toLowerCase().includes(term)
      );
    }

    // Contadores para as abas da Caixa de Entrada
    const counts = {
      all: filtered.length,
      unread: filtered.filter((c: any) => c.unread_count > 0 || c.status === "unread").length,
      waiting_user: filtered.filter((c: any) => c.status === "waiting_user").length,
      waiting_client: filtered.filter((c: any) => c.status === "waiting_client").length,
      triagem: filtered.filter((c: any) => c.status === "triagem").length,
      closed: filtered.filter((c: any) => c.status === "closed").length,
    };

    return NextResponse.json({
      success: true,
      conversations: filtered,
      counts,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Erro ao consultar conversas." },
      { status: 500 }
    );
  }
}

// POST /api/conversations - Obter ou criar conversa para um cliente (auto-provisionamento)
export async function POST(request: Request) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { client_id, campaign_id } = body;

    if (!client_id) {
      return NextResponse.json({ error: "client_id é obrigatório." }, { status: 400 });
    }

    const supabase = createServiceClient();
    const now = new Date().toISOString();

    // 1. Verificar se conversa já existe
    const { data: existingConvs } = await supabase
      .from("conversations")
      .select(`
        *,
        client:clients(*),
        campaign_lead:campaign_leads(
          id,
          campaign_id,
          stage_id,
          assigned_user_id,
          stage:campaign_stages(id, name, color, stage_kind),
          campaign:campaigns(id, name, type)
        )
      `)
      .eq("contact_client_id", client_id)
      .limit(1);

    if (existingConvs && existingConvs.length > 0) {
      return NextResponse.json({ success: true, conversation: existingConvs[0] });
    }

    // 2. Buscar dados do cliente
    const { data: client, error: clientErr } = await supabase
      .from("clients")
      .select("*")
      .eq("id", client_id)
      .maybeSingle();

    if (!client || clientErr) {
      return NextResponse.json({ error: "Cliente não encontrado." }, { status: 404 });
    }

    // 3. Buscar lead correspondente
    let leadQuery = supabase
      .from("campaign_leads")
      .select("id, campaign_id, assigned_user_id")
      .eq("client_id", client_id);
    if (campaign_id) {
      leadQuery = leadQuery.eq("campaign_id", campaign_id);
    }
    const { data: lead } = await leadQuery.limit(1).maybeSingle();

    // 4. Obter instância padrão
    const { data: defaultInst } = await supabase
      .from("whatsapp_instances")
      .select("id")
      .eq("is_default", true)
      .limit(1)
      .maybeSingle();

    const instanceId = defaultInst?.id || "6c98699d-3684-4a35-a47f-8dfcaa950476";

    // 5. Verificar se já existe conversa para esta instância e telefone
    const { data: existingPhoneConv } = await supabase
      .from("conversations")
      .select("id")
      .eq("instance_id", instanceId)
      .eq("contact_phone", client.phone)
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
        .select(`
          *,
          client:clients(*),
          campaign_lead:campaign_leads(
            id,
            campaign_id,
            stage_id,
            assigned_user_id,
            stage:campaign_stages(id, name, color, stage_kind),
            campaign:campaigns(id, name, type)
          )
        `)
        .single();

      return NextResponse.json({ success: true, conversation: updConv || existingPhoneConv });
    }

    // 6. Inserir conversa
    const { data: newConv, error: convErr } = await supabase
      .from("conversations")
      .insert([
        {
          instance_id: instanceId,
          contact_client_id: client.id,
          campaign_lead_id: lead?.id || null,
          assigned_user_id: lead?.assigned_user_id || (user.role === "seller" ? user.id : null),
          contact_phone: client.phone,
          contact_name: client.name,
          status: "waiting_user",
          unread_count: 0,
          last_message_text: "Atendimento iniciado",
          last_message_at: now,
          created_at: now,
          updated_at: now,
        },
      ])
      .select(`
        *,
        client:clients(*),
        campaign_lead:campaign_leads(
          id,
          campaign_id,
          stage_id,
          assigned_user_id,
          stage:campaign_stages(id, name, color, stage_kind),
          campaign:campaigns(id, name, type)
        )
      `)
      .single();

    if (convErr || !newConv) {
      return NextResponse.json(
        { error: "Erro ao provisionar conversa: " + convErr?.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, conversation: newConv });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Erro interno." }, { status: 500 });
  }
}
