import { NextRequest, NextResponse } from "next/server";
import { EvolutionService } from "@/lib/evolution-api";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { number, text, instanceName } = body;

    if (!number || !text) {
      return NextResponse.json(
        { success: false, error: "Número e texto são obrigatórios" },
        { status: 400 }
      );
    }

    const result = await EvolutionService.sendTextMessage(number, text, instanceName);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Erro ao enviar mensagem via Evolution API" },
      { status: 500 }
    );
  }
}
