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
