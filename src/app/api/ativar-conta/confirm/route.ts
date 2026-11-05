import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { logAuditEvent } from "@/modules/team-management/server/team-service";

export async function POST(request: Request) {
  try {
    const { userId } = await request.json();

    if (!userId || typeof userId !== "string") {
      return NextResponse.json(
        { success: false, error: "Identificador de usuário ausente." },
        { status: 400 }
      );
    }

    const supabase = createServiceClient();
    const now = new Date().toISOString();

    const { data: currentMember, error: fetchErr } = await supabase
      .from("np_team_profiles")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (fetchErr || !currentMember) {
      return NextResponse.json(
        { success: false, error: "Registro de perfil não encontrado." },
        { status: 404 }
      );
    }

    // Se já estava ativo, apenas confirma
    if (currentMember.status === "ativo") {
      return NextResponse.json({ success: true, message: "Conta já ativada." });
    }

    const { error: updateErr } = await supabase
      .from("np_team_profiles")
      .update({
        status: "ativo",
        activated_at: now,
        updated_at: now,
      })
      .eq("user_id", userId);

    if (updateErr) {
      return NextResponse.json(
        { success: false, error: `Falha ao atualizar status: ${updateErr.message}` },
        { status: 500 }
      );
    }

    await logAuditEvent({
      actorUserId: userId,
      targetUserId: userId,
      action: "team.account_activated",
      beforeData: { status: currentMember.status },
      afterData: { status: "ativo", activated_at: now },
    });

    return NextResponse.json({
      success: true,
      message: "Conta ativada com sucesso.",
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Erro interno." },
      { status: 500 }
    );
  }
}
