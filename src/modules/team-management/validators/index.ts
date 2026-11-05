import { InviteMemberInput, TeamRole, TeamStatus, UpdateMemberInput } from "../types";

const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

export const VALID_ROLES: TeamRole[] = ["admin", "supervisor", "vendedor"];
export const VALID_STATUSES: TeamStatus[] = [
  "convite_pendente",
  "ativo",
  "suspenso",
  "desativado",
];

export function sanitizeString(val: unknown): string {
  if (typeof val !== "string") return "";
  return val.trim().replace(/\s+/g, " ");
}

export function validateFullName(name: string): { valid: boolean; error?: string } {
  const sanitized = sanitizeString(name);
  if (!sanitized) {
    return { valid: false, error: "Nome completo é obrigatório." };
  }
  if (sanitized.length < 3) {
    return { valid: false, error: "Nome completo deve ter pelo menos 3 caracteres." };
  }
  if (sanitized.length > 120) {
    return { valid: false, error: "Nome completo não pode exceder 120 caracteres." };
  }
  return { valid: true };
}

export function validateEmail(email: string): { valid: boolean; error?: string; normalized?: string } {
  const sanitized = sanitizeString(email).toLowerCase();
  if (!sanitized) {
    return { valid: false, error: "E-mail é obrigatório." };
  }
  if (sanitized.length > 254) {
    return { valid: false, error: "E-mail muito longo." };
  }
  if (!EMAIL_REGEX.test(sanitized)) {
    return { valid: false, error: "Formato de e-mail inválido." };
  }
  return { valid: true, normalized: sanitized };
}

export function validateRole(role: unknown): { valid: boolean; error?: string } {
  if (typeof role !== "string" || !VALID_ROLES.includes(role as TeamRole)) {
    return { valid: false, error: `Perfil inválido. Deve ser: ${VALID_ROLES.join(", ")}.` };
  }
  return { valid: true };
}

export function validateStatus(status: unknown): { valid: boolean; error?: string } {
  if (typeof status !== "string" || !VALID_STATUSES.includes(status as TeamStatus)) {
    return { valid: false, error: `Status inválido. Deve ser: ${VALID_STATUSES.join(", ")}.` };
  }
  return { valid: true };
}

export interface ValidationResult<T> {
  valid: boolean;
  errors?: Record<string, string>;
  data?: T;
}

export function validateInviteInput(input: unknown): ValidationResult<InviteMemberInput> {
  const errors: Record<string, string> = {};
  if (!input || typeof input !== "object") {
    return { valid: false, errors: { _general: "Dados de requisição inválidos." } };
  }

  const raw = input as Record<string, unknown>;
  const nameRes = validateFullName(String(raw.full_name || ""));
  if (!nameRes.valid) errors.full_name = nameRes.error!;

  const emailRes = validateEmail(String(raw.email || ""));
  if (!emailRes.valid) errors.email = emailRes.error!;

  const roleRes = validateRole(raw.role || "vendedor");
  if (!roleRes.valid) errors.role = roleRes.error!;

  if (Object.keys(errors).length > 0) {
    return { valid: false, errors };
  }

  return {
    valid: true,
    data: {
      full_name: sanitizeString(raw.full_name),
      email: emailRes.normalized!,
      role: (raw.role || "vendedor") as TeamRole,
    },
  };
}

export function validateUpdateInput(input: unknown): ValidationResult<UpdateMemberInput> {
  const errors: Record<string, string> = {};
  if (!input || typeof input !== "object") {
    return { valid: false, errors: { _general: "Dados de requisição inválidos." } };
  }

  const raw = input as Record<string, unknown>;
  const output: UpdateMemberInput = {};

  if (raw.full_name !== undefined) {
    const nameRes = validateFullName(String(raw.full_name));
    if (!nameRes.valid) errors.full_name = nameRes.error!;
    else output.full_name = sanitizeString(raw.full_name);
  }

  if (raw.role !== undefined) {
    const roleRes = validateRole(raw.role);
    if (!roleRes.valid) errors.role = roleRes.error!;
    else output.role = raw.role as TeamRole;
  }

  if (raw.status !== undefined) {
    const statusRes = validateStatus(raw.status);
    if (!statusRes.valid) errors.status = statusRes.error!;
    else output.status = raw.status as TeamStatus;
  }

  if (Object.keys(output).length === 0 && Object.keys(errors).length === 0) {
    return { valid: false, errors: { _general: "Nenhum campo fornecido para atualização." } };
  }

  if (Object.keys(errors).length > 0) {
    return { valid: false, errors };
  }

  return { valid: true, data: output };
}
