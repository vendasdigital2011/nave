"use client";

import React, { useState } from "react";
import { KanbanBoard } from "@/components/kanban/kanban-board";
import { ImportModal } from "@/components/clients/import-modal";
import { AddClientModal } from "@/components/clients/add-client-modal";
import { Button } from "@/components/ui/button";
import {
  Upload,
  Plus,
  User,
  LogOut,
  ChevronDown,
} from "lucide-react";
import { useRouter } from "next/navigation";

export default function KanbanPage() {
  const router = useRouter();
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isAddClientOpen, setIsAddClientOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleDataRefresh = () => {
    setRefreshKey((prev) => prev + 1);
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
    } catch {
      router.push("/login");
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Header Matching Reference Mock */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-4.5 rounded-2xl border border-[#E2E8F0] shadow-sm">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748B] block">
            PAINEL DO OPERADOR
          </span>
          <h1 className="text-xl md:text-2xl font-black text-[#0F172A] tracking-tight">
            Campanha Upgrade 100M
          </h1>
        </div>

        {/* Action Controls: Importar Planilha | + Novo Cliente | Operador | Sair */}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsImportOpen(true)}
            className="text-xs font-bold border-[#E2E8F0] text-[#0F172A] hover:bg-[#F8FAFC] h-9 px-3 rounded-xl"
          >
            <Upload className="h-3.5 w-3.5 mr-1.5 text-[#64748B]" />
            Importar Planilha
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={() => setIsAddClientOpen(true)}
            className="bg-[#FF6A00] hover:bg-[#E85C00] text-white font-bold text-xs h-9 px-3.5 rounded-xl shadow-xs"
          >
            <Plus className="h-4 w-4 mr-1" />
            Novo Cliente
          </Button>

          <div className="flex items-center gap-1 bg-[#FFF4EC] border border-[#FFD0A8] rounded-full px-3 py-1.5 text-xs font-bold text-[#FF6A00] ml-1">
            <User className="h-3.5 w-3.5" />
            <span>Operador</span>
            <ChevronDown className="h-3.5 w-3.5 opacity-70" />
          </div>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="text-xs text-[#64748B] hover:text-rose-600 h-9 px-2 rounded-xl ml-1"
          >
            <LogOut className="h-3.5 w-3.5 mr-1" />
            Sair
          </Button>
        </div>
      </div>

      {/* Main Kanban Board with Bottom Metrics */}
      <KanbanBoard key={refreshKey} />

      {/* Modais de Importação e Adição */}
      <ImportModal
        open={isImportOpen}
        onOpenChange={setIsImportOpen}
        onImportComplete={handleDataRefresh}
      />

      <AddClientModal
        open={isAddClientOpen}
        onOpenChange={setIsAddClientOpen}
        onClientAdded={handleDataRefresh}
      />
    </div>
  );
}
