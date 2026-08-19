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
      className={`group relative flex flex-col rounded-lg border border-[#E2E8F0] bg-white p-3.5 shadow-sm hover:border-[#CBD5E1] transition-all cursor-pointer ${
        isOverlay ? "shadow-lg ring-1 ring-[#2563EB] scale-105 z-50" : ""
      }`}
      onClick={() => onSelectClient(client)}
    >
      {/* Top row: Condominium & Drag Handle */}
      <div className="flex items-center justify-between gap-1 text-[11px] text-[#64748B] mb-1.5">
        <div className="flex items-center gap-1 truncate">
          <Building className="h-3 w-3 shrink-0 text-[#94A3B8]" />
          <span className="truncate max-w-[140px] font-medium text-[#64748B]">
            {client.condominium || "Condomínio Geral"}
          </span>
        </div>
        <div
          {...attributes}
          {...listeners}
          onClick={(e) => e.stopPropagation()}
          className="cursor-grab active:cursor-grabbing p-0.5 rounded text-[#CBD5E1] hover:text-[#64748B] hover:bg-[#F8FAFC]"
        >
          <GripVertical className="h-3.5 w-3.5" />
        </div>
      </div>

      {/* Client Name */}
      <div className="text-xs font-semibold text-[#0F172A] line-clamp-1 group-hover:text-[#2563EB] transition-colors">
        {client.name}
      </div>

      {/* Phone */}
      <div className="text-[11px] text-[#64748B] font-mono mt-0.5">
        {formatPhone(client.phone)}
      </div>

      {/* Badges / Indicators */}
      <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
        <span className="rounded bg-[#F1F5F9] px-1.5 py-0.5 text-[10px] font-medium text-[#475569]">
          50M → 100M
        </span>

        {client.nps_score !== null && client.nps_score !== undefined && (
          <span
            className={`inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[10px] font-semibold ${
              client.nps_score >= 9
                ? "bg-[#DCFCE7] text-[#15803D]"
                : client.nps_score >= 7
                ? "bg-[#FEF3C7] text-[#B45309]"
                : "bg-[#FEE2E2] text-[#B91C1C]"
            }`}
          >
            <Star className="h-2.5 w-2.5 fill-current" />
            NPS {client.nps_score}
          </span>
        )}

        {client.wants_upgrade && (
          <span className="inline-flex items-center gap-0.5 rounded bg-[#EFF6FF] text-[#2563EB] px-1.5 py-0.5 text-[10px] font-semibold">
            <Zap className="h-2.5 w-2.5 fill-current" />
            Interesse
          </span>
        )}

        {client.gave_referral && (
          <span className="inline-flex items-center gap-0.5 rounded bg-[#F3E8FF] text-[#7E22CE] px-1.5 py-0.5 text-[10px] font-semibold">
            <UserCheck className="h-2.5 w-2.5" />
            Indicação
          </span>
        )}
      </div>

      {/* Card Footer: WhatsApp Action */}
      <div className="mt-3 pt-2 border-t border-[#F1F5F9] flex items-center justify-between">
        <span className="text-[10px] text-[#94A3B8]">
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
          className="inline-flex items-center gap-1 rounded bg-[#EFF6FF] px-2 py-0.5 text-[11px] font-medium text-[#2563EB] hover:bg-[#2563EB] hover:text-white transition-colors"
        >
          <MessageSquare className="h-3 w-3" />
          <span>WhatsApp</span>
        </a>
      </div>
    </div>
  );
}
