"use client";

import React, { useState, useEffect } from "react";
import {
  MessageSquare,
  Search,
  ExternalLink,
  Send,
  Sparkles,
  User,
  Phone,
  Building,
  CheckCircle2,
  Copy,
  Star,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { DataService } from "@/lib/data-service";
import { formatPhone, getCleanPhoneForWhatsApp, getStatusBadgeInfo } from "@/lib/utils";
import { Client, ClientStatus } from "@/types/database";

const MESSAGE_TEMPLATES = [
  {
    id: "apresentacao",
    title: "1. Oferta Upgrade 100M",
    text: "Olá, {NOME}! Tudo bem? Aqui é da equipe de atendimento da sua internet. Estamos com uma condição exclusiva para dobrar sua velocidade de 50 Mega para 100 Mega sem custo de adesão! Gostaria de aproveitar?",
  },
  {
    id: "roteador",
    title: "2. Troca de Roteador Gigabit",
    text: "Olá, {NOME}! Para ativar seu novo plano de 100 Mega com velocidade máxima no Wi-Fi, podemos agendar a visita técnica para configuração do roteador Gigabit. Qual o melhor dia e horário para você?",
  },
  {
    id: "followup",
    title: "3. Follow-up / Dúvidas",
    text: "Olá, {NOME}! Passando para saber se você conseguiu avaliar nossa proposta de upgrade para 100 Mega. Ficou alguma dúvida sobre o plano?",
  },
  {
    id: "nps",
    title: "4. Pesquisa de Satisfação NPS",
    text: "Olá, {NOME}! Como está sendo sua experiência com a nossa internet? De 0 a 10, qual nota você nos daria hoje?",
  },
  {
    id: "indicacao",
    title: "5. Pedido de Indicação",
    text: "Olá, {NOME}! Que ótimo saber que está satisfeito com sua conexão! Você tem algum vizinho ou amigo no condomínio para indicar? Se ele fechar conosco, ambos ganham benefícios!",
  },
];

export default function ConversasPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [currentMessage, setCurrentMessage] = useState("");
  const [copied, setCopied] = useState(false);

  const loadData = async () => {
    const data = await DataService.getClients();
    setClients(data);
    if (data.length > 0 && !selectedClient) {
      setSelectedClient(data[0]);
      prepareTemplate(MESSAGE_TEMPLATES[0].text, data[0]);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const prepareTemplate = (templateText: string, client: Client) => {
    const personalized = templateText.replace(/{NOME}/g, client.name.split(" ")[0]);
    setCurrentMessage(personalized);
  };

  const handleSelectClient = (client: Client) => {
    setSelectedClient(client);
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

  const handleStatusChange = async (newStatus: ClientStatus) => {
    if (!selectedClient) return;
    await DataService.updateClientStatus(selectedClient.id, newStatus);
    setSelectedClient({ ...selectedClient, status: newStatus });
    loadData();
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
          <MessageSquare className="h-6 w-6 text-emerald-600" />
          Central de Conversas WhatsApp
        </h1>
        <p className="text-xs md:text-sm text-slate-500">
          Painel de preparação de mensagens e atendimento manual humanizado para clientes da esteira de upgrade.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 h-[calc(100vh-210px)] min-h-[600px]">
        {/* Left: Clients List */}
        <div className="lg:col-span-4 flex flex-col rounded-xl border bg-white shadow-sm overflow-hidden">
          <div className="p-3 border-b space-y-2 bg-slate-50">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar cliente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full text-xs rounded-lg border border-slate-200 bg-white px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="all">Todos os clientes ({clients.length})</option>
              <option value="frio">❄️ Frio</option>
              <option value="morno">🌤️ Morno</option>
              <option value="quente">🔥 Quente</option>
              <option value="vendido">🏆 Vendido</option>
            </select>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {filteredClients.map((client) => {
              const isSelected = selectedClient?.id === client.id;
              const statusInfo = getStatusBadgeInfo(client.status);
              return (
                <div
                  key={client.id}
                  onClick={() => handleSelectClient(client)}
                  className={`p-3 cursor-pointer transition-colors ${
                    isSelected
                      ? "bg-blue-50/80 border-l-4 border-blue-600"
                      : "hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 truncate max-w-[160px]">
                      {client.name}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${statusInfo.color}`}
                    >
                      {statusInfo.icon} {statusInfo.label}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-1 text-[11px] text-slate-500">
                    <span>{formatPhone(client.phone)}</span>
                    <span className="text-[10px] text-slate-400">{client.condominium || "Geral"}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Message Workstation */}
        <div className="lg:col-span-8 flex flex-col rounded-xl border bg-white shadow-sm overflow-hidden">
          {selectedClient ? (
            <div className="flex-1 flex flex-col p-5 space-y-4 overflow-y-auto">
              {/* Client Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-slate-900">
                      {selectedClient.name}
                    </h2>
                    <Badge className={getStatusBadgeInfo(selectedClient.status).color}>
                      {getStatusBadgeInfo(selectedClient.status).icon}{" "}
                      {getStatusBadgeInfo(selectedClient.status).label}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5">
                    <span>{formatPhone(selectedClient.phone)}</span>
                    <span>•</span>
                    <span>{selectedClient.condominium || "Condomínio Geral"}</span>
                    <span>•</span>
                    <span className="font-semibold text-blue-600">
                      {selectedClient.current_plan} → {selectedClient.target_plan}
                    </span>
                  </div>
                </div>

                {/* Status Quick Changer */}
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-slate-400 font-medium">Mover etapa:</span>
                  {(["frio", "morno", "quente", "vendido"] as ClientStatus[]).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => handleStatusChange(st)}
                      className={`px-2 py-1 rounded text-[11px] font-bold border transition-all ${
                        selectedClient.status === st
                          ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                          : "bg-slate-50 text-slate-600 hover:bg-slate-100 border-slate-200"
                      }`}
                    >
                      {getStatusBadgeInfo(st).icon} {getStatusBadgeInfo(st).label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Templates Selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                  <Sparkles className="h-3.5 w-3.5 text-blue-600" />
                  Modelos de Abordagem Rápida:
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {MESSAGE_TEMPLATES.map((tmpl) => (
                    <Button
                      key={tmpl.id}
                      variant="outline"
                      size="sm"
                      onClick={() => prepareTemplate(tmpl.text, selectedClient)}
                      className="text-xs bg-slate-50 hover:bg-blue-50 hover:border-blue-300 text-slate-700 h-8"
                    >
                      {tmpl.title}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Message Editor */}
              <div className="space-y-1.5 flex-1 flex flex-col">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700">
                    Mensagem Personalizada a Enviar:
                  </label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCopy}
                    className="text-xs text-slate-500 hover:text-slate-800 h-7"
                  >
                    <Copy className="h-3.5 w-3.5 mr-1" />
                    {copied ? "Copiado!" : "Copiar Texto"}
                  </Button>
                </div>
                <Textarea
                  value={currentMessage}
                  onChange={(e) => setCurrentMessage(e.target.value)}
                  className="flex-1 min-h-[120px] text-xs font-sans bg-slate-50/50 p-3 leading-relaxed"
                  placeholder="Digite ou selecione uma mensagem acima..."
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-col sm:flex-row gap-3 border-t">
                <a
                  href={getWhatsAppWebUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-4 text-xs shadow-md shadow-emerald-600/20 transition-all active:scale-[0.98]"
                >
                  <MessageSquare className="h-4 w-4" />
                  <span>Abrir no WhatsApp Web (Navegador)</span>
                  <ExternalLink className="h-3.5 w-3.5 opacity-70" />
                </a>

                <a
                  href={getWhatsAppMobileUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold py-3 px-4 text-xs transition-all"
                >
                  <span>Abrir no App / Celular</span>
                  <ExternalLink className="h-3.5 w-3.5 opacity-70" />
                </a>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400">
              <MessageSquare className="h-12 w-12 text-slate-300 mb-2" />
              <h3 className="text-sm font-bold text-slate-700">Nenhum cliente selecionado</h3>
              <p className="text-xs">Selecione um cliente na lista ao lado para iniciar a conversa.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
