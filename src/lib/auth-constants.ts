export const AUTH_COOKIE_NAME = "upgrade_crm_session";

export interface AuthUser {
  id?: string;
  email: string;
  name: string;
  role: 'admin' | 'supervisor' | 'seller';
  is_active?: boolean;
}
