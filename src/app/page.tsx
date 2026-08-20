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
import { formatPhone, getStatusBadgeInfo } from "@/lib/utils";
import { Client, DashboardMetrics } from "@/types/database";

export default function DashboardPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalClients: 0,
    importadosCount: 0,
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
            Acompanhe o funil de migração, NPS e taxa de conversão em tempo real.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/kanban">
            <Button className="bg-[#FF6A00] hover:bg-[#E85C00] text-white font-bold text-xs shadow-md shadow-[#FF6A00]/20 rounded-xl">
              <Kanban className="mr-1.5 h-4 w-4" /> Ver Quadro Kanban
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <MetricCards metrics={metrics} />

      {/* Main Content Grid: Charts + Fast Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Funnel & NPS Overview (2 Cols) */}
        <div className="lg:col-span-2 space-y-6">
          <ChartsOverview metrics={metrics} />
        </div>

        {/* Action Column (1 Col) */}
        <div className="space-y-6">
          {/* Oportunidades Quentes */}
          <Card className="bg-white border-[#E2E8F0] shadow-sm">
            <CardHeader className="pb-3 border-b border-[#E2E8F0]">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-bold text-[#0B0B0D] flex items-center gap-2">
                  <Zap className="h-4 w-4 text-[#FF6A00]" />
                  Clientes Interessados
                </CardTitle>
                <Link
                  href="/kanban"
                  className="text-xs text-[#FF6A00] hover:underline font-semibold flex items-center gap-1"
                >
                  Ver todos <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </CardHeader>

            <CardContent className="pt-3 divide-y divide-[#E2E8F0]">
              {recentHotClients.length > 0 ? (
                recentHotClients.map((client) => {
                  const statusInfo = getStatusBadgeInfo(client.status);
                  return (
                    <div
                      key={client.id}
                      className="py-3 flex items-center justify-between hover:bg-[#F8FAFC] p-2 rounded-xl transition-colors"
                    >
                      <div className="space-y-0.5">
                        <span className="text-xs font-bold text-[#0B0B0D] block">
                          {client.name}
                        </span>
                        <div className="flex items-center gap-2 text-[11px] text-[#64748B]">
                          <span className="font-mono">{formatPhone(client.phone)}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${statusInfo.color}`}
                        >
                          {statusInfo.label}
                        </span>

                        <Link
                          href={`/conversas?clientId=${client.id}`}
                          className="p-1.5 rounded-lg bg-[#FFF4EC] text-[#FF6A00] hover:bg-[#FF6A00] hover:text-white transition-colors"
                          title="Abrir no Chat Interno"
                        >
                          <MessageSquare className="h-3.5 w-3.5" />
                        </Link>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="py-6 text-center text-xs text-[#64748B]">
                  Nenhuma oportunidade recente nesta etapa.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
