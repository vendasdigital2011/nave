import { NextResponse } from "next/server";
import { EvolutionService } from "@/lib/evolution-api";

export async function GET() {
  try {
    const result = await EvolutionService.fetchInstances();
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Erro ao consultar instâncias" },
      { status: 500 }
    );
  }
}
