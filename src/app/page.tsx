"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Kanban,
  Upload,
  ArrowRight,
  Zap,
  CheckCircle,
  Clock,
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
      {/* Banner de Boas-vindas / Meta */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-700 via-blue-800 to-indigo-900 p-6 text-white shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/30 px-3 py-1 text-xs font-semibold text-blue-200 border border-blue-400/20">
              <Sparkles className="h-3.5 w-3.5" />
              Meta da Operação: Migração 50 Mega → 100 Mega
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              Painel de Desempenho Comercial
            </h1>
            <p className="text-sm text-blue-100/80 max-w-xl">
              Acompanhe o funil de vendas, satisfação (NPS) e conversões em tempo real. Operação 100% humanizada e sem automações invasivas.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link href="/kanban">
              <Button className="bg-white text-blue-900 hover:bg-blue-50 font-bold shadow-md">
                <Kanban className="mr-1.5 h-4 w-4" />
                Abrir Kanban
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <MetricCards metrics={metrics} />

      {/* Main Charts */}
      <ChartsOverview metrics={metrics} />

      {/* Bottom Section: Recent Highlights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Hot Leads / Recent Conversions */}
        <Card className="lg:col-span-2 bg-white border-slate-200">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Zap className="h-4 w-4 text-orange-500" />
              Últimos Clientes Quentes & Vendidos
            </CardTitle>
            <Link href="/kanban" className="text-xs text-blue-600 hover:underline font-semibold flex items-center">
              Ver no Kanban <ArrowRight className="ml-1 h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent>
            {recentHotClients.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {recentHotClients.map((client) => (
                  <div key={client.id} className="py-2.5 flex items-center justify-between">
                    <div>
                      <div className="text-sm font-bold text-slate-800">{client.name}</div>
                      <div className="text-xs text-slate-400">{client.phone} • {client.condominium || "Condomínio Geral"}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                          client.status === "vendido"
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-orange-100 text-orange-800"
                        }`}
                      >
                        {client.status === "vendido" ? "🏆 Vendido" : "🔥 Quente"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-xs text-slate-400 py-6 text-center">
                Nenhum cliente quente ou vendido ainda. Comece a abordar clientes no Kanban!
              </div>
            )}
          </CardContent>
        </Card>

        {/* Guia Rápido do Operador */}
        <Card className="bg-white border-slate-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold text-slate-800">
              Fluxo do Atendimento
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-xs text-slate-600">
            <div className="flex items-start gap-2.5">
              <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-700 font-bold text-[10px]">
                1
              </div>
              <p>Importe a lista de clientes pelo botão superior <strong>Importar Planilha</strong>.</p>
            </div>
            <div className="flex items-start gap-2.5">
              <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-700 font-bold text-[10px]">
                2
              </div>
              <p>Abra o <strong>Kanban de Vendas</strong> e clique no botão verde de <strong>WhatsApp</strong> para chamar o cliente.</p>
            </div>
            <div className="flex items-start gap-2.5">
              <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-700 font-bold text-[10px]">
                3
              </div>
              <p>Arraste o card conforme a negociação avançar (<strong>Morno</strong>, <strong>Quente</strong> ou <strong>Vendido</strong>).</p>
            </div>
            <div className="flex items-start gap-2.5">
              <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-700 font-bold text-[10px]">
                4
              </div>
              <p>Clique no card para registrar a nota de <strong>NPS</strong> e salvar dados de <strong>indicações</strong> de amigos.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
