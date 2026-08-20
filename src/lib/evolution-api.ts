export interface EvolutionInstance {
  id?: string;
  name?: string;
  instanceName?: string;
  ownerJid?: string;
  profileName?: string;
  profilePicUrl?: string;
  status?: string;
  connectionStatus?: string;
  integration?: string;
  token?: string;
}

export interface EvolutionQrCodeResponse {
  pairingCode?: string;
  code?: string;
  base64?: string;
  count?: number;
}

export interface ChatMessage {
  id: string;
  instance_name: string;
  client_phone: string;
  client_name?: string;
  message: string;
  direction: "inbound" | "outbound";
  status: "sent" | "delivered" | "read";
  created_at: string;
}

const MESSAGES_KEY = "naveprospect_chat_messages_v1";

export class EvolutionService {
  private static getBaseUrl(): string {
    return (
      process.env.EVOLUTION_API_URL ||
      process.env.NEXT_PUBLIC_EVOLUTION_API_URL ||
      "https://evolutionapi.vps10855.panel.icontainer.net"
    );
  }

  private static getApiKey(): string {
    return process.env.EVOLUTION_API_KEY || "PMhtTHmZZyRRN4A7mi8m2FYHMEH6FYf8";
  }

  static getInstanceNameForUser(userIdentifier: string = "admin@navetech.com.br"): string {
    // Retorna a instância padrão naveprospect ou por operador
    return process.env.EVOLUTION_INSTANCE_NAME || "naveprospect";
  }

  private static async request<T>(
    path: string,
    options: RequestInit = {}
  ): Promise<{ success: boolean; data?: T; error?: string; status?: number }> {
    const baseUrl = this.getBaseUrl().replace(/\/$/, "");
    const apiKey = this.getApiKey();
    const url = `${baseUrl}${path}`;

    try {
      const res = await fetch(url, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          apikey: apiKey,
          ...(options.headers || {}),
        },
      });

      const text = await res.text();
      let parsedData: any;
      try {
        parsedData = JSON.parse(text);
      } catch {
        parsedData = text;
      }

      if (!res.ok) {
        return {
          success: false,
          status: res.status,
          error: typeof parsedData === "object" ? parsedData?.message || JSON.stringify(parsedData) : parsedData,
        };
      }

      return {
        success: true,
        status: res.status,
        data: parsedData as T,
      };
    } catch (err: any) {
      return {
        success: false,
        error: err.message || "Falha na conexão com a Evolution API",
      };
    }
  }

  static async fetchInstances(): Promise<{ success: boolean; instances: EvolutionInstance[]; error?: string }> {
    const result = await this.request<EvolutionInstance[]>("/instance/fetchInstances");
    if (!result.success || !Array.isArray(result.data)) {
      return { success: false, instances: [], error: result.error };
    }
    return { success: true, instances: result.data };
  }

  static async createInstance(
    instanceName: string = "naveprospect",
    webhookUrl?: string
  ): Promise<{ success: boolean; data?: any; error?: string }> {
    const body: Record<string, any> = {
      instanceName,
      token: this.getApiKey(),
      qrcode: true,
      integration: "WHATSAPP-BAILEYS",
    };

    if (webhookUrl) {
      body.webhook = {
        url: webhookUrl,
        enabled: true,
        webhookByEvents: true,
        events: ["MESSAGES_UPSERT", "CONNECTION_UPDATE", "QRCODE_UPDATED"],
      };
    }

    return this.request("/instance/create", {
      method: "POST",
      body: JSON.stringify(body),
    });
  }

  static async connectInstance(
    instanceName: string = "naveprospect"
  ): Promise<{ success: boolean; data?: EvolutionQrCodeResponse; error?: string }> {
    return this.request<EvolutionQrCodeResponse>(`/instance/connect/${instanceName}`, {
      method: "GET",
    });
  }

  static async getConnectionState(
    instanceName: string = "naveprospect"
  ): Promise<{ success: boolean; state?: string; instance?: EvolutionInstance; error?: string }> {
    const instancesRes = await this.fetchInstances();
    if (instancesRes.success && Array.isArray(instancesRes.instances)) {
      const found = instancesRes.instances.find(
        (i) => i.name === instanceName || i.instanceName === instanceName
      );
      if (found) {
        const state = found.connectionStatus || found.status || (found.ownerJid ? "open" : "close");
        return { success: true, state, instance: found };
      }
    }

    const result = await this.request<any>(`/instance/connectionState/${instanceName}`);
    if (!result.success) {
      return { success: false, error: result.error };
    }
    const state = result.data?.instance?.state || result.data?.state || "unknown";
    return { success: true, state };
  }

  static async sendTextMessage(
    number: string,
    text: string,
    instanceName: string = "naveprospect"
  ): Promise<{ success: boolean; data?: any; error?: string }> {
    const cleanNumber = number.replace(/\D/g, "");
    const formattedNumber = cleanNumber.startsWith("55") ? cleanNumber : `55${cleanNumber}`;

    return this.request(`/message/sendText/${instanceName}`, {
      method: "POST",
      body: JSON.stringify({
        number: formattedNumber,
        text,
        options: {
          delay: 1000,
          presence: "composing",
        },
      }),
    });
  }

  // Local Chat Messages Store
  static getStoredMessages(instanceName: string, clientPhone?: string): ChatMessage[] {
    if (typeof window === "undefined") return [];
    try {
      const raw = localStorage.getItem(MESSAGES_KEY);
      const all: ChatMessage[] = raw ? JSON.parse(raw) : [];
      let filtered = all.filter((m) => m.instance_name === instanceName);
      if (clientPhone) {
        const cleanPhone = clientPhone.replace(/\D/g, "");
        filtered = filtered.filter(
          (m) =>
            m.client_phone.replace(/\D/g, "").includes(cleanPhone) ||
            cleanPhone.includes(m.client_phone.replace(/\D/g, ""))
        );
      }
      return filtered.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    } catch {
      return [];
    }
  }

  static saveMessage(msg: Omit<ChatMessage, "id" | "created_at">): ChatMessage {
    const newMsg: ChatMessage = {
      ...msg,
      id: "msg_" + Date.now() + "_" + Math.random().toString(36).substr(2, 4),
      created_at: new Date().toISOString(),
    };

    if (typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem(MESSAGES_KEY);
        const all: ChatMessage[] = raw ? JSON.parse(raw) : [];
        all.push(newMsg);
        localStorage.setItem(MESSAGES_KEY, JSON.stringify(all));
      } catch (e) {
        console.error("Erro salvando mensagem:", e);
      }
    }

    return newMsg;
  }
}
