import { NextResponse } from "next/server";
import {
  isTeamModuleEnabled,
  listAuditEvents,
  TeamServiceError,
} from "@/modules/team-management/server/team-service";

export async function GET() {
  if (!isTeamModuleEnabled()) {
    return NextResponse.json(
      {
        success: false,
        error: "Módulo de Gestão de Equipe desativado via feature flag (NP_TEAM_MODULE_ENABLED=false).",
      },
      { status: 403 }
    );
  }

  try {
    const events = await listAuditEvents(50);
    return NextResponse.json({ success: true, events });
  } catch (err: any) {
    const status = err instanceof TeamServiceError ? err.statusCode : 500;
    return NextResponse.json(
      { success: false, error: err.message || "Erro ao consultar trilha de auditoria." },
      { status }
    );
  }
}
