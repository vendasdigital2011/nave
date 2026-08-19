export type ClientStatus = 'frio' | 'morno' | 'quente' | 'vendido' | 'desativado';

export interface Client {
  id: string;
  name: string;
  phone: string;
  current_plan: string;
  target_plan: string;
  status: ClientStatus;
  feedback_first_contact?: string;
  feedback_second_contact?: string;
  notes?: string;
  nps_score?: number | null;
  wants_upgrade?: boolean;
  gave_referral?: boolean;
  referral_name?: string;
  referral_phone?: string;
  sold_at?: string;
  created_at: string;
  updated_at: string;
}

export interface Interaction {
  id: string;
  client_id: string;
  type?: string;
  content?: string;
  channel?: 'whatsapp' | 'call' | 'manual';
  message_content?: string;
  direction?: 'inbound' | 'outbound';
  status?: 'sent' | 'delivered' | 'read' | 'replied' | 'failed';
  old_status?: string | null;
  new_status?: string;
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
