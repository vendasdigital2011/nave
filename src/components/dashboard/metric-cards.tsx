"use client";

import React from "react";
import {
  Users,
  TrendingUp,
  Award,
  Star,
  UserCheck,
  Percent,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { DashboardMetrics } from "@/types/database";

export function MetricCards({ metrics }: { metrics: DashboardMetrics }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
      {/* 1. Total Clientes */}
      <Card className="bg-white border-[#E2E8F0] shadow-sm">
        <CardContent className="p-4 flex flex-col justify-between h-full">
          <div className="flex items-center justify-between text-[#64748B]">
            <span className="text-xs font-medium">Total Base</span>
            <Users className="h-4 w-4 text-[#64748B]" />
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-[#0F172A]">{metrics.totalClients}</div>
            <p className="text-[11px] text-[#64748B] mt-0.5">Clientes 50M</p>
          </div>
        </CardContent>
      </Card>

      {/* 2. Quentes / Interessados (#2563EB) */}
      <Card className="bg-white border-[#E2E8F0] shadow-sm">
        <CardContent className="p-4 flex flex-col justify-between h-full">
          <div className="flex items-center justify-between text-[#64748B]">
            <span className="text-xs font-medium">Interessados</span>
            <TrendingUp className="h-4 w-4 text-[#2563EB]" />
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-[#2563EB]">{metrics.quenteCount}</div>
            <p className="text-[11px] text-[#64748B] mt-0.5">Etapa Quente</p>
          </div>
        </CardContent>
      </Card>

      {/* 3. Vendidos / Upgrades (#22C55E) */}
      <Card className="bg-white border-[#E2E8F0] shadow-sm">
        <CardContent className="p-4 flex flex-col justify-between h-full">
          <div className="flex items-center justify-between text-[#64748B]">
            <span className="text-xs font-medium">Upgrades</span>
            <Award className="h-4 w-4 text-[#22C55E]" />
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-[#22C55E]">{metrics.vendidoCount}</div>
            <p className="text-[11px] text-[#64748B] mt-0.5">Migrados 100M</p>
          </div>
        </CardContent>
      </Card>

      {/* 4. Taxa de Conversão */}
      <Card className="bg-white border-[#E2E8F0] shadow-sm">
        <CardContent className="p-4 flex flex-col justify-between h-full">
          <div className="flex items-center justify-between text-[#64748B]">
            <span className="text-xs font-medium">Conversão</span>
            <Percent className="h-4 w-4 text-[#0F172A]" />
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-[#0F172A]">{metrics.conversionRate}%</div>
            <p className="text-[11px] text-[#64748B] mt-0.5">Da base total</p>
          </div>
        </CardContent>
      </Card>

      {/* 5. NPS Médio */}
      <Card className="bg-white border-[#E2E8F0] shadow-sm">
        <CardContent className="p-4 flex flex-col justify-between h-full">
          <div className="flex items-center justify-between text-[#64748B]">
            <span className="text-xs font-medium">NPS Médio</span>
            <Star className="h-4 w-4 text-[#F59E0B]" />
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-[#F59E0B]">
              {metrics.avgNps > 0 ? metrics.avgNps : "-"}
            </div>
            <p className="text-[11px] text-[#64748B] mt-0.5">
              {metrics.npsPromoters} promotores
            </p>
          </div>
        </CardContent>
      </Card>

      {/* 6. Indicações */}
      <Card className="bg-white border-[#E2E8F0] shadow-sm">
        <CardContent className="p-4 flex flex-col justify-between h-full">
          <div className="flex items-center justify-between text-[#64748B]">
            <span className="text-xs font-medium">Indicações</span>
            <UserCheck className="h-4 w-4 text-[#2563EB]" />
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-[#0F172A]">{metrics.referralsCount}</div>
            <p className="text-[11px] text-[#64748B] mt-0.5">Novos contatos</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
