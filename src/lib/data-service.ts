import { Client, ClientStatus, AuditLog, DashboardMetrics } from "@/types/database";
import { createClient } from "./supabase/client";

export class DataService {
  static async getAuditLogs(): Promise<AuditLog[]> {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("audit_logs")
        .select("*")
        .order("timestamp", { ascending: false })
        .limit(100);

      if (error) {
        console.error("Erro ao buscar logs de auditoria no Supabase:", error);
        return [];
      }

      return (data as AuditLog[]) || [];
    } catch (err) {
      console.error("Erro inesperado ao buscar audit logs:", err);
      return [];
    }
  }

  static async addAuditLog(log: Omit<AuditLog, "id" | "timestamp">): Promise<AuditLog | null> {
    const newLog: AuditLog = {
      ...log,
      id: "log_" + Date.now() + "_" + Math.random().toString(36).substring(2, 6),
      timestamp: new Date().toISOString(),
    };

    try {
      const supabase = createClient();
      const { error } = await supabase.from("audit_logs").insert([newLog]);
      if (error) {
        console.error("Erro ao salvar log de auditoria no Supabase:", error);
      }
      return newLog;
    } catch (err) {
      console.error("Erro inesperado ao salvar audit log:", err);
      return newLog;
    }
  }

  static async getClients(): Promise<Client[]> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("clients")
      .select("*")
      .order("name", { ascending: true });

    if (error) {
      console.error("Erro ao buscar clientes no Supabase Cloud:", error);
      throw error;
    }

    return (data as Client[]) || [];
  }

  static async moveAllFrioToImportados(operatorEmail: string = "admin@navetech.com.br"): Promise<number> {
    const supabase = createClient();
    const now = new Date().toISOString();

    const { data: frios, error: fetchErr } = await supabase
      .from("clients")
      .select("id")
      .eq("status", "frio");

    if (fetchErr || !frios || frios.length === 0) {
      return 0;
    }

    const count = frios.length;

    const { error: updateErr } = await supabase
      .from("clients")
      .update({ status: "importados", updated_at: now })
      .eq("status", "frio");

    if (updateErr) {
      console.error("Erro ao migrar status frio para importados no Supabase:", updateErr);
      throw updateErr;
    }

    await this.addAuditLog({
      operator_email: operatorEmail,
      action: `Moveu ${count} clientes da coluna Contato Iniciado para Importados`,
    });

    return count;
  }

  static async updateClientStatus(
    id: string,
    newStatus: ClientStatus,
    operatorEmail: string = "admin@navetech.com.br"
  ): Promise<boolean> {
    const supabase = createClient();
    const now = new Date().toISOString();

    const { data: currentClient } = await supabase
      .from("clients")
      .select("name, status")
      .eq("id", id)
      .maybeSingle();

    const oldStatus = currentClient?.status || null;
    const clientName = currentClient?.name || "Cliente";

    const updates: Record<string, unknown> = {
      status: newStatus,
      updated_at: now,
      operator_email: operatorEmail,
    };

    if (newStatus === "vendido") {
      updates.sold_at = now;
      updates.wants_upgrade = true;
    }

    const { error } = await supabase
      .from("clients")
      .update(updates)
      .eq("id", id);

    if (error) {
      console.error("Erro ao atualizar status do cliente no Supabase:", error);
      throw error;
    }

    await this.addAuditLog({
      operator_email: operatorEmail,
      action: `Alterou status de "${oldStatus}" para "${newStatus}"`,
      target_client_id: id,
      target_client_name: clientName,
    });

    return true;
  }

  static async updateClient(
    id: string,
    updates: Partial<Client>,
    operatorEmail: string = "admin@navetech.com.br"
  ): Promise<boolean> {
    const supabase = createClient();
    const now = new Date().toISOString();

    const payload = {
      ...updates,
      operator_email: operatorEmail,
      updated_at: now,
    };

    const { error } = await supabase
      .from("clients")
      .update(payload)
      .eq("id", id);

    if (error) {
      console.error("Erro ao atualizar cliente no Supabase:", error);
      throw error;
    }

    await this.addAuditLog({
      operator_email: operatorEmail,
      action: `Atualizou dados do cliente`,
      target_client_id: id,
      target_client_name: updates.name || "Cliente",
      details: JSON.stringify(updates),
    });

    return true;
  }

  static async addClient(
    clientData: Omit<Client, "id" | "created_at" | "updated_at">,
    operatorEmail: string = "admin@navetech.com.br"
  ): Promise<Client> {
    const supabase = createClient();
    const now = new Date().toISOString();

    const newClient: Client = {
      ...clientData,
      id: "c_" + Date.now() + "_" + Math.random().toString(36).substring(2, 6),
      operator_email: operatorEmail,
      created_at: now,
      updated_at: now,
    };

    const { error } = await supabase
      .from("clients")
      .insert([newClient]);

    if (error) {
      console.error("Erro ao cadastrar cliente no Supabase:", error);
      throw error;
    }

    await this.addAuditLog({
      operator_email: operatorEmail,
      action: `Cadastrou novo cliente`,
      target_client_id: newClient.id,
      target_client_name: newClient.name,
    });

    return newClient;
  }

  static async deleteClient(
    id: string,
    operatorEmail: string = "admin@navetech.com.br"
  ): Promise<boolean> {
    const supabase = createClient();

    const { data: currentClient } = await supabase
      .from("clients")
      .select("name")
      .eq("id", id)
      .maybeSingle();

    const clientName = currentClient?.name || "Cliente";

    const { error } = await supabase
      .from("clients")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Erro ao excluir cliente no Supabase:", error);
      throw error;
    }

    await this.addAuditLog({
      operator_email: operatorEmail,
      action: `Excluiu cliente`,
      target_client_id: id,
      target_client_name: clientName,
    });

    return true;
  }

  static async importBulkClients(
    clientsData: Omit<Client, "id" | "created_at" | "updated_at">[],
    operatorEmail: string = "admin@navetech.com.br"
  ): Promise<number> {
    if (!clientsData || clientsData.length === 0) return 0;

    const supabase = createClient();
    const now = new Date().toISOString();

    const newClients: Client[] = clientsData.map((c, idx) => ({
      ...c,
      id: "imp_" + Date.now() + "_" + idx + "_" + Math.random().toString(36).substring(2, 5),
      operator_email: operatorEmail,
      created_at: now,
      updated_at: now,
    }));

    const { error } = await supabase
      .from("clients")
      .insert(newClients);

    if (error) {
      console.error("Erro ao importar clientes em lote no Supabase:", error);
      throw error;
    }

    await this.addAuditLog({
      operator_email: operatorEmail,
      action: `Importou lote de ${newClients.length} clientes`,
    });

    return newClients.length;
  }

  static calculateMetrics(clients: Client[]): DashboardMetrics {
    const total = clients.length;
    const importados = clients.filter((c) => c.status === "importados").length;
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
    const totalApproached = total - importados;
    const responseRate = total > 0 ? Number(((totalApproached / total) * 100).toFixed(1)) : 0;

    return {
      totalClients: total,
      importadosCount: importados,
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

