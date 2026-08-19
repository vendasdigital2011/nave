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
  accentColor: string;
  onSelectClient: (client: Client) => void;
}

export function KanbanColumn({
  id,
  title,
  emoji,
  clients,
  accentColor,
  onSelectClient,
}: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id,
  });

  return (
    <div
      className={`flex flex-col rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-3 min-w-[280px] max-w-[320px] flex-1 transition-all ${
        isOver ? "bg-[#EFF6FF] border-[#2563EB]" : ""
      }`}
    >
      {/* Column Header */}
      <div className="flex items-center justify-between pb-3 px-1 border-b border-[#E2E8F0] mb-2.5">
        <div className="flex items-center gap-2">
          <span
            className="h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: accentColor }}
          />
          <h3 className="font-semibold text-xs text-[#0F172A] tracking-tight">{title}</h3>
        </div>
        <span className="rounded-md bg-white border border-[#E2E8F0] px-2 py-0.5 text-[11px] font-semibold text-[#64748B]">
          {clients.length}
        </span>
      </div>

      {/* Droppable Area */}
      <div
        ref={setNodeRef}
        className="flex-1 flex flex-col gap-2 min-h-[500px] overflow-y-auto max-h-[calc(100vh-230px)] pr-0.5"
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
          <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed border-[#E2E8F0] p-6 text-center text-xs text-[#64748B]">
            Nenhum cliente nesta etapa
          </div>
        )}
      </div>
    </div>
  );
}
