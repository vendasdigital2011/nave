import { NextResponse } from "next/server";
import {
  isTeamModuleEnabled,
  resendInvite,
  TeamServiceError,
} from "@/modules/team-management/server/team-service";

interface RouteParams {
  params: Promise<{
    userId: string;
  }>;
}

export async function POST(request: Request, { params }: RouteParams) {
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
    const { userId } = await params;
    const origin =
      request.headers.get("origin") ||
      request.headers.get("referer") ||
      process.env.NEXT_PUBLIC_APP_URL ||
      "https://nave-zeta.vercel.app";

    const requestId = request.headers.get("x-request-id") || undefined;

    const result = await resendInvite(userId, origin, requestId);
    return NextResponse.json(result);
  } catch (err: any) {
    const status = err instanceof TeamServiceError ? err.statusCode : 500;
    return NextResponse.json(
      { success: false, error: err.message || "Erro ao reenviar convite." },
      { status }
    );
  }
}
