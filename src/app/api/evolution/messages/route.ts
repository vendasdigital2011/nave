import { NextRequest, NextResponse } from "next/server";
import { ChatMessage } from "@/lib/evolution-api";

export async function POST(req: NextRequest) {
  try {
    const { number, instanceName = "naveprospect" } = await req.json();

    if (!number) {
      return NextResponse.json({ success: false, error: "Número não informado." }, { status: 400 });
    }

    const cleanNumber = number.replace(/\D/g, "");
    const formattedNumber = cleanNumber.startsWith("55") ? cleanNumber : `55${cleanNumber}`;
    const jid = `${formattedNumber}@s.whatsapp.net`;
    const jidNoCountry = cleanNumber.startsWith("55") ? `${cleanNumber.slice(2)}@s.whatsapp.net` : `${cleanNumber}@s.whatsapp.net`;

    const baseUrl = (process.env.EVOLUTION_API_URL || "https://evolutionapi.vps10855.panel.icontainer.net").replace(/\/$/, "");
    const apiKey = process.env.EVOLUTION_API_KEY || "PMhtTHmZZyRRN4A7mi8m2FYHMEH6FYf8";
    const url = `${baseUrl.replace("http://", "https://")}/chat/findMessages/${instanceName}`;

    // Buscar mensagens por remoteJidAlt e remoteJid
    const fetchByJid = async (targetJid: string) => {
      try {
        const res = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: apiKey,
          },
          body: JSON.stringify({
            where: {
              key: {
                remoteJidAlt: targetJid,
              },
            },
            limit: 100,
          }),
        });

        if (!res.ok) return [];
        const json = await res.json();
        return json?.messages?.records || json?.records || json?.data || [];
      } catch {
        return [];
      }
    };

    const fetchDirect = async (targetJid: string) => {
      try {
        const res = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: apiKey,
          },
          body: JSON.stringify({
            where: {
              key: {
                remoteJid: targetJid,
              },
            },
            limit: 100,
          }),
        });

        if (!res.ok) return [];
        const json = await res.json();
        return json?.messages?.records || json?.records || json?.data || [];
      } catch {
        return [];
      }
    };

    const [altRecords, directRecords] = await Promise.all([
      fetchByJid(jid),
      fetchDirect(jid),
    ]);

    const combinedMap = new Map<string, any>();
    [...altRecords, ...directRecords].forEach((rec) => {
      if (rec && rec.key && rec.key.id) {
        combinedMap.set(rec.key.id, rec);
      }
    });

    const records = Array.from(combinedMap.values());

    const messages: ChatMessage[] = records
      .map((r: any) => {
        const isFromMe = r.key?.fromMe || false;
        const msg = r.message || {};
        let text =
          msg.conversation ||
          msg.extendedTextMessage?.text ||
          (msg.audioMessage
            ? "🎤 [Áudio]"
            : msg.imageMessage
            ? "📷 [Imagem]"
            : msg.documentMessage
            ? "📄 [Documento]"
            : msg.stickerMessage
            ? "🎨 [Figurinha]"
            : "[Mensagem]");

        const timestampSeconds = r.messageTimestamp || Math.floor(Date.now() / 1000);
        const createdAt = new Date(timestampSeconds * 1000).toISOString();

        return {
          id: r.key?.id || "msg_" + Math.random().toString(36).substr(2, 6),
          instance_name: instanceName,
          client_phone: formattedNumber,
          message: text,
          direction: isFromMe ? ("outbound" as const) : ("inbound" as const),
          status: isFromMe ? ("sent" as const) : ("delivered" as const),
          created_at: createdAt,
        };
      })
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

    return NextResponse.json({ success: true, count: messages.length, messages });
  } catch (error: any) {
    console.error("[Evolution Fetch Messages Error]:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
