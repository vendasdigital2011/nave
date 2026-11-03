"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Layers,
  Plus,
  ArrowUpRight,
  Wifi,
  Users,
  Kanban,
  CheckCircle2,
  Clock,
  Settings,
  RefreshCw,
  Loader2,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Campaign } from "@/types/database";

export default function CampanhasPage() {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    type: "hotspot",
    description: "",
  });

  const fetchCampaigns = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/campaigns");
      const data = await res.json();
      if (res.ok && data.success) {
        setCampaigns(data.campaigns || []);
      } else {
        toast.error(data.error || "Erro ao listar campanhas.");
      }
    } catch (err: any) {
      toast.error("Falha ao comunicar com o servidor: " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error("O nome da campanha é obrigatório.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(`Campanha "${formData.name}" criada com sucesso!`);
        setIsModalOpen(false);
        setFormData({ name: "", type: "hotspot", description: "" });
        fetchCampaigns();
      } else {
        toast.error(data.error || "Não foi possível criar a campanha.");
      }
    } catch (err: any) {
      toast.error("Erro na criação: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalLeads = campaigns.reduce((acc, c) => acc + (c.leads_count || 0), 0);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-[#E2E8F0] pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-[#0B0B0D] tracking-tight">
              Gestão de Campanhas & Funis
            </h1>
            <span className="rounded-md bg-[#FFF4EC] text-[#FF6A00] text-xs font-bold px-2 py-0.5 border border-[#FFD0A8]">
              Fase 2
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[#64748B] mt-1">
            Segmentação lógica de oportunidades comerciais, bases de clientes e Kanbans independentes.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchCampaigns}
            disabled={isLoading}
            className="border-[#E2E8F0] text-[#64748B] hover:text-[#0B0B0D]"
          >
            <RefreshCw className={`h-3.5 w-3.5 mr-1 ${isLoading ? "animate-spin" : ""}`} />
            Atualizar
          </Button>

          <Button
            size="sm"
            onClick={() => setIsModalOpen(true)}
            className="bg-[#FF6A00] hover:bg-[#E85C00] text-white font-bold shadow-xs text-xs sm:text-sm h-9"
          >
            <Plus className="h-4 w-4 mr-1.5" />
            Nova Campanha
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-[#E2E8F0] bg-white p-4 shadow-2xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B]">
            Campanhas Ativas
          </span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-2xl font-black text-[#0B0B0D]">
              {campaigns.filter((c) => c.status === "active").length}
            </span>
            <Layers className="h-4 w-4 text-[#64748B]" />
          </div>
        </div>

        <div className="rounded-xl border border-[#E2E8F0] bg-white p-4 shadow-2xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B]">
            Total de Leads em Funil
          </span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-2xl font-black text-[#FF6A00]">{totalLeads}</span>
            <Users className="h-4 w-4 text-[#FF6A00]" />
          </div>
        </div>

        <div className="rounded-xl border border-[#E2E8F0] bg-white p-4 shadow-2xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B]">
            Upgrade 100M (Legado)
          </span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-2xl font-black text-[#2563EB]">
              {campaigns.find((c) => c.type === "upgrade")?.leads_count || 125}
            </span>
            <ArrowUpRight className="h-4 w-4 text-[#2563EB]" />
          </div>
        </div>

        <div className="rounded-xl border border-[#E2E8F0] bg-white p-4 shadow-2xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B]">
            Hotspot Wi-Fi
          </span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-2xl font-black text-[#10B981]">
              {campaigns.find((c) => c.type === "hotspot")?.leads_count || 0}
            </span>
            <Wifi className="h-4 w-4 text-[#10B981]" />
          </div>
        </div>
      </div>

      {/* Campaigns Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {isLoading ? (
          <div className="col-span-full py-16 text-center text-sm text-[#64748B] bg-white rounded-2xl border border-[#E2E8F0]">
            <Loader2 className="h-6 w-6 animate-spin mx-auto text-[#FF6A00] mb-2" />
            Carregando campanhas da Navetech...
          </div>
        ) : campaigns.length === 0 ? (
          <div className="col-span-full py-16 text-center text-sm text-[#64748B] bg-white rounded-2xl border border-[#E2E8F0]">
            Nenhuma campanha encontrada.
          </div>
        ) : (
          campaigns.map((camp) => {
            const isUpgrade = camp.type === "upgrade";
            return (
              <div
                key={camp.id}
                className="rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-xs hover:border-[#FFD0A8] transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span
                      className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-0.5 rounded-full border ${
                        isUpgrade
                          ? "bg-[#FFF4EC] text-[#FF6A00] border-[#FFD0A8]"
                          : "bg-[#F0FDF4] text-[#16A34A] border-[#BBF7D0]"
                      }`}
                    >
                      {isUpgrade ? (
                        <ArrowUpRight className="h-3.5 w-3.5" />
                      ) : (
                        <Wifi className="h-3.5 w-3.5" />
                      )}
                      {isUpgrade ? "Migração de Base" : "Aquisição de Novos Leads"}
                    </span>

                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#10B981]">
                      <span className="h-2 w-2 rounded-full bg-[#10B981]" />
                      Ativa
                    </span>
                  </div>

                  <h3 className="text-lg font-black text-[#0B0B0D] tracking-tight">
                    {camp.name}
                  </h3>
                  <p className="text-xs text-[#64748B] mt-1 line-clamp-2">
                    {camp.description || "Campanha comercial estruturada no funil de 6 etapas."}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-[#E2E8F0] flex items-center justify-between">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-2xl font-black text-[#0B0B0D]">
                      {camp.leads_count || 0}
                    </span>
                    <span className="text-xs text-[#64748B] font-semibold">leads no funil</span>
                  </div>

                  <Link href="/kanban">
                    <Button
                      size="sm"
                      className="bg-[#0B0B0D] hover:bg-[#1E293B] text-white text-xs font-bold rounded-xl h-9 px-4 flex items-center gap-1.5"
                    >
                      <Kanban className="h-3.5 w-3.5 text-[#FF6A00]" />
                      Abrir Kanban
                    </Button>
                  </Link>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal Nova Campanha */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-md bg-white rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-[#0B0B0D] flex items-center gap-2">
              <Layers className="h-5 w-5 text-[#FF6A00]" />
              Criar Nova Campanha Comercial
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleCreateCampaign} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#0B0B0D]">Nome da Campanha</label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Leads Hotspot - Praça Central"
                required
                className="h-10 text-xs sm:text-sm border-[#E2E8F0] rounded-xl"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#0B0B0D]">Tipo de Estratégia</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full h-10 px-3 text-xs sm:text-sm border border-[#E2E8F0] rounded-xl bg-white text-[#0B0B0D] focus:outline-[#FF6A00]"
              >
                <option value="hotspot">Leads Hotspot (Aquisição Semanal)</option>
                <option value="upgrade">Upgrade de Plano (Migração de Clientes)</option>
                <option value="custom">Campanha Personalizada</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#0B0B0D]">Descrição / Objetivo</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descreva o objetivo ou origem desta campanha..."
                rows={3}
                className="w-full p-3 text-xs sm:text-sm border border-[#E2E8F0] rounded-xl bg-white text-[#0B0B0D] focus:outline-[#FF6A00]"
              />
            </div>

            <DialogFooter className="pt-4 flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsModalOpen(false)}
                className="border-[#E2E8F0] text-[#64748B]"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-[#FF6A00] hover:bg-[#E85C00] text-white font-bold"
              >
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                Criar Campanha
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
