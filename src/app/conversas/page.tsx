"use client";

import React, { useState, useEffect } from "react";
import {
  MessageSquare,
  Search,
  ExternalLink,
  Sparkles,
  User,
  Phone,
  Building,
  CheckCircle2,
  Copy,
  Star,
  Zap,
  Save,
  UserCheck,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { DataService } from "@/lib/data-service";
import { formatPhone, getCleanPhoneForWhatsApp, getStatusBadgeInfo } from "@/lib/utils";
import { Client, ClientStatus } from "@/types/database";

const MESSAGE_TEMPLATES = [
  {
    id: "apresentacao",
    title: "1. Oferta 100M",
    text: "Olá, {NOME}! Tudo bem? Aqui é da equipe da sua internet. Temos uma condição exclusiva para você dobrar sua velocidade de 50 Mega para 100 Mega sem custo de adesão! Gostaria de aproveitar?",
  },
  {
    id: "roteador",
    title: "2. Roteador Gigabit",
    text: "Olá, {NOME}! Para ativar seu novo plano de 100 Mega com máxima performance, podemos agendar a visita técnica para instalação do roteador Gigabit. Qual o melhor horário para você?",
  },
  {
    id: "followup",
    title: "3. Follow-up",
    text: "Olá, {NOME}! Passando para saber se você conseguiu avaliar nossa proposta de upgrade para 100 Mega. Ficou alguma dúvida?",
  },
  {
    id: "nps",
    title: "4. Pesquisa NPS",
    text: "Olá, {NOME}! Como está sendo sua experiência com a nossa conexão? De 0 a 10, qual nota você nos daria hoje?",
  },
  {
    id: "indicacao",
    title: "5. Indicação",
    text: "Olá, {NOME}! Que ótimo saber que está satisfeito! Tem algum vizinho ou amigo no condomínio para indicar? Se ele fechar conosco, ambos ganham benefícios!",
  },
];

export default function ConversasPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [currentMessage, setCurrentMessage] = useState("");
  const [copied, setCopied] = useState(false);

  // Client Data Panel State
  const [clientData, setClientData] = useState<Partial<Client>>({});
  const [isSavingData, setIsSavingData] = useState(false);
  const [dataSavedSuccess, setDataSavedSuccess] = useState(false);

  const loadData = async () => {
    const data = await DataService.getClients();
    setClients(data);
    if (data.length > 0 && !selectedClient) {
      handleSelectClient(data[0]);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const prepareTemplate = (templateText: string, client: Client) => {
    const firstName = client.name.split(" ")[0];
    const personalized = templateText.replace(/{NOME}/g, firstName);
    setCurrentMessage(personalized);
  };

  const handleSelectClient = (client: Client) => {
    setSelectedClient(client);
    setClientData({
      status: client.status,
      nps_score: client.nps_score,
      wants_upgrade: client.wants_upgrade,
      gave_referral: client.gave_referral,
      referral_name: client.referral_name || "",
      referral_phone: client.referral_phone || "",
      notes: client.notes || "",
    });
    prepareTemplate(MESSAGE_TEMPLATES[0].text, client);
  };

  const filteredClients = clients.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.phone.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getWhatsAppWebUrl = () => {
    if (!selectedClient) return "#";
    const phone = getCleanPhoneForWhatsApp(selectedClient.phone);
    return `https://web.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(currentMessage)}`;
  };

  const getWhatsAppMobileUrl = () => {
    if (!selectedClient) return "#";
    const phone = getCleanPhoneForWhatsApp(selectedClient.phone);
    return `https://wa.me/${phone}?text=${encodeURIComponent(currentMessage)}`;
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(currentMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleQuickStatusChange = async (newStatus: ClientStatus) => {
    if (!selectedClient) return;
    await DataService.updateClientStatus(selectedClient.id, newStatus);
    setSelectedClient({ ...selectedClient, status: newStatus });
    setClientData((prev) => ({ ...prev, status: newStatus }));
    loadData();
  };

  const handleSaveClientData = async () => {
    if (!selectedClient) return;
    setIsSavingData(true);
    try {
      await DataService.updateClient(selectedClient.id, clientData);
      setDataSavedSuccess(true);
      setTimeout(() => setDataSavedSuccess(false), 2000);
      loadData();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSavingData(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-[#0F172A] tracking-tight">
          Central de Conversas
        </h1>
        <p className="text-xs md:text-sm text-[#64748B]">
          Atendimento manual de clientes com templates inteligentes e registro rápido de dados.
        </p>
      </div>

      {/* 3-Column Layout: [ Clientes | Conversa | Dados ] */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 h-[calc(100vh-210px)] min-h-[620px]">
        {/* COLUNA 1: Clientes (3 cols) */}
        <div className="lg:col-span-3 flex flex-col rounded-xl border border-[#E2E8F0] bg-white shadow-sm overflow-hidden">
          <div className="p-3 border-b border-[#E2E8F0] space-y-2 bg-[#F8FAFC]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#0F172A]">Clientes</span>
              <span className="text-[11px] text-[#64748B]">{filteredClients.length} contatos</span>
            </div>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-[#64748B]" />
              <input
                type="text"
                placeholder="Buscar cliente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-[#E2E8F0] bg-white text-[#0F172A] placeholder:text-[#64748B] focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full text-xs rounded-lg border border-[#E2E8F0] bg-white text-[#0F172A] px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
            >
              <option value="all">Todos os status</option>
              <option value="frio">❄️ Frio</option>
              <option value="morno">🌤️ Morno</option>
              <option value="quente">🔥 Quente</option>
              <option value="vendido">🏆 Vendido</option>
            </select>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-[#F1F5F9]">
            {filteredClients.map((client) => {
              const isSelected = selectedClient?.id === client.id;
              const statusInfo = getStatusBadgeInfo(client.status);
              return (
                <div
                  key={client.id}
                  onClick={() => handleSelectClient(client)}
                  className={`p-3 cursor-pointer transition-colors ${
                    isSelected
                      ? "bg-[#EFF6FF] border-l-4 border-[#2563EB]"
                      : "hover:bg-[#F8FAFC]"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-[#0F172A] truncate max-w-[140px]">
                      {client.name}
                    </span>
                    <span
                      className={`text-[10px] font-semibold px-1.5 py-0.2 rounded ${statusInfo.color}`}
                    >
                      {statusInfo.label}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-1 text-[11px] text-[#64748B]">
                    <span>{formatPhone(client.phone)}</span>
                    <span className="text-[10px] text-[#94A3B8]">{client.condominium || "Geral"}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* COLUNA 2: Conversa (6 cols) */}
        <div className="lg:col-span-6 flex flex-col rounded-xl border border-[#E2E8F0] bg-white shadow-sm overflow-hidden">
          {selectedClient ? (
            <div className="flex-1 flex flex-col p-4 space-y-3.5 overflow-y-auto">
              {/* Header do Chat */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#E2E8F0] gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-bold text-[#0F172A]">
                      {selectedClient.name}
                    </h2>
                    <Badge className={getStatusBadgeInfo(selectedClient.status).color}>
                      {getStatusBadgeInfo(selectedClient.status).label}
                    </Badge>
                  </div>
                  <div className="text-[11px] text-[#64748B] mt-0.5">
                    {formatPhone(selectedClient.phone)} • {selectedClient.condominium || "Condomínio Geral"}
                  </div>
                </div>

                {/* Etapas rápidas */}
                <div className="flex items-center gap-1">
                  {(["frio", "morno", "quente", "vendido"] as ClientStatus[]).map((st) => {
                    const isCurrent = selectedClient.status === st;
                    return (
                      <button
                        key={st}
                        type="button"
                        onClick={() => handleQuickStatusChange(st)}
                        className={`px-2 py-1 rounded text-[10px] font-semibold border transition-all ${
                          isCurrent
                            ? "bg-[#0F172A] text-white border-[#0F172A]"
                            : "bg-white text-[#64748B] hover:bg-[#F8FAFC] border-[#E2E8F0]"
                        }`}
                      >
                        {st}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Templates Rápidos */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-[#64748B] flex items-center gap-1">
                  <Sparkles className="h-3 w-3 text-[#2563EB]" />
                  Modelos Prontos de Mensagem:
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {MESSAGE_TEMPLATES.map((tmpl) => (
                    <Button
                      key={tmpl.id}
                      variant="outline"
                      size="sm"
                      onClick={() => prepareTemplate(tmpl.text, selectedClient)}
                      className="text-[11px] border-[#E2E8F0] bg-[#F8FAFC] hover:bg-[#EFF6FF] hover:border-[#2563EB] hover:text-[#2563EB] text-[#0F172A] h-7 px-2.5"
                    >
                      {tmpl.title}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Caixa de Texto da Mensagem */}
              <div className="space-y-1 flex-1 flex flex-col">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-semibold text-[#64748B]">
                    Mensagem a Enviar:
                  </label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCopy}
                    className="text-[11px] text-[#64748B] hover:text-[#0F172A] h-6 px-2"
                  >
                    <Copy className="h-3 w-3 mr-1" />
                    {copied ? "Copiado!" : "Copiar"}
                  </Button>
                </div>
                <Textarea
                  value={currentMessage}
                  onChange={(e) => setCurrentMessage(e.target.value)}
                  className="flex-1 min-h-[140px] text-xs bg-[#F8FAFC] border-[#E2E8F0] text-[#0F172A] p-3 leading-relaxed rounded-lg focus-visible:ring-[#2563EB]"
                  placeholder="Digite sua mensagem personalizada..."
                />
              </div>

              {/* Botões de Ação WhatsApp */}
              <div className="pt-2 flex flex-col sm:flex-row gap-2.5 border-t border-[#E2E8F0]">
                <a
                  href={getWhatsAppWebUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold py-2.5 px-4 text-xs shadow-sm transition-colors"
                >
                  <MessageSquare className="h-4 w-4" />
                  <span>Abrir no WhatsApp Web</span>
                  <ExternalLink className="h-3.5 w-3.5 opacity-70" />
                </a>

                <a
                  href={getWhatsAppMobileUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-[#E2E8F0] bg-white hover:bg-[#F8FAFC] text-[#0F172A] font-semibold py-2.5 px-3 text-xs"
                >
                  <span>App / Celular</span>
                  <ExternalLink className="h-3.5 w-3.5 opacity-70" />
                </a>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-[#64748B]">
              <MessageSquare className="h-10 w-10 text-[#CBD5E1] mb-2" />
              <h3 className="text-xs font-semibold text-[#0F172A]">Nenhum cliente selecionado</h3>
              <p className="text-[11px] text-[#64748B]">Selecione um cliente ao lado.</p>
            </div>
          )}
        </div>

        {/* COLUNA 3: Dados do Cliente (3 cols) */}
        <div className="lg:col-span-3 flex flex-col rounded-xl border border-[#E2E8F0] bg-white shadow-sm overflow-hidden">
          <div className="p-3 border-b border-[#E2E8F0] bg-[#F8FAFC]">
            <span className="text-xs font-semibold text-[#0F172A]">Dados & Feedback</span>
          </div>

          {selectedClient ? (
            <div className="flex-1 p-3.5 space-y-4 overflow-y-auto text-xs">
              {/* Planos */}
              <div className="rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] p-3 space-y-1">
                <span className="text-[11px] text-[#64748B] block font-medium">Plano Atual → Alvo</span>
                <div className="font-semibold text-[#0F172A] flex items-center justify-between">
                  <span>{selectedClient.current_plan}</span>
                  <span className="text-[#2563EB]">→ {selectedClient.target_plan}</span>
                </div>
              </div>

              {/* NPS */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-[#0F172A] flex items-center justify-between">
                  <span>Avaliação NPS (0 a 10)</span>
                  {clientData.nps_score !== null && clientData.nps_score !== undefined && (
                    <span className="font-bold text-[#2563EB]">Nota {clientData.nps_score}</span>
                  )}
                </label>
                <div className="grid grid-cols-6 gap-1">
                  {[0, 2, 4, 6, 8, 10].map((score) => {
                    const isSelected = clientData.nps_score === score;
                    return (
                      <button
                        key={score}
                        type="button"
                        onClick={() => setClientData({ ...clientData, nps_score: score })}
                        className={`h-7 rounded text-[10px] font-semibold border transition-all ${
                          isSelected
                            ? "bg-[#2563EB] text-white border-[#2563EB]"
                            : "bg-white text-[#0F172A] hover:bg-[#F8FAFC] border-[#E2E8F0]"
                        }`}
                      >
                        {score}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Upgrade Interest & Referral */}
              <div className="space-y-2 pt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={clientData.wants_upgrade || false}
                    onChange={(e) => setClientData({ ...clientData, wants_upgrade: e.target.checked })}
                    className="h-3.5 w-3.5 rounded border-[#CBD5E1] text-[#2563EB]"
                  />
                  <span className="text-xs font-medium text-[#0F172A]">Interesse no Upgrade</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={clientData.gave_referral || false}
                    onChange={(e) => setClientData({ ...clientData, gave_referral: e.target.checked })}
                    className="h-3.5 w-3.5 rounded border-[#CBD5E1] text-[#2563EB]"
                  />
                  <span className="text-xs font-medium text-[#0F172A]">Cliente Fez Indicação</span>
                </label>
              </div>

              {/* Indicação Fields se ativo */}
              {clientData.gave_referral && (
                <div className="rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] p-2.5 space-y-2">
                  <span className="text-[10px] font-semibold uppercase text-[#64748B]">Dados do Indicado</span>
                  <Input
                    placeholder="Nome do indicado"
                    value={clientData.referral_name || ""}
                    onChange={(e) => setClientData({ ...clientData, referral_name: e.target.value })}
                    className="h-7 text-xs bg-white border-[#E2E8F0]"
                  />
                  <Input
                    placeholder="Telefone do indicado"
                    value={clientData.referral_phone || ""}
                    onChange={(e) => setClientData({ ...clientData, referral_phone: e.target.value })}
                    className="h-7 text-xs bg-white border-[#E2E8F0]"
                  />
                </div>
              )}

              {/* Anotações */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-[#0F172A]">Anotações / Histórico</label>
                <Textarea
                  value={clientData.notes || ""}
                  onChange={(e) => setClientData({ ...clientData, notes: e.target.value })}
                  placeholder="Observações do contato..."
                  rows={3}
                  className="text-xs bg-[#F8FAFC] border-[#E2E8F0]"
                />
              </div>

              {/* Salvar Dados */}
              <div className="pt-2">
                <Button
                  onClick={handleSaveClientData}
                  disabled={isSavingData}
                  className="w-full bg-[#0F172A] hover:bg-black text-white text-xs font-semibold h-8 rounded-lg"
                >
                  {dataSavedSuccess ? (
                    <span className="text-[#22C55E] flex items-center gap-1">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Salvo!
                    </span>
                  ) : (
                    <span className="flex items-center gap-1">
                      <Save className="h-3.5 w-3.5" /> Salvar Dados
                    </span>
                  )}
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex-1 p-6 text-center text-xs text-[#64748B]">
              Selecione um cliente para visualizar e editar os dados.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
