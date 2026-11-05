import { NextResponse } from "next/server";
import {
  inviteTeamMember,
  isTeamModuleEnabled,
  listTeamMembers,
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
    const members = await listTeamMembers();
    return NextResponse.json({ success: true, members });
  } catch (err: any) {
    const status = err instanceof TeamServiceError ? err.statusCode : 500;
    return NextResponse.json(
      { success: false, error: err.message || "Erro ao listar equipe." },
      { status }
    );
  }
}

export async function POST(request: Request) {
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
    const body = await request.json();
    const origin =
      request.headers.get("origin") ||
      request.headers.get("referer") ||
      process.env.NEXT_PUBLIC_APP_URL ||
      "https://nave-zeta.vercel.app";

    const requestId = request.headers.get("x-request-id") || undefined;

    const result = await inviteTeamMember(body, origin, requestId);
    return NextResponse.json(result, { status: 201 });
  } catch (err: any) {
    const status = err instanceof TeamServiceError ? err.statusCode : 500;
    return NextResponse.json(
      { success: false, error: err.message || "Erro ao convidar membro." },
      { status }
    );
  }
}
