"use client";

import React from "react";
import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { ClientCard } from "./client-card";
import { Client, ClientStatus } from "@/types/database";

interface KanbanColumnProps {
  id: ClientStatus;
  title: string;
  emoji: string;
  clients: Client[];
  color: string;
  badgeBg: string;
  badgeText: string;
  onSelectClient: (client: Client) => void;
}

export function KanbanColumn({
  id,
  title,
  emoji,
  clients,
  color,
  badgeBg,
  badgeText,
  onSelectClient,
}: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id,
  });

  return (
    <div
      className={`flex flex-col rounded-xl border bg-slate-100/70 p-3 min-w-[280px] max-w-[320px] flex-1 transition-all ${
        isOver ? "bg-blue-50/80 ring-2 ring-blue-400" : ""
      }`}
    >
      {/* Column Header */}
      <div className="flex items-center justify-between pb-3 px-1">
        <div className="flex items-center gap-2">
          <span className="text-base">{emoji}</span>
          <h3 className="font-bold text-sm text-slate-800 tracking-tight">{title}</h3>
        </div>
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-bold ${badgeBg} ${badgeText}`}
        >
          {clients.length}
        </span>
      </div>

      {/* Droppable Area */}
      <div
        ref={setNodeRef}
        className="flex-1 flex flex-col gap-2.5 min-h-[500px] overflow-y-auto max-h-[calc(100vh-230px)] pr-1"
      >
        <SortableContext
          items={clients.map((c) => c.id)}
          strategy={verticalListSortingStrategy}
        >
          {clients.map((client) => (
            <ClientCard
              key={client.id}
              client={client}
              onSelectClient={onSelectClient}
            />
          ))}
        </SortableContext>

        {clients.length === 0 && (
          <div className="flex flex-1 items-center justify-center rounded-lg border-2 border-dashed border-slate-200 p-6 text-center text-xs text-slate-400">
            Nenhum cliente nesta etapa
          </div>
        )}
      </div>
    </div>
  );
}
