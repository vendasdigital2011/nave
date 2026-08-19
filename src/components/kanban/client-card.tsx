"use client";

import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  MessageSquare,
  Star,
  UserCheck,
  Zap,
  GripVertical,
  Building,
} from "lucide-react";
import { Client } from "@/types/database";
import { formatPhone, getCleanPhoneForWhatsApp } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

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

  const cleanPhone = getCleanPhoneForWhatsApp(client.phone);
  const whatsappUrl = `https://wa.me/${cleanPhone}?text=Ol%C3%A1%20${encodeURIComponent(
    client.name
  )}%2C%20tudo%20bem%3F%20Aqui%20%C3%A9%20da%20equipe%20de%20atendimento%20da%20sua%20internet.%20Gostaria%20de%20apresentar%20uma%20oportunidade%20especial%20de%20upgrade%20para%20o%20plano%20de%20100%20Mega!`;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group relative flex flex-col rounded-xl border bg-white p-3.5 shadow-sm hover:shadow-md transition-all cursor-pointer ${
        isOverlay ? "shadow-2xl ring-2 ring-blue-500 scale-105 z-50" : ""
      }`}
      onClick={() => onSelectClient(client)}
    >
      {/* Top row: Drag handle, Condominium / Plan */}
      <div className="flex items-center justify-between gap-1 text-[11px] text-slate-400 mb-1.5">
        <div className="flex items-center gap-1.5 truncate">
          <Building className="h-3 w-3 shrink-0" />
          <span className="truncate max-w-[130px] font-medium text-slate-500">
            {client.condominium || "Condomínio Geral"}
          </span>
        </div>
        <div
          {...attributes}
          {...listeners}
          onClick={(e) => e.stopPropagation()}
          className="cursor-grab active:cursor-grabbing p-0.5 rounded text-slate-300 hover:text-slate-600 hover:bg-slate-100"
        >
          <GripVertical className="h-3.5 w-3.5" />
        </div>
      </div>

      {/* Client Name */}
      <div className="text-sm font-bold text-slate-900 line-clamp-1 group-hover:text-blue-600 transition-colors">
        {client.name}
      </div>

      {/* Phone */}
      <div className="text-xs text-slate-500 font-medium mt-0.5">
        {formatPhone(client.phone)}
      </div>

      {/* Badges / Indicators */}
      <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
        <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600">
          50M → 100M
        </span>

        {client.nps_score !== null && client.nps_score !== undefined && (
          <span
            className={`inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[10px] font-bold ${
              client.nps_score >= 9
                ? "bg-emerald-100 text-emerald-800"
                : client.nps_score >= 7
                ? "bg-amber-100 text-amber-800"
                : "bg-rose-100 text-rose-800"
            }`}
          >
            <Star className="h-2.5 w-2.5 fill-current" />
            NPS {client.nps_score}
          </span>
        )}

        {client.wants_upgrade && (
          <span className="inline-flex items-center gap-0.5 rounded bg-blue-100 text-blue-800 px-1.5 py-0.5 text-[10px] font-bold">
            <Zap className="h-2.5 w-2.5 fill-current" />
            Interesse
          </span>
        )}

        {client.gave_referral && (
          <span className="inline-flex items-center gap-0.5 rounded bg-purple-100 text-purple-800 px-1.5 py-0.5 text-[10px] font-bold">
            <UserCheck className="h-2.5 w-2.5" />
            Indicação
          </span>
        )}
      </div>

      {/* Card Footer: WhatsApp Direct Action */}
      <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between">
        <span className="text-[10px] text-slate-400">
          {new Date(client.created_at).toLocaleDateString("pt-BR", {
            day: "2-digit",
            month: "2-digit",
          })}
        </span>

        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-600 hover:text-white transition-all shadow-xs"
        >
          <MessageSquare className="h-3 w-3" />
          <span>WhatsApp</span>
        </a>
      </div>
    </div>
  );
}
