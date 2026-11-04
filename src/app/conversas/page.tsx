"use client";

import React, { useState, useEffect, useMemo, Suspense, useRef } from "react";
import { useSearchParams } from "next/navigation";
import {
  MessageSquare,
  Search,
  Sparkles,
  CheckCircle2,
  Copy,
  Star,
  Zap,
  Save,
  UserCheck,
  Send,
  Loader2,
  AlertCircle,
  RefreshCw,
  Clock,
  User,
  Filter,
  Check,
  CheckCheck,
  Phone,
  Layers,
  ChevronRight,
  Shield,
  HelpCircle,
  Tag,
  Calendar,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { formatPhone } from "@/lib/utils";
import {
  Conversation,
  DbMessage,
  ConversationNote,
  ConversationEvent,
  Client,
  CampaignStage,
} from "@/types/database";

const MESSAGE_TEMPLATES = [
  {
    id: "apresentacao",
    title: "1. Oferta 100M",
    text: "Olá! Tudo bem? Aqui é da Navetech Telecom. Estamos com uma condição exclusiva para você dobrar sua velocidade de 50 Mega para 100 Mega sem custo de adesão e com novo roteador! Gostaria de aproveitar?",
  },
  {
    id: "roteador",
    title: "2. Troca de Roteador",
    text: "Olá! Para ativar seu novo plano de 100 Mega com máxima performance no Wi-Fi, podemos agendar a visita técnica para instalação do roteador Gigabit. Qual o melhor dia e horário para você?",
  },
  {
    id: "followup",
    title: "3. Follow-up",
    text: "Olá! Passando para saber se você conseguiu avaliar nossa proposta de upgrade para 100 Mega. Ficou alguma dúvida?",
  },
  {
    id: "nps",
    title: "4. Pesquisa NPS",
    text: "Olá! Como está sendo sua experiência com a nossa internet? De 0 a 10, qual nota você nos daria hoje?",
  },
  {
    id: "indicacao",
    title: "5. Indique e Ganhe",
    text: "Olá! Que ótimo saber que está satisfeito com a Navetech! Tem algum amigo ou familiar para indicar no nosso programa Indique e Ganhe? Se ele fechar conosco, ambos ganham benefícios!",
  },
];

const OBJECTION_OPTIONS = [
  "Preço / Valor da mensalidade",
  "Já possui velocidade suficiente",
  "Fidelidade / Contrato atual",
  "Problema técnico pendente",
  "Precisa consultar cônjuge/sócio",
  "Sem interesse no momento",
  "Outra objeção",
];

function ConversasContent() {
  const searchParams = useSearchParams();
  const targetClientId = searchParams.get("clientId");

  // Estado geral
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<DbMessage[]>([]);
  const [notes, setNotes] = useState<ConversationNote[]>([]);
  const [events, setEvents] = useState<ConversationEvent[]>([]);

  // Carregamentos
  const [isLoadingConversations, setIsLoadingConversations] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isSavingNote, setIsSavingNote] = useState(false);
  const [isMovingStage, setIsMovingStage] = useState(false);

  // Filtros
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCampaign, setSelectedCampaign] = useState<string>("all");
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [campaignStages, setCampaignStages] = useState<CampaignStage[]>([]);

  // Caixa de Envio
  const [inputText, setInputText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Formulário de Nota Comercial
  const [noteContent, setNoteContent] = useState("");
  const [commercialClass, setCommercialClass] = useState("Interessado");
  const [selectedObjection, setSelectedObjection] = useState("");
  const [followupDate, setFollowupDate] = useState("");

  // Contadores
  const [counts, setCounts] = useState({
    all: 0,
    unread: 0,
    waiting_user: 0,
    waiting_client: 0,
    triagem: 0,
    closed: 0,
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // 1. Carregar usuário e campanhas
  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => {
        if (d.success && d.user) setCurrentUser(d.user);
      })
      .catch(() => {});

    fetch("/api/campaigns")
      .then((r) => r.json())
      .then((d) => {
        if (d.success && d.campaigns) setCampaigns(d.campaigns);
      })
      .catch(() => {});
  }, []);

  // 2. Carregar conversas
  const loadConversas = async () => {
    setIsLoadingConversations(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.append("status", statusFilter);
      if (selectedCampaign !== "all") params.append("campaign_id", selectedCampaign);
      if (searchTerm) params.append("search", searchTerm);

      const res = await fetch(`/api/conversations?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          setConversations(json.conversations || []);
          if (json.counts) setCounts(json.counts);

          // Se veio clientId na URL, seleciona a conversa do cliente
          if (targetClientId && !selectedConversation) {
            const found = (json.conversations || []).find(
              (c: Conversation) => c.contact_client_id === targetClientId
            );
            if (found) setSelectedConversation(found);
          }
        }
      }
    } catch (err) {
      console.error("Erro ao carregar conversas:", err);
    } finally {
      setIsLoadingConversations(false);
    }
  };

  useEffect(() => {
    loadConversas();
  }, [statusFilter, selectedCampaign]);

  // Busca com debounce simples
  useEffect(() => {
    const timer = setTimeout(() => {
      loadConversas();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // 3. Carregar mensagens e detalhes da conversa selecionada
  const loadConversationDetails = async (convId: string) => {
    setIsLoadingMessages(true);
    try {
      const [msgRes, detRes] = await Promise.all([
        fetch(`/api/conversations/${convId}/messages`),
        fetch(`/api/conversations/${convId}`),
      ]);

      if (msgRes.ok) {
        const msgJson = await msgRes.json();
        if (msgJson.success) {
          setMessages(msgJson.messages || []);
        }
      }

      if (detRes.ok) {
        const detJson = await detRes.json();
        if (detJson.success) {
          setNotes(detJson.notes || []);
          setEvents(detJson.events || []);
          if (detJson.conversation) {
            setSelectedConversation(detJson.conversation);

            // Carregar etapas da campanha deste lead
            const campId = detJson.conversation.campaign_lead?.campaign_id;
            if (campId) {
              fetch(`/api/campaigns/${campId}`)
                .then((r) => r.json())
                .then((d) => {
                  if (d.success && d.stages) setCampaignStages(d.stages);
                })
                .catch(() => {});
            }
          }
        }
      }
    } catch (err) {
      console.error("Erro ao carregar detalhes da conversa:", err);
    } finally {
      setIsLoadingMessages(false);
      setTimeout(scrollToBottom, 150);
    }
  };

  useEffect(() => {
    if (selectedConversation?.id) {
      loadConversationDetails(selectedConversation.id);
    }
  }, [selectedConversation?.id]);

  // 4. Enviar mensagem manual
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!selectedConversation || !inputText.trim() || isSending) return;

    const textToSend = inputText.trim();
    setIsSending(true);

    try {
      const res = await fetch(`/api/conversations/${selectedConversation.id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: textToSend }),
      });

      if (res.ok) {
        setInputText("");
        await loadConversationDetails(selectedConversation.id);
        loadConversas();
      } else {
        const err = await res.json();
        alert(`Erro no envio: ${err.error || "Falha na Evolution API"}`);
      }
    } catch (err: any) {
      alert(`Falha ao conectar: ${err.message}`);
    } finally {
      setIsSending(false);
    }
  };

  // 5. Salvar nota comercial
  const handleSaveNote = async () => {
    if (!selectedConversation || !noteContent.trim() || isSavingNote) return;

    setIsSavingNote(true);
    try {
      const res = await fetch(`/api/conversations/${selectedConversation.id}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: noteContent.trim(),
          commercial_classification: commercialClass,
          objection: selectedObjection || null,
          next_followup_at: followupDate ? new Date(followupDate).toISOString() : null,
        }),
      });

      if (res.ok) {
        setNoteContent("");
        setSelectedObjection("");
        setFollowupDate("");
        loadConversationDetails(selectedConversation.id);
      } else {
        const err = await res.json();
        alert(`Erro: ${err.error}`);
      }
    } catch (err: any) {
      alert(`Erro: ${err.message}`);
    } finally {
      setIsSavingNote(false);
    }
  };

  // 6. Mover etapa no Kanban
  const handleMoveStage = async (newStageId: string) => {
    if (!selectedConversation?.campaign_lead || isMovingStage) return;

    setIsMovingStage(true);
    const campId = selectedConversation.campaign_lead.campaign_id;
    const clientId = selectedConversation.contact_client_id;

    try {
      const res = await fetch(`/api/campaigns/${campId}/leads/move`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_id: clientId,
          new_stage_id: newStageId,
        }),
      });

      if (res.ok) {
        await loadConversationDetails(selectedConversation.id);
        loadConversas();
      }
    } catch (err) {
      console.error("Erro ao mover etapa:", err);
    } finally {
      setIsMovingStage(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden bg-[#F8FAFC]">
      {/* ========================================================================= */}
      {/* COLUNA 1: CAIXA DE ENTRADA & FILTROS (LARGURA FIXA 340px)               */}
      {/* ========================================================================= */}
      <div className="flex w-80 md:w-96 flex-col border-r border-[#E2E8F0] bg-white">
        {/* Header da Coluna 1 */}
        <div className="border-b border-[#E2E8F0] p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#FFF4EC] text-[#FF6A00] border border-[#FFD0A8]">
                <MessageSquare className="h-4 w-4" />
              </span>
              <h2 className="font-bold text-base text-[#0F172A]">Central de Conversas</h2>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={loadConversas}
              className="h-8 w-8 p-0 text-[#64748B] hover:text-[#0F172A]"
              title="Atualizar conversas"
            >
              <RefreshCw className={`h-4 w-4 ${isLoadingConversations ? "animate-spin" : ""}`} />
            </Button>
          </div>

          {/* Campo de Busca */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-[#94A3B8]" />
            <input
              type="text"
              placeholder="Buscar por nome, telefone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full text-xs rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] pl-8 pr-3 py-2 text-[#0F172A] placeholder:text-[#94A3B8] outline-none focus:border-[#FF6A00]"
            />
          </div>

          {/* Filtro de Campanha */}
          <div className="flex items-center gap-2 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] px-2.5 py-1.5">
            <Filter className="h-3.5 w-3.5 text-[#64748B]" />
            <select
              value={selectedCampaign}
              onChange={(e) => setSelectedCampaign(e.target.value)}
              className="w-full bg-transparent text-xs font-semibold text-[#0F172A] outline-none"
            >
              <option value="all">Todas as Campanhas</option>
              {campaigns.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Abas de Status da Caixa */}
        <div className="flex border-b border-[#E2E8F0] bg-slate-50/60 overflow-x-auto text-[11px] font-semibold divide-x divide-slate-200/60">
          <button
            onClick={() => setStatusFilter("all")}
            className={`px-3 py-2 shrink-0 ${statusFilter === "all" ? "bg-white text-[#FF6A00] font-bold border-b-2 border-[#FF6A00]" : "text-slate-600 hover:text-slate-900"}`}
          >
            Todas ({counts.all})
          </button>
          <button
            onClick={() => setStatusFilter("unread")}
            className={`px-3 py-2 shrink-0 ${statusFilter === "unread" ? "bg-white text-emerald-600 font-bold border-b-2 border-emerald-600" : "text-slate-600 hover:text-slate-900"}`}
          >
            Não lidas ({counts.unread})
          </button>
          <button
            onClick={() => setStatusFilter("waiting_user")}
            className={`px-3 py-2 shrink-0 ${statusFilter === "waiting_user" ? "bg-white text-amber-600 font-bold border-b-2 border-amber-600" : "text-slate-600 hover:text-slate-900"}`}
          >
            Aguard. Vendedor ({counts.waiting_user})
          </button>
          <button
            onClick={() => setStatusFilter("waiting_client")}
            className={`px-3 py-2 shrink-0 ${statusFilter === "waiting_client" ? "bg-white text-blue-600 font-bold border-b-2 border-blue-600" : "text-slate-600 hover:text-slate-900"}`}
          >
            Aguard. Cliente ({counts.waiting_client})
          </button>
          <button
            onClick={() => setStatusFilter("triagem")}
            className={`px-3 py-2 shrink-0 ${statusFilter === "triagem" ? "bg-white text-purple-600 font-bold border-b-2 border-purple-600" : "text-slate-600 hover:text-slate-900"}`}
          >
            Triagem ({counts.triagem})
          </button>
        </div>

        {/* Lista de Conversas */}
        <div className="flex-1 overflow-y-auto divide-y divide-[#E2E8F0]">
          {isLoadingConversations ? (
            <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-2">
              <Loader2 className="h-6 w-6 animate-spin text-[#FF6A00]" />
              <span className="text-xs font-medium">Carregando conversas...</span>
            </div>
          ) : conversations.length === 0 ? (
            <div className="py-12 px-4 text-center text-xs text-slate-500">
              Nenhuma conversa encontrada para o filtro selecionado.
            </div>
          ) : (
            conversations.map((conv) => {
              const isSelected = selectedConversation?.id === conv.id;
              const formattedDate = new Date(conv.last_message_at).toLocaleTimeString("pt-BR", {
                hour: "2-digit",
                minute: "2-digit",
              });

              return (
                <div
                  key={conv.id}
                  onClick={() => setSelectedConversation(conv)}
                  className={`p-3.5 cursor-pointer transition-colors hover:bg-slate-50 flex items-start gap-3 ${
                    isSelected ? "bg-[#FFF4EC] border-l-4 border-l-[#FF6A00]" : ""
                  }`}
                >
                  {/* Avatar com inicial */}
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 font-bold text-xs text-[#0F172A] border border-slate-200">
                    {conv.contact_name ? conv.contact_name[0].toUpperCase() : "C"}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-bold text-xs text-[#0F172A] truncate">
                        {conv.contact_name || conv.client?.name || formatPhone(conv.contact_phone)}
                      </h4>
                      <span className="text-[10px] text-slate-400 font-mono shrink-0">
                        {formattedDate}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-600 truncate line-clamp-1">
                      {conv.last_message_text || "Conversa iniciada"}
                    </p>

                    <div className="flex items-center gap-1.5 mt-1.5">
                      {conv.status === "triagem" && (
                        <span className="rounded bg-purple-100 text-purple-700 px-1.5 py-0.5 text-[9px] font-bold">
                          Triagem
                        </span>
                      )}
                      {conv.status === "waiting_user" && (
                        <span className="rounded bg-amber-100 text-amber-800 px-1.5 py-0.5 text-[9px] font-bold">
                          Responder
                        </span>
                      )}
                      {conv.status === "waiting_client" && (
                        <span className="rounded bg-blue-50 text-blue-700 px-1.5 py-0.5 text-[9px]">
                          Enviado
                        </span>
                      )}
                      {conv.unread_count > 0 && (
                        <span className="rounded-full bg-[#FF6A00] text-white px-1.5 py-0.2 text-[10px] font-bold ml-auto">
                          {conv.unread_count}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* COLUNA 2: CHAT DA CONVERSA SELECIONADA                                  */}
      {/* ========================================================================= */}
      <div className="flex flex-1 flex-col bg-[#F8FAFC]">
        {selectedConversation ? (
          <>
            {/* Header do Chat */}
            <div className="flex items-center justify-between border-b border-[#E2E8F0] bg-white px-5 py-3 shadow-2xs">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold text-sm">
                  {selectedConversation.contact_name?.[0]?.toUpperCase() || "W"}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-sm text-[#0F172A]">
                      {selectedConversation.contact_name || selectedConversation.client?.name || "Contato"}
                    </h3>
                    <Badge variant="outline" className="text-[10px]">
                      {selectedConversation.status.toUpperCase()}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-500 font-mono">
                    {formatPhone(selectedConversation.contact_phone)} • Canal:{" "}
                    <strong>{selectedConversation.instance?.provider_instance_name || "nave"}</strong>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => loadConversationDetails(selectedConversation.id)}
                  className="text-xs border-slate-200"
                >
                  <RefreshCw className={`h-3 w-3 mr-1 ${isLoadingMessages ? "animate-spin" : ""}`} />
                  Recarregar
                </Button>
              </div>
            </div>

            {/* Feed de Mensagens */}
            <div className="flex-1 overflow-y-auto p-5 space-y-3.5">
              {isLoadingMessages && messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-2">
                  <Loader2 className="h-6 w-6 animate-spin text-[#FF6A00]" />
                  <span className="text-xs">Carregando histórico auditado...</span>
                </div>
              ) : messages.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-xs text-slate-500">
                  <MessageSquare className="h-8 w-8 mx-auto mb-2 text-slate-300" />
                  Nenhuma mensagem registrada nesta conversa ainda. Utilize a caixa abaixo para enviar a primeira mensagem.
                </div>
              ) : (
                messages.map((msg) => {
                  const isOutbound = msg.direction === "outbound";
                  const timeFormatted = new Date(msg.created_at).toLocaleTimeString("pt-BR", {
                    hour: "2-digit",
                    minute: "2-digit",
                  });

                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isOutbound ? "items-end" : "items-start"}`}
                    >
                      <div
                        className={`max-w-[75%] rounded-2xl p-3 text-xs shadow-2xs ${
                          isOutbound
                            ? "bg-[#FF6A00] text-white rounded-br-xs"
                            : "bg-white text-[#0F172A] border border-[#E2E8F0] rounded-bl-xs"
                        }`}
                      >
                        {/* Remetente */}
                        <div
                          className={`text-[10px] font-bold mb-1 ${
                            isOutbound ? "text-orange-100" : "text-slate-500"
                          }`}
                        >
                          {isOutbound
                            ? msg.created_by_user?.display_name || msg.sender_ref || "Vendedor"
                            : selectedConversation.contact_name || "Cliente"}
                        </div>

                        {/* Corpo da Mensagem */}
                        <p className="whitespace-pre-wrap leading-relaxed">{msg.body}</p>

                        {/* Rodapé: Horário e Status */}
                        <div
                          className={`flex items-center justify-end gap-1 mt-1 text-[9px] ${
                            isOutbound ? "text-orange-200" : "text-slate-400"
                          }`}
                        >
                          <span>{timeFormatted}</span>
                          {isOutbound && (
                            <CheckCheck className="h-3 w-3 inline text-white/80" />
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Área de Envio e Templates */}
            <div className="border-t border-[#E2E8F0] bg-white p-4 space-y-3">
              {/* Barra de Templates Rápidos */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
                <span className="text-[11px] font-bold text-slate-500 shrink-0 flex items-center gap-1">
                  <Sparkles className="h-3 w-3 text-[#FF6A00]" />
                  Templates:
                </span>
                {MESSAGE_TEMPLATES.map((tmpl) => (
                  <button
                    key={tmpl.id}
                    onClick={() => {
                      const clientName = selectedConversation.client?.name || selectedConversation.contact_name || "Cliente";
                      const personalized = tmpl.text.replace(/\{NOME\}/g, clientName.split(" ")[0]);
                      setInputText(personalized);
                    }}
                    className="shrink-0 rounded-lg bg-slate-100 hover:bg-slate-200 px-2.5 py-1 text-[11px] font-medium text-slate-700 transition-colors"
                  >
                    {tmpl.title}
                  </button>
                ))}
              </div>

              {/* Caixa de Texto e Botão de Envio */}
              <form onSubmit={handleSendMessage} className="flex gap-2">
                <Textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  placeholder="Escreva sua mensagem... (Enter para enviar, Shift+Enter para quebra de linha)"
                  rows={2}
                  className="flex-1 text-xs resize-none border-[#E2E8F0] focus:border-[#FF6A00]"
                />
                <Button
                  type="submit"
                  disabled={isSending || !inputText.trim()}
                  className="h-auto bg-[#FF6A00] hover:bg-[#EA580C] text-white px-5"
                >
                  {isSending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center text-slate-400 gap-3">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
              <MessageSquare className="h-8 w-8" />
            </div>
            <h3 className="font-bold text-base text-[#0F172A]">Nenhuma conversa selecionada</h3>
            <p className="text-xs text-slate-500 max-w-sm text-center">
              Selecione um cliente na lista à esquerda para visualizar o histórico de mensagens, responder e registrar o atendimento.
            </p>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* COLUNA 3: PAINEL COMERCIAL DO LEAD (LARGURA FIXA 340px)                  */}
      {/* ========================================================================= */}
      {selectedConversation && (
        <div className="w-80 border-l border-[#E2E8F0] bg-white overflow-y-auto p-4 space-y-5">
          {/* Header do Lead */}
          <div className="border-b border-[#E2E8F0] pb-3">
            <h3 className="font-bold text-sm text-[#0F172A]">Painel do Lead & Campanha</h3>
            <p className="text-[11px] text-[#64748B]">Contexto comercial em tempo real</p>
          </div>

          {/* Dados do Cliente */}
          <div className="rounded-xl border border-[#E2E8F0] bg-slate-50/60 p-3.5 space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500">Nome:</span>
              <span className="font-bold text-[#0F172A]">
                {selectedConversation.client?.name || selectedConversation.contact_name}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Telefone:</span>
              <span className="font-mono text-[#0F172A]">
                {formatPhone(selectedConversation.contact_phone)}
              </span>
            </div>
            {selectedConversation.client?.current_plan && (
              <div className="flex justify-between">
                <span className="text-slate-500">Plano Atual:</span>
                <span className="font-semibold text-slate-700">
                  {selectedConversation.client.current_plan}
                </span>
              </div>
            )}
            {selectedConversation.client?.target_plan && (
              <div className="flex justify-between">
                <span className="text-slate-500">Plano Proposto:</span>
                <span className="font-bold text-[#FF6A00]">
                  {selectedConversation.client.target_plan}
                </span>
              </div>
            )}
          </div>

          {/* Etapa do Funil no Kanban */}
          {selectedConversation.campaign_lead && (
            <div className="space-y-2">
              <label className="text-xs font-bold text-[#0F172A] block">
                Etapa no Funil ({selectedConversation.campaign_lead.campaign?.name || "Upgrade"})
              </label>

              <div className="grid grid-cols-2 gap-1.5">
                {campaignStages.map((stg) => {
                  const isCurrent = selectedConversation.campaign_lead?.stage_id === stg.id;
                  return (
                    <button
                      key={stg.id}
                      onClick={() => handleMoveStage(stg.id)}
                      disabled={isMovingStage || isCurrent}
                      className={`text-[11px] font-bold py-1.5 px-2 rounded-lg border text-left truncate transition-all ${
                        isCurrent
                          ? "bg-[#FF6A00] text-white border-[#FF6A00] shadow-2xs"
                          : "bg-slate-50 text-slate-700 border-slate-200 hover:border-[#FFD0A8]"
                      }`}
                    >
                      {stg.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Se estiver em Triagem, botão para vincular lead */}
          {selectedConversation.status === "triagem" && (
            <div className="rounded-xl border border-purple-200 bg-purple-50 p-3 space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-purple-900">
                <AlertCircle className="h-4 w-4 text-purple-700" />
                Conversa em Triagem
              </div>
              <p className="text-[11px] text-purple-700">
                Esta conversa não possui campanha inequívoca associada.
              </p>
            </div>
          )}

          {/* Anotação Comercial e Objeção */}
          <div className="space-y-3 border-t border-[#E2E8F0] pt-4">
            <h4 className="font-bold text-xs text-[#0F172A] flex items-center gap-1.5">
              <Tag className="h-3.5 w-3.5 text-[#FF6A00]" />
              Registrar Observação Comercial
            </h4>

            <div>
              <label className="text-[11px] font-semibold text-slate-600">Classificação</label>
              <select
                value={commercialClass}
                onChange={(e) => setCommercialClass(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs outline-none"
              >
                <option value="Interessado">🔥 Interessado no Upgrade</option>
                <option value="Em Negociação">💬 Em Negociação</option>
                <option value="Agendamento Visita">🤝 Agendar Visita / Roteador</option>
                <option value="Objeção Identificada">⚠️ Objeção Levantada</option>
                <option value="Sem Interesse">🚫 Sem Interesse</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-600">Objeção (se houver)</label>
              <select
                value={selectedObjection}
                onChange={(e) => setSelectedObjection(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs outline-none"
              >
                <option value="">Nenhuma objeção</option>
                {OBJECTION_OPTIONS.map((obj) => (
                  <option key={obj} value={obj}>
                    {obj}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-600">Agendar Próximo Contato</label>
              <Input
                type="datetime-local"
                value={followupDate}
                onChange={(e) => setFollowupDate(e.target.value)}
                className="mt-1 text-xs"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-600">Notas do Contato</label>
              <Textarea
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                placeholder="Ex: Cliente concordou com valor, pediu retorno às 15h..."
                rows={2}
                className="mt-1 text-xs resize-none"
              />
            </div>

            <Button
              size="sm"
              onClick={handleSaveNote}
              disabled={isSavingNote || !noteContent.trim()}
              className="w-full bg-[#0F172A] hover:bg-[#1E293B] text-white text-xs h-8"
            >
              {isSavingNote ? "Salvando..." : "Salvar Observação"}
            </Button>
          </div>

          {/* Histórico de Notas Salvas */}
          {notes.length > 0 && (
            <div className="space-y-2 border-t border-[#E2E8F0] pt-4">
              <h4 className="font-bold text-xs text-[#0F172A]">Histórico de Notas ({notes.length})</h4>
              <div className="space-y-2">
                {notes.map((note) => (
                  <div key={note.id} className="rounded-lg bg-slate-50 p-2.5 text-xs border border-slate-200 space-y-1">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="font-bold text-slate-700">{note.commercial_classification}</span>
                      <span className="text-slate-400">
                        {new Date(note.created_at).toLocaleDateString("pt-BR")}
                      </span>
                    </div>
                    {note.objection && (
                      <p className="text-[10px] text-red-600 font-semibold">⚠️ {note.objection}</p>
                    )}
                    <p className="text-[11px] text-slate-800">{note.content}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function ConversasPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#FF6A00]" />
        </div>
      }
    >
      <ConversasContent />
    </Suspense>
  );
}
