import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/ai/config - Obter status de configuração da IA (Gemini ou OpenAI)
export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const geminiKey = process.env.GEMINI_API_KEY;
    const openAiKey = process.env.OPENAI_API_KEY;

    let activeProvider = "heuristic";
    let activeModel = "regras-internas";
    let maskedKey = null;

    if (geminiKey) {
      activeProvider = "gemini";
      activeModel = process.env.GEMINI_MODEL || "gemini-1.5-flash";
      maskedKey = geminiKey.slice(0, 6) + "..." + geminiKey.slice(-4);
    } else if (openAiKey) {
      activeProvider = "openai";
      activeModel = process.env.OPENAI_MODEL || "gpt-4o-mini";
      maskedKey = openAiKey.slice(0, 6) + "..." + openAiKey.slice(-4);
    }

    return NextResponse.json({
      success: true,
      configured: !!(geminiKey || openAiKey),
      provider: activeProvider,
      model: activeModel,
      maskedKey,
      geminiConfigured: !!geminiKey,
      openAiConfigured: !!openAiKey,
      description:
        activeProvider === "gemini"
          ? `Provedor Google Gemini ativo (${activeModel}) via Google AI Studio.`
          : activeProvider === "openai"
          ? `Provedor OpenAI ativo (${activeModel}).`
          : "Modo Heurístico ativo (análise comercial com base nas regras oficiais da Navetech Telecom).",
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Erro ao obter status da IA" },
      { status: 500 }
    );
  }
}
