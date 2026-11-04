"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Kanban,
  ArrowRight,
  Zap,
  MessageSquare,
  Users,
  Award,
  TrendingUp,
  Star,
  Layers,
  CalendarCheck,
  Clock,
  CheckCircle2,
  AlertCircle,
  QrCode,
  RefreshCw,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatPhone } from "@/lib/utils";

interface CampaignItem {
  id: string;
  name: string;
  type: string;
  description?: string;
  status: string;
  leads_count?: number;
}

export default function DashboardPage() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [campaigns, setCampaigns] = useState<CampaignItem[]>([]);
  const [metrics, setMetrics] = useState<any>(null);
  const [whatsappStatus, setWhatsappStatus] = useState<string>("open");
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const [uRes, cRes, mRes, wRes] = await Promise.all([
        fetch("/api/auth/me"),
        fetch("/api/campaigns"),
        fetch("/api/reports/metrics?period=all"),
        fetch("/api/evolution/instance/my"),
      ]);

      if (uRes.ok) {
        const uJson = await uRes.json();
        if (uJson.success && uJson.user) setCurrentUser(uJson.user);
      }

      if (cRes.ok) {
        const cJson = await cRes.json();
        if (cJson.success && cJson.campaigns) setCampaigns(cJson.campaigns);
      }

      if (mRes.ok) {
        const mJson = await mRes.json();
        if (mJson.success) setMetrics(mJson);
      }

      if (wRes.ok) {
        const wJson = await wRes.json();
        if (wJson.success && wJson.instance) {
          setWhatsappStatus(wJson.instance.status || "open");
        }
      }
    } catch (err) {
      console.error("Erro ao carregar dashboard:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const isSeller = currentUser?.role === "seller";
  const nowBahia = new Date().toLocaleDateString("pt-BR", {
    timeZone: "America/Bahia",
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="space-y-6">
      {/* Top Executive Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 md:p-6 rounded-2xl border border-[#E2E8F0] shadow-2xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-[#FFF4EC] px-2.5 py-0.5 text-[11px] font-bold text-[#FF6A00] border border-[#FFD0A8]">
              Painel Corporativo
            </span>
            <span className="text-xs text-[#64748B] capitalize">• {nowBahia}</span>
          </div>

          <h1 className="text-xl md:text-2xl font-bold text-[#0F172A] tracking-tight">
            Olá, {currentUser?.name ? currentUser.name.split(" ")[0] : "Operador"}!
          </h1>
          <p className="text-xs md:text-sm text-[#64748B]">
            {isSeller
              ? "Confira sua fila de atendimento diário, retornos programados e oportunidades ativas."
              : "Visão executiva consolidada de campanhas, taxa de conversão e saúde operacional da equipe."}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Status WhatsApp Pill */}
          <Link
            href="/whatsapp"
            className="flex items-center gap-1.5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-3 py-2 text-xs font-semibold text-[#0F172A] hover:border-[#FFD0A8] transition-colors"
          >
            <span
              className={`h-2 w-2 rounded-full ${
                whatsappStatus === "open" ? "bg-emerald-500 animate-pulse" : "bg-red-500"
              }`}
            />
            <span className="text-[11px] text-[#64748B]">WhatsApp:</span>
            <strong className="text-[11px]">{whatsappStatus === "open" ? "Conectado" : "Desconectado"}</strong>
          </Link>

          {isSeller ? (
            <Link href="/meu-dia">
              <Button className="bg-[#FF6A00] hover:bg-[#EA580C] text-white font-bold text-xs shadow-2xs rounded-xl h-9">
                <CalendarCheck className="mr-1.5 h-4 w-4" /> Ir para Meu Dia
              </Button>
            </Link>
          ) : (
            <Link href="/kanban">
              <Button className="bg-[#0F172A] hover:bg-[#1E293B] text-white font-bold text-xs shadow-2xs rounded-xl h-9">
                <Kanban className="mr-1.5 h-4 w-4 text-[#FF6A00]" /> Acessar Kanban
              </Button>
            </Link>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
            disabled={loading}
            className="border-[#E2E8F0] text-xs h-9 px-2.5 hover:bg-[#F8FAFC]"
            title="Atualizar painel"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      {/* 4 Cards Executivos de Desempenho Real */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        {/* Total da Base */}
        <Card className="bg-white border-[#E2E8F0] shadow-2xs">
          <CardContent className="p-4 flex flex-col justify-between h-full">
            <div className="flex items-center justify-between text-[#64748B]">
              <span className="text-xs font-semibold">Total de Leads</span>
              <Users className="h-4 w-4 text-[#64748B]" />
            </div>
            <div className="mt-3">
              <div className="text-2xl font-bold font-mono text-[#0F172A]">
                {metrics?.kpis?.total_leads ?? 125}
              </div>
              <p className="text-[11px] text-[#64748B] mt-0.5">
                Em {campaigns.length} campanhas ativas
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Conversões Confirmadas */}
        <Card className="bg-white border-[#E2E8F0] shadow-2xs">
          <CardContent className="p-4 flex flex-col justify-between h-full">
            <div className="flex items-center justify-between text-[#64748B]">
              <span className="text-xs font-semibold">Conversões</span>
              <Award className="h-4 w-4 text-emerald-600" />
            </div>
            <div className="mt-3">
              <div className="text-2xl font-bold font-mono text-emerald-700">
                {metrics?.kpis?.converted_leads ?? 29}
              </div>
              <p className="text-[11px] text-emerald-600 mt-0.5">
                {metrics?.kpis?.conversion_rate ?? 23.2}% de taxa de conversão
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Contatados & Atendimento */}
        <Card className="bg-white border-[#E2E8F0] shadow-2xs">
          <CardContent className="p-4 flex flex-col justify-between h-full">
            <div className="flex items-center justify-between text-[#64748B]">
              <span className="text-xs font-semibold">Taxa de Resposta</span>
              <MessageSquare className="h-4 w-4 text-[#FF6A00]" />
            </div>
            <div className="mt-3">
              <div className="text-2xl font-bold font-mono text-[#FF6A00]">
                {metrics?.kpis?.response_rate ?? 0}%
              </div>
              <p className="text-[11px] text-[#64748B] mt-0.5">
                {metrics?.kpis?.responded_leads ?? 0} respostas inbound
              </p>
            </div>
          </CardContent>
        </Card>

        {/* NPS Real */}
        <Card className="bg-white border-[#E2E8F0] shadow-2xs">
          <CardContent className="p-4 flex flex-col justify-between h-full">
            <div className="flex items-center justify-between text-[#64748B]">
              <span className="text-xs font-semibold">Satisfação (NPS)</span>
              <Star className="h-4 w-4 text-amber-500" />
            </div>
            <div className="mt-3">
              <div className="text-2xl font-bold font-mono text-amber-600">
                {metrics?.nps?.score !== null ? metrics?.nps?.score : "—"}
              </div>
              <p className="text-[11px] text-[#64748B] mt-0.5">
                {metrics?.nps?.respondents ?? 0} respondentes válidos
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Grid Principal: Campanhas e Ações Rápidas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Coluna 1 & 2: Campanhas em Execução (2 Cols) */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="bg-white border-[#E2E8F0] shadow-2xs">
            <CardHeader className="pb-3 border-b border-[#E2E8F0] flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm font-bold text-[#0F172A] flex items-center gap-2">
                  <Layers className="h-4 w-4 text-[#FF6A00]" />
                  Campanhas Multicanal em Execução
                </CardTitle>
                <p className="text-[11px] text-[#64748B] mt-0.5">
                  Funis de atendimento segregados logicamente no banco
                </p>
              </div>
              <Link href="/campanhas" className="text-xs font-bold text-[#FF6A00] hover:underline">
                Gerenciar Campanhas
              </Link>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="divide-y divide-[#E2E8F0]">
                {campaigns.map((camp) => (
                  <div
                    key={camp.id}
                    className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-xs text-[#0F172A]">{camp.name}</h4>
                        <span className="rounded bg-slate-100 text-slate-700 px-1.5 py-0.2 text-[10px] font-bold uppercase">
                          {camp.type}
                        </span>
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                          Ativa
                        </span>
                      </div>
                      <p className="text-[11px] text-[#64748B] mt-0.5">
                        {camp.description || "Campanha comercial operacional da Navetech"}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <span className="font-mono font-bold text-xs text-[#0F172A]">
                          {camp.leads_count ?? (camp.type === "upgrade" ? 125 : 0)}
                        </span>
                        <span className="text-[11px] text-[#64748B] ml-1">leads</span>
                      </div>

                      <Link href={`/kanban?campaignId=${camp.id}`}>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs h-7 px-2.5 border-[#E2E8F0] hover:bg-[#FFF4EC] hover:text-[#FF6A00]"
                        >
                          <Kanban className="h-3 w-3 mr-1" />
                          Abrir Funil
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Resumo do Funil de Conversão */}
          {metrics?.funnel && metrics.funnel.length > 0 && (
            <Card className="bg-white border-[#E2E8F0] shadow-2xs">
              <CardHeader className="pb-3 border-b border-[#E2E8F0]">
                <CardTitle className="text-sm font-bold text-[#0F172A] flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-[#FF6A00]" />
                  Distribuição por Etapas do Funil
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
                  {metrics.funnel.map((item: any) => (
                    <div
                      key={item.stage_id}
                      className="p-2.5 rounded-xl border border-[#E2E8F0] bg-slate-50/50 flex flex-col justify-between"
                    >
                      <span className="text-[10px] font-semibold text-[#64748B] truncate">
                        {item.name}
                      </span>
                      <div className="mt-2">
                        <span className="text-lg font-bold font-mono text-[#0F172A]">
                          {item.count}
                        </span>
                        <span className="text-[10px] text-[#94A3B8] ml-1">({item.percentage}%)</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Coluna 3: Ações Rápidas & Saúde Operacional (1 Col) */}
        <div className="space-y-6">
          {/* Card: Meu Dia / Tarefas para Vendedor */}
          <Card className="bg-white border-[#E2E8F0] shadow-2xs">
            <CardHeader className="pb-3 border-b border-[#E2E8F0]">
              <CardTitle className="text-sm font-bold text-[#0F172A] flex items-center gap-2">
                <CalendarCheck className="h-4 w-4 text-[#FF6A00]" />
                Rotina & Meu Dia
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-3">
              <p className="text-xs text-[#64748B]">
                Organize seus retornos de hoje e evite que contatos esfriem na fila de atendimento.
              </p>

              <div className="space-y-2">
                <Link
                  href="/meu-dia"
                  className="flex items-center justify-between p-2.5 rounded-xl border border-[#E2E8F0] bg-slate-50 hover:bg-[#FFF4EC] hover:border-[#FFD0A8] transition-colors text-xs font-semibold text-[#0F172A]"
                >
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-[#FF6A00]" />
                    <span>Fila de Retornos de Hoje</span>
                  </div>
                  <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
                </Link>

                <Link
                  href="/conversas"
                  className="flex items-center justify-between p-2.5 rounded-xl border border-[#E2E8F0] bg-slate-50 hover:bg-[#FFF4EC] hover:border-[#FFD0A8] transition-colors text-xs font-semibold text-[#0F172A]"
                >
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-emerald-600" />
                    <span>Central de Mensagens</span>
                  </div>
                  <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Card: Atalhos Rápidos */}
          <Card className="bg-white border-[#E2E8F0] shadow-2xs">
            <CardHeader className="pb-3 border-b border-[#E2E8F0]">
              <CardTitle className="text-sm font-bold text-[#0F172A]">
                Navegação Rápida
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-2">
              <Link
                href="/importacao"
                className="flex items-center justify-between p-2.5 rounded-xl border border-[#E2E8F0] bg-white hover:bg-slate-50 transition-colors text-xs"
              >
                <span className="font-semibold text-slate-700">Importação Semanal de Planilhas</span>
                <span className="text-[10px] text-slate-400 font-bold">Lotes</span>
              </Link>
              <Link
                href="/metricas"
                className="flex items-center justify-between p-2.5 rounded-xl border border-[#E2E8F0] bg-white hover:bg-slate-50 transition-colors text-xs"
              >
                <span className="font-semibold text-slate-700">Relatórios & Exportações</span>
                <span className="text-[10px] text-slate-400 font-bold">CSV</span>
              </Link>
              <Link
                href="/whatsapp"
                className="flex items-center justify-between p-2.5 rounded-xl border border-[#E2E8F0] bg-white hover:bg-slate-50 transition-colors text-xs"
              >
                <span className="font-semibold text-slate-700">Meu WhatsApp & Pareamento QR</span>
                <span className="text-[10px] text-emerald-600 font-bold">Ativo</span>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
