"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Kanban,
  ArrowRight,
  Zap,
  MessageSquare,
} from "lucide-react";
import { MetricCards } from "@/components/dashboard/metric-cards";
import { ChartsOverview } from "@/components/dashboard/charts-overview";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { DataService } from "@/lib/data-service";
import { Client, DashboardMetrics } from "@/types/database";

export default function DashboardPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalClients: 0,
    frioCount: 0,
    mornoCount: 0,
    quenteCount: 0,
    vendidoCount: 0,
    desativadoCount: 0,
    conversionRate: 0,
    avgNps: 0,
    npsPromoters: 0,
    npsPassives: 0,
    npsDetractors: 0,
    referralsCount: 0,
    totalApproached: 0,
    responseRate: 0,
  });

  const loadData = async () => {
    const data = await DataService.getClients();
    setClients(data);
    setMetrics(DataService.calculateMetrics(data));
  };

  useEffect(() => {
    loadData();
  }, []);

  const recentHotClients = clients
    .filter((c) => c.status === "quente" || c.status === "vendido")
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Top Clean Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-[#E2E8F0] shadow-sm">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-[#FFF4EC] px-3 py-1 text-xs font-bold text-[#FF6A00] border border-[#FFD0A8]">
            <span>Campanha Ativa: Upgrade 50M → 100M</span>
          </div>
          <h1 className="text-xl md:text-2xl font-bold text-[#0B0B0D]">
            Painel Comercial
          </h1>
          <p className="text-xs md:text-sm text-[#64748B]">
            Acompanhe o funil de migração dos condomínios, NPS e taxa de conversão em tempo real.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link href="/conversas">
            <Button className="bg-[#FF6A00] hover:bg-[#E85C00] text-white font-bold text-xs h-10 px-4 rounded-xl shadow-sm">
              <MessageSquare className="mr-1.5 h-4 w-4" />
              Central de Conversas
            </Button>
          </Link>
          <Link href="/kanban">
            <Button variant="outline" className="border-[#E2E8F0] bg-white text-[#0B0B0D] hover:bg-[#F8FAFC] font-semibold text-xs h-10 px-4 rounded-xl">
              <Kanban className="mr-1.5 h-4 w-4 text-[#FF6A00]" />
              Abrir Kanban
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <MetricCards metrics={metrics} />

      {/* Main Charts */}
      <ChartsOverview metrics={metrics} />

      {/* Bottom Section: Recent Highlights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Hot Leads / Recent Conversions */}
        <Card className="lg:col-span-2 bg-white border-[#E2E8F0] shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-sm font-bold text-[#0B0B0D] flex items-center gap-2">
              <Zap className="h-4 w-4 text-[#FF6A00]" />
              Últimos Clientes Quentes & Vendidos
            </CardTitle>
            <Link href="/kanban" className="text-xs text-[#FF6A00] hover:underline font-bold flex items-center">
              Ver no Kanban <ArrowRight className="ml-1 h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent>
            {recentHotClients.length > 0 ? (
              <div className="divide-y divide-[#E2E8F0]">
                {recentHotClients.map((client) => (
                  <div key={client.id} className="py-2.5 flex items-center justify-between">
                    <div>
                      <div className="text-sm font-semibold text-[#0B0B0D]">{client.name}</div>
                      <div className="text-xs text-[#64748B]">{client.phone} • {client.condominium || "Condomínio Geral"}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                          client.status === "vendido"
                            ? "bg-[#DCFCE7] text-[#15803D] border border-[#BBF7D0]"
                            : "bg-[#FFF4EC] text-[#FF6A00] border border-[#FFD0A8]"
                        }`}
                      >
                        {client.status === "vendido" ? "🏆 Vendido" : "🔥 Quente"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-xs text-[#64748B] py-6 text-center">
                Nenhum cliente quente ou vendido ainda.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Guia Rápido do Operador Navetech */}
        <Card className="bg-white border-[#E2E8F0] shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold text-[#0B0B0D]">
              Fluxo do Atendimento
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-xs text-[#64748B]">
            <div className="flex items-start gap-2.5">
              <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#FFF4EC] text-[#FF6A00] font-bold text-[10px]">
                1
              </div>
              <p>Importe a lista de clientes em <strong>Importação</strong>.</p>
            </div>
            <div className="flex items-start gap-2.5">
              <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#FFF4EC] text-[#FF6A00] font-bold text-[10px]">
                2
              </div>
              <p>Abra <strong>Conversas</strong> ou o <strong>Kanban</strong> para falar com o cliente no WhatsApp.</p>
            </div>
            <div className="flex items-start gap-2.5">
              <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#FFF4EC] text-[#FF6A00] font-bold text-[10px]">
                3
              </div>
              <p>Avance o status para <strong>Quente</strong> ou <strong>Vendido</strong>.</p>
            </div>
            <div className="flex items-start gap-2.5">
              <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#FFF4EC] text-[#FF6A00] font-bold text-[10px]">
                4
              </div>
              <p>Lance o <strong>NPS</strong> e registre contatos indicados.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
