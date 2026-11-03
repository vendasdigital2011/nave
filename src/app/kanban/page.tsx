"use client";

import React, { useState, useEffect } from "react";
import { KanbanBoard } from "@/components/kanban/kanban-board";
import { ImportModal } from "@/components/clients/import-modal";
import { AddClientModal } from "@/components/clients/add-client-modal";
import { Button } from "@/components/ui/button";
import {
  Upload,
  Plus,
  LogOut,
  ChevronDown,
  Layers,
  Sparkles,
  Wifi,
  ArrowUpRight,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { Campaign } from "@/types/database";

export default function KanbanPage() {
  const router = useRouter();
  const [campaigns, setCampaigns] = useState<any[]>([
    {
      id: "c0000000-0000-0000-0000-000000000001",
      name: "Upgrade 50 → 100 Mega",
      type: "upgrade",
      leads_count: 125,
    },
    {
      id: "c0000000-0000-0000-0000-000000000002",
      name: "Leads Hotspot",
      type: "hotspot",
      leads_count: 0,
    },
  ]);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>(
    "c0000000-0000-0000-0000-000000000001"
  );
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isAddClientOpen, setIsAddClientOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    fetch("/api/campaigns")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.success && data.campaigns && data.campaigns.length > 0) {
          setCampaigns(data.campaigns);
        }
      })
      .catch(() => {});
  }, [refreshKey]);

  const handleDataRefresh = () => {
    setRefreshKey((prev) => prev + 1);
  };

  const activeCampaign =
    campaigns.find((c) => c.id === selectedCampaignId) || campaigns[0];

  return (
    <div className="space-y-4">
      {/* Top Header com Seletor de Campanhas Integrado */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-4.5 rounded-2xl border border-[#E2E8F0] shadow-sm">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748B] block">
            FUNIS COMERCIAIS POR CAMPANHA
          </span>
          <div className="flex items-center gap-2 mt-0.5">
            <h1 className="text-xl md:text-2xl font-black text-[#0F172A] tracking-tight">
              {activeCampaign.name}
            </h1>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase border ${
                activeCampaign.type === "upgrade"
                  ? "bg-[#FFF4EC] text-[#FF6A00] border-[#FFD0A8]"
                  : "bg-[#F0FDF4] text-[#16A34A] border-[#BBF7D0]"
              }`}
            >
              {activeCampaign.type === "upgrade" ? "Migração" : "Aquisição"}
            </span>
          </div>
        </div>

        {/* Campaign Switcher Pills */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex bg-[#F1F5F9] p-1 rounded-xl border border-[#E2E8F0]">
            {campaigns.map((camp) => {
              const isSelected = camp.id === selectedCampaignId;
              const isUpgrade = camp.type === "upgrade";
              return (
                <button
                  key={camp.id}
                  type="button"
                  onClick={() => setSelectedCampaignId(camp.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    isSelected
                      ? "bg-white text-[#0B0B0D] shadow-xs"
                      : "text-[#64748B] hover:text-[#0B0B0D]"
                  }`}
                >
                  {isUpgrade ? (
                    <ArrowUpRight className="h-3.5 w-3.5 text-[#FF6A00]" />
                  ) : (
                    <Wifi className="h-3.5 w-3.5 text-[#16A34A]" />
                  )}
                  <span>{camp.name}</span>
                  {camp.leads_count !== undefined && (
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                        isSelected
                          ? "bg-[#0B0B0D] text-white"
                          : "bg-[#E2E8F0] text-[#64748B]"
                      }`}
                    >
                      {camp.leads_count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="h-5 w-px bg-[#E2E8F0] hidden sm:block mx-1" />

          {/* Action Controls */}
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
            Novo Lead
          </Button>
        </div>
      </div>

      {/* Main Kanban Board isolado por campanha */}
      <KanbanBoard
        key={`${selectedCampaignId}-${refreshKey}`}
        campaignId={selectedCampaignId}
        onRefresh={handleDataRefresh}
      />

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
