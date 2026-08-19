"use client";

import React from "react";
import { KanbanBoard } from "@/components/kanban/kanban-board";
import { Kanban, Sparkles } from "lucide-react";

export default function KanbanPage() {
  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Kanban className="h-6 w-6 text-blue-600" />
            Quadro Kanban de Vendas
          </h1>
          <p className="text-xs md:text-sm text-slate-500">
            Arraste os cards entre as etapas do funil conforme você conversa com os clientes no WhatsApp.
          </p>
        </div>
      </div>

      <KanbanBoard />
    </div>
  );
}
