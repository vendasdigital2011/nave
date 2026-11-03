"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  CalendarCheck,
  Clock,
  AlertTriangle,
  Flame,
  CheckCircle2,
  Calendar,
  Phone,
  MessageSquare,
  ArrowRight,
  Filter,
  Plus,
  RefreshCw,
  ExternalLink,
  User,
  Users,
  Check,
  X,
  Send,
  MoreVertical,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { formatPhone } from "@/lib/utils";

interface TaskItem {
  id: string;
  campaign_lead_id: string;
  title: string;
  description?: string;
  type: "call" | "whatsapp" | "followup" | "visit" | "other";
  due_at: string;
  status: "pending" | "completed" | "cancelled";
  completed_at?: string;
  lead?: {
    id: string;
    campaign_id: string;
    client_id: string;
    stage_id: string;
    assigned_user_id?: string;
    client?: {
      id: string;
      name: string;
      phone: string;
      current_plan: string;
      target_plan: string;
      condominium?: string;
      status?: string;
    };
  };
}

interface IdleLead {
  id: string;
  campaign_id: string;
  client_id: string;
  stage_id: string;
  assigned_user_id?: string;
  last_activity_at: string;
  client?: {
    id: string;
    name: string;
    phone: string;
    current_plan: string;
    target_plan: string;
  };
  stage?: {
    name: string;
    color: string;
  };
}

export default function MeuDiaPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<{
    user?: any;
    kpis: {
      assigned_leads: number;
      overdue_tasks: number;
      today_tasks: number;
      hot_leads: number;
      completed_today: number;
    };
    tasks: {
      overdue: TaskItem[];
      today: TaskItem[];
      upcoming: TaskItem[];
    };
    idle_leads: IdleLead[];
  }>({
    kpis: {
      assigned_leads: 0,
      overdue_tasks: 0,
      today_tasks: 0,
      hot_leads: 0,
      completed_today: 0,
    },
    tasks: {
      overdue: [],
      today: [],
      upcoming: [],
    },
    idle_leads: [],
  });

  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState<string>("all");
  const [activeTab, setActiveTab] = useState<"tasks" | "idle">("tasks");

  // Modais
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [selectedLeadForTask, setSelectedLeadForTask] = useState<any>(null);
  const [taskForm, setTaskForm] = useState({
    title: "",
    description: "",
    type: "followup",
    due_date: "",
    due_time: "10:00",
  });
  const [isSubmittingTask, setIsSubmittingTask] = useState(false);

  // Modal de conclusão de tarefa
  const [completingTask, setCompletingTask] = useState<TaskItem | null>(null);
  const [completionNotes, setCompletionNotes] = useState("");
  const [isCompleting, setIsCompleting] = useState(false);

  // Modal de transferência
  const [transferLeadId, setTransferLeadId] = useState<string | null>(null);
  const [transferUsers, setTransferUsers] = useState<any[]>([]);
  const [transferTargetUser, setTransferTargetUser] = useState("");
  const [transferReason, setTransferReason] = useState("");
  const [isTransferring, setIsTransferring] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const campParam = selectedCampaign !== "all" ? `?campaign_id=${selectedCampaign}` : "";
      const res = await fetch(`/api/my-day${campParam}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          setData(json);
        }
      }
    } catch (err) {
      console.error("Erro ao carregar Meu Dia:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadCampaignsAndUsers = async () => {
    try {
      const [cRes, uRes] = await Promise.all([
        fetch("/api/campaigns"),
        fetch("/api/users"),
      ]);
      if (cRes.ok) {
        const cJson = await cRes.json();
        if (cJson.success && cJson.campaigns) setCampaigns(cJson.campaigns);
      }
      if (uRes.ok) {
        const uJson = await uRes.json();
        if (uJson.success && uJson.users) setTransferUsers(uJson.users);
      }
    } catch (err) {
      console.error("Erro ao carregar listas:", err);
    }
  };

  useEffect(() => {
    loadCampaignsAndUsers();
  }, []);

  useEffect(() => {
    loadData();
  }, [selectedCampaign]);

  // Handlers de tarefas
  const handleOpenScheduleModal = (lead: any, defaultTitle = "Retorno de contato") => {
    setSelectedLeadForTask(lead);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const yyyy = tomorrow.getFullYear();
    const mm = String(tomorrow.getMonth() + 1).padStart(2, "0");
    const dd = String(tomorrow.getDate()).padStart(2, "0");

    setTaskForm({
      title: defaultTitle,
      description: "",
      type: "followup",
      due_date: `${yyyy}-${mm}-${dd}`,
      due_time: "10:00",
    });
    setIsScheduleModalOpen(true);
  };

  const handleSaveTask = async () => {
    if (!selectedLeadForTask || !taskForm.title || !taskForm.due_date) return;
    setIsSubmittingTask(true);
    try {
      const dueAt = new Date(`${taskForm.due_date}T${taskForm.due_time}:00`).toISOString();
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campaign_lead_id: selectedLeadForTask.id,
          title: taskForm.title,
          description: taskForm.description,
          type: taskForm.type,
          due_at: dueAt,
        }),
      });
      if (res.ok) {
        setIsScheduleModalOpen(false);
        loadData();
      } else {
        const err = await res.json();
        alert(`Erro: ${err.error || "Não foi possível agendar."}`);
      }
    } catch (err: any) {
      alert(`Falha ao conectar: ${err.message}`);
    } finally {
      setIsSubmittingTask(false);
    }
  };

  const handleCompleteTask = async () => {
    if (!completingTask) return;
    setIsCompleting(true);
    try {
      const res = await fetch(`/api/tasks/${completingTask.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "completed",
          notes: completionNotes,
        }),
      });
      if (res.ok) {
        setCompletingTask(null);
        setCompletionNotes("");
        loadData();
      } else {
        const err = await res.json();
        alert(`Erro: ${err.error}`);
      }
    } catch (err: any) {
      alert(`Erro: ${err.message}`);
    } finally {
      setIsCompleting(false);
    }
  };

  const handleTransferLead = async () => {
    if (!transferLeadId || !transferTargetUser) return;
    setIsTransferring(true);
    try {
      const res = await fetch(`/api/campaign-leads/${transferLeadId}/assign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assigned_user_id: transferTargetUser,
          reason: transferReason || "Transferência pela agenda do Meu Dia",
        }),
      });
      if (res.ok) {
        setTransferLeadId(null);
        setTransferTargetUser("");
        setTransferReason("");
        loadData();
      } else {
        const err = await res.json();
        alert(`Erro: ${err.error}`);
      }
    } catch (err: any) {
      alert(`Erro: ${err.message}`);
    } finally {
      setIsTransferring(false);
    }
  };

  const formatDueDisplay = (isoDate: string) => {
    const date = new Date(isoDate);
    const now = new Date();
    const isToday =
      date.getDate() === now.getDate() &&
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear();

    const timeStr = date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

    if (date < now) {
      return {
        text: `Atrasado • ${date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })} às ${timeStr}`,
        urgent: true,
      };
    }
    if (isToday) {
      return {
        text: `Hoje às ${timeStr}`,
        urgent: false,
        today: true,
      };
    }
    return {
      text: `${date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })} às ${timeStr}`,
      urgent: false,
    };
  };

  const nowBahia = new Date().toLocaleDateString("pt-BR", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="flex-1 space-y-6 p-6">
      {/* Header com Boas-Vindas e Filtro */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-[#E2E8F0] pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#FFF4EC] text-[#FF6A00] border border-[#FFD0A8]">
              <CalendarCheck className="h-5 w-5" />
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-[#0F172A]">
              Meu Dia & Agenda
            </h1>
          </div>
          <p className="mt-1 text-xs text-[#64748B] capitalize">
            {nowBahia} • Fuso Salvador/Bahia
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-lg border border-[#E2E8F0] bg-white px-3 py-1.5 shadow-2xs">
            <Filter className="h-4 w-4 text-[#64748B]" />
            <select
              value={selectedCampaign}
              onChange={(e) => setSelectedCampaign(e.target.value)}
              className="bg-transparent text-xs font-medium text-[#0F172A] outline-none"
            >
              <option value="all">Todas as Campanhas</option>
              {campaigns.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
            disabled={loading}
            className="border-[#E2E8F0] text-xs font-medium hover:bg-[#F8FAFC]"
          >
            <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${loading ? "animate-spin" : ""}`} />
            Atualizar
          </Button>
        </div>
      </div>

      {/* KPI Cards Operacionais */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Retornos Atrasados */}
        <Card className={`border ${data.kpis.overdue_tasks > 0 ? "border-red-300 bg-red-50/50" : "border-[#E2E8F0] bg-white"}`}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-[#64748B]">
              Retornos Vencidos
            </CardTitle>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-red-100 text-red-600">
              <AlertTriangle className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-700">
              {data.kpis.overdue_tasks}
            </div>
            <p className="text-[11px] text-red-600 mt-1">
              {data.kpis.overdue_tasks > 0 ? "Requer atendimento urgente!" : "Nenhum retorno atrasado."}
            </p>
          </CardContent>
        </Card>

        {/* Agendados para Hoje */}
        <Card className="border border-[#E2E8F0] bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-[#64748B]">
              Agendados para Hoje
            </CardTitle>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-100 text-amber-600">
              <Clock className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#0F172A]">
              {data.kpis.today_tasks}
            </div>
            <p className="text-[11px] text-[#64748B] mt-1">
              Contatos programados para o expediente
            </p>
          </CardContent>
        </Card>

        {/* Negociações Quentes */}
        <Card className="border border-[#E2E8F0] bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-[#64748B]">
              Negociações Quentes
            </CardTitle>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-orange-100 text-[#FF6A00]">
              <Flame className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#FF6A00]">
              {data.kpis.hot_leads}
            </div>
            <p className="text-[11px] text-[#64748B] mt-1">
              Leads interessados em negociação
            </p>
          </CardContent>
        </Card>

        {/* Total sob Minha Gestão */}
        <Card className="border border-[#E2E8F0] bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-[#64748B]">
              Meus Leads Atribuídos
            </CardTitle>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
              <User className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#0F172A]">
              {data.kpis.assigned_leads}
            </div>
            <p className="text-[11px] text-[#64748B] mt-1">
              {data.kpis.completed_today} concluídos hoje
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Navegação por Abas */}
      <div className="flex items-center gap-2 border-b border-[#E2E8F0]">
        <button
          onClick={() => setActiveTab("tasks")}
          className={`flex items-center gap-2 pb-3 px-1 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === "tasks"
              ? "border-[#FF6A00] text-[#FF6A00]"
              : "border-transparent text-[#64748B] hover:text-[#0F172A]"
          }`}
        >
          <Clock className="h-4 w-4" />
          Fila de Retornos & Tarefas
          <span className="rounded-full bg-[#F1F5F9] px-2 py-0.5 text-xs text-[#0F172A]">
            {data.tasks.overdue.length + data.tasks.today.length + data.tasks.upcoming.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("idle")}
          className={`flex items-center gap-2 pb-3 px-1 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === "idle"
              ? "border-[#FF6A00] text-[#FF6A00]"
              : "border-transparent text-[#64748B] hover:text-[#0F172A]"
          }`}
        >
          <AlertTriangle className="h-4 w-4" />
          Leads Sem Retorno Agendado
          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-700">
            {data.idle_leads.length}
          </span>
        </button>
      </div>

      {/* Conteúdo Aba 1: Fila de Tarefas */}
      {activeTab === "tasks" && (
        <div className="space-y-6">
          {/* Seção 1: Vencidos / Atrasados */}
          {data.tasks.overdue.length > 0 && (
            <div className="rounded-xl border border-red-200 bg-red-50/30 p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-red-600 text-white text-xs font-bold">
                    !
                  </span>
                  <h3 className="font-bold text-sm text-red-900">
                    Retornos Atrasados ({data.tasks.overdue.length})
                  </h3>
                </div>
                <span className="text-xs text-red-700 font-medium">Prioridade Máxima</span>
              </div>

              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {data.tasks.overdue.map((task) => {
                  const dueInfo = formatDueDisplay(task.due_at);
                  const cleanPhone = task.lead?.client?.phone ? task.lead.client.phone.replace(/\D/g, "") : "";
                  const waLink = cleanPhone ? `https://wa.me/55${cleanPhone}` : "#";

                  return (
                    <div
                      key={task.id}
                      className="flex flex-col justify-between rounded-lg border border-red-200 bg-white p-3.5 shadow-2xs hover:shadow-xs transition-shadow"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <Badge variant="outline" className="border-red-300 bg-red-50 text-[10px] text-red-700 font-bold">
                            {dueInfo.text}
                          </Badge>
                          <Badge variant="outline" className="text-[10px] bg-slate-50 text-slate-600">
                            {task.type.toUpperCase()}
                          </Badge>
                        </div>

                        <h4 className="font-bold text-sm text-[#0F172A] line-clamp-1">
                          {task.lead?.client?.name || "Cliente sem nome"}
                        </h4>

                        <p className="text-xs text-[#64748B] mt-0.5">
                          {formatPhone(task.lead?.client?.phone || "")} • {task.lead?.client?.current_plan} → {task.lead?.client?.target_plan}
                        </p>

                        <div className="mt-2.5 rounded bg-slate-50 p-2 text-xs text-[#334155] border border-slate-100">
                          <p className="font-semibold text-[11px] text-[#0F172A]">{task.title}</p>
                          {task.description && (
                            <p className="text-[11px] text-[#64748B] mt-1">{task.description}</p>
                          )}
                        </div>
                      </div>

                      {/* Ações Rápidas */}
                      <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 gap-2">
                        <Button
                          size="sm"
                          onClick={() => setCompletingTask(task)}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-8 px-2.5"
                        >
                          <Check className="h-3.5 w-3.5 mr-1" />
                          Concluir
                        </Button>

                        <div className="flex items-center gap-1.5">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenScheduleModal(task.lead, `Reagendado: ${task.title}`)}
                            className="text-xs h-8 px-2 border-slate-200"
                          >
                            <Clock className="h-3 w-3 mr-1" />
                            Reagendar
                          </Button>

                          {cleanPhone && (
                            <a
                              href={waLink}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center justify-center h-8 w-8 rounded-md bg-emerald-50 text-emerald-600 border border-emerald-200 hover:bg-emerald-100 transition-colors"
                              title="Abrir WhatsApp"
                            >
                              <MessageSquare className="h-4 w-4" />
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Seção 2: Agendados para Hoje */}
          <div className="rounded-xl border border-amber-200 bg-amber-50/30 p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-500 text-white text-xs font-bold">
                  ★
                </span>
                <h3 className="font-bold text-sm text-amber-900">
                  Agendados para Hoje ({data.tasks.today.length})
                </h3>
              </div>
              <span className="text-xs text-amber-700 font-medium">Fila do Dia</span>
            </div>

            {data.tasks.today.length === 0 ? (
              <p className="text-xs text-[#64748B] py-4 text-center">
                Nenhum retorno agendado para o restante do dia de hoje.
              </p>
            ) : (
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {data.tasks.today.map((task) => {
                  const dueInfo = formatDueDisplay(task.due_at);
                  const cleanPhone = task.lead?.client?.phone ? task.lead.client.phone.replace(/\D/g, "") : "";
                  const waLink = cleanPhone ? `https://wa.me/55${cleanPhone}` : "#";

                  return (
                    <div
                      key={task.id}
                      className="flex flex-col justify-between rounded-lg border border-amber-200 bg-white p-3.5 shadow-2xs hover:shadow-xs transition-shadow"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <Badge variant="outline" className="border-amber-300 bg-amber-50 text-[10px] text-amber-800 font-bold">
                            {dueInfo.text}
                          </Badge>
                          <Badge variant="outline" className="text-[10px] bg-slate-50 text-slate-600">
                            {task.type.toUpperCase()}
                          </Badge>
                        </div>

                        <h4 className="font-bold text-sm text-[#0F172A] line-clamp-1">
                          {task.lead?.client?.name || "Cliente sem nome"}
                        </h4>

                        <p className="text-xs text-[#64748B] mt-0.5">
                          {formatPhone(task.lead?.client?.phone || "")} • {task.lead?.client?.current_plan} → {task.lead?.client?.target_plan}
                        </p>

                        <div className="mt-2.5 rounded bg-slate-50 p-2 text-xs text-[#334155] border border-slate-100">
                          <p className="font-semibold text-[11px] text-[#0F172A]">{task.title}</p>
                          {task.description && (
                            <p className="text-[11px] text-[#64748B] mt-1">{task.description}</p>
                          )}
                        </div>
                      </div>

                      <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 gap-2">
                        <Button
                          size="sm"
                          onClick={() => setCompletingTask(task)}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-8 px-2.5"
                        >
                          <Check className="h-3.5 w-3.5 mr-1" />
                          Concluir
                        </Button>

                        <div className="flex items-center gap-1.5">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenScheduleModal(task.lead, `Reagendado: ${task.title}`)}
                            className="text-xs h-8 px-2 border-slate-200"
                          >
                            <Clock className="h-3 w-3 mr-1" />
                            Reagendar
                          </Button>

                          {cleanPhone && (
                            <a
                              href={waLink}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center justify-center h-8 w-8 rounded-md bg-emerald-50 text-emerald-600 border border-emerald-200 hover:bg-emerald-100 transition-colors"
                              title="Abrir WhatsApp"
                            >
                              <MessageSquare className="h-4 w-4" />
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Seção 3: Próximos Retornos */}
          {data.tasks.upcoming.length > 0 && (
            <div className="rounded-xl border border-[#E2E8F0] bg-white p-4">
              <h3 className="font-bold text-sm text-[#0F172A] mb-3">
                Próximos Retornos ({data.tasks.upcoming.length})
              </h3>
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {data.tasks.upcoming.map((task) => {
                  const dueInfo = formatDueDisplay(task.due_at);
                  return (
                    <div
                      key={task.id}
                      className="rounded-lg border border-[#E2E8F0] bg-slate-50/50 p-3 flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between text-xs mb-1.5">
                          <span className="font-semibold text-slate-700">{dueInfo.text}</span>
                          <Badge variant="outline" className="text-[10px]">{task.type}</Badge>
                        </div>
                        <h4 className="font-semibold text-xs text-[#0F172A]">
                          {task.lead?.client?.name}
                        </h4>
                        <p className="text-[11px] text-[#64748B]">{task.title}</p>
                      </div>
                      <div className="mt-3 flex items-center justify-end gap-1.5 border-t border-slate-200/60 pt-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setCompletingTask(task)}
                          className="text-xs h-7 text-emerald-700 hover:bg-emerald-50"
                        >
                          Concluir
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Conteúdo Aba 2: Leads sem Retorno Agendado */}
      {activeTab === "idle" && (
        <div className="rounded-xl border border-[#E2E8F0] bg-white p-5">
          <div className="mb-4">
            <h3 className="font-bold text-sm text-[#0F172A]">
              Leads Atribuídos Sem Retorno Programado ({data.idle_leads.length})
            </h3>
            <p className="text-xs text-[#64748B] mt-0.5">
              Estes leads estão sob sua responsabilidade, mas não possuem nenhuma tarefa pendente. Agende um retorno para não esfriar o contato!
            </p>
          </div>

          {data.idle_leads.length === 0 ? (
            <div className="py-8 text-center text-xs text-[#64748B]">
              🎉 Excelente trabalho! Todos os seus leads atribuídos possuem retornos ou contatos programados.
            </div>
          ) : (
            <div className="divide-y divide-[#E2E8F0]">
              {data.idle_leads.map((lead) => {
                const cleanPhone = lead.client?.phone ? lead.client.phone.replace(/\D/g, "") : "";
                const waLink = cleanPhone ? `https://wa.me/55${cleanPhone}` : "#";

                return (
                  <div
                    key={lead.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between py-3.5 gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-sm text-[#0F172A]">
                          {lead.client?.name || "Sem nome"}
                        </h4>
                        {lead.stage && (
                          <Badge
                            variant="outline"
                            className="text-[10px]"
                            style={{ borderColor: lead.stage.color, color: lead.stage.color }}
                          >
                            {lead.stage.name}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-[#64748B] mt-1">
                        {formatPhone(lead.client?.phone || "")} • {lead.client?.current_plan} → {lead.client?.target_plan}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleOpenScheduleModal(lead, "Primeiro retorno de contato")}
                        className="bg-[#FF6A00] hover:bg-[#EA580C] text-white text-xs h-8"
                      >
                        <Calendar className="h-3.5 w-3.5 mr-1" />
                        Agendar Retorno
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setTransferLeadId(lead.id);
                        }}
                        className="text-xs h-8 border-slate-200"
                      >
                        <Users className="h-3 w-3 mr-1" />
                        Transferir
                      </Button>

                      {cleanPhone && (
                        <a
                          href={waLink}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center justify-center h-8 w-8 rounded-md bg-emerald-50 text-emerald-600 border border-emerald-200 hover:bg-emerald-100 transition-colors"
                          title="Abrir WhatsApp"
                        >
                          <MessageSquare className="h-4 w-4" />
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Modal: Agendar Retorno */}
      <Dialog open={isScheduleModalOpen} onOpenChange={setIsScheduleModalOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold text-[#0F172A]">
              <Calendar className="h-5 w-5 text-[#FF6A00]" />
              Agendar Retorno / Tarefa
            </DialogTitle>
          </DialogHeader>

          {selectedLeadForTask && (
            <div className="rounded-lg bg-slate-50 p-2.5 text-xs border border-slate-200">
              <span className="font-semibold text-slate-700">Lead: </span>
              <span className="font-bold text-[#0F172A]">{selectedLeadForTask.client?.name}</span>
              <span className="text-slate-500"> ({formatPhone(selectedLeadForTask.client?.phone || "")})</span>
            </div>
          )}

          <div className="space-y-3.5 py-2">
            <div>
              <label className="text-xs font-semibold text-[#0F172A]">Tipo de Retorno</label>
              <select
                value={taskForm.type}
                onChange={(e) => setTaskForm({ ...taskForm, type: e.target.value as any })}
                className="mt-1 w-full rounded-lg border border-[#E2E8F0] bg-white px-3 py-2 text-xs outline-none focus:border-[#FF6A00]"
              >
                <option value="followup">⏰ Follow-up Geral</option>
                <option value="call">📞 Ligação Telefônica</option>
                <option value="whatsapp">💬 Contato WhatsApp</option>
                <option value="visit">🤝 Visita / Reunião</option>
                <option value="other">📝 Outro</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-[#0F172A]">Título da Tarefa</label>
              <Input
                value={taskForm.title}
                onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                placeholder="Ex: Ligar para confirmar proposta de upgrade"
                className="mt-1 text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-[#0F172A]">Data</label>
                <Input
                  type="date"
                  value={taskForm.due_date}
                  onChange={(e) => setTaskForm({ ...taskForm, due_date: e.target.value })}
                  className="mt-1 text-xs"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-[#0F172A]">Horário</label>
                <Input
                  type="time"
                  value={taskForm.due_time}
                  onChange={(e) => setTaskForm({ ...taskForm, due_time: e.target.value })}
                  className="mt-1 text-xs"
                />
              </div>
            </div>

            {/* Atalhos Rápidos de Horário */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              <button
                type="button"
                onClick={() => {
                  const d = new Date();
                  const yyyy = d.getFullYear();
                  const mm = String(d.getMonth() + 1).padStart(2, "0");
                  const dd = String(d.getDate()).padStart(2, "0");
                  setTaskForm({ ...taskForm, due_date: `${yyyy}-${mm}-${dd}`, due_time: "15:00" });
                }}
                className="rounded bg-slate-100 hover:bg-slate-200 px-2 py-1 text-[11px] font-medium text-slate-700"
              >
                Hoje 15:00
              </button>
              <button
                type="button"
                onClick={() => {
                  const d = new Date();
                  d.setDate(d.getDate() + 1);
                  const yyyy = d.getFullYear();
                  const mm = String(d.getMonth() + 1).padStart(2, "0");
                  const dd = String(d.getDate()).padStart(2, "0");
                  setTaskForm({ ...taskForm, due_date: `${yyyy}-${mm}-${dd}`, due_time: "09:30" });
                }}
                className="rounded bg-slate-100 hover:bg-slate-200 px-2 py-1 text-[11px] font-medium text-slate-700"
              >
                Amanhã 09:30
              </button>
              <button
                type="button"
                onClick={() => {
                  const d = new Date();
                  d.setDate(d.getDate() + 3);
                  const yyyy = d.getFullYear();
                  const mm = String(d.getMonth() + 1).padStart(2, "0");
                  const dd = String(d.getDate()).padStart(2, "0");
                  setTaskForm({ ...taskForm, due_date: `${yyyy}-${mm}-${dd}`, due_time: "10:00" });
                }}
                className="rounded bg-slate-100 hover:bg-slate-200 px-2 py-1 text-[11px] font-medium text-slate-700"
              >
                Em 3 Dias
              </button>
            </div>

            <div>
              <label className="text-xs font-semibold text-[#0F172A]">Observações (Opcional)</label>
              <Textarea
                value={taskForm.description}
                onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                placeholder="Detalhes ou lembretes sobre a negociação..."
                rows={2}
                className="mt-1 text-xs"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsScheduleModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              size="sm"
              onClick={handleSaveTask}
              disabled={isSubmittingTask || !taskForm.title || !taskForm.due_date}
              className="bg-[#FF6A00] hover:bg-[#EA580C] text-white"
            >
              {isSubmittingTask ? "Salvando..." : "Salvar Agendamento"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal: Concluir Tarefa */}
      <Dialog open={!!completingTask} onOpenChange={(open) => !open && setCompletingTask(null)}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold text-emerald-700">
              <CheckCircle2 className="h-5 w-5" />
              Concluir Retorno
            </DialogTitle>
          </DialogHeader>

          {completingTask && (
            <div className="space-y-3 py-2">
              <div className="rounded-lg bg-slate-50 p-3 text-xs border border-slate-200">
                <p className="font-bold text-[#0F172A]">{completingTask.title}</p>
                <p className="text-[#64748B] mt-0.5">
                  Lead: {completingTask.lead?.client?.name}
                </p>
              </div>

              <div>
                <label className="text-xs font-semibold text-[#0F172A]">
                  Resultado do Contato (Opcional)
                </label>
                <Textarea
                  value={completionNotes}
                  onChange={(e) => setCompletionNotes(e.target.value)}
                  placeholder="Ex: Cliente atendeu, pediu para formalizar proposta por mensagem..."
                  rows={3}
                  className="mt-1 text-xs"
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCompletingTask(null)}
            >
              Voltar
            </Button>
            <Button
              size="sm"
              onClick={handleCompleteTask}
              disabled={isCompleting}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {isCompleting ? "Concluindo..." : "Confirmar Conclusão"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal: Transferir Lead */}
      <Dialog open={!!transferLeadId} onOpenChange={(open) => !open && setTransferLeadId(null)}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold text-[#0F172A]">
              <Users className="h-5 w-5 text-[#FF6A00]" />
              Transferir Responsável
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <div>
              <label className="text-xs font-semibold text-[#0F172A]">Novo Vendedor Responsável</label>
              <select
                value={transferTargetUser}
                onChange={(e) => setTransferTargetUser(e.target.value)}
                className="mt-1 w-full rounded-lg border border-[#E2E8F0] bg-white px-3 py-2 text-xs outline-none focus:border-[#FF6A00]"
              >
                <option value="">Selecione o vendedor...</option>
                {transferUsers.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.display_name} ({u.role})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-[#0F172A]">Motivo da Transferência</label>
              <Input
                value={transferReason}
                onChange={(e) => setTransferReason(e.target.value)}
                placeholder="Ex: Férias, redistribuição de carteira..."
                className="mt-1 text-xs"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setTransferLeadId(null)}
            >
              Cancelar
            </Button>
            <Button
              size="sm"
              onClick={handleTransferLead}
              disabled={isTransferring || !transferTargetUser}
              className="bg-[#FF6A00] hover:bg-[#EA580C] text-white"
            >
              {isTransferring ? "Transferindo..." : "Confirmar Transferência"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
