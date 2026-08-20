"use client";

import React from "react";
import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import {
  Download,
  Send,
  MessageSquare,
  Flame,
  Handshake,
  XCircle,
  Plus,
} from "lucide-react";
import { ClientCard } from "./client-card";
import { Client, ClientStatus } from "@/types/database";

interface KanbanColumnProps {
  id: ClientStatus;
  title: string;
  emoji: string;
  clients: Client[];
  accentColor: string;
  onSelectClient: (client: Client) => void;
  onAddClient?: (status: ClientStatus) => void;
}

const COLUMN_CONFIG: Record<
  ClientStatus,
  {
    subtitle: string;
    icon: React.ElementType;
    iconBg: string;
    iconColor: string;
    badgeBg: string;
    badgeText: string;
  }
> = {
  importados: {
    subtitle: "Recém importados ainda não contatados",
    icon: Download,
    iconBg: "bg-[#F3E8FF]",
    iconColor: "text-[#7E22CE]",
    badgeBg: "bg-[#F3E8FF]",
    badgeText: "text-[#7E22CE]",
  },
  frio: {
    subtitle: "Mensagem enviada aguardando resposta",
    icon: Send,
    iconBg: "bg-[#EFF6FF]",
    iconColor: "text-[#2563EB]",
    badgeBg: "bg-[#EFF6FF]",
    badgeText: "text-[#2563EB]",
  },
  morno: {
    subtitle: "Cliente respondeu em atendimento",
    icon: MessageSquare,
    iconBg: "bg-[#FEF3C7]",
    iconColor: "text-[#D97706]",
    badgeBg: "bg-[#FEF3C7]",
    badgeText: "text-[#D97706]",
  },
  quente: {
    subtitle: "Demonstrou interesse em contratar",
    icon: Flame,
    iconBg: "bg-[#FFF4EC]",
    iconColor: "text-[#FF6A00]",
    badgeBg: "bg-[#FFF4EC]",
    badgeText: "text-[#FF6A00]",
  },
  vendido: {
    subtitle: "Cliente aceitou e contrato concluído",
    icon: Handshake,
    iconBg: "bg-[#ECFDF5]",
    iconColor: "text-[#059669]",
    badgeBg: "bg-[#ECFDF5]",
    badgeText: "text-[#059669]",
  },
  desativado: {
    subtitle: "Cliente não tem interesse no momento",
    icon: XCircle,
    iconBg: "bg-[#FEF2F2]",
    iconColor: "text-[#DC2626]",
    badgeBg: "bg-[#FEF2F2]",
    badgeText: "text-[#DC2626]",
  },
};

export function KanbanColumn({
  id,
  title,
  clients,
  accentColor,
  onSelectClient,
  onAddClient,
}: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id,
  });

  const config = COLUMN_CONFIG[id] || COLUMN_CONFIG.importados;
  const IconComponent = config.icon;

  return (
    <div
      className={`flex flex-col rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] p-2.5 min-w-0 flex-1 transition-all overflow-hidden ${
        isOver ? "bg-[#EFF6FF] border-[#2563EB]" : ""
      }`}
    >
      {/* Column Header matching reference design */}
      <div className="pb-2.5 px-1 border-b border-[#E2E8F0] mb-2 space-y-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <div
              className={`h-7 w-7 rounded-xl ${config.iconBg} ${config.iconColor} flex items-center justify-center shrink-0 border border-black/5`}
            >
              <IconComponent className="h-4 w-4" />
            </div>
            <h3
              className="font-bold text-xs text-[#0F172A] tracking-tight truncate"
              title={title}
            >
              {title}
            </h3>
          </div>

          <span
            className={`rounded-full px-2 py-0.5 text-[11px] font-bold shrink-0 ${config.badgeBg} ${config.badgeText}`}
          >
            {clients.length}
          </span>
        </div>

        {/* Subtitle */}
        <p className="text-[10px] text-[#64748B] leading-tight line-clamp-1 pl-0.5">
          {config.subtitle}
        </p>
      </div>

      {/* Droppable Cards Container */}
      <div
        ref={setNodeRef}
        className="flex-1 flex flex-col gap-2 min-h-[460px] overflow-y-auto max-h-[calc(100vh-250px)] pr-0.5"
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
          <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed border-[#CBD5E1] p-4 text-center text-[10px] text-[#94A3B8] leading-tight bg-white/50">
            Nenhum cliente nesta etapa
          </div>
        )}
      </div>

      {/* Column Footer: + Adicionar cliente */}
      <div className="pt-2 border-t border-[#E2E8F0]">
        <button
          type="button"
          onClick={() => onAddClient && onAddClient(id)}
          className="w-full py-1.5 px-2 rounded-xl border border-dashed border-[#CBD5E1] bg-white text-[11px] font-bold text-[#64748B] hover:text-[#FF6A00] hover:border-[#FF6A00] hover:bg-[#FFF4EC] transition-all flex items-center justify-center gap-1"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Adicionar cliente</span>
        </button>
      </div>
    </div>
  );
}
