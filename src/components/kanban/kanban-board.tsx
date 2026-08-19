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
import { KanbanColumn } from "./kanban-column";
import { ClientCard } from "./client-card";
import { ClientDetailsModal } from "./client-details-modal";
import { DataService } from "@/lib/data-service";
import { Client, ClientStatus } from "@/types/database";

const COLUMNS: {
  id: ClientStatus;
  title: string;
  emoji: string;
  color: string;
  badgeBg: string;
  badgeText: string;
}[] = [
  {
    id: "frio",
    title: "Frio (A Iniciar)",
    emoji: "❄️",
    color: "border-blue-200",
    badgeBg: "bg-blue-100",
    badgeText: "text-blue-800",
  },
  {
    id: "morno",
    title: "Morno (Em Contato)",
    emoji: "🌤️",
    color: "border-amber-200",
    badgeBg: "bg-amber-100",
    badgeText: "text-amber-800",
  },
  {
    id: "quente",
    title: "Quente (Interessado)",
    emoji: "🔥",
    color: "border-orange-200",
    badgeBg: "bg-orange-100",
    badgeText: "text-orange-800",
  },
  {
    id: "vendido",
    title: "Vendido (Upgrade Feito)",
    emoji: "🏆",
    color: "border-emerald-200",
    badgeBg: "bg-emerald-100",
    badgeText: "text-emerald-800",
  },
];

export function KanbanBoard() {
  const [clients, setClients] = useState<Client[]>([]);
  const [activeClient, setActiveClient] = useState<Client | null>(null);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
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
      c.phone.toLowerCase().includes(term) ||
      (c.condominium && c.condominium.toLowerCase().includes(term))
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

    // Se soltou em cima de uma coluna
    if (COLUMNS.some((col) => col.id === over.id)) {
      targetStatus = over.id as ClientStatus;
    } else {
      // Se soltou em cima de outro card
      const overClient = clients.find((c) => c.id === over.id);
      if (overClient) {
        targetStatus = overClient.status;
      }
    }

    if (targetStatus) {
      const currentClient = clients.find((c) => c.id === clientId);
      if (currentClient && currentClient.status !== targetStatus) {
        // Atualização otimista
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

  return (
    <div className="space-y-4">
      {/* Search and Filters bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-xl border">
        <div className="relative w-full sm:w-80">
          <input
            type="text"
            placeholder="Buscar por nome, telefone ou condomínio..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full text-xs rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500 w-full sm:w-auto justify-end">
          <span>
            Exibindo <strong>{filteredClients.length}</strong> de {clients.length} clientes
          </span>
        </div>
      </div>

      {/* DnD Board */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 overflow-x-auto pb-4 items-start">
          {COLUMNS.map((column) => {
            const columnClients = filteredClients.filter((c) => c.status === column.id);
            return (
              <KanbanColumn
                key={column.id}
                id={column.id}
                title={column.title}
                emoji={column.emoji}
                clients={columnClients}
                color={column.color}
                badgeBg={column.badgeBg}
                badgeText={column.badgeText}
                onSelectClient={handleCardClick}
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

      {/* Details Modal */}
      <ClientDetailsModal
        client={selectedClient}
        open={isDetailsOpen}
        onOpenChange={setIsDetailsOpen}
        onClientUpdated={loadData}
        onClientDeleted={loadData}
      />
    </div>
  );
}
