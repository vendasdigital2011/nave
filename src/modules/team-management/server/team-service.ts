import { createServiceClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/auth";
import {
  InviteMemberInput,
  TeamAuditEvent,
  TeamMember,
  TeamRole,
  TeamStatus,
  UpdateMemberInput,
} from "../types";
import { validateInviteInput, validateUpdateInput } from "../validators";

export function isTeamModuleEnabled(): boolean {
  return process.env.NP_TEAM_MODULE_ENABLED === "true";
}

export class TeamServiceError extends Error {
  statusCode: number;
  code?: string;

  constructor(message: string, statusCode = 400, code?: string) {
    super(message);
    this.name = "TeamServiceError";
    this.statusCode = statusCode;
    this.code = code;
  }
}

async function getAuthenticatedAdmin() {
  const session = await getSession();
  if (!session) {
    throw new TeamServiceError("Sessão não autenticada.", 401, "UNAUTHORIZED");
  }
  if (session.role !== "admin") {
    throw new TeamServiceError(
      "Acesso restrito. Somente administradores podem gerenciar a equipe.",
      403,
      "FORBIDDEN"
    );
  }
  return session;
}

export async function logAuditEvent(params: {
  actorUserId: string | null;
  targetUserId: string | null;
  action: string;
  beforeData?: Record<string, any> | null;
  afterData?: Record<string, any> | null;
  requestId?: string | null;
}) {
  try {
    const supabase = createServiceClient();
    await supabase.from("np_team_audit_events").insert({
      actor_user_id: params.actorUserId,
      target_user_id: params.targetUserId,
      action: params.action,
      before_data: params.beforeData || null,
      after_data: params.afterData || null,
      request_id: params.requestId || null,
    });
  } catch (err: any) {
    console.warn("[TeamService] Falha ao registrar log de auditoria:", err.message);
  }
}

export async function listTeamMembers(): Promise<TeamMember[]> {
  const supabase = createServiceClient();

  const { data: teamProfiles, error: profileErr } = await supabase
    .from("np_team_profiles")
    .select("*")
    .order("created_at", { ascending: false });

  if (profileErr) {
    // Se a tabela ainda não existir no ambiente, retorna lista vazia graceful
    if (profileErr.code === "42P01") {
      return [];
    }
    throw new TeamServiceError(`Erro ao listar equipe: ${profileErr.message}`, 500);
  }

  if (!teamProfiles || teamProfiles.length === 0) {
    return [];
  }

  // Obter metadados de último login dos usuários via Auth Admin
  let lastSignInMap: Record<string, string | null> = {};
  try {
    const { data: authData } = await supabase.auth.admin.listUsers({
      perPage: 1000,
    });
    if (authData?.users) {
      for (const u of authData.users) {
        lastSignInMap[u.id] = u.last_sign_in_at || null;
      }
    }
  } catch (authErr: any) {
    console.warn("[TeamService] Aviso ao sincronizar last_sign_in_at:", authErr.message);
  }

  return teamProfiles.map((p) => ({
    user_id: p.user_id,
    full_name: p.full_name,
    email_snapshot: p.email_snapshot,
    role: p.role as TeamRole,
    status: p.status as TeamStatus,
    invited_by: p.invited_by,
    invited_at: p.invited_at,
    activated_at: p.activated_at,
    suspended_at: p.suspended_at,
    created_at: p.created_at,
    updated_at: p.updated_at,
    last_sign_in_at: lastSignInMap[p.user_id] ?? null,
  }));
}

export async function inviteTeamMember(
  rawInput: unknown,
  origin: string,
  requestId?: string
): Promise<{ success: boolean; member: TeamMember }> {
  const admin = await getAuthenticatedAdmin();

  const validation = validateInviteInput(rawInput);
  if (!validation.valid || !validation.data) {
    const firstError = Object.values(validation.errors || {})[0] || "Dados inválidos.";
    throw new TeamServiceError(firstError, 400, "VALIDATION_ERROR");
  }

  const { full_name, email, role } = validation.data;
  const supabase = createServiceClient();

  // 1. Verificar se já existe perfil no módulo
  const { data: existingProfile } = await supabase
    .from("np_team_profiles")
    .select("user_id, email_snapshot, status")
    .eq("email_snapshot", email)
    .maybeSingle();

  if (existingProfile) {
    throw new TeamServiceError(
      `Um membro com o e-mail '${email}' já está cadastrado no sistema com status '${existingProfile.status}'.`,
      409,
      "DUPLICATE_EMAIL"
    );
  }

  // 2. Convite via Supabase Auth Admin API
  const redirectTarget = `${origin.replace(/\/$/, "")}/ativar-conta`;

  const { data: inviteData, error: inviteErr } =
    await supabase.auth.admin.inviteUserByEmail(email, {
      redirectTo: redirectTarget,
      data: {
        display_name: full_name,
        role: role,
      },
    });

  if (inviteErr || !inviteData?.user) {
    // Tratar se usuário já existe em auth.users mas não em np_team_profiles
    if (inviteErr?.message?.toLowerCase().includes("already registered")) {
      throw new TeamServiceError(
        "Este e-mail já possui conta registrada no Supabase Auth.",
        409,
        "AUTH_USER_EXISTS"
      );
    }
    throw new TeamServiceError(
      `Falha no envio do convite pelo Supabase Auth: ${inviteErr?.message || "Erro desconhecido"}`,
      502,
      "INVITE_FAILED"
    );
  }

  const newUserId = inviteData.user.id;
  const now = new Date().toISOString();

  // 3. Registrar na tabela aditiva np_team_profiles
  const profileRecord = {
    user_id: newUserId,
    full_name,
    email_snapshot: email,
    role,
    status: "convite_pendente" as TeamStatus,
    invited_by: admin.id || null,
    invited_at: now,
    created_at: now,
    updated_at: now,
  };

  const { error: insertErr } = await supabase
    .from("np_team_profiles")
    .insert([profileRecord]);

  if (insertErr) {
    console.error("[TeamService] Erro ao gravar np_team_profiles:", insertErr);
    // Não deixamos em estado fantasma: registramos auditoria de erro
    await logAuditEvent({
      actorUserId: admin.id || null,
      targetUserId: newUserId,
      action: "team.invite_failed_reconciliation",
      beforeData: null,
      afterData: { email, role, full_name, db_error: insertErr.message },
      requestId,
    });
    throw new TeamServiceError(
      "Convite disparado, mas houve falha ao registrar perfil interno. Reconciliação pendente.",
      500,
      "PROFILE_INSERT_FAILED"
    );
  }

  // 4. Log de auditoria
  await logAuditEvent({
    actorUserId: admin.id || null,
    targetUserId: newUserId,
    action: "team.member_invited",
    beforeData: null,
    afterData: { full_name, email, role, status: "convite_pendente" },
    requestId,
  });

  return {
    success: true,
    member: {
      ...profileRecord,
      activated_at: null,
      suspended_at: null,
      last_sign_in_at: null,
    },
  };
}

export async function updateTeamMember(
  userId: string,
  rawInput: unknown,
  requestId?: string
): Promise<{ success: boolean; member: TeamMember }> {
  const admin = await getAuthenticatedAdmin();

  if (!userId || typeof userId !== "string") {
    throw new TeamServiceError("ID de usuário inválido.", 400);
  }

  const validation = validateUpdateInput(rawInput);
  if (!validation.valid || !validation.data) {
    const firstError = Object.values(validation.errors || {})[0] || "Dados inválidos.";
    throw new TeamServiceError(firstError, 400, "VALIDATION_ERROR");
  }

  const updates = validation.data;
  const supabase = createServiceClient();

  // Buscar estado atual
  const { data: currentMember, error: fetchErr } = await supabase
    .from("np_team_profiles")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (fetchErr || !currentMember) {
    throw new TeamServiceError("Membro não encontrado.", 404, "NOT_FOUND");
  }

  // PROTEÇÃO DO ÚLTIMO ADMIN:
  // Se estiver tentando rebaixar perfil ou suspender/desativar um admin:
  const isDemotingAdmin =
    currentMember.role === "admin" &&
    updates.role !== undefined &&
    updates.role !== "admin";

  const isDeactivatingAdmin =
    currentMember.role === "admin" &&
    updates.status !== undefined &&
    updates.status !== "ativo" &&
    updates.status !== "convite_pendente";

  if (isDemotingAdmin || isDeactivatingAdmin) {
    const { count } = await supabase
      .from("np_team_profiles")
      .select("user_id", { count: "exact", head: true })
      .eq("role", "admin")
      .eq("status", "ativo");

    if ((count || 0) <= 1) {
      throw new TeamServiceError(
        "Operação bloqueada: Não é permitido desativar ou rebaixar o único administrador ativo do sistema.",
        403,
        "LAST_ADMIN_PROTECTION"
      );
    }
  }

  const payloadToUpdate: Record<string, any> = {
    updated_at: new Date().toISOString(),
  };

  if (updates.full_name !== undefined) payloadToUpdate.full_name = updates.full_name;
  if (updates.role !== undefined) payloadToUpdate.role = updates.role;
  if (updates.status !== undefined) {
    payloadToUpdate.status = updates.status;
    if (updates.status === "suspenso" || updates.status === "desativado") {
      payloadToUpdate.suspended_at = new Date().toISOString();
    } else if (updates.status === "ativo") {
      payloadToUpdate.suspended_at = null;
    }
  }

  const { data: updatedMember, error: updateErr } = await supabase
    .from("np_team_profiles")
    .update(payloadToUpdate)
    .eq("user_id", userId)
    .select()
    .single();

  if (updateErr || !updatedMember) {
    throw new TeamServiceError(`Falha ao atualizar membro: ${updateErr?.message}`, 500);
  }

  // Log de auditoria
  await logAuditEvent({
    actorUserId: admin.id || null,
    targetUserId: userId,
    action: "team.member_updated",
    beforeData: {
      full_name: currentMember.full_name,
      role: currentMember.role,
      status: currentMember.status,
    },
    afterData: {
      full_name: updatedMember.full_name,
      role: updatedMember.role,
      status: updatedMember.status,
    },
    requestId,
  });

  return {
    success: true,
    member: updatedMember as TeamMember,
  };
}

export async function resendInvite(
  userId: string,
  origin: string,
  requestId?: string
): Promise<{ success: boolean; message: string }> {
  const admin = await getAuthenticatedAdmin();
  const supabase = createServiceClient();

  const { data: member, error: fetchErr } = await supabase
    .from("np_team_profiles")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (fetchErr || !member) {
    throw new TeamServiceError("Membro não encontrado.", 404, "NOT_FOUND");
  }

  if (member.status !== "convite_pendente") {
    throw new TeamServiceError(
      `Reenvio de convite só é permitido para contas com status 'convite_pendente'. O status atual é '${member.status}'.`,
      400,
      "INVALID_STATUS_FOR_RESEND"
    );
  }

  // Rate limiting / verificação de intervalo mínimo (ex: 2 minutos entre disparos)
  const lastInvited = new Date(member.invited_at).getTime();
  const nowMs = Date.now();
  const diffMinutes = (nowMs - lastInvited) / (1000 * 60);

  if (diffMinutes < 2) {
    const waitSeconds = Math.ceil((2 - diffMinutes) * 60);
    throw new TeamServiceError(
      `Por favor aguarde mais ${waitSeconds}s antes de reenviar o convite.`,
      429,
      "RATE_LIMITED"
    );
  }

  const redirectTarget = `${origin.replace(/\/$/, "")}/ativar-conta`;

  const { error: inviteErr } = await supabase.auth.admin.inviteUserByEmail(
    member.email_snapshot,
    {
      redirectTo: redirectTarget,
      data: {
        display_name: member.full_name,
        role: member.role,
      },
    }
  );

  if (inviteErr) {
    throw new TeamServiceError(
      `Falha no reenvio de convite: ${inviteErr.message}`,
      502,
      "RESEND_FAILED"
    );
  }

  const newInvitedAt = new Date().toISOString();
  await supabase
    .from("np_team_profiles")
    .update({ invited_at: newInvitedAt, updated_at: newInvitedAt })
    .eq("user_id", userId);

  await logAuditEvent({
    actorUserId: admin.id || null,
    targetUserId: userId,
    action: "team.invite_resent",
    beforeData: { invited_at: member.invited_at },
    afterData: { invited_at: newInvitedAt },
    requestId,
  });

  return {
    success: true,
    message: `Convite reenviado com sucesso para ${member.email_snapshot}.`,
  };
}

export async function listAuditEvents(limit = 50): Promise<TeamAuditEvent[]> {
  await getAuthenticatedAdmin();
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("np_team_audit_events")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    if (error.code === "42P01") return [];
    throw new TeamServiceError(`Erro ao carregar auditoria: ${error.message}`, 500);
  }

  return (data || []) as TeamAuditEvent[];
}
