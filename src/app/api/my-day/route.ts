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

// GET /api/my-day - Dados operacionais centralizados para o "Meu Dia"
export async function GET(request: Request) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const campaignId = searchParams.get("campaign_id");

    const supabase = createServiceClient();
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999).toISOString();
    const next7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();

    // 1. Buscar leads atribuídos ao usuário logado
    let leadsQuery = supabase
      .from("campaign_leads")
      .select(`
        *,
        client:clients(*),
        stage:campaign_stages(id, name, stage_kind, color)
      `)
      .eq("assigned_user_id", user.id);

    if (campaignId && campaignId !== "all") {
      leadsQuery = leadsQuery.eq("campaign_id", campaignId);
    }

    const { data: myLeads, error: leadsErr } = await leadsQuery;
    const leadsList = myLeads || [];

    // Contadores de leads
    const assignedLeadsCount = leadsList.length;
    const hotLeadsCount = leadsList.filter((l: any) => {
      const stageName = l.stage?.name?.toLowerCase() || "";
      return stageName.includes("interessado") || stageName.includes("quente") || stageName.includes("conversa");
    }).length;

    // 2. Buscar tarefas atribuídas ao usuário
    let tasksQuery = supabase
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
      .eq("assigned_user_id", user.id)
      .order("due_at", { ascending: true });

    const { data: allTasks, error: tasksErr } = await tasksQuery;
    const tasksList = (allTasks || []).filter((t: any) => {
      if (campaignId && campaignId !== "all") {
        return t.lead?.campaign_id === campaignId;
      }
      return true;
    });

    // Separar tarefas por temporalidade e status
    const overdueTasks = tasksList.filter(
      (t) => t.status === "pending" && t.due_at < now.toISOString()
    );

    const todayTasks = tasksList.filter(
      (t) =>
        t.status === "pending" &&
        t.due_at >= startOfToday &&
        t.due_at <= endOfToday
    );

    const upcomingTasks = tasksList.filter(
      (t) =>
        t.status === "pending" &&
        t.due_at > endOfToday &&
        t.due_at <= next7Days
    );

    const completedTodayTasks = tasksList.filter(
      (t) =>
        t.status === "completed" &&
        t.completed_at &&
        t.completed_at >= startOfToday &&
        t.completed_at <= endOfToday
    );

    // 3. Identificar leads sem nenhuma tarefa futura agendada (leads ociosos)
    const leadIdsWithPendingTasks = new Set(
      tasksList.filter((t) => t.status === "pending").map((t) => t.campaign_lead_id)
    );

    const idleLeads = leadsList
      .filter((l: any) => !leadIdsWithPendingTasks.has(l.id))
      .slice(0, 15); // Limita aos 15 primeiros para foco imediato

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        role: user.role,
        email: user.email,
      },
      kpis: {
        assigned_leads: assignedLeadsCount,
        overdue_tasks: overdueTasks.length,
        today_tasks: todayTasks.length,
        hot_leads: hotLeadsCount,
        completed_today: completedTodayTasks.length,
      },
      tasks: {
        overdue: overdueTasks,
        today: todayTasks,
        upcoming: upcomingTasks,
      },
      idle_leads: idleLeads,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Erro ao carregar dados do Meu Dia." },
      { status: 500 }
    );
  }
}
