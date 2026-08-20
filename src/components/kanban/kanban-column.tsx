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
      className={`flex flex-col rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-2.5 min-w-0 flex-1 transition-all overflow-hidden ${
        isOver ? "bg-[#EFF6FF] border-[#2563EB]" : ""
      }`}
    >
      {/* Column Header */}
      <div className="flex items-center justify-between pb-2 px-1 border-b border-[#E2E8F0] mb-2 gap-1">
        <div className="flex items-center gap-1.5 min-w-0">
          <span
            className="h-2 w-2 rounded-full shrink-0"
            style={{ backgroundColor: accentColor }}
          />
          <h3
            className="font-bold text-[11px] text-[#0F172A] tracking-tight truncate"
            title={title}
          >
            {title}
          </h3>
        </div>
        <span className="rounded-md bg-white border border-[#E2E8F0] px-1.5 py-0.5 text-[10px] font-bold text-[#64748B] shrink-0">
          {clients.length}
        </span>
      </div>

      {/* Droppable Area - Vertical Scroll Only */}
      <div
        ref={setNodeRef}
        className="flex-1 flex flex-col gap-2 min-h-[480px] overflow-y-auto max-h-[calc(100vh-220px)] pr-0.5"
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
          <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed border-[#E2E8F0] p-4 text-center text-[10px] text-[#94A3B8] leading-tight">
            Nenhum cliente nesta etapa
          </div>
        )}
      </div>
    </div>
  );
}
