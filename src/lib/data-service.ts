import { Client, ClientStatus, Interaction, AuditLog, DashboardMetrics } from "@/types/database";
import { createClient } from "./supabase/client";

const LOCAL_STORAGE_KEY = "upgradenavetech_clients_backup_v1";
const INTERACTIONS_STORAGE_KEY = "upgradenavetech_interactions_backup_v1";
const AUDIT_LOGS_STORAGE_KEY = "upgradenavetech_audit_logs_backup_v1";

// Amostra inicial de clientes padrão caso o banco esteja vazio
const DEFAULT_SAMPLE_CLIENTS: Client[] = [
  {
    id: "c1",
    name: "ADELSA DE JESUS SANTOS",
    phone: "(77) 99966-8387",
    current_plan: "50 Mega",
    target_plan: "100 Mega",
    status: "morno",
    nps_score: null,
    wants_upgrade: false,
    gave_referral: false,
    operator_email: "admin@navetech.com.br",
    feedback_first_contact: "Primeiro contato feito para mudança de roteador",
    notes: "Aguardando confirmação do horário de visita técnica",
    created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "c2",
    name: "ADEIDES MOREIRA DA SILVA",
    phone: "(77) 98863-0116",
    current_plan: "50 Mega",
    target_plan: "100 Mega",
    status: "frio",
    nps_score: null,
    wants_upgrade: false,
    gave_referral: false,
    operator_email: "admin@navetech.com.br",
    notes: "Aguardando primeiro contato",
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "c3",
    name: "ADENIDES DOS SANTOS PARDIM",
    phone: "(77) 98100-5915",
    current_plan: "50 Mega",
    target_plan: "100 Mega",
    status: "quente",
    nps_score: 9,
    wants_upgrade: true,
    gave_referral: true,
    referral_name: "Marcos Pardim (Irmão)",
    referral_phone: "(77) 99122-3344",
    operator_email: "admin@navetech.com.br",
    notes: "Muito interessado no dobro de velocidade para home office",
    created_at: new Date(Date.now() - 86400000 * 1).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "c4",
    name: "ALEX ANTONIO RIBEIRO DA SILVA",
    phone: "(77) 99963-5691",
    current_plan: "50 Mega",
    target_plan: "100 Mega",
    status: "vendido",
    nps_score: 10,
    wants_upgrade: true,
    gave_referral: false,
    operator_email: "admin@navetech.com.br",
    notes: "Upgrade ativado com sucesso. Roteador Gigabit instalado.",
    created_at: new Date(Date.now() - 86400000 * 4).toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export class DataService {
  private static getLocalClients(): Client[] {
    if (typeof window === "undefined") return DEFAULT_SAMPLE_CLIENTS;
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(DEFAULT_SAMPLE_CLIENTS));
      return DEFAULT_SAMPLE_CLIENTS;
    } catch {
      return DEFAULT_SAMPLE_CLIENTS;
    }
  }

  private static setLocalClients(clients: Client[]) {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(clients));
    } catch (e) {
      console.error("Erro salvando localmente:", e);
    }
  }

  // PRD-24: Audit Logs Store
  static getAuditLogs(): AuditLog[] {
    if (typeof window === "undefined") return [];
    try {
      const stored = localStorage.getItem(AUDIT_LOGS_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  static addAuditLog(log: Omit<AuditLog, "id" | "timestamp">): AuditLog {
    const newLog: AuditLog = {
      ...log,
      id: "log_" + Date.now() + "_" + Math.random().toString(36).substr(2, 4),
      timestamp: new Date().toISOString(),
    };

    if (typeof window !== "undefined") {
      try {
        const list = this.getAuditLogs();
        list.unshift(newLog);
        localStorage.setItem(AUDIT_LOGS_STORAGE_KEY, JSON.stringify(list.slice(0, 100)));
      } catch (e) {
        console.error("Erro registrando log de auditoria:", e);
      }
    }

    return newLog;
  }

  static async getClients(): Promise<Client[]> {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("clients")
        .select("*")
        .order("created_at", { ascending: false });

      if (error || !data || data.length === 0) {
        return this.getLocalClients();
      }

      this.setLocalClients(data);
      return data;
    } catch {
      return this.getLocalClients();
    }
  }

  static async updateClientStatus(
    id: string,
    newStatus: ClientStatus,
    operatorEmail: string = "admin@navetech.com.br"
  ): Promise<boolean> {
    const now = new Date().toISOString();
    const local = this.getLocalClients();
    const target = local.find((c) => c.id === id);
    const oldStatus = target ? target.status : null;
    const clientName = target ? target.name : "Cliente";

    if (target) {
      target.status = newStatus;
      target.updated_at = now;
      target.operator_email = operatorEmail;
      if (newStatus === "vendido") {
        target.sold_at = now;
        target.wants_upgrade = true;
      }
      this.setLocalClients(local);

      // Log de Auditoria Rastreável (PRD-24)
      this.addAuditLog({
        operator_email: operatorEmail,
        action: `Alterou status de "${oldStatus}" para "${newStatus}"`,
        target_client_id: id,
        target_client_name: clientName,
      });
    }

    try {
      const supabase = createClient();
      const updates: Record<string, unknown> = {
        status: newStatus,
        updated_at: now,
        operator_email: operatorEmail,
      };
      if (newStatus === "vendido") {
        updates.sold_at = now;
        updates.wants_upgrade = true;
      }

      await supabase.from("clients").update(updates).eq("id", id);
      return true;
    } catch {
      return true;
    }
  }

  static async updateClient(
    id: string,
    updates: Partial<Client>,
    operatorEmail: string = "admin@navetech.com.br"
  ): Promise<boolean> {
    const now = new Date().toISOString();
    const local = this.getLocalClients();
    const idx = local.findIndex((c) => c.id === id);
    let clientName = "Cliente";

    if (idx !== -1) {
      clientName = local[idx].name;
      local[idx] = {
        ...local[idx],
        ...updates,
        operator_email: operatorEmail,
        updated_at: now,
      };
      this.setLocalClients(local);

      this.addAuditLog({
        operator_email: operatorEmail,
        action: `Atualizou dados do cliente`,
        target_client_id: id,
        target_client_name: clientName,
        details: JSON.stringify(updates),
      });
    }

    try {
      const supabase = createClient();
      await supabase
        .from("clients")
        .update({ ...updates, operator_email: operatorEmail, updated_at: now })
        .eq("id", id);
      return true;
    } catch {
      return true;
    }
  }

  static async addClient(
    clientData: Omit<Client, "id" | "created_at" | "updated_at">,
    operatorEmail: string = "admin@navetech.com.br"
  ): Promise<Client> {
    const now = new Date().toISOString();
    const newClient: Client = {
      ...clientData,
      id: "c_" + Date.now() + "_" + Math.random().toString(36).substr(2, 4),
      operator_email: operatorEmail,
      created_at: now,
      updated_at: now,
    };

    const local = this.getLocalClients();
    local.unshift(newClient);
    this.setLocalClients(local);

    this.addAuditLog({
      operator_email: operatorEmail,
      action: `Cadastrou novo cliente`,
      target_client_id: newClient.id,
      target_client_name: newClient.name,
    });

    try {
      const supabase = createClient();
      await supabase.from("clients").insert([newClient]);
    } catch (e) {
      console.error("Erro salvando no Supabase:", e);
    }

    return newClient;
  }

  static async deleteClient(
    id: string,
    operatorEmail: string = "admin@navetech.com.br"
  ): Promise<boolean> {
    const local = this.getLocalClients();
    const target = local.find((c) => c.id === id);
    const filtered = local.filter((c) => c.id !== id);
    this.setLocalClients(filtered);

    if (target) {
      this.addAuditLog({
        operator_email: operatorEmail,
        action: `Excluiu cliente`,
        target_client_id: id,
        target_client_name: target.name,
      });
    }

    try {
      const supabase = createClient();
      await supabase.from("clients").delete().eq("id", id);
      return true;
    } catch {
      return true;
    }
  }

  static async importBulkClients(
    clientsData: Omit<Client, "id" | "created_at" | "updated_at">[],
    operatorEmail: string = "admin@navetech.com.br"
  ): Promise<number> {
    const now = new Date().toISOString();
    const newClients: Client[] = clientsData.map((c, idx) => ({
      ...c,
      id: "imp_" + Date.now() + "_" + idx,
      operator_email: operatorEmail,
      created_at: now,
      updated_at: now,
    }));

    const local = this.getLocalClients();
    const updatedList = [...newClients, ...local];
    this.setLocalClients(updatedList);

    this.addAuditLog({
      operator_email: operatorEmail,
      action: `Importou lote de ${newClients.length} clientes`,
    });

    try {
      const supabase = createClient();
      await supabase.from("clients").insert(newClients);
    } catch (e) {
      console.error("Erro ao importar em lote no Supabase:", e);
    }

    return newClients.length;
  }

  static calculateMetrics(clients: Client[]): DashboardMetrics {
    const total = clients.length;
    const frios = clients.filter((c) => c.status === "frio").length;
    const mornos = clients.filter((c) => c.status === "morno").length;
    const quentes = clients.filter((c) => c.status === "quente").length;
    const vendidos = clients.filter((c) => c.status === "vendido").length;
    const desativados = clients.filter((c) => c.status === "desativado").length;

    const conversionRate = total > 0 ? Number(((vendidos / total) * 100).toFixed(1)) : 0;

    const npsList = clients
      .map((c) => c.nps_score)
      .filter((score): score is number => score !== null && score !== undefined);

    const avgNps =
      npsList.length > 0
        ? Number((npsList.reduce((a, b) => a + b, 0) / npsList.length).toFixed(1))
        : 0;

    const npsPromoters = npsList.filter((s) => s >= 9).length;
    const npsPassives = npsList.filter((s) => s >= 7 && s <= 8).length;
    const npsDetractors = npsList.filter((s) => s <= 6).length;

    const referralsCount = clients.filter((c) => c.gave_referral).length;
    const totalApproached = total - frios;
    const responseRate = total > 0 ? Number(((totalApproached / total) * 100).toFixed(1)) : 0;

    return {
      totalClients: total,
      frioCount: frios,
      mornoCount: mornos,
      quenteCount: quentes,
      vendidoCount: vendidos,
      desativadoCount: desativados,
      conversionRate,
      avgNps,
      npsPromoters,
      npsPassives,
      npsDetractors,
      referralsCount,
      totalApproached,
      responseRate,
    };
  }
}
