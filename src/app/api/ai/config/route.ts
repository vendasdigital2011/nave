import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/ai/config - Obter status de configuração da IA (sem vazar a chave secreta)
export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    const model = process.env.OPENAI_MODEL || "gpt-4o-mini";

    let maskedKey = null;
    if (apiKey && apiKey.length > 8) {
      maskedKey = apiKey.slice(0, 7) + "..." + apiKey.slice(-4);
    }

    return NextResponse.json({
      success: true,
      configured: !!apiKey,
      provider: apiKey ? "openai" : "heuristic",
      model,
      maskedKey,
      description: apiKey
        ? "Provedor OpenAI ativo com análise semântica generativa."
        : "Modo Heurístico ativo (análise comercial interna com base nas regras da Navetech).",
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Erro ao obter status da IA" },
      { status: 500 }
    );
  }
}
