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
} from "lucide-react";
import { KanbanColumn } from "./kanban-column";
import { ClientCard } from "./client-card";
import { ClientDetailsModal } from "./client-details-modal";
import { AddClientModal } from "@/components/clients/add-client-modal";
import { DataService } from "@/lib/data-service";
import { Client, ClientStatus, CampaignStage } from "@/types/database";

interface KanbanBoardProps {
  campaignId?: string;
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
    id: "s0000000-0000-0000-0000-000000000001",
    title: "Importados",
    legacyStatus: "importados",
    emoji: "📥",
    accentColor: "#7E22CE",
  },
  {
    id: "s0000000-0000-0000-0000-000000000002",
    title: "Contato Iniciado",
    legacyStatus: "frio",
    emoji: "📩",
    accentColor: "#2563EB",
  },
  {
    id: "s0000000-0000-0000-0000-000000000003",
    title: "Em Conversa",
    legacyStatus: "morno",
    emoji: "💬",
    accentColor: "#D97706",
  },
  {
    id: "s0000000-0000-0000-0000-000000000004",
    title: "Interessado",
    legacyStatus: "quente",
    emoji: "🔥",
    accentColor: "#FF6A00",
  },
  {
    id: "s0000000-0000-0000-0000-000000000005",
    title: "Fechado",
    legacyStatus: "vendido",
    emoji: "🏆",
    accentColor: "#059669",
  },
  {
    id: "s0000000-0000-0000-0000-000000000006",
    title: "Não Interessado",
    legacyStatus: "desativado",
    emoji: "🚫",
    accentColor: "#DC2626",
  },
];

export function KanbanBoard({ campaignId = "c0000000-0000-0000-0000-000000000001" }: KanbanBoardProps) {
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

  const loadData = async () => {
    setIsLoading(true);
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
              clientList.push(l.client);
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
    loadData();
  }, [campaignId]);

  const handleMoveAllFrioToImportados = async () => {
    setIsMovingBatch(true);
    await DataService.moveAllFrioToImportados();
    await loadData();
    setIsMovingBatch(false);
  };

  const filteredClients = clients.filter((c) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      c.name.toLowerCase().includes(term) ||
      c.phone.toLowerCase().includes(term)
    );
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

    // Verificar se soltou sobre uma coluna (stage.id)
    if (stages.some((stg) => stg.id === over.id)) {
      targetStageId = over.id as string;
    } else {
      // Soltou sobre outro card: descobrir em qual estágio aquele card está
      const overClientId = over.id as string;
      targetStageId = leadStageMap[overClientId] || null;
    }

    if (targetStageId && leadStageMap[clientId] !== targetStageId) {
      // Atualização otimista imediata na UI
      setLeadStageMap((prev) => ({
        ...prev,
        [clientId]: targetStageId!,
      }));

      // Chamar API de movimentação com isolamento de campanha
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

  // Contagem dinâmica por coluna/estágio
  const getStageClients = (stageId: string, legacyStatus?: ClientStatus) => {
    return filteredClients.filter((c) => {
      if (leadStageMap[c.id]) {
        return leadStageMap[c.id] === stageId;
      }
      return legacyStatus ? c.status === legacyStatus : false;
    });
  };

  return (
    <div className="space-y-4 w-full overflow-hidden">
      {/* Search and Filters bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-[#E2E8F0] shadow-sm">
        <div className="relative w-full sm:w-80">
          <input
            type="text"
            placeholder="Buscar por nome ou telefone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full text-xs rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-3 py-2 text-[#0B0B0D] placeholder:text-[#64748B] focus:outline-none focus:ring-1 focus:ring-[#FF6A00]"
          />
        </div>

        <div className="flex items-center gap-3 text-xs text-[#64748B] w-full sm:w-auto justify-end">
          {campaignId === "c0000000-0000-0000-0000-000000000001" && (
            <button
              type="button"
              onClick={handleMoveAllFrioToImportados}
              disabled={isMovingBatch}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#F3E8FF] text-[#7E22CE] border border-[#E9D5FF] font-bold hover:bg-[#7E22CE] hover:text-white transition-all text-xs"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Mover Contato Iniciado → Importados</span>
            </button>
          )}
          <span>
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

      {/* Details Modal */}
      <ClientDetailsModal
        client={selectedClient}
        open={isDetailsOpen}
        onOpenChange={setIsDetailsOpen}
        onClientUpdated={loadData}
        onClientDeleted={loadData}
      />

      {/* Add Client Modal */}
      <AddClientModal
        open={isAddClientOpen}
        onOpenChange={setIsAddClientOpen}
        onClientAdded={loadData}
        defaultStatus={typeof targetColumnStatus === "string" ? "importados" : targetColumnStatus}
      />
    </div>
  );
}
