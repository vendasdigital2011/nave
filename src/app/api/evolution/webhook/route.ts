import { NextRequest, NextResponse } from "next/server";
import { EvolutionService } from "@/lib/evolution-api";

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json().catch(() => ({}));
    const event = payload.event;
    const instance = payload.instance || payload.instanceName || "naveprospect";

    console.log(`[Evolution Webhook] Event: ${event} on instance: ${instance}`);

    // Trata mensagem recebida
    if (event === "messages.upsert" || event === "MESSAGES_UPSERT") {
      const data = payload.data;
      const key = data?.key;
      const message = data?.message;
      const isFromMe = key?.fromMe || false;

      if (!isFromMe && key?.remoteJid) {
        const phone = key.remoteJid.replace(/@.*$/, "");
        const text =
          message?.conversation ||
          message?.extendedTextMessage?.text ||
          message?.imageMessage?.caption ||
          "[Mídia/Anexo]";

        EvolutionService.saveMessage({
          instance_name: instance,
          client_phone: phone,
          message: text,
          direction: "inbound",
          status: "delivered",
        });
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
