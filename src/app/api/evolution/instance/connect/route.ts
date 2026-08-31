import { NextRequest, NextResponse } from "next/server";
import { EvolutionService } from "@/lib/evolution-api";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const instanceName = searchParams.get("instanceName") || process.env.EVOLUTION_INSTANCE_NAME || "nave";
    const result = await EvolutionService.connectInstance(instanceName);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Erro ao conectar instância" },
      { status: 500 }
    );
  }
}
