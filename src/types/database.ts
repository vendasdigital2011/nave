export type ClientStatus = 'importados' | 'frio' | 'morno' | 'quente' | 'vendido' | 'desativado';

export type UserRole = 'admin' | 'supervisor' | 'seller';

export type CampaignStatus = 'active' | 'paused' | 'archived';

export type StageKind = 'open' | 'won' | 'lost';

export type TaskStatus = 'pending' | 'completed' | 'cancelled';

export type TaskType = 'call' | 'whatsapp' | 'followup' | 'visit' | 'other';

export interface Profile {
  id: string;
  display_name: string;
  role: UserRole;
  is_active: boolean;
  email?: string;
  created_at: string;
  updated_at: string;
}

export interface Campaign {
  id: string;
  name: string;
  type: 'upgrade' | 'hotspot' | 'custom' | string;
  description?: string;
  status: CampaignStatus;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface CampaignStage {
  id: string;
  campaign_id: string;
  name: string;
  position: number;
  stage_kind: StageKind;
  color?: string;
  is_active: boolean;
  created_at: string;
}

export interface CampaignMember {
  id: string;
  campaign_id: string;
  user_id: string;
  role: string;
  joined_at: string;
}

export interface CampaignLead {
  id: string;
  campaign_id: string;
  client_id: string;
  stage_id: string;
  assigned_user_id?: string;
  first_import_batch_id?: string;
  notes?: string;
  converted_at?: string;
  lost_at?: string;
  last_activity_at: string;
  version: number;
  created_at: string;
  updated_at: string;
}

export interface LeadTask {
  id: string;
  campaign_lead_id: string;
  assigned_user_id?: string;
  created_by?: string;
  type: TaskType;
  title: string;
  description?: string;
  due_at: string;
  status: TaskStatus;
  completed_at?: string;
  created_at: string;
  updated_at: string;
  assigned_user?: Profile;
  lead?: CampaignLead & { client: Client };
}

export interface LeadTransfer {
  id: string;
  campaign_lead_id: string;
  from_user_id?: string;
  to_user_id?: string;
  transferred_by?: string;
  reason?: string;
  created_at: string;
}

export interface ImportBatch {
  id: string;
  campaign_id: string;
  uploaded_by?: string;
  operator_email?: string;
  file_name: string;
  file_hash?: string;
  status: 'pending' | 'processing' | 'completed' | 'partial' | 'failed';
  total_rows: number;
  valid_rows: number;
  inserted_clients: number;
  linked_leads: number;
  duplicate_leads: number;
  rejected_rows: number;
  error_summary?: string;
  started_at: string;
  completed_at?: string;
  created_at: string;
}

export interface ImportBatchRow {
  id: string;
  batch_id: string;
  row_number: number;
  raw_name?: string;
  raw_phone?: string;
  normalized_phone?: string;
  result: 'inserted' | 'linked' | 'duplicate' | 'rejected';
  error_code?: string;
  client_id?: string;
  campaign_lead_id?: string;
  created_at: string;
}

export interface KanbanLeadCard extends CampaignLead {
  client: Client;
  assigned_to?: Profile;
  tasks?: LeadTask[];
}

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
  operator_email?: string;
  assigned_user_id?: string;
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
  operator_email?: string;
  created_at: string;
}

export interface AuditLog {
  id: string;
  operator_email: string;
  action: string;
  target_client_id?: string;
  target_client_name?: string;
  details?: string;
  actor_user_id?: string;
  timestamp: string;
}

export interface DashboardMetrics {
  totalClients: number;
  importadosCount: number;
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
