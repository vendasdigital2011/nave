export type ClientStatus = 'frio' | 'morno' | 'quente' | 'vendido' | 'desativado';

export interface Client {
  id: string;
  name: string;
  phone: string;
  condominium?: string;
  current_plan: string;
  target_plan: string;
  status: ClientStatus;
  nps_score?: number | null;
  wants_upgrade: boolean;
  gave_referral: boolean;
  referral_name?: string | null;
  referral_phone?: string | null;
  feedback_first_contact?: string | null;
  feedback_second_contact?: string | null;
  notes?: string | null;
  last_contact_at?: string | null;
  sold_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Interaction {
  id: string;
  client_id: string;
  type: 'whatsapp' | 'call' | 'note' | 'status_change';
  content: string;
  old_status?: ClientStatus | null;
  new_status?: ClientStatus | null;
  created_at: string;
}

export interface DashboardMetrics {
  totalClients: number;
  frioCount: number;
  mornoCount: number;
  quenteCount: number;
  vendidoCount: number;
  desativadoCount: number;
  conversionRate: number;
  avgNps: number;
  npsPromoters: number;
  npsPassives: number;
  npsDetractors: number;
  referralsCount: number;
  totalApproached: number;
  responseRate: number;
}
