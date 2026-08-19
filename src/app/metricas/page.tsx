"use client";

import React, { useState, useEffect } from "react";
import {
  BarChart3,
  TrendingUp,
  PieChart as PieIcon,
  Award,
  Star,
  UserCheck,
  Percent,
  CheckCircle2,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
  Legend,
} from "recharts";
import { DataService } from "@/lib/data-service";
import { DashboardMetrics } from "@/types/database";

const NPS_COLORS = ["#10b981", "#f59e0b", "#ef4444"];
const FUNNEL_COLORS = ["#3b82f6", "#f59e0b", "#f97316", "#10b981"];

export default function MetricasPage() {
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

  useEffect(() => {
    DataService.getClients().then((clients) => {
      setMetrics(DataService.calculateMetrics(clients));
    });
  }, []);

  const funnelData = [
    { etapa: "1. Frio (Base)", total: metrics.frioCount, fill: "#3b82f6" },
    { etapa: "2. Morno (Contato)", total: metrics.mornoCount, fill: "#f59e0b" },
    { etapa: "3. Quente (Interesse)", total: metrics.quenteCount, fill: "#f97316" },
    { etapa: "4. Vendido (Ativado)", total: metrics.vendidoCount, fill: "#10b981" },
  ];

  const npsData = [
    { name: "Promotores (9-10)", value: metrics.npsPromoters },
    { name: "Neutros (7-8)", value: metrics.npsPassives },
    { name: "Detratores (0-6)", value: metrics.npsDetractors },
  ].filter((d) => d.value > 0);

  const responseRateData = [
    { name: "Abordados / Respondidos", value: metrics.totalApproached, fill: "#10b981" },
    { name: "Ainda Não Abordados", value: metrics.frioCount, fill: "#cbd5e1" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
          <BarChart3 className="h-6 w-6 text-blue-600" />
          Métricas & Indicadores de Desempenho
        </h1>
        <p className="text-xs md:text-sm text-slate-500">
          Relatórios quantitativos da campanha de upgrade de planos 50 Mega para 100 Mega.
        </p>
      </div>

      {/* KPI Highlights */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-xl border bg-white p-4 shadow-sm">
          <span className="text-xs font-semibold text-slate-400">Taxa de Abordagem</span>
          <div className="text-2xl font-black text-blue-600 mt-1">{metrics.responseRate}%</div>
          <span className="text-[11px] text-slate-500">{metrics.totalApproached} de {metrics.totalClients} contatos</span>
        </div>

        <div className="rounded-xl border bg-white p-4 shadow-sm">
          <span className="text-xs font-semibold text-slate-400">Taxa de Fechamento</span>
          <div className="text-2xl font-black text-emerald-600 mt-1">{metrics.conversionRate}%</div>
          <span className="text-[11px] text-slate-500">{metrics.vendidoCount} upgrades realizados</span>
        </div>

        <div className="rounded-xl border bg-white p-4 shadow-sm">
          <span className="text-xs font-semibold text-slate-400">Média NPS</span>
          <div className="text-2xl font-black text-amber-500 mt-1">
            {metrics.avgNps > 0 ? `${metrics.avgNps} / 10` : "-"}
          </div>
          <span className="text-[11px] text-slate-500">{metrics.npsPromoters} promotores</span>
        </div>

        <div className="rounded-xl border bg-white p-4 shadow-sm">
          <span className="text-xs font-semibold text-slate-400">Total de Indicações</span>
          <div className="text-2xl font-black text-purple-600 mt-1">{metrics.referralsCount}</div>
          <span className="text-[11px] text-slate-500">Novos leads gerados</span>
        </div>
      </div>

      {/* Detailed Graphs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 1. Funil Comercial */}
        <Card className="bg-white border-slate-200">
          <CardHeader>
            <CardTitle className="text-sm font-bold text-slate-800">
              1. Funil Comercial de Vendas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={funnelData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="etapa" fontSize={11} stroke="#64748b" />
                  <YAxis fontSize={12} stroke="#64748b" />
                  <Tooltip />
                  <Bar dataKey="total" radius={[6, 6, 0, 0]}>
                    {funnelData.map((e, idx) => (
                      <Cell key={idx} fill={e.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* 2. Distribuição NPS */}
        <Card className="bg-white border-slate-200">
          <CardHeader>
            <CardTitle className="text-sm font-bold text-slate-800">
              2. Classificação de Satisfação (NPS)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 w-full flex items-center justify-center">
              {npsData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={npsData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={85}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {npsData.map((_, index) => (
                        <Cell key={index} fill={NPS_COLORS[index % NPS_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend verticalAlign="bottom" height={36} iconType="circle" />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-xs text-slate-400 text-center">
                  Sem dados suficientes de NPS preenchidos.
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 3. Taxa de Resposta / Abordagem */}
        <Card className="bg-white border-slate-200">
          <CardHeader>
            <CardTitle className="text-sm font-bold text-slate-800">
              3. Taxa de Abordagem da Base
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={responseRateData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={85}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {responseRateData.map((e, index) => (
                      <Cell key={index} fill={e.fill} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* 4. Resumo Executivo */}
        <Card className="bg-white border-slate-200">
          <CardHeader>
            <CardTitle className="text-sm font-bold text-slate-800">
              4. Diagnóstico da Operação
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-xs text-slate-700">
            <div className="rounded-lg bg-slate-50 p-3 border">
              <div className="font-bold text-slate-900 mb-1">Status da Validação do MVP:</div>
              <p className="text-slate-600 leading-relaxed">
                A esteira comercial está configurada para abordagem manual direta dos clientes 50 Mega via WhatsApp, garantindo atendimento humanizado e validação de interesse sem ruídos de robôs ou custos desnecessários.
              </p>
            </div>

            <div className="flex items-center justify-between p-2 rounded border bg-emerald-50 text-emerald-800">
              <span className="font-semibold">Upgrades Ativados:</span>
              <strong className="text-base">{metrics.vendidoCount} clientes</strong>
            </div>

            <div className="flex items-center justify-between p-2 rounded border bg-blue-50 text-blue-800">
              <span className="font-semibold">Oportunidades em Aberto:</span>
              <strong className="text-base">{metrics.mornoCount + metrics.quenteCount} clientes</strong>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
