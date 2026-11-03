import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { AUTH_COOKIE_NAME, AuthUser } from "@/lib/auth-constants";
import { EvolutionService } from "@/lib/evolution-api";
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

// GET /api/evolution/instance/connect - Obter QR Code de pareamento
export async function GET(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const requestedName = searchParams.get("instanceName");

    const supabase = createServiceClient();

    // 1. Resolver qual instância conectar
    let targetInstanceName: string = requestedName || "";

    if (!targetInstanceName) {
      // Busca a instância do usuário logado
      const { data: myInst } = await supabase
        .from("whatsapp_instances")
        .select("provider_instance_name")
        .eq("owner_user_id", user.id)
        .eq("is_active", true)
        .maybeSingle();

      targetInstanceName = myInst?.provider_instance_name || "nave";
    }

    // 2. Proteção de Segurança RBAC: Vendedor só conecta sua própria instância
    if (user.role === "seller") {
      const { data: instCheck } = await supabase
        .from("whatsapp_instances")
        .select("owner_user_id")
        .eq("provider_instance_name", targetInstanceName)
        .maybeSingle();

      if (instCheck && instCheck.owner_user_id !== user.id) {
        return NextResponse.json(
          { error: "Acesso negado: você não pode conectar a instância de outro usuário." },
          { status: 403 }
        );
      }
    }

    // 3. PROTEÇÃO CRÍTICA DA INSTÂNCIA LEGADA NAVE:
    // Se a instância for 'nave' e já estiver conectada, NUNCA chamar connect para não derrubar a sessão ativa!
    if (targetInstanceName === "nave") {
      const stateCheck = await EvolutionService.getConnectionState("nave");
      if (stateCheck.success && stateCheck.state === "open") {
        return NextResponse.json({
          success: true,
          already_connected: true,
          message: "A instância corporativa 'nave' já está conectada e operacional.",
        });
      }
    }

    // 4. Solicitar conexão e QR Code à Evolution API
    const result = await EvolutionService.connectInstance(targetInstanceName);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Erro ao conectar instância" },
      { status: 500 }
    );
  }
}
