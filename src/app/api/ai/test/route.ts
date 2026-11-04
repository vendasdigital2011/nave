import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// POST /api/ai/test - Testar credenciais da API do Gemini ou da OpenAI
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
    const provider = body.provider || (body.apiKey?.startsWith("AIzaSy") ? "gemini" : "gemini");
    const keyToTest =
      body.apiKey?.trim() ||
      (provider === "gemini" ? process.env.GEMINI_API_KEY : process.env.OPENAI_API_KEY);

    if (!keyToTest) {
      return NextResponse.json({
        success: false,
        error: `Nenhuma chave de API fornecida nem configurada nas variáveis de ambiente (${
          provider === "gemini" ? "GEMINI_API_KEY" : "OPENAI_API_KEY"
        }).`,
      });
    }

    const startTime = Date.now();

    // 1. Teste para Google Gemini
    if (provider === "gemini" || keyToTest.startsWith("AIzaSy")) {
      const model = body.model?.trim() || process.env.GEMINI_MODEL || "gemini-1.5-flash";
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${keyToTest}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: "Diga apenas: 'OK Navetech Telecom'." }] }],
            generationConfig: { maxOutputTokens: 10, temperature: 0 },
          }),
        }
      );

      const latencyMs = Date.now() - startTime;

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        return NextResponse.json({
          success: false,
          error:
            errData.error?.message ||
            `Erro da API Google Gemini HTTP ${res.status}. Verifique se a chave do AI Studio está correta.`,
          latencyMs,
        });
      }

      const data = await res.json();
      const reply = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "OK";

      return NextResponse.json({
        success: true,
        provider: "gemini",
        message: `Conexão com o Google Gemini bem-sucedida! Modelo: ${model}`,
        sampleResponse: reply,
        latencyMs,
      });
    }

    // 2. Teste para OpenAI
    const model = body.model?.trim() || process.env.OPENAI_MODEL || "gpt-4o-mini";
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${keyToTest}`,
      },
      body: JSON.stringify({
        model,
        messages: [{ role: "user", content: "Diga apenas OK." }],
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
      provider: "openai",
      message: `Conexão com a OpenAI bem-sucedida! Modelo: ${model}`,
      sampleResponse: reply,
      latencyMs,
    });
  } catch (err: any) {
    return NextResponse.json({
      success: false,
      error: "Falha na comunicação com o servidor de IA: " + err.message,
    });
  }
}
