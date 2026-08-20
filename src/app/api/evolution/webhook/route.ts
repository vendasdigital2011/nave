import { NextRequest, NextResponse } from "next/server";
import { EvolutionService } from "@/lib/evolution-api";
import { createClient } from "@/lib/supabase/client";

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json().catch(() => ({}));
    const event = payload.event;
    const instance = payload.instance || payload.instanceName || "naveprospect";

    console.log(`[Evolution Webhook] Event: ${event} on instance: ${instance}`);

    // Trata mensagem recebida (inbound)
    if (event === "messages.upsert" || event === "MESSAGES_UPSERT") {
      const data = payload.data;
      const key = data?.key;
      const message = data?.message;
      const isFromMe = key?.fromMe || false;

      if (!isFromMe && key?.remoteJid) {
        const rawPhone = key.remoteJid.replace(/@.*$/, "");
        const cleanPhone = rawPhone.replace(/\D/g, "");
        const text =
          message?.conversation ||
          message?.extendedTextMessage?.text ||
          (message?.audioMessage ? "🎤 [Áudio]" : message?.imageMessage ? "📷 [Imagem]" : "[Mensagem/Anexo]");

        EvolutionService.saveMessage({
          instance_name: instance,
          client_phone: cleanPhone,
          message: text,
          direction: "inbound",
          status: "delivered",
        });

        // Atualiza o status do cliente no Supabase para 'morno' (Em Conversa) quando ele responde!
        try {
          const supabase = createClient();
          const { data: clients } = await supabase.from("clients").select("id, status, phone");
          if (clients && clients.length > 0) {
            const target = clients.find(
              (c) =>
                c.phone.replace(/\D/g, "").includes(cleanPhone) ||
                cleanPhone.includes(c.phone.replace(/\D/g, ""))
            );
            if (target && (target.status === "importados" || target.status === "frio")) {
              await supabase
                .from("clients")
                .update({ status: "morno", updated_at: new Date().toISOString() })
                .eq("id", target.id);
              console.log(`[Webhook] Cliente ${target.id} movido automaticamente para 'Em Conversa' (morno)`);
            }
          }
        } catch (dbErr) {
          console.error("[Webhook DB Update Error]:", dbErr);
        }
      }
    }

    return NextResponse.json({ success: true, received: true });
  } catch (error: any) {
    console.error("[Evolution Webhook Error]:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    status: "online",
    service: "NaveProspect Evolution Webhook",
    timestamp: new Date().toISOString(),
  });
}
