"use client";

import React from "react";
import Link from "next/link";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  MessageSquare,
  Star,
  UserCheck,
  Zap,
  GripVertical,
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

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group relative flex flex-col rounded-xl border border-[#E2E8F0] bg-white p-3.5 shadow-sm hover:border-[#FFD0A8] transition-all cursor-pointer ${
        isOverlay ? "shadow-lg ring-1 ring-[#FF6A00] scale-105 z-50" : ""
      }`}
      onClick={() => onSelectClient(client)}
    >
      {/* Top row: Plan & Drag Handle */}
      <div className="flex items-center justify-between gap-1 text-[11px] text-[#64748B] mb-1.5">
        <span className="rounded-full bg-[#FFF4EC] px-2 py-0.5 text-[10px] font-bold text-[#FF6A00] border border-[#FFD0A8]">
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

      {/* Client Name */}
      <div className="text-xs font-bold text-[#0B0B0D] line-clamp-1 group-hover:text-[#FF6A00] transition-colors">
        {client.name}
      </div>

      {/* Phone */}
      <div className="text-[11px] text-[#64748B] font-mono mt-0.5">
        {formatPhone(client.phone)}
      </div>

      {/* Badges / Indicators */}
      <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
        {client.nps_score !== null && client.nps_score !== undefined && (
          <span
            className={`inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[10px] font-bold ${
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
          <span className="inline-flex items-center gap-0.5 rounded-full bg-[#FFF4EC] text-[#FF6A00] border border-[#FFD0A8] px-2 py-0.5 text-[10px] font-bold">
            <Zap className="h-2.5 w-2.5 fill-current" />
            Upgrade
          </span>
        )}

        {client.gave_referral && (
          <span className="inline-flex items-center gap-0.5 rounded-full bg-[#F3E8FF] text-[#7E22CE] px-2 py-0.5 text-[10px] font-bold">
            <UserCheck className="h-2.5 w-2.5" />
            Indicação
          </span>
        )}
      </div>

      {/* Card Footer: Internal Chat Navigation (PRD-CORRECAO-01) */}
      <div className="mt-3 pt-2 border-t border-[#F1F5F9] flex items-center justify-between">
        <span className="text-[10px] text-[#94A3B8]">
          {new Date(client.created_at).toLocaleDateString("pt-BR", {
            day: "2-digit",
            month: "2-digit",
          })}
        </span>

        <Link
          href={`/conversas?clientId=${client.id}`}
          onClick={(e) => e.stopPropagation()}
          className="inline-flex items-center gap-1 rounded-lg bg-[#FFF4EC] px-2.5 py-1 text-[11px] font-bold text-[#FF6A00] border border-[#FFD0A8] hover:bg-[#FF6A00] hover:text-white transition-colors"
        >
          <MessageSquare className="h-3 w-3" />
          <span>Conversa</span>
        </Link>
      </div>
    </div>
  );
}
