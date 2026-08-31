import { NextRequest, NextResponse } from "next/server";
import { EvolutionService } from "@/lib/evolution-api";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const instanceName = body.instanceName || process.env.EVOLUTION_INSTANCE_NAME || "nave";
    const result = await EvolutionService.createInstance(instanceName);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Erro ao criar instância" },
      { status: 500 }
    );
  }
}
