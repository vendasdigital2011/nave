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

// GET /api/campaigns/[id] - Obter detalhes e etapas da campanha
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    }

    const { id } = await params;
    const supabase = createServiceClient();

    // 1. Buscar campanha
    const { data: campaign, error: campErr } = await supabase
      .from("campaigns")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (campErr || !campaign) {
      // Fallback para Upgrade legado se ainda não estiver no banco
      if (id === "c0000000-0000-0000-0000-000000000001" || id === "legacy") {
        return NextResponse.json({
          success: true,
          campaign: {
            id: "c0000000-0000-0000-0000-000000000001",
            name: "Upgrade 50 → 100 Mega",
            type: "upgrade",
            status: "active",
          },
          stages: [
            { id: "10000000-0000-0000-0000-000000000001", name: "Importados", position: 0, stage_kind: "open", color: "#64748B" },
            { id: "10000000-0000-0000-0000-000000000002", name: "Contato Iniciado", position: 1, stage_kind: "open", color: "#3B82F6" },
            { id: "10000000-0000-0000-0000-000000000003", name: "Em Negociação", position: 2, stage_kind: "open", color: "#F59E0B" },
            { id: "10000000-0000-0000-0000-000000000004", name: "Proposta Enviada", position: 3, stage_kind: "open", color: "#FF6A00" },
            { id: "10000000-0000-0000-0000-000000000005", name: "Vendido", position: 4, stage_kind: "won", color: "#10B981" },
            { id: "10000000-0000-0000-0000-000000000006", name: "Desativado", position: 5, stage_kind: "lost", color: "#EF4444" },
          ],
        });
      }
      return NextResponse.json({ error: "Campanha não encontrada." }, { status: 404 });
    }

    // 2. Buscar etapas da campanha
    const { data: stages, error: stgErr } = await supabase
      .from("campaign_stages")
      .select("*")
      .eq("campaign_id", id)
      .order("position", { ascending: true });

    return NextResponse.json({
      success: true,
      campaign,
      stages: stages || [],
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Erro no servidor." }, { status: 500 });
  }
}
