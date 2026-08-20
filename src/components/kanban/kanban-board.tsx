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
} from "lucide-react";
import { KanbanColumn } from "./kanban-column";
import { ClientCard } from "./client-card";
import { ClientDetailsModal } from "./client-details-modal";
import { AddClientModal } from "@/components/clients/add-client-modal";
import { DataService } from "@/lib/data-service";
import { Client, ClientStatus } from "@/types/database";

const COLUMNS: {
  id: ClientStatus;
  title: string;
  emoji: string;
  accentColor: string;
}[] = [
  {
    id: "importados",
    title: "Importados",
    emoji: "📥",
    accentColor: "#7E22CE",
  },
  {
    id: "frio",
    title: "Contato Iniciado",
    emoji: "📩",
    accentColor: "#2563EB",
  },
  {
    id: "morno",
    title: "Em Conversa",
    emoji: "💬",
    accentColor: "#D97706",
  },
  {
    id: "quente",
    title: "Interessado",
    emoji: "🔥",
    accentColor: "#FF6A00",
  },
  {
    id: "vendido",
    title: "Fechado",
    emoji: "🏆",
    accentColor: "#059669",
  },
  {
    id: "desativado",
    title: "Não Interessado",
    emoji: "🚫",
    accentColor: "#DC2626",
  },
];

export function KanbanBoard() {
  const [clients, setClients] = useState<Client[]>([]);
  const [activeClient, setActiveClient] = useState<Client | null>(null);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isAddClientOpen, setIsAddClientOpen] = useState(false);
  const [targetColumnStatus, setTargetColumnStatus] = useState<ClientStatus>("importados");
  const [searchTerm, setSearchTerm] = useState("");

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
    const data = await DataService.getClients();
    setClients(data);
  };

  useEffect(() => {
    loadData();
  }, []);

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
    let targetStatus: ClientStatus | null = null;

    if (COLUMNS.some((col) => col.id === over.id)) {
      targetStatus = over.id as ClientStatus;
    } else {
      const overClient = clients.find((c) => c.id === over.id);
      if (overClient) {
        targetStatus = overClient.status;
      }
    }

    if (targetStatus) {
      const currentClient = clients.find((c) => c.id === clientId);
      if (currentClient && currentClient.status !== targetStatus) {
        setClients((prev) =>
          prev.map((c) => (c.id === clientId ? { ...c, status: targetStatus! } : c))
        );
        await DataService.updateClientStatus(clientId, targetStatus);
      }
    }
  };

  const handleCardClick = (client: Client) => {
    setSelectedClient(client);
    setIsDetailsOpen(true);
  };

  const handleOpenAddClient = (status: ClientStatus = "importados") => {
    setTargetColumnStatus(status);
    setIsAddClientOpen(true);
  };

  // Contadores para o Painel de Resumo Inferior
  const counts = {
    importados: filteredClients.filter((c) => c.status === "importados").length,
    frio: filteredClients.filter((c) => c.status === "frio").length,
    morno: filteredClients.filter((c) => c.status === "morno").length,
    quente: filteredClients.filter((c) => c.status === "quente").length,
    vendido: filteredClients.filter((c) => c.status === "vendido").length,
    desativado: filteredClients.filter((c) => c.status === "desativado").length,
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
        <div className="flex items-center gap-2 text-xs text-[#64748B] w-full sm:w-auto justify-end">
          <span>
            Exibindo <strong>{filteredClients.length}</strong> de {clients.length} clientes
          </span>
        </div>
      </div>

      {/* DnD Board - 6 Colunas em 100% da tela sem rolagem lateral */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5 w-full items-start">
          {COLUMNS.map((column) => {
            const columnClients = filteredClients.filter((c) => c.status === column.id);
            return (
              <KanbanColumn
                key={column.id}
                id={column.id}
                title={column.title}
                emoji={column.emoji}
                clients={columnClients}
                accentColor={column.accentColor}
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

      {/* Painel de Resumo Inferior (Bottom Summary Bar) matching reference design */}
      <div className="rounded-2xl border border-[#E2E8F0] bg-white p-4 shadow-sm">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 divide-x-0 sm:divide-x divide-[#E2E8F0]">
          {/* 1. Importados */}
          <div className="flex items-center gap-3 px-2">
            <div className="h-9 w-9 rounded-xl bg-[#F3E8FF] text-[#7E22CE] flex items-center justify-center shrink-0">
              <Download className="h-5 w-5" />
            </div>
            <div>
              <span className="text-xs font-bold text-[#0F172A] block">Importados</span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl font-black text-[#0F172A]">{counts.importados}</span>
                <span className="text-[10px] text-[#64748B]">Recém importados</span>
              </div>
            </div>
          </div>

          {/* 2. Contato Iniciado */}
          <div className="flex items-center gap-3 px-2">
            <div className="h-9 w-9 rounded-xl bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center shrink-0">
              <Send className="h-5 w-5" />
            </div>
            <div>
              <span className="text-xs font-bold text-[#0F172A] block">Contato Iniciado</span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl font-black text-[#0F172A]">{counts.frio}</span>
                <span className="text-[10px] text-[#64748B]">Aguardando resposta</span>
              </div>
            </div>
          </div>

          {/* 3. Em Conversa */}
          <div className="flex items-center gap-3 px-2">
            <div className="h-9 w-9 rounded-xl bg-[#FEF3C7] text-[#D97706] flex items-center justify-center shrink-0">
              <MessageSquare className="h-5 w-5" />
            </div>
            <div>
              <span className="text-xs font-bold text-[#0F172A] block">Em Conversa</span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl font-black text-[#0F172A]">{counts.morno}</span>
                <span className="text-[10px] text-[#64748B]">Em atendimento</span>
              </div>
            </div>
          </div>

          {/* 4. Interessado */}
          <div className="flex items-center gap-3 px-2">
            <div className="h-9 w-9 rounded-xl bg-[#FFF4EC] text-[#FF6A00] flex items-center justify-center shrink-0">
              <Flame className="h-5 w-5" />
            </div>
            <div>
              <span className="text-xs font-bold text-[#0F172A] block">Interessado</span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl font-black text-[#0F172A]">{counts.quente}</span>
                <span className="text-[10px] text-[#64748B]">Com interesse</span>
              </div>
            </div>
          </div>

          {/* 5. Fechado */}
          <div className="flex items-center gap-3 px-2">
            <div className="h-9 w-9 rounded-xl bg-[#ECFDF5] text-[#059669] flex items-center justify-center shrink-0">
              <Handshake className="h-5 w-5" />
            </div>
            <div>
              <span className="text-xs font-bold text-[#0F172A] block">Fechado</span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl font-black text-[#0F172A]">{counts.vendido}</span>
                <span className="text-[10px] text-[#64748B]">Contratos fechados</span>
              </div>
            </div>
          </div>

          {/* 6. Não Interessado */}
          <div className="flex items-center gap-3 px-2">
            <div className="h-9 w-9 rounded-xl bg-[#FEF2F2] text-[#DC2626] flex items-center justify-center shrink-0">
              <XCircle className="h-5 w-5" />
            </div>
            <div>
              <span className="text-xs font-bold text-[#0F172A] block">Não Interessado</span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl font-black text-[#0F172A]">{counts.desativado}</span>
                <span className="text-[10px] text-[#64748B]">Sem interesse</span>
              </div>
            </div>
          </div>
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
        defaultStatus={targetColumnStatus}
      />
    </div>
  );
}
