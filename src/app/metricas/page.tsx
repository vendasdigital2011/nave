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

const NPS_COLORS = ["#22c55e", "#f59e0b", "#ef4444"];

export default function MetricasPage() {
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

  useEffect(() => {
    DataService.getClients().then((clients) => {
      setMetrics(DataService.calculateMetrics(clients));
    });
  }, []);

  const funnelData = [
    { etapa: "1. Importados", total: metrics.importadosCount, fill: "#64748b" },
    { etapa: "2. Contato Iniciado", total: metrics.frioCount, fill: "#2563eb" },
    { etapa: "3. Em Conversa", total: metrics.mornoCount, fill: "#f59e0b" },
    { etapa: "4. Interessados", total: metrics.quenteCount, fill: "#ff6a00" },
    { etapa: "5. Fechados", total: metrics.vendidoCount, fill: "#22c55e" },
    { etapa: "6. Não Interessados", total: metrics.desativadoCount, fill: "#ef4444" },
  ];

  const npsPieData = [
    { name: "Promotores (9-10)", value: metrics.npsPromoters },
    { name: "Neutros (7-8)", value: metrics.npsPassives },
    { name: "Detratores (0-6)", value: metrics.npsDetractors },
  ];

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-[#0B0B0D] tracking-tight">
          Métricas & Desempenho Comercial
        </h1>
        <p className="text-xs md:text-sm text-[#64748B]">
          Acompanhe os resultados do funil comercial, satisfação (NPS) e taxa de conversão em tempo real.
        </p>
      </div>

      {/* Grid de KPIs Superiores */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <Card className="bg-white border-[#E2E8F0] shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider block">
                Total de Clientes
              </span>
              <span className="text-2xl font-black text-[#0B0B0D] tracking-tight">
                {metrics.totalClients}
              </span>
            </div>
            <div className="h-10 w-10 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-center text-[#FF6A00]">
              <BarChart3 className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-[#E2E8F0] shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider block">
                Taxa de Conversão
              </span>
              <span className="text-2xl font-black text-[#16A34A] tracking-tight">
                {metrics.conversionRate}%
              </span>
            </div>
            <div className="h-10 w-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
              <TrendingUp className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-[#E2E8F0] shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider block">
                Média NPS
              </span>
              <span className="text-2xl font-black text-[#0B0B0D] tracking-tight">
                {metrics.avgNps > 0 ? metrics.avgNps : "N/A"}
              </span>
            </div>
            <div className="h-10 w-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
              <Star className="h-5 w-5 fill-current" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-[#E2E8F0] shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider block">
                Indicações Recebidas
              </span>
              <span className="text-2xl font-black text-[#7E22CE] tracking-tight">
                {metrics.referralsCount}
              </span>
            </div>
            <div className="h-10 w-10 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-600">
              <UserCheck className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico do Funil Comercial de 6 Etapas */}
      <Card className="bg-white border-[#E2E8F0] shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-bold text-[#0B0B0D] flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-[#FF6A00]" />
            Distribuição dos Clientes por Etapa Comercial
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={funnelData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="etapa" tick={{ fontSize: 11, fill: "#64748B" }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#64748B" }} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#ffffff", borderRadius: "12px", border: "1px solid #E2E8F0", fontSize: "12px" }}
                />
                <Bar dataKey="total" radius={[8, 8, 0, 0]}>
                  {funnelData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Gráfico NPS e Taxa de Resposta */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-white border-[#E2E8F0] shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold text-[#0B0B0D] flex items-center gap-2">
              <PieIcon className="h-4 w-4 text-[#FF6A00]" />
              Classificação NPS (Satisfação do Cliente)
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={npsPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {npsPieData.map((entry, index) => (
                      <Cell key={`nps-cell-${index}`} fill={NPS_COLORS[index % NPS_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: "#ffffff", borderRadius: "12px", border: "1px solid #E2E8F0", fontSize: "12px" }}
                  />
                  <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "10px" }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-[#E2E8F0] shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold text-[#0B0B0D] flex items-center gap-2">
              <Award className="h-4 w-4 text-[#FF6A00]" />
              Resumo Operacional Navetech
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-2">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#64748B] font-semibold">Taxa de Abordagem</span>
                <span className="font-bold text-[#0B0B0D]">{metrics.responseRate}%</span>
              </div>
              <div className="h-2 w-full rounded-full bg-[#F8FAFC] border border-[#E2E8F0] overflow-hidden">
                <div
                  className="h-full bg-[#FF6A00] rounded-full transition-all duration-500"
                  style={{ width: `${metrics.responseRate}%` }}
                />
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-[#E2E8F0]">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#64748B] font-semibold">Conversão de Fechados</span>
                <span className="font-bold text-[#16A34A]">{metrics.conversionRate}%</span>
              </div>
              <div className="h-2 w-full rounded-full bg-[#F8FAFC] border border-[#E2E8F0] overflow-hidden">
                <div
                  className="h-full bg-[#16A34A] rounded-full transition-all duration-500"
                  style={{ width: `${metrics.conversionRate}%` }}
                />
              </div>
            </div>

            <div className="p-3 rounded-xl border border-[#FFD0A8] bg-[#FFF7F1] text-xs text-[#0B0B0D] space-y-1">
              <span className="font-bold block">Programa Indique e Ganhe</span>
              <p className="text-[11px] text-[#64748B] leading-relaxed">
                {metrics.referralsCount} clientes aceitaram indicar novos contatos após realizarem o upgrade de 50M para 100M.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
