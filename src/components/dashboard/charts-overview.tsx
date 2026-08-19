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

// Cores Oficiais do Funil:
// Frio #CBD5E1 | Morno #F59E0B | Quente #2563EB | Vendido #22C55E
const FUNNEL_COLORS = ["#CBD5E1", "#F59E0B", "#2563EB", "#22C55E"];
const NPS_COLORS = ["#22C55E", "#F59E0B", "#EF4444"];
const REFERRAL_COLORS = ["#2563EB", "#E2E8F0"];

export function ChartsOverview({ metrics }: ChartsOverviewProps) {
  const funnelData = [
    { name: "Frio", valor: metrics.frioCount, fill: "#CBD5E1" },
    { name: "Morno", valor: metrics.mornoCount, fill: "#F59E0B" },
    { name: "Quente", valor: metrics.quenteCount, fill: "#2563EB" },
    { name: "Vendido", valor: metrics.vendidoCount, fill: "#22C55E" },
  ];

  const conversionData = [
    { etapa: "Total Base", qtd: metrics.totalClients },
    { etapa: "Abordados", qtd: metrics.totalApproached },
    { etapa: "Interessados", qtd: metrics.quenteCount + metrics.vendidoCount },
    { etapa: "Vendidos", qtd: metrics.vendidoCount },
  ];

  const npsData = [
    { name: "Promotores (9-10)", value: metrics.npsPromoters },
    { name: "Neutros (7-8)", value: metrics.npsPassives },
    { name: "Detratores (0-6)", value: metrics.npsDetractors },
  ].filter((item) => item.value > 0);

  const referralData = [
    { name: "Com Indicação", value: metrics.referralsCount },
    { name: "Sem Indicação", value: Math.max(0, metrics.totalClients - metrics.referralsCount) },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Gráfico 1: Funil Comercial */}
      <Card className="bg-white border-[#E2E8F0] shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-[#0F172A]">
            Funil Comercial (Distribuição por Etapa)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={funnelData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis dataKey="name" fontSize={12} stroke="#64748B" />
                <YAxis fontSize={12} stroke="#64748B" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0F172A",
                    borderRadius: "8px",
                    color: "#FFF",
                    fontSize: "12px",
                    border: "none",
                  }}
                />
                <Bar dataKey="valor" radius={[4, 4, 0, 0]}>
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
      <Card className="bg-white border-[#E2E8F0] shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-[#0F172A]">
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
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#F1F5F9" />
                <XAxis type="number" fontSize={12} stroke="#64748B" />
                <YAxis type="category" dataKey="etapa" fontSize={12} stroke="#64748B" width={85} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0F172A",
                    borderRadius: "8px",
                    color: "#FFF",
                    fontSize: "12px",
                    border: "none",
                  }}
                />
                <Bar dataKey="qtd" fill="#2563EB" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Gráfico 3: Satisfação NPS */}
      <Card className="bg-white border-[#E2E8F0] shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-[#0F172A]">
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
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {npsData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={NPS_COLORS[index % NPS_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#0F172A",
                      borderRadius: "8px",
                      color: "#FFF",
                      fontSize: "12px",
                      border: "none",
                    }}
                  />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-xs text-[#64748B] text-center">
                Nenhum NPS registrado ainda.
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Gráfico 4: Indicações Recebidas */}
      <Card className="bg-white border-[#E2E8F0] shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-[#0F172A]">
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
                  innerRadius={55}
                  outerRadius={80}
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
                    backgroundColor: "#0F172A",
                    borderRadius: "8px",
                    color: "#FFF",
                    fontSize: "12px",
                    border: "none",
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
