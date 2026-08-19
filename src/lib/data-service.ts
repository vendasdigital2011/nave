import { Client, ClientStatus, Interaction, DashboardMetrics } from "@/types/database";
import { createClient } from "./supabase/client";

const LOCAL_STORAGE_KEY = "upgradenavetech_clients_backup_v1";
const INTERACTIONS_STORAGE_KEY = "upgradenavetech_interactions_backup_v1";

// Amostra inicial de clientes padrão caso o banco esteja vazio
const DEFAULT_SAMPLE_CLIENTS: Client[] = [
  {
    id: "c1",
    name: "ADELSA DE JESUS SANTOS",
    phone: "(77) 99966-8387",
    condominium: "Condomínio Primavera",
    current_plan: "50 Mega",
    target_plan: "100 Mega",
    status: "morno",
    nps_score: null,
    wants_upgrade: false,
    gave_referral: false,
    feedback_first_contact: "Primeiro contato feito para mudança de roteador",
    notes: "Aguardando confirmação do horário de visita técnica",
    created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "c2",
    name: "ADEIDES MOREIRA DA SILVA",
    phone: "(77) 98863-0116",
    condominium: "Residencial Jardins",
    current_plan: "50 Mega",
    target_plan: "100 Mega",
    status: "frio",
    nps_score: null,
    wants_upgrade: false,
    gave_referral: false,
    notes: "Importado da planilha de condomínios",
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "c3",
    name: "ADENIDES DOS SANTOS PARDIM",
    phone: "(77) 98100-5915",
    condominium: "Condomínio Bela Vista",
    current_plan: "50 Mega",
    target_plan: "100 Mega",
    status: "quente",
    nps_score: 9,
    wants_upgrade: true,
    gave_referral: true,
    referral_name: "Marcos Pardim (Irmão)",
    referral_phone: "(77) 99122-3344",
    notes: "Muito interessado no dobro de velocidade para home office",
    created_at: new Date(Date.now() - 86400000 * 1).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "c4",
    name: "ALEX ANTONIO RIBEIRO DA SILVA",
    phone: "(77) 99963-5691",
    condominium: "Residencial Jardins",
    current_plan: "50 Mega",
    target_plan: "100 Mega",
    status: "vendido",
    nps_score: 10,
    wants_upgrade: true,
    gave_referral: false,
    notes: "Upgrade ativado com sucesso. Roteador Gigabit instalado.",
    sold_at: new Date().toISOString(),
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

  private static getLocalInteractions(): Interaction[] {
    if (typeof window === "undefined") return [];
    try {
      const stored = localStorage.getItem(INTERACTIONS_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  private static addLocalInteraction(interaction: Interaction) {
    if (typeof window === "undefined") return;
    try {
      const list = this.getLocalInteractions();
      list.unshift(interaction);
      localStorage.setItem(INTERACTIONS_STORAGE_KEY, JSON.stringify(list));
    } catch (e) {
      console.error("Erro salvando interacao:", e);
    }
  }

  static async getClients(): Promise<Client[]> {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("clients")
        .select("*")
        .order("created_at", { ascending: false });

      if (error || !data || data.length === 0) {
        // Fallback para cache local se Supabase estiver offline ou vazio
        return this.getLocalClients();
      }

      // Sincroniza cache local
      this.setLocalClients(data);
      return data;
    } catch (err) {
      console.warn("Supabase offline ou não acessível, usando cache local:", err);
      return this.getLocalClients();
    }
  }

  static async updateClientStatus(id: string, newStatus: ClientStatus): Promise<boolean> {
    const now = new Date().toISOString();
    // Atualiza local primeiro para feedback instantâneo (Optimistic UI)
    const local = this.getLocalClients();
    const target = local.find((c) => c.id === id);
    const oldStatus = target ? target.status : null;

    if (target) {
      target.status = newStatus;
      target.updated_at = now;
      if (newStatus === "vendido") {
        target.sold_at = now;
        target.wants_upgrade = true;
      }
      this.setLocalClients(local);

      this.addLocalInteraction({
        id: "int_" + Date.now(),
        client_id: id,
        type: "status_change",
        content: `Status alterado de "${oldStatus}" para "${newStatus}"`,
        old_status: oldStatus,
        new_status: newStatus,
        created_at: now,
      });
    }

    try {
      const supabase = createClient();
      const updates: Record<string, unknown> = {
        status: newStatus,
        updated_at: now,
      };
      if (newStatus === "vendido") {
        updates.sold_at = now;
        updates.wants_upgrade = true;
      }

      await supabase.from("clients").update(updates).eq("id", id);
      await supabase.from("interactions").insert({
        client_id: id,
        type: "status_change",
        content: `Status alterado de "${oldStatus}" para "${newStatus}"`,
        old_status: oldStatus,
        new_status: newStatus,
      });
      return true;
    } catch {
      return true;
    }
  }

  static async updateClient(id: string, updates: Partial<Client>): Promise<boolean> {
    const now = new Date().toISOString();
    const local = this.getLocalClients();
    const idx = local.findIndex((c) => c.id === id);
    if (idx !== -1) {
      local[idx] = { ...local[idx], ...updates, updated_at: now };
      this.setLocalClients(local);
    }

    try {
      const supabase = createClient();
      await supabase
        .from("clients")
        .update({ ...updates, updated_at: now })
        .eq("id", id);
      return true;
    } catch {
      return true;
    }
  }

  static async addClient(clientData: Omit<Client, "id" | "created_at" | "updated_at">): Promise<Client> {
    const now = new Date().toISOString();
    const newClient: Client = {
      ...clientData,
      id: "cli_" + Math.random().toString(36).substring(2, 11),
      created_at: now,
      updated_at: now,
    };

    const local = this.getLocalClients();
    local.unshift(newClient);
    this.setLocalClients(local);

    try {
      const supabase = createClient();
      const { data } = await supabase.from("clients").insert(clientData).select().single();
      if (data) {
        // Atualiza ID com o do Supabase
        const updatedLocal = this.getLocalClients().map((c) => (c.id === newClient.id ? data : c));
        this.setLocalClients(updatedLocal);
        return data;
      }
    } catch (e) {
      console.warn("Inserção no Supabase pendente:", e);
    }

    return newClient;
  }

  static async importBulkClients(clientsList: Array<Omit<Client, "id" | "created_at" | "updated_at">>): Promise<number> {
    const now = new Date().toISOString();
    const newItems: Client[] = clientsList.map((item, idx) => ({
      ...item,
      id: "imp_" + Date.now() + "_" + idx,
      created_at: now,
      updated_at: now,
    }));

    const local = this.getLocalClients();
    const merged = [...newItems, ...local];
    this.setLocalClients(merged);

    try {
      const supabase = createClient();
      await supabase.from("clients").insert(clientsList);
    } catch (err) {
      console.warn("Importação em massa salva localmente:", err);
    }

    return newItems.length;
  }

  static async deleteClient(id: string): Promise<boolean> {
    const local = this.getLocalClients().filter((c) => c.id !== id);
    this.setLocalClients(local);

    try {
      const supabase = createClient();
      await supabase.from("clients").delete().eq("id", id);
    } catch {
      // Ignora erro
    }
    return true;
  }

  static calculateMetrics(clients: Client[]): DashboardMetrics {
    const total = clients.length;
    const frioCount = clients.filter((c) => c.status === "frio").length;
    const mornoCount = clients.filter((c) => c.status === "morno").length;
    const quenteCount = clients.filter((c) => c.status === "quente").length;
    const vendidoCount = clients.filter((c) => c.status === "vendido").length;
    const desativadoCount = clients.filter((c) => c.status === "desativado").length;

    const conversionRate = total > 0 ? (vendidoCount / total) * 100 : 0;

    const withNps = clients.filter((c) => c.nps_score !== null && c.nps_score !== undefined);
    const avgNps =
      withNps.length > 0
        ? withNps.reduce((acc, c) => acc + (c.nps_score || 0), 0) / withNps.length
        : 0;

    const npsPromoters = withNps.filter((c) => (c.nps_score || 0) >= 9).length;
    const npsPassives = withNps.filter((c) => (c.nps_score || 0) >= 7 && (c.nps_score || 0) <= 8).length;
    const npsDetractors = withNps.filter((c) => (c.nps_score || 0) <= 6).length;

    const referralsCount = clients.filter((c) => c.gave_referral).length;
    const totalApproached = total - frioCount;
    const responseRate = total > 0 ? (totalApproached / total) * 100 : 0;

    return {
      totalClients: total,
      frioCount,
      mornoCount,
      quenteCount,
      vendidoCount,
      desativadoCount,
      conversionRate: Math.round(conversionRate * 10) / 10,
      avgNps: Math.round(avgNps * 10) / 10,
      npsPromoters,
      npsPassives,
      npsDetractors,
      referralsCount,
      totalApproached,
      responseRate: Math.round(responseRate * 10) / 10,
    };
  }
}
