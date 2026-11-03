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

// PATCH /api/tasks/[id] - Atualizar status, reagendar ou editar tarefa
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    }

    const { id: taskId } = await params;
    const body = await request.json();
    const { status, due_at, title, description, notes } = body;

    const supabase = createServiceClient();

    // 1. Buscar a tarefa existente
    const { data: existingTask, error: findErr } = await supabase
      .from("lead_tasks")
      .select("*")
      .eq("id", taskId)
      .single();

    if (findErr || !existingTask) {
      return NextResponse.json({ error: "Tarefa não encontrada." }, { status: 404 });
    }

    // RBAC: Se for seller, só pode editar suas próprias tarefas
    if (user.role === "seller" && existingTask.assigned_user_id !== user.id) {
      return NextResponse.json(
        { error: "Acesso negado: você só pode editar suas próprias tarefas." },
        { status: 403 }
      );
    }

    // 2. Montar objeto de atualização
    const updates: Record<string, any> = {};

    if (status) {
      updates.status = status;
      if (status === "completed") {
        updates.completed_at = new Date().toISOString();
      } else {
        updates.completed_at = null;
      }
    }

    if (due_at) {
      updates.due_at = due_at;
    }

    if (title !== undefined) updates.title = title;
    if (description !== undefined) updates.description = description;

    // Se passou notes de conclusão, anexa na descrição ou histórico
    if (notes) {
      updates.description = updates.description
        ? `${updates.description}\n[Conclusão ${new Date().toLocaleDateString('pt-BR')}]: ${notes}`
        : `[Conclusão ${new Date().toLocaleDateString('pt-BR')}]: ${notes}`;
    }

    const { data: updatedTask, error: updateErr } = await supabase
      .from("lead_tasks")
      .update(updates)
      .eq("id", taskId)
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

    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }

    // Atualiza last_activity_at no campaign_lead
    if (existingTask.campaign_lead_id) {
      await supabase
        .from("campaign_leads")
        .update({ last_activity_at: new Date().toISOString() })
        .eq("id", existingTask.campaign_lead_id);
    }

    return NextResponse.json({ success: true, task: updatedTask });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Erro ao atualizar tarefa." },
      { status: 500 }
    );
  }
}

// DELETE /api/tasks/[id] - Excluir ou cancelar tarefa
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    }

    const { id: taskId } = await params;
    const supabase = createServiceClient();

    // 1. Buscar a tarefa existente
    const { data: existingTask, error: findErr } = await supabase
      .from("lead_tasks")
      .select("*")
      .eq("id", taskId)
      .single();

    if (findErr || !existingTask) {
      return NextResponse.json({ error: "Tarefa não encontrada." }, { status: 404 });
    }

    // RBAC: Se for seller, só pode excluir tarefas criadas por ele ou atribuídas a ele
    if (user.role === "seller" && existingTask.assigned_user_id !== user.id && existingTask.created_by !== user.id) {
      return NextResponse.json(
        { error: "Acesso negado." },
        { status: 403 }
      );
    }

    const { error: delErr } = await supabase
      .from("lead_tasks")
      .delete()
      .eq("id", taskId);

    if (delErr) {
      return NextResponse.json({ error: delErr.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "Tarefa removida com sucesso." });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Erro ao excluir tarefa." },
      { status: 500 }
    );
  }
}
