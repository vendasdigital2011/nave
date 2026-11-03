"use client";

import React from "react";
import Link from "next/link";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  MessageSquare,
  GripVertical,
  Check,
  X,
  Clock,
  User,
} from "lucide-react";
import { Client } from "@/types/database";
import { formatPhone } from "@/lib/utils";

interface ClientCardProps {
  client: Client;
  onSelectClient: (client: Client) => void;
  isOverlay?: boolean;
}

export function ClientCard({ client, onSelectClient, isOverlay = false }: ClientCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: client.id,
    data: {
      client,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
  };

  const formattedDate = new Date(client.created_at).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
  });

  const formattedTime = new Date(client.created_at).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group relative flex flex-col rounded-xl border border-[#E2E8F0] bg-white p-3 shadow-xs hover:border-[#FFD0A8] transition-all cursor-pointer ${
        isOverlay ? "shadow-lg ring-1 ring-[#FF6A00] scale-105 z-50" : ""
      }`}
      onClick={() => onSelectClient(client)}
    >
      {/* Top row: Plan Badge & Drag Handle */}
      {client.status !== "importados" ? (
        <div className="flex items-center justify-between gap-1 text-[10px] mb-1.5">
          <span className="rounded-full bg-[#FFF4EC] px-2 py-0.5 font-bold text-[#FF6A00] border border-[#FFD0A8]">
            50M → 100M
          </span>
          <div
            {...attributes}
            {...listeners}
            onClick={(e) => e.stopPropagation()}
            className="cursor-grab active:cursor-grabbing p-0.5 rounded text-[#CBD5E1] hover:text-[#64748B] hover:bg-[#F8FAFC]"
          >
            <GripVertical className="h-3.5 w-3.5" />
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-end mb-1">
          <div
            {...attributes}
            {...listeners}
            onClick={(e) => e.stopPropagation()}
            className="cursor-grab active:cursor-grabbing p-0.5 rounded text-[#CBD5E1] hover:text-[#64748B] hover:bg-[#F8FAFC]"
          >
            <GripVertical className="h-3.5 w-3.5" />
          </div>
        </div>
      )}

      {/* Client Name */}
      <div className="text-xs font-bold text-[#0F172A] uppercase line-clamp-1 group-hover:text-[#FF6A00] transition-colors">
        {client.name}
      </div>

      {/* Phone */}
      <div className="text-[11px] text-[#64748B] font-mono mt-0.5">
        {formatPhone(client.phone)}
      </div>

      {/* Responsável pelo Lead */}
      {(client as any).assigned_to ? (
        <div className="flex items-center gap-1 text-[10px] text-slate-500 mt-1">
          <User className="h-3 w-3 text-[#FF6A00]" />
          <span className="font-medium truncate max-w-[130px]">
            {(client as any).assigned_to.display_name}
          </span>
        </div>
      ) : (
        <div className="flex items-center gap-1 text-[10px] text-amber-600 mt-1 font-medium">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-amber-400" />
          <span>Fila geral</span>
        </div>
      )}

      {/* Próxima Tarefa / Retorno */}
      {(client as any).tasks && (client as any).tasks.length > 0 && (
        <div className="mt-1.5 flex items-center gap-1 text-[10px] font-semibold text-amber-800 bg-amber-50 rounded px-1.5 py-0.5 border border-amber-200/60 truncate">
          <Clock className="h-2.5 w-2.5 shrink-0 text-amber-600" />
          <span className="truncate">{(client as any).tasks[0].title}</span>
        </div>
      )}

      {/* Date / Time */}
      <div className="text-[10px] text-[#94A3B8] mt-1 flex items-center gap-1 font-mono">
        <span>{formattedDate} às {formattedTime}</span>
      </div>

      {/* Card Footer Action according to Status */}
      <div className="mt-2.5 pt-2 border-t border-[#F1F5F9] flex items-center justify-end">
        {client.status === "importados" ? (
          <span className="inline-flex items-center rounded-lg bg-[#F3E8FF] px-2.5 py-1 text-[10px] font-bold text-[#7E22CE] border border-[#E9D5FF]">
            Recém importado
          </span>
        ) : client.status === "vendido" ? (
          <span className="inline-flex items-center gap-1 rounded-lg bg-[#ECFDF5] px-2.5 py-1 text-[10px] font-bold text-[#059669] border border-[#A7F3D0]">
            <Check className="h-3 w-3" />
            Fechado
          </span>
        ) : client.status === "desativado" ? (
          <span className="inline-flex items-center gap-1 rounded-lg bg-[#FEF2F2] px-2.5 py-1 text-[10px] font-bold text-[#DC2626] border border-[#FCA5A5]">
            <X className="h-3 w-3" />
            Não interessado
          </span>
        ) : (
          <Link
            href={`/conversas?clientId=${client.id}`}
            onClick={(e) => e.stopPropagation()}
            className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[10px] font-bold border transition-colors ${
              client.status === "frio"
                ? "bg-[#EFF6FF] text-[#2563EB] border-[#BFDBFE] hover:bg-[#2563EB] hover:text-white"
                : client.status === "morno"
                ? "bg-[#FEF3C7] text-[#D97706] border-[#FDE68A] hover:bg-[#F59E0B] hover:text-white"
                : "bg-[#FFF4EC] text-[#FF6A00] border-[#FFD0A8] hover:bg-[#FF6A00] hover:text-white"
            }`}
          >
            <MessageSquare className="h-3 w-3" />
            <span>Conversa</span>
          </Link>
        )}
      </div>
    </div>
  );
}
