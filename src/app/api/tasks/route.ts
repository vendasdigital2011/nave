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

// GET /api/tasks - Listar tarefas com filtros
export async function GET(request: Request) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const campaignId = searchParams.get("campaign_id");
    const scope = searchParams.get("scope") || (user.role === "seller" ? "my" : "team");
    const status = searchParams.get("status") || "pending";
    const due = searchParams.get("due") || "all";

    const supabase = createServiceClient();

    let query = supabase
      .from("lead_tasks")
      .select(`
        *,
        lead:campaign_leads(
          id,
          campaign_id,
          client_id,
          stage_id,
          assigned_user_id,
          client:clients(*)
        ),
        assigned_user:profiles!lead_tasks_assigned_user_id_fkey(
          id,
          display_name,
          role
        )
      `)
      .order("due_at", { ascending: true });

    // Restrição RBAC: Vendedores vêem apenas suas próprias tarefas
    if (user.role === "seller" || scope === "my") {
      query = query.eq("assigned_user_id", user.id);
    }

    if (status !== "all") {
      query = query.eq("status", status);
    }

    // Filtros de data
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999).toISOString();

    if (due === "overdue") {
      query = query.lt("due_at", now.toISOString()).eq("status", "pending");
    } else if (due === "today") {
      query = query.gte("due_at", startOfToday).lte("due_at", endOfToday);
    } else if (due === "upcoming") {
      query = query.gt("due_at", endOfToday).eq("status", "pending");
    }

    const { data: tasks, error } = await query;

    if (error) {
      // Se tabela não existe ou erro de join simples, fallback com select básico
      const fallbackQuery = supabase
        .from("lead_tasks")
        .select(`
          *,
          lead:campaign_leads(
            id,
            campaign_id,
            client_id,
            stage_id,
            assigned_user_id,
            client:clients(*)
          )
        `)
        .order("due_at", { ascending: true });

      const { data: fallbackTasks, error: fbErr } = await fallbackQuery;
      if (fbErr) {
        return NextResponse.json({ success: true, tasks: [] });
      }
      return NextResponse.json({ success: true, tasks: fallbackTasks || [] });
    }

    // Filtro por campanha se solicitado
    let filteredTasks = tasks || [];
    if (campaignId && campaignId !== "all") {
      filteredTasks = filteredTasks.filter(
        (t: any) => t.lead?.campaign_id === campaignId
      );
    }

    return NextResponse.json({ success: true, tasks: filteredTasks });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Erro ao consultar tarefas." },
      { status: 500 }
    );
  }
}

// POST /api/tasks - Criar nova tarefa / agendamento de retorno
export async function POST(request: Request) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    }

    const body = await request.json();
    const {
      campaign_lead_id,
      title,
      description,
      due_at,
      type = "followup",
      assigned_user_id,
    } = body;

    if (!campaign_lead_id || !title || !due_at) {
      return NextResponse.json(
        { error: "campaign_lead_id, title e due_at são obrigatórios." },
        { status: 400 }
      );
    }

    const supabase = createServiceClient();

    // Determinar o responsável pela tarefa: especificado > usuário atual
    const targetAssignedUser = assigned_user_id || user.id;

    const { data: newTask, error: insertErr } = await supabase
      .from("lead_tasks")
      .insert({
        campaign_lead_id,
        assigned_user_id: targetAssignedUser,
        created_by: user.id,
        type,
        title: title.trim(),
        description: description ? description.trim() : null,
        due_at,
        status: "pending",
      })
      .select(`
        *,
        lead:campaign_leads(
          id,
          campaign_id,
          client_id,
          stage_id,
          assigned_user_id,
          client:clients(*)
        )
      `)
      .single();

    if (insertErr) {
      return NextResponse.json({ error: insertErr.message }, { status: 500 });
    }

    // Atualiza last_activity_at no campaign_lead
    await supabase
      .from("campaign_leads")
      .update({ last_activity_at: new Date().toISOString() })
      .eq("id", campaign_lead_id);

    return NextResponse.json({ success: true, task: newTask });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Erro ao criar tarefa." },
      { status: 500 }
    );
  }
}
