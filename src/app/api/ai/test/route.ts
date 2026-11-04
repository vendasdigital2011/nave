import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { AUTH_COOKIE_NAME, AuthUser } from "@/lib/auth-constants";
import { createClient } from "@/lib/supabase/server";

async function getAuthenticatedUser(): Promise<AuthUser | null> {
  // 1. Cookie oficial de sessão da aplicação
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(AUTH_COOKIE_NAME);
    if (sessionCookie?.value) {
      const parsed = JSON.parse(Buffer.from(sessionCookie.value, "base64").toString("utf-8"));
      if (parsed) return parsed;
    }
  } catch {}

  // 2. Fallback para Supabase Auth nativo
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      return {
        id: user.id,
        email: user.email || "",
        name: user.user_metadata?.full_name || user.email || "Usuário",
        role: "admin",
      };
    }
  } catch {}

  return null;
}

// POST /api/ai/test - Testar credenciais da API do Gemini ou da OpenAI
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();

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
    if (provider === "gemini" || keyToTest.startsWith("AIzaSy") || keyToTest.startsWith("AQ.")) {
      const preferredModel = body.model?.trim() || process.env.GEMINI_MODEL || "gemini-3.5-flash";
      const candidateModels = [
        preferredModel,
        "gemini-3.5-flash",
        "gemini-3.8-flash",
        "gemini-2.5-flash",
        "gemini-1.5-flash",
      ];
      const uniqueModels = Array.from(new Set(candidateModels));

      let lastErrData: any = null;
      let lastStatus = 500;
      let successfulModel = preferredModel;
      let reply = "";
      let isSuccess = false;

      for (const model of uniqueModels) {
        try {
          const res = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${keyToTest}`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                contents: [{ parts: [{ text: "Diga apenas: 'OK Navetech Telecom'." }] }],
                generationConfig: { maxOutputTokens: 20, temperature: 0 },
              }),
            }
          );

          if (res.ok) {
            const data = await res.json();
            reply = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "OK";
            successfulModel = model;
            isSuccess = true;
            break;
          } else {
            lastStatus = res.status;
            lastErrData = await res.json().catch(() => ({}));
          }
        } catch (fetchErr: any) {
          lastErrData = { error: { message: fetchErr.message } };
        }
      }

      const latencyMs = Date.now() - startTime;

      if (!isSuccess) {
        return NextResponse.json({
          success: false,
          error:
            lastErrData?.error?.message ||
            `Erro da API Google Gemini HTTP ${lastStatus}. Verifique se a chave do AI Studio está correta.`,
          latencyMs,
        });
      }

      return NextResponse.json({
        success: true,
        provider: "gemini",
        message: `Conexão com o Google Gemini bem-sucedida! Modelo ativo: ${successfulModel}`,
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
