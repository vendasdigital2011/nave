"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Kanban,
  ArrowRight,
  Zap,
  Radio,
  MessageSquare,
  Sparkles,
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-[#E2E8F0] shadow-sm">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 rounded-md bg-[#EFF6FF] px-2.5 py-0.5 text-xs font-semibold text-[#2563EB]">
            <span>Campanha Ativa: Upgrade 50M → 100M</span>
          </div>
          <h1 className="text-xl md:text-2xl font-bold text-[#0F172A]">
            Painel Comercial
          </h1>
          <p className="text-xs md:text-sm text-[#64748B]">
            Acompanhe o funil de migração dos condomínios, NPS e taxa de conversão em tempo real.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link href="/conversas">
            <Button className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-medium text-xs h-9 px-4 rounded-lg shadow-sm">
              <MessageSquare className="mr-1.5 h-3.5 w-3.5" />
              Central de Conversas
            </Button>
          </Link>
          <Link href="/kanban">
            <Button variant="outline" className="border-[#E2E8F0] bg-white text-[#0F172A] hover:bg-[#F8FAFC] font-medium text-xs h-9 px-4 rounded-lg">
              <Kanban className="mr-1.5 h-3.5 w-3.5 text-[#2563EB]" />
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
            <CardTitle className="text-sm font-semibold text-[#0F172A] flex items-center gap-2">
              <Zap className="h-4 w-4 text-[#2563EB]" />
              Últimos Clientes Quentes & Vendidos
            </CardTitle>
            <Link href="/kanban" className="text-xs text-[#2563EB] hover:underline font-medium flex items-center">
              Ver no Kanban <ArrowRight className="ml-1 h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent>
            {recentHotClients.length > 0 ? (
              <div className="divide-y divide-[#E2E8F0]">
                {recentHotClients.map((client) => (
                  <div key={client.id} className="py-2.5 flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium text-[#0F172A]">{client.name}</div>
                      <div className="text-xs text-[#64748B]">{client.phone} • {client.condominium || "Condomínio Geral"}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs font-semibold px-2.5 py-0.5 rounded-md ${
                          client.status === "vendido"
                            ? "bg-[#DCFCE7] text-[#15803D]"
                            : "bg-[#EFF6FF] text-[#2563EB]"
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
            <CardTitle className="text-sm font-semibold text-[#0F172A]">
              Fluxo do Atendimento
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-xs text-[#64748B]">
            <div className="flex items-start gap-2.5">
              <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#EFF6FF] text-[#2563EB] font-semibold text-[10px]">
                1
              </div>
              <p>Importe a lista de clientes em <strong>Importação</strong>.</p>
            </div>
            <div className="flex items-start gap-2.5">
              <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#EFF6FF] text-[#2563EB] font-semibold text-[10px]">
                2
              </div>
              <p>Abra <strong>Conversas</strong> ou o <strong>Kanban</strong> para falar com o cliente no WhatsApp.</p>
            </div>
            <div className="flex items-start gap-2.5">
              <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#EFF6FF] text-[#2563EB] font-semibold text-[10px]">
                3
              </div>
              <p>Avance o status para <strong>Quente</strong> ou <strong>Vendido</strong>.</p>
            </div>
            <div className="flex items-start gap-2.5">
              <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#EFF6FF] text-[#2563EB] font-semibold text-[10px]">
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
