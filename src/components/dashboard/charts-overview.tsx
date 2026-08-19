"use client";

import React from "react";
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
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { DashboardMetrics } from "@/types/database";

interface ChartsOverviewProps {
  metrics: DashboardMetrics;
}

const FUNNEL_COLORS = ["#3b82f6", "#f59e0b", "#f97316", "#10b981"];
const NPS_COLORS = ["#10b981", "#f59e0b", "#ef4444"];
const REFERRAL_COLORS = ["#8b5cf6", "#cbd5e1"];

export function ChartsOverview({ metrics }: ChartsOverviewProps) {
  // 1. Dados do Funil Comercial
  const funnelData = [
    { name: "Frio", valor: metrics.frioCount, fill: "#3b82f6" },
    { name: "Morno", valor: metrics.mornoCount, fill: "#f59e0b" },
    { name: "Quente", valor: metrics.quenteCount, fill: "#f97316" },
    { name: "Vendido", valor: metrics.vendidoCount, fill: "#10b981" },
  ];

  // 2. Dados de Conversão de Upgrade
  const conversionData = [
    { etapa: "Total Base", qtd: metrics.totalClients },
    { etapa: "Abordados", qtd: metrics.totalApproached },
    { etapa: "Interessados", qtd: metrics.quenteCount + metrics.vendidoCount },
    { etapa: "Vendidos", qtd: metrics.vendidoCount },
  ];

  // 3. Dados de NPS
  const npsData = [
    { name: "Promotores (9-10)", value: metrics.npsPromoters },
    { name: "Neutros (7-8)", value: metrics.npsPassives },
    { name: "Detratores (0-6)", value: metrics.npsDetractors },
  ].filter((item) => item.value > 0);

  // 4. Dados de Indicações
  const referralData = [
    { name: "Com Indicação", value: metrics.referralsCount },
    { name: "Sem Indicação", value: Math.max(0, metrics.totalClients - metrics.referralsCount) },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Gráfico 1: Funil Comercial */}
      <Card className="bg-white border-slate-200">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-bold text-slate-800">
            Funil Comercial (Distribuição por Etapa)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={funnelData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" fontSize={12} stroke="#64748b" />
                <YAxis fontSize={12} stroke="#64748b" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1e293b",
                    borderRadius: "8px",
                    color: "#fff",
                    fontSize: "12px",
                  }}
                />
                <Bar dataKey="valor" radius={[6, 6, 0, 0]}>
                  {funnelData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Gráfico 2: Conversão de Upgrade */}
      <Card className="bg-white border-slate-200">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-bold text-slate-800">
            Conversão de Upgrade (50M → 100M)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={conversionData}
                layout="vertical"
                margin={{ top: 10, right: 20, left: 20, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" fontSize={12} stroke="#64748b" />
                <YAxis type="category" dataKey="etapa" fontSize={12} stroke="#64748b" width={85} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1e293b",
                    borderRadius: "8px",
                    color: "#fff",
                    fontSize: "12px",
                  }}
                />
                <Bar dataKey="qtd" fill="#6366f1" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Gráfico 3: Satisfação NPS */}
      <Card className="bg-white border-slate-200">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-bold text-slate-800">
            Distribuição de NPS
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
                      <Cell key={`cell-${index}`} fill={NPS_COLORS[index % NPS_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1e293b",
                      borderRadius: "8px",
                      color: "#fff",
                      fontSize: "12px",
                    }}
                  />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-xs text-slate-400 text-center">
                Nenhum NPS registrado ainda. Preencha notas no card do cliente.
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Gráfico 4: Indicações Recebidas */}
      <Card className="bg-white border-slate-200">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-bold text-slate-800">
            Taxa de Indicações de Clientes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={referralData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={85}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {referralData.map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={REFERRAL_COLORS[index % REFERRAL_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1e293b",
                    borderRadius: "8px",
                    color: "#fff",
                    fontSize: "12px",
                  }}
                />
                <Legend verticalAlign="bottom" height={36} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
