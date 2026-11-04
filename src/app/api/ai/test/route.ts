import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// POST /api/ai/test - Testar credenciais da API da OpenAI
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const keyToTest = body.apiKey?.trim() || process.env.OPENAI_API_KEY;
    const modelToTest = body.model?.trim() || process.env.OPENAI_MODEL || "gpt-4o-mini";

    if (!keyToTest) {
      return NextResponse.json({
        success: false,
        error: "Nenhuma chave de API fornecida nem configurada nas variáveis de ambiente (OPENAI_API_KEY).",
      });
    }

    const startTime = Date.now();

    // Chamada de teste rápida com modelo leve
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${keyToTest}`,
      },
      body: JSON.stringify({
        model: modelToTest,
        messages: [{ role: "user", content: "Ping: diga OK se estiver funcionando." }],
        max_tokens: 5,
        temperature: 0,
      }),
    });

    const latencyMs = Date.now() - startTime;

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      return NextResponse.json({
        success: false,
        error: errData.error?.message || `Erro da OpenAI HTTP ${res.status}`,
        latencyMs,
      });
    }

    const data = await res.json();
    const reply = data.choices?.[0]?.message?.content?.trim() || "OK";

    return NextResponse.json({
      success: true,
      message: `Conexão com a OpenAI bem-sucedida! Modelo: ${modelToTest}`,
      sampleResponse: reply,
      latencyMs,
    });
  } catch (err: any) {
    return NextResponse.json({
      success: false,
      error: "Falha na comunicação com o servidor da OpenAI: " + err.message,
    });
  }
}
