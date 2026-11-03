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
  id: string;
  title: string;
  emoji?: string;
  clients: Client[];
  accentColor?: string;
  onSelectClient: (client: Client) => void;
  onAddClient?: (status: any) => void;
}

const COLUMN_CONFIG: Record<
  string,
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
  accentColor = "#FF6A00",
  onSelectClient,
  onAddClient,
}: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id,
  });

  const config = COLUMN_CONFIG[id] || {
    subtitle: "Etapa da campanha",
    icon: MessageSquare,
    iconBg: "bg-[#F8FAFC]",
    iconColor: "text-[#64748B]",
    badgeBg: "bg-[#F1F5F9]",
    badgeText: "text-[#475569]",
  };
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
            <h3 className="font-black text-xs text-[#0F172A] truncate tracking-tight">
              {title}
            </h3>
          </div>

          <span
            className={`text-[11px] font-black px-2 py-0.5 rounded-full ${config.badgeBg} ${config.badgeText} border border-black/5`}
          >
            {clients.length}
          </span>
        </div>

        <p className="text-[10px] text-[#64748B] leading-tight line-clamp-2 pl-0.5">
          {config.subtitle}
        </p>
      </div>

      {/* Cards list */}
      <div
        ref={setNodeRef}
        className="flex-1 space-y-2 overflow-y-auto max-h-[calc(100vh-270px)] pr-0.5 scrollbar-thin scrollbar-thumb-slate-200"
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
          <div className="flex flex-col items-center justify-center py-8 text-center text-xs text-[#94A3B8] border-2 border-dashed border-[#E2E8F0] rounded-xl bg-white/40">
            <span>Vazio</span>
          </div>
        )}
      </div>

      {/* Add Client Button at the bottom of the column */}
      {onAddClient && (
        <button
          type="button"
          onClick={() => onAddClient(id)}
          className="mt-2.5 flex items-center justify-center gap-1.5 w-full py-2 rounded-xl text-xs font-bold text-[#64748B] hover:text-[#0F172A] hover:bg-white border border-transparent hover:border-[#E2E8F0] transition-all"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Adicionar</span>
        </button>
      )}
    </div>
  );
}
