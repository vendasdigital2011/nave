import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { AUTH_COOKIE_NAME, AuthUser } from "@/lib/auth-constants";
import { createServiceClient } from "@/lib/supabase/server";
import { EvolutionService } from "@/lib/evolution-api";

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

// GET /api/evolution/instances - Lista instâncias de WhatsApp com RBAC e sincronização
export async function GET() {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    }

    const supabase = createServiceClient();

    // 1. Consultar estado ao vivo na Evolution API
    const liveRes = await EvolutionService.fetchInstances();
    const liveMap: Record<string, any> = {};
    if (liveRes.success && Array.isArray(liveRes.instances)) {
      liveRes.instances.forEach((inst: any) => {
        const name = inst.name || inst.instanceName;
        if (name) liveMap[name] = inst;
      });
    }

    // 2. Consultar instâncias no Supabase Cloud
    let dbQuery = supabase
      .from("whatsapp_instances")
      .select(`
        *,
        owner:profiles!whatsapp_instances_owner_user_id_fkey(
          id,
          display_name,
          role
        )
      `)
      .order("is_default", { ascending: false });

    // Se for vendedor comum, vê apenas a sua própria instância e a corporativa (is_default = true)
    if (user.role === "seller") {
      dbQuery = dbQuery.or(`owner_user_id.eq.${user.id},is_default.eq.true`);
    }

    const { data: dbInstances, error: dbErr } = await dbQuery;

    // Se tabela ainda não foi criada ou deu erro, fallback para a instância viva nave
    if (dbErr || !dbInstances || dbInstances.length === 0) {
      return NextResponse.json({
        success: true,
        instances: liveRes.instances || [],
        db_instances: [],
      });
    }

    // 3. Atualizar status no banco se houve mudança na Evolution API
    const enrichedInstances = await Promise.all(
      dbInstances.map(async (inst: any) => {
        const live = liveMap[inst.provider_instance_name];
        let currentStatus = inst.status;
        let ownerJid = live?.ownerJid;
        let profileName = live?.profileName;

        if (live) {
          currentStatus = live.connectionStatus || live.status || (live.ownerJid ? "open" : "close");
        } else if (inst.provider_instance_name === "nave") {
          currentStatus = "open";
        }

        // Se o status mudou, atualiza de forma assíncrona
        if (currentStatus !== inst.status) {
          await supabase
            .from("whatsapp_instances")
            .update({
              status: currentStatus,
              last_seen_at: new Date().toISOString(),
              ...(profileName ? { profile_name: profileName } : {}),
            })
            .eq("id", inst.id);
        }

        return {
          ...inst,
          status: currentStatus,
          live_info: live || null,
        };
      })
    );

    return NextResponse.json({
      success: true,
      instances: liveRes.instances || [], // Compatibilidade com frontend anterior
      db_instances: enrichedInstances,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Erro ao consultar instâncias" },
      { status: 500 }
    );
  }
}
