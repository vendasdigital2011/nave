export type TeamRole = "admin" | "supervisor" | "vendedor";

export type TeamStatus =
  | "convite_pendente"
  | "ativo"
  | "suspenso"
  | "desativado";

export interface TeamMember {
  user_id: string;
  full_name: string;
  email_snapshot: string;
  role: TeamRole;
  status: TeamStatus;
  invited_by: string | null;
  invited_at: string;
  activated_at: string | null;
  suspended_at: string | null;
  created_at: string;
  updated_at: string;
  last_sign_in_at?: string | null;
}

export interface InviteMemberInput {
  full_name: string;
  email: string;
  role: TeamRole;
}

export interface UpdateMemberInput {
  role?: TeamRole;
  status?: TeamStatus;
  full_name?: string;
}

export interface TeamAuditEvent {
  id: string;
  actor_user_id: string | null;
  actor_name?: string | null;
  target_user_id: string | null;
  target_name?: string | null;
  action: string;
  before_data: Record<string, any> | null;
  after_data: Record<string, any> | null;
  request_id: string | null;
  created_at: string;
}
