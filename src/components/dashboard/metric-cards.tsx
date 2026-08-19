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
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      {/* 1. Total Clientes */}
      <Card className="bg-white border-slate-200">
        <CardContent className="p-4 flex flex-col justify-between h-full">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">Total Base</span>
            <Users className="h-4 w-4 text-blue-600" />
          </div>
          <div className="mt-2">
            <div className="text-2xl font-black text-slate-900">{metrics.totalClients}</div>
            <p className="text-[10px] text-slate-400">Clientes 50 Mega</p>
          </div>
        </CardContent>
      </Card>

      {/* 2. Quentes / Interessados */}
      <Card className="bg-white border-slate-200">
        <CardContent className="p-4 flex flex-col justify-between h-full">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">Interessados</span>
            <TrendingUp className="h-4 w-4 text-orange-500" />
          </div>
          <div className="mt-2">
            <div className="text-2xl font-black text-orange-600">{metrics.quenteCount}</div>
            <p className="text-[10px] text-slate-400">Prontos para fechar</p>
          </div>
        </CardContent>
      </Card>

      {/* 3. Vendidos / Upgrades Fechados */}
      <Card className="bg-white border-slate-200">
        <CardContent className="p-4 flex flex-col justify-between h-full">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">Upgrades</span>
            <Award className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="mt-2">
            <div className="text-2xl font-black text-emerald-600">{metrics.vendidoCount}</div>
            <p className="text-[10px] text-slate-400">Migrados para 100M</p>
          </div>
        </CardContent>
      </Card>

      {/* 4. Taxa de Conversão */}
      <Card className="bg-white border-slate-200">
        <CardContent className="p-4 flex flex-col justify-between h-full">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">Conversão</span>
            <Percent className="h-4 w-4 text-indigo-600" />
          </div>
          <div className="mt-2">
            <div className="text-2xl font-black text-indigo-600">{metrics.conversionRate}%</div>
            <p className="text-[10px] text-slate-400">Da base total</p>
          </div>
        </CardContent>
      </Card>

      {/* 5. NPS Médio */}
      <Card className="bg-white border-slate-200">
        <CardContent className="p-4 flex flex-col justify-between h-full">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">NPS Médio</span>
            <Star className="h-4 w-4 text-amber-500" />
          </div>
          <div className="mt-2">
            <div className="text-2xl font-black text-amber-600">
              {metrics.avgNps > 0 ? metrics.avgNps : "-"}
            </div>
            <p className="text-[10px] text-slate-400">
              {metrics.npsPromoters} promotores
            </p>
          </div>
        </CardContent>
      </Card>

      {/* 6. Indicações */}
      <Card className="bg-white border-slate-200">
        <CardContent className="p-4 flex flex-col justify-between h-full">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">Indicações</span>
            <UserCheck className="h-4 w-4 text-purple-600" />
          </div>
          <div className="mt-2">
            <div className="text-2xl font-black text-purple-600">{metrics.referralsCount}</div>
            <p className="text-[10px] text-slate-400">Novos contatos</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
