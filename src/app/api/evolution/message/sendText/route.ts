import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { AUTH_COOKIE_NAME, AuthUser } from "@/lib/auth-constants";
import { EvolutionService } from "@/lib/evolution-api";
import { createServiceClient } from "@/lib/supabase/server";
import { 
  advanceStageOnMessageSent,
  handleInvalidWhatsAppNumber,
  isWhatsAppNonExistentError
} from "@/lib/kanban-automation";

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

// POST /api/evolution/message/sendText - Envio manual seguro de mensagem via WhatsApp
export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    }

    const body = await req.json();
    const { number, text, instanceName: reqInstanceName, campaign_lead_id } = body;

    if (!number || !text) {
      return NextResponse.json(
        { success: false, error: "Número e texto são obrigatórios." },
        { status: 400 }
      );
    }

    const supabase = createServiceClient();

    // 1. Resolver qual instância utilizar para envio
    let activeInstanceName = reqInstanceName;

    if (!activeInstanceName) {
      // Buscar instância do próprio vendedor
      const { data: myInst } = await supabase
        .from("whatsapp_instances")
        .select("provider_instance_name, status")
        .eq("owner_user_id", user.id)
        .eq("is_active", true)
        .maybeSingle();

      if (myInst && myInst.status === "open") {
        activeInstanceName = myInst.provider_instance_name;
      } else {
        // Fallback para a instância corporativa padrão
        activeInstanceName = "nave";
      }
    }

    // 2. Validar permissão sobre a instância se não for a corporativa
    if (activeInstanceName !== "nave" && user.role === "seller") {
      const { data: instCheck } = await supabase
        .from("whatsapp_instances")
        .select("owner_user_id")
        .eq("provider_instance_name", activeInstanceName)
        .maybeSingle();

      if (instCheck && instCheck.owner_user_id !== user.id) {
        return NextResponse.json(
          { error: "Acesso negado: você não tem permissão para disparar mensagens por esta instância." },
          { status: 403 }
        );
      }
    }

    // 3. Executar envio na Evolution API
    const result = await EvolutionService.sendTextMessage(number, text, activeInstanceName);

    if (!result.success) {
      if (isWhatsAppNonExistentError(result.error)) {
        await handleInvalidWhatsAppNumber(supabase, {
          campaignLeadId: campaign_lead_id || null,
          phone: number,
          actorUserId: user.id || null,
          rawError: result.error,
        });

        return NextResponse.json(
          { 
            success: false, 
            error: "Este número não possui WhatsApp ativo. O lead foi movido automaticamente para a coluna de Desativados / Inválidos.",
            is_invalid_number: true,
          },
          { status: 400 }
        );
      }

      return NextResponse.json(
        { success: false, error: result.error || "Falha no envio pela Evolution API." },
        { status: 502 }
      );
    }

    // 4. Se campaign_lead_id fornecido, avança etapa no Kanban
    if (campaign_lead_id) {
      try {
        await advanceStageOnMessageSent(supabase, {
          conversationId: "direct_send",
          campaignLeadId: campaign_lead_id,
          actorUserId: user.id || null,
        });
      } catch {
        // Ignora
      }
    }

    // 5. Registrar auditoria do disparo manual
    try {
      const cleanPhone = number.replace(/\D/g, "");
      const maskedPhone = cleanPhone.length >= 8
        ? `${cleanPhone.slice(0, 4)}****${cleanPhone.slice(-2)}`
        : "****";

      await supabase.from("audit_logs").insert({
        actor_user_id: user.id,
        action: "whatsapp_message.sent",
        target_entity: "whatsapp_messages",
        details: {
          instance_name: activeInstanceName,
          recipient_masked: maskedPhone,
          length: text.length,
        },
      });
    } catch {
      // Ignora erro de auditoria
    }

    return NextResponse.json({
      success: true,
      instance_name: activeInstanceName,
      data: result.data,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Erro interno ao enviar mensagem." },
      { status: 500 }
    );
  }
}
