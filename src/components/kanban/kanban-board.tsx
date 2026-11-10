"use client";

import React, { useState, useEffect } from "react";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import {
  Download,
  Send,
  MessageSquare,
  Flame,
  Handshake,
  XCircle,
  ArrowLeft,
  Loader2,
  Users,
  Share2,
  Filter,
  CheckCircle2,
} from "lucide-react";
import { KanbanColumn } from "./kanban-column";
import { ClientCard } from "./client-card";
import { ClientDetailsModal } from "./client-details-modal";
import { AddClientModal } from "@/components/clients/add-client-modal";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { DataService } from "@/lib/data-service";
import { Client, ClientStatus, CampaignStage } from "@/types/database";

interface KanbanBoardProps {
  campaignId?: string;
  refreshTrigger?: number;
  onRefresh?: () => void;
}

const DEFAULT_UPGRADE_STAGES: {
  id: string;
  title: string;
  legacyStatus: ClientStatus;
  emoji: string;
  accentColor: string;
}[] = [
  {
    id: "10000000-0000-0000-0000-000000000001",
    title: "Importados",
    legacyStatus: "importados",
    emoji: "📥",
    accentColor: "#7E22CE",
  },
  {
    id: "10000000-0000-0000-0000-000000000002",
    title: "Contato Iniciado",
    legacyStatus: "frio",
    emoji: "📩",
    accentColor: "#2563EB",
  },
  {
    id: "10000000-0000-0000-0000-000000000003",
    title: "Em Conversa",
    legacyStatus: "morno",
    emoji: "💬",
    accentColor: "#D97706",
  },
  {
    id: "10000000-0000-0000-0000-000000000004",
    title: "Interessado",
    legacyStatus: "quente",
    emoji: "🔥",
    accentColor: "#FF6A00",
  },
  {
    id: "10000000-0000-0000-0000-000000000005",
    title: "Fechado",
    legacyStatus: "vendido",
    emoji: "🏆",
    accentColor: "#059669",
  },
  {
    id: "10000000-0000-0000-0000-000000000006",
    title: "Não Interessado",
    legacyStatus: "desativado",
    emoji: "🚫",
    accentColor: "#DC2626",
  },
];

export function KanbanBoard({ 
  campaignId = "c0000000-0000-0000-0000-000000000001",
  refreshTrigger,
}: KanbanBoardProps) {
  const [stages, setStages] = useState<any[]>(DEFAULT_UPGRADE_STAGES);
  const [clients, setClients] = useState<Client[]>([]);
  const [leadStageMap, setLeadStageMap] = useState<Record<string, string>>({});
  const [activeClient, setActiveClient] = useState<Client | null>(null);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isAddClientOpen, setIsAddClientOpen] = useState(false);
  const [targetColumnStatus, setTargetColumnStatus] = useState<any>("importados");
  const [searchTerm, setSearchTerm] = useState("");
  const [isMovingBatch, setIsMovingBatch] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // RBAC & Filtro de Vendedor
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [sellers, setSellers] = useState<any[]>([]);
  const [sellerFilter, setSellerFilter] = useState<string>("all");

  // Distribuição de Leads
  const [isDistributeOpen, setIsDistributeOpen] = useState(false);
  const [distributeMethod, setDistributeMethod] = useState<"round_robin" | "balanced">("round_robin");
  const [distributeLimit, setDistributeLimit] = useState(50);
  const [isDistributing, setIsDistributing] = useState(false);
  const [distributeSuccessMsg, setDistributeSuccessMsg] = useState("");

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => {
        if (d.success && d.user) setCurrentUser(d.user);
      })
      .catch(() => {});

    fetch("/api/users")
      .then((r) => r.json())
      .then((d) => {
        if (d.success && d.users) setSellers(d.users);
      })
      .catch(() => {});
  }, []);

  const loadData = async (isInitial = false) => {
    if (isInitial || clients.length === 0) {
      setIsLoading(true);
    }
    try {
      // 1. Carregar etapas da campanha
      const resCamp = await fetch(`/api/campaigns/${campaignId}`);
      if (resCamp.ok) {
        const campData = await resCamp.json();
        if (campData.success && campData.stages && campData.stages.length > 0) {
          setStages(
            campData.stages.map((s: CampaignStage) => ({
              id: s.id,
              title: s.name,
              stageKind: s.stage_kind,
              accentColor: s.color || "#FF6A00",
            }))
          );
        }
      }

      // 2. Carregar leads da campanha
      const resLeads = await fetch(`/api/campaigns/${campaignId}/leads`);
      if (resLeads.ok) {
        const leadsData = await resLeads.json();
        if (leadsData.success && leadsData.leads) {
          const clientList: Client[] = [];
          const mapping: Record<string, string> = {};

          leadsData.leads.forEach((l: any) => {
            if (l.client) {
              const enrichedClient = {
                ...l.client,
                campaign_lead_id: l.id,
                assigned_user_id: l.assigned_user_id,
                assigned_to: l.assigned_to,
                tasks: l.tasks || [],
                version: l.version || 1,
              };
              clientList.push(enrichedClient);
              mapping[l.client.id] = l.stage_id;
            }
          });

          setClients(clientList);
          setLeadStageMap(mapping);
          setIsLoading(false);
          return;
        }
      }

      // 3. Fallback legado (Upgrade 100M direto)
      if (campaignId === "c0000000-0000-0000-0000-000000000001") {
        await DataService.moveAllFrioToImportados();
        const data = await DataService.getClients();
        setClients(data);

        const mapping: Record<string, string> = {};
        data.forEach((c) => {
          const matched = DEFAULT_UPGRADE_STAGES.find((s) => s.legacyStatus === c.status);
          if (matched) mapping[c.id] = matched.id;
        });
        setLeadStageMap(mapping);
      }
    } catch (err) {
      console.error("Erro ao carregar dados do Kanban:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData(true);
  }, [campaignId]);

  useEffect(() => {
    if (refreshTrigger !== undefined && refreshTrigger > 0) {
      loadData(false);
    }
  }, [refreshTrigger]);

  const handleMoveAllFrioToImportados = async () => {
    setIsMovingBatch(true);
    await DataService.moveAllFrioToImportados();
    await loadData();
    setIsMovingBatch(false);
  };

  const handleExecuteDistribute = async () => {
    setIsDistributing(true);
    setDistributeSuccessMsg("");
    try {
      const res = await fetch(`/api/campaigns/${campaignId}/distribute`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          method: distributeMethod,
          limit: distributeLimit,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setDistributeSuccessMsg(data.message || "Distribuição concluída com sucesso!");
        await loadData();
        setTimeout(() => {
          setIsDistributeOpen(false);
          setDistributeSuccessMsg("");
        }, 2000);
      } else {
        alert(`Erro na distribuição: ${data.error}`);
      }
    } catch (err: any) {
      alert(`Erro: ${err.message}`);
    } finally {
      setIsDistributing(false);
    }
  };

  const filteredClients = clients.filter((c: any) => {
    // 1. Filtro de pesquisa
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const matchSearch =
        c.name.toLowerCase().includes(term) ||
        c.phone.toLowerCase().includes(term);
      if (!matchSearch) return false;
    }

    // 2. Filtro de vendedor
    if (sellerFilter === "my") {
      return currentUser && c.assigned_user_id === currentUser.id;
    }
    if (sellerFilter === "unassigned") {
      return !c.assigned_user_id;
    }
    if (sellerFilter !== "all") {
      return c.assigned_user_id === sellerFilter;
    }

    return true;
  });

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const client = clients.find((c) => c.id === active.id);
    if (client) {
      setActiveClient(client);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveClient(null);

    if (!over) return;

    const clientId = active.id as string;
    let targetStageId: string | null = null;

    if (stages.some((stg) => stg.id === over.id)) {
      targetStageId = over.id as string;
    } else {
      const overClientId = over.id as string;
      targetStageId = leadStageMap[overClientId] || null;
    }

    if (targetStageId && leadStageMap[clientId] !== targetStageId) {
      setLeadStageMap((prev) => ({
        ...prev,
        [clientId]: targetStageId!,
      }));

      try {
        await fetch(`/api/campaigns/${campaignId}/leads/move`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            client_id: clientId,
            new_stage_id: targetStageId,
          }),
        });
      } catch (err) {
        console.error("Erro ao persistir movimentação no servidor:", err);
      }
    }
  };

  const handleCardClick = (client: Client) => {
    setSelectedClient(client);
    setIsDetailsOpen(true);
  };

  const handleOpenAddClient = (stageId: any) => {
    setTargetColumnStatus(stageId);
    setIsAddClientOpen(true);
  };

  const getStageClients = (stageId: string, legacyStatus?: ClientStatus) => {
    return filteredClients.filter((c) => {
      if (leadStageMap[c.id]) {
        return leadStageMap[c.id] === stageId;
      }
      return legacyStatus ? c.status === legacyStatus : false;
    });
  };

  const canDistribute = currentUser && (currentUser.role === "admin" || currentUser.role === "supervisor");

  return (
    <div className="space-y-4 w-full overflow-hidden">
      {/* Search and Filters bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-[#E2E8F0] shadow-sm">
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
          {/* Busca por texto */}
          <div className="relative w-full sm:w-64">
            <input
              type="text"
              placeholder="Buscar por nome ou telefone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full text-xs rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-3 py-2 text-[#0B0B0D] placeholder:text-[#64748B] focus:outline-none focus:ring-1 focus:ring-[#FF6A00]"
            />
          </div>

          {/* Filtro de Responsável */}
          <div className="flex items-center gap-2 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-3 py-1.5 w-full sm:w-auto">
            <Filter className="h-3.5 w-3.5 text-[#64748B]" />
            <select
              value={sellerFilter}
              onChange={(e) => setSellerFilter(e.target.value)}
              className="bg-transparent text-xs font-semibold text-[#0F172A] outline-none"
            >
              <option value="all">Todos os Responsáveis</option>
              {currentUser && (
                <option value="my">Apenas Meus Leads</option>
              )}
              <option value="unassigned">Fila Geral (Sem Responsável)</option>
              {sellers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.display_name} ({s.role})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2.5 text-xs text-[#64748B] w-full sm:w-auto justify-end">
          {/* Botão de Distribuição (Admin / Supervisor) */}
          {canDistribute && (
            <Button
              size="sm"
              onClick={() => setIsDistributeOpen(true)}
              className="bg-[#0F172A] hover:bg-[#1E293B] text-white text-xs h-8 px-3 rounded-xl shadow-2xs"
            >
              <Share2 className="h-3.5 w-3.5 mr-1.5 text-[#FF6A00]" />
              Distribuir Leads
            </Button>
          )}

          {campaignId === "c0000000-0000-0000-0000-000000000001" && (
            <button
              type="button"
              onClick={handleMoveAllFrioToImportados}
              disabled={isMovingBatch}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#F3E8FF] text-[#7E22CE] border border-[#E9D5FF] font-bold hover:bg-[#7E22CE] hover:text-white transition-all text-xs"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Importados</span>
            </button>
          )}

          <span className="font-medium">
            Exibindo <strong>{filteredClients.length}</strong> de {clients.length} leads
          </span>
        </div>
      </div>

      {/* DnD Board Dinâmico - Colunas isoladas da campanha */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20 bg-white rounded-2xl border border-[#E2E8F0]">
          <Loader2 className="h-8 w-8 animate-spin text-[#FF6A00] mr-2" />
          <span className="text-sm font-bold text-[#64748B]">Carregando funil da campanha...</span>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5 w-full items-start">
            {stages.map((stage) => {
              const columnClients = getStageClients(stage.id, stage.legacyStatus);
              return (
                <KanbanColumn
                  key={stage.id}
                  id={stage.id}
                  title={stage.title}
                  clients={columnClients}
                  accentColor={stage.accentColor}
                  onSelectClient={handleCardClick}
                  onAddClient={handleOpenAddClient}
                />
              );
            })}
          </div>

          <DragOverlay>
            {activeClient ? (
              <ClientCard
                client={activeClient}
                onSelectClient={() => {}}
                isOverlay
              />
            ) : null}
          </DragOverlay>
        </DndContext>
      )}

      {/* Painel de Resumo Inferior (Bottom Summary Bar) */}
      <div className="rounded-2xl border border-[#E2E8F0] bg-white p-4 shadow-sm">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 divide-x-0 sm:divide-x divide-[#E2E8F0]">
          {stages.slice(0, 6).map((stage, idx) => {
            const stageClients = getStageClients(stage.id, stage.legacyStatus);
            return (
              <div key={stage.id} className="flex items-center gap-3 px-2">
                <div
                  className="h-9 w-9 rounded-xl flex items-center justify-center shrink-0 font-black text-xs"
                  style={{
                    backgroundColor: `${stage.accentColor || "#FF6A00"}15`,
                    color: stage.accentColor || "#FF6A00",
                  }}
                >
                  {idx + 1}
                </div>
                <div>
                  <span className="text-xs font-bold text-[#0F172A] block truncate max-w-[110px]">
                    {stage.title}
                  </span>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-xl font-black text-[#0F172A]">{stageClients.length}</span>
                    <span className="text-[10px] text-[#64748B]">leads</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal: Distribuir Leads */}
      <Dialog open={isDistributeOpen} onOpenChange={setIsDistributeOpen}>
        <DialogContent className="sm:max-w-[440px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold text-[#0F172A]">
              <Share2 className="h-5 w-5 text-[#FF6A00]" />
              Distribuir Leads da Campanha
            </DialogTitle>
          </DialogHeader>

          {distributeSuccessMsg ? (
            <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-4 text-center">
              <CheckCircle2 className="h-8 w-8 text-emerald-600 mx-auto mb-2" />
              <p className="text-xs font-bold text-emerald-800">{distributeSuccessMsg}</p>
            </div>
          ) : (
            <div className="space-y-4 py-2">
              <p className="text-xs text-[#64748B]">
                Distribui os leads não atribuídos da campanha entre os membros ativos da equipe de vendas.
              </p>

              <div>
                <label className="text-xs font-semibold text-[#0F172A]">Método de Distribuição</label>
                <select
                  value={distributeMethod}
                  onChange={(e) => setDistributeMethod(e.target.value as any)}
                  className="mt-1 w-full rounded-lg border border-[#E2E8F0] bg-white px-3 py-2 text-xs outline-none focus:border-[#FF6A00]"
                >
                  <option value="round_robin">Round-Robin (Alternado Sequencial)</option>
                  <option value="balanced">Balanceamento por Volume (Quem tem menos leads recebe mais)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-[#0F172A]">Quantidade Máxima de Leads</label>
                <input
                  type="number"
                  min={1}
                  max={500}
                  value={distributeLimit}
                  onChange={(e) => setDistributeLimit(Number(e.target.value))}
                  className="mt-1 w-full rounded-lg border border-[#E2E8F0] bg-white px-3 py-2 text-xs outline-none focus:border-[#FF6A00]"
                />
              </div>

              <div className="rounded-lg bg-slate-50 p-3 text-xs border border-slate-200 text-[#475569]">
                <span className="font-semibold text-[#0F172A]">Vendedores ativos disponíveis: </span>
                <span>{sellers.filter((s) => s.is_active !== false).length} vendedores cadastrados</span>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsDistributeOpen(false)}
            >
              Fechar
            </Button>
            {!distributeSuccessMsg && (
              <Button
                size="sm"
                onClick={handleExecuteDistribute}
                disabled={isDistributing}
                className="bg-[#FF6A00] hover:bg-[#EA580C] text-white"
              >
                {isDistributing ? "Distribuindo..." : "Iniciar Distribuição"}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modais de Detalhes e Inclusão */}
      <ClientDetailsModal
        client={selectedClient}
        open={isDetailsOpen}
        onOpenChange={setIsDetailsOpen}
        onClientUpdated={loadData}
        onClientDeleted={loadData}
      />

      <AddClientModal
        open={isAddClientOpen}
        onOpenChange={setIsAddClientOpen}
        onClientAdded={loadData}
        defaultStatus={targetColumnStatus}
        campaignId={campaignId}
        stageId={targetColumnStatus}
      />
    </div>
  );
}
