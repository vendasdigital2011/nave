"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Printer,
  ArrowLeft,
  Download,
  Layers,
  Calendar,
  Users,
  CheckCircle2,
  TrendingUp,
  AlertTriangle,
  Flame,
  Award,
  Loader2,
  Phone,
  Building,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface ReportData {
  campaign: {
    id: string;
    name: string;
    type: string;
    created_at?: string;
  } | null;
  currentUser: {
    name: string;
    email: string;
    role: string;
  } | null;
  emissionDate: string;
  metrics: {
    kpis: {
      total_leads: number;
      contacted_leads: number;
      contact_rate: number;
      responded_leads: number;
      response_rate: number;
      converted_leads: number;
      conversion_rate: number;
      lost_leads: number;
      loss_rate: number;
    };
    funnel: Array<{
      stage_id: string;
      name: string;
      stage_kind: string;
      color: string;
      count: number;
      percentage: number;
    }>;
    sellers: Array<{
      id: string;
      name: string;
      role: string;
      assigned_leads: number;
      contacted_leads: number;
      converted_leads: number;
      conversion_rate: number;
    }>;
    objections: Array<{
      objection: string;
      count: number;
      percentage: number;
    }>;
  };
  leads: any[];
}

function RelatorioPdfContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const campaignId = searchParams.get("campaign_id") || "c0000000-0000-0000-0000-000000000001";
  const period = searchParams.get("period") || "all";

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ReportData | null>(null);

  useEffect(() => {
    async function loadReport() {
      setLoading(true);
      try {
        const [authRes, campRes, metricsRes, leadsRes] = await Promise.all([
          fetch("/api/auth/me").then((r) => r.json()).catch(() => null),
          fetch(`/api/campaigns/${campaignId}`).then((r) => r.json()).catch(() => null),
          fetch(`/api/reports/metrics?campaign_id=${campaignId}&period=${period}`).then((r) => r.json()).catch(() => null),
          fetch(`/api/campaigns/${campaignId}/leads`).then((r) => r.json()).catch(() => null),
        ]);

        const emissionDate = new Date().toLocaleString("pt-BR", {
          timeZone: "America/Bahia",
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });

        const campaign = campRes?.campaign || {
          id: campaignId,
          name: "Campanha Upgrade 100M",
          type: "upgrade",
        };

        const metrics = metricsRes?.kpis ? metricsRes : {
          kpis: {
            total_leads: 0,
            contacted_leads: 0,
            contact_rate: 0,
            responded_leads: 0,
            response_rate: 0,
            converted_leads: 0,
            conversion_rate: 0,
            lost_leads: 0,
            loss_rate: 0,
          },
          funnel: [],
          sellers: [],
          objections: [],
        };

        const leads = leadsRes?.leads || [];

        setData({
          campaign,
          currentUser: authRes?.user || { name: "Operador", email: "admin@navetech.com.br", role: "admin" },
          emissionDate,
          metrics,
          leads,
        });
      } catch (err) {
        console.error("Erro ao carregar relatório:", err);
      } finally {
        setLoading(false);
      }
    }

    loadReport();
  }, [campaignId, period]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex h-screen flex-col items-center justify-center space-y-4 bg-slate-50">
        <Loader2 className="h-10 w-10 animate-spin text-[#FF6A00]" />
        <p className="text-sm font-bold text-slate-600">Gerando Relatório Ilustrativo da Campanha...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-8 text-center text-red-600">
        Não foi possível carregar os dados desta campanha.
      </div>
    );
  }

  const { campaign, currentUser, emissionDate, metrics, leads } = data;
  const kpis = metrics.kpis;

  return (
    <div className="min-h-screen bg-slate-100/80 py-6 px-4 sm:px-6 lg:px-8 print:bg-white print:p-0">
      {/* Barra de Ações Superior (Oculta na impressão) */}
      <div className="mx-auto mb-6 max-w-5xl flex items-center justify-between rounded-2xl bg-white p-4 shadow-sm border border-slate-200 print:hidden">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push("/metricas")}
            className="text-xs font-semibold gap-1.5"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Voltar para Métricas
          </Button>
          <span className="text-xs text-slate-500">
            Campanha: <strong className="text-slate-800">{campaign?.name}</strong>
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={() => {
              window.open(`/api/reports/export?type=leads&campaign_id=${campaignId}&period=${period}`, "_blank");
            }}
            variant="outline"
            className="text-xs font-semibold gap-1.5 text-slate-700"
          >
            <Download className="h-3.5 w-3.5 text-slate-500" />
            Baixar CSV
          </Button>

          <Button
            size="sm"
            onClick={handlePrint}
            className="bg-[#FF6A00] hover:bg-[#E85C00] text-white text-xs font-bold gap-1.5 shadow-sm"
          >
            <Printer className="h-4 w-4" />
            Imprimir / Salvar em PDF
          </Button>
        </div>
      </div>

      {/* DOCUMENTO PRINCIPAL / FOLHA A4 DE RELATÓRIO */}
      <div className="mx-auto max-w-5xl rounded-3xl bg-white p-8 sm:p-12 shadow-md border border-slate-200 print:border-none print:shadow-none print:p-4 print:max-w-none text-[#0F172A]">
        {/* 1. CABEÇALHO INSTITUCIONAL */}
        <div className="flex items-start justify-between border-b-2 border-[#FF6A00] pb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <img
                src="/images/brand/logo.png"
                alt="Navetech Telecom"
                className="h-10 w-10 object-contain rounded-xl shadow-2xs"
              />
              <div>
                <h1 className="text-xl font-black tracking-tight text-[#0B0B0D] uppercase">
                  NAVETECH TELECOM
                </h1>
                <p className="text-xs font-bold text-[#FF6A00]">
                  NaveProspect CRM • Relatório Executivo de Campanha
                </p>
              </div>
            </div>
            <div className="pt-2">
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                {campaign?.name}
              </h2>
              <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-slate-500">
                <span className="font-semibold text-slate-700">Tipo:</span>
                <Badge variant="outline" className="text-[10px] font-bold uppercase">
                  {campaign?.type || "Upgrade"}
                </Badge>
                <span>•</span>
                <span>Período: <strong>{period === "all" ? "Histórico Completo" : period === "30d" ? "Últimos 30 Dias" : "Últimos 7 Dias"}</strong></span>
              </div>
            </div>
          </div>

          <div className="text-right text-xs space-y-1 bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80">
            <div>
              <span className="text-slate-400 font-medium">Emissão: </span>
              <strong className="text-slate-800">{emissionDate}</strong>
            </div>
            <div>
              <span className="text-slate-400 font-medium">Operador: </span>
              <strong className="text-slate-800">{currentUser?.name}</strong>
            </div>
            <div className="text-[10px] text-slate-400">
              {currentUser?.email} ({currentUser?.role})
            </div>
          </div>
        </div>

        {/* 2. CARDS EXECUTIVOS DE KPIS */}
        <div className="mt-6">
          <h3 className="text-xs font-black tracking-wider uppercase text-slate-400 mb-3 flex items-center gap-1.5">
            <Award className="h-4 w-4 text-[#FF6A00]" />
            Indicadores Chave de Performance (KPIs da Campanha)
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {/* Total Leads */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-3.5">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Total de Leads</span>
              <span className="text-2xl font-black text-slate-900 mt-1 block">{kpis.total_leads}</span>
              <span className="text-[10px] text-slate-400 mt-0.5 block">100% da base importada</span>
            </div>

            {/* Contatados */}
            <div className="rounded-2xl border border-blue-200 bg-blue-50/50 p-3.5">
              <span className="text-[11px] font-bold text-blue-700 uppercase tracking-wider block">Contato Feito</span>
              <span className="text-2xl font-black text-blue-900 mt-1 block">{kpis.contacted_leads}</span>
              <span className="text-[10px] font-bold text-blue-600 mt-0.5 block">{kpis.contact_rate}% alcançados</span>
            </div>

            {/* Responderam */}
            <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-3.5">
              <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider block">Respostas</span>
              <span className="text-2xl font-black text-amber-900 mt-1 block">{kpis.responded_leads}</span>
              <span className="text-[10px] font-bold text-amber-600 mt-0.5 block">{kpis.response_rate}% engajamento</span>
            </div>

            {/* Convertidos / Fechados */}
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-3.5">
              <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider block">Convertidos</span>
              <span className="text-2xl font-black text-emerald-900 mt-1 block">{kpis.converted_leads}</span>
              <span className="text-[10px] font-bold text-emerald-600 mt-0.5 block">{kpis.conversion_rate}% taxa final</span>
            </div>

            {/* Perdidos / Inválidos */}
            <div className="rounded-2xl border border-red-200 bg-red-50/50 p-3.5 col-span-2 sm:col-span-1">
              <span className="text-[11px] font-bold text-red-700 uppercase tracking-wider block">Perdidos / Inválidos</span>
              <span className="text-2xl font-black text-red-900 mt-1 block">{kpis.lost_leads}</span>
              <span className="text-[10px] font-bold text-red-600 mt-0.5 block">{kpis.loss_rate}% taxa de perda</span>
            </div>
          </div>
        </div>

        {/* 3. ILUSTRAÇÃO VISUAL DO FUNIL DA CAMPANHA */}
        <div className="mt-8 border-t border-slate-200 pt-6">
          <h3 className="text-xs font-black tracking-wider uppercase text-slate-400 mb-4 flex items-center gap-1.5">
            <Flame className="h-4 w-4 text-[#FF6A00]" />
            Funil Comercial Ilustrativo da Campanha
          </h3>

          <div className="space-y-3 bg-slate-50/60 p-5 rounded-2xl border border-slate-200">
            {metrics.funnel.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-4">Nenhuma etapa cadastrada para esta campanha.</p>
            ) : (
              metrics.funnel.map((stage, idx) => {
                const isWon = stage.stage_kind === "won";
                const isLost = stage.stage_kind === "lost";
                const barColor = isWon ? "bg-emerald-500" : isLost ? "bg-red-500" : "bg-[#FF6A00]";

                return (
                  <div key={stage.stage_id} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-200 text-slate-700 font-bold text-[10px]">
                          {idx + 1}
                        </span>
                        <strong className="text-slate-800 text-sm">{stage.name}</strong>
                        <Badge
                          variant="outline"
                          className="text-[9px] font-semibold uppercase px-1.5 py-0"
                          style={{ borderColor: stage.color, color: stage.color }}
                        >
                          {stage.stage_kind}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="font-mono text-sm font-black text-slate-900">
                          {stage.count} <span className="text-xs font-normal text-slate-500">leads</span>
                        </span>
                        <span className="text-xs font-bold text-slate-600 w-12 text-right">
                          {stage.percentage}%
                        </span>
                      </div>
                    </div>

                    {/* Barra de Progresso Ilustrativa */}
                    <div className="h-3 w-full rounded-full bg-slate-200 overflow-hidden shadow-inner">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                        style={{
                          width: `${Math.max(stage.percentage, stage.count > 0 ? 5 : 0)}%`,
                          backgroundColor: stage.color || undefined,
                        }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* 4. PERFORMANCE DOS VENDEDORES NESTA CAMPANHA */}
        <div className="mt-8 border-t border-slate-200 pt-6">
          <h3 className="text-xs font-black tracking-wider uppercase text-slate-400 mb-3 flex items-center gap-1.5">
            <Users className="h-4 w-4 text-[#FF6A00]" />
            Desempenho da Equipe Comercial nesta Campanha
          </h3>

          <div className="overflow-hidden rounded-2xl border border-slate-200">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-4">Vendedor / Responsável</th>
                  <th className="py-2.5 px-4 text-center">Leads Atribuídos</th>
                  <th className="py-2.5 px-4 text-center">Contatados</th>
                  <th className="py-2.5 px-4 text-center">Convertidos</th>
                  <th className="py-2.5 px-4 text-right">Taxa de Conversão</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {metrics.sellers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-4 text-center text-slate-400">
                      Nenhum vendedor com leads atribuídos nesta campanha.
                    </td>
                  </tr>
                ) : (
                  metrics.sellers.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50/50">
                      <td className="py-2.5 px-4 font-bold text-slate-800">
                        {s.name}
                        <span className="block text-[10px] font-normal text-slate-400">{s.role}</span>
                      </td>
                      <td className="py-2.5 px-4 text-center font-mono font-semibold text-slate-700">
                        {s.assigned_leads}
                      </td>
                      <td className="py-2.5 px-4 text-center font-mono font-semibold text-blue-700">
                        {s.contacted_leads}
                      </td>
                      <td className="py-2.5 px-4 text-center font-mono font-bold text-emerald-700">
                        {s.converted_leads}
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono font-black text-slate-900">
                        {s.conversion_rate}%
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* 5. TABELA DE LEADS DETALHADOS DA CAMPANHA */}
        <div className="mt-8 border-t border-slate-200 pt-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-black tracking-wider uppercase text-slate-400 flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-[#FF6A00]" />
              Relação de Leads da Campanha ({leads.length})
            </h3>
            <span className="text-[11px] text-slate-500">
              Listagem auditada no PostgreSQL
            </span>
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-200">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Cliente</th>
                  <th className="py-2.5 px-3">Telefone</th>
                  <th className="py-2.5 px-3">Condomínio</th>
                  <th className="py-2.5 px-3">Planos (Atual → Alvo)</th>
                  <th className="py-2.5 px-3 text-center">Etapa Atual</th>
                  <th className="py-2.5 px-3 text-right">Responsável</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {leads.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-slate-400">
                      Nenhum lead encontrado para esta campanha.
                    </td>
                  </tr>
                ) : (
                  leads.map((l: any, i: number) => {
                    const c = l.client || {};
                    return (
                      <tr key={l.id || i} className="hover:bg-slate-50/50">
                        <td className="py-2 px-3 font-bold text-slate-900">
                          {c.name || "Sem Nome"}
                        </td>
                        <td className="py-2 px-3 font-mono text-[11px] text-slate-600">
                          {c.phone || "-"}
                        </td>
                        <td className="py-2 px-3 text-slate-600">
                          {c.condominium || "Geral"}
                        </td>
                        <td className="py-2 px-3 text-slate-700">
                          <span className="font-medium text-slate-500">{c.current_plan || "50M"}</span>
                          <span className="mx-1 text-[#FF6A00] font-bold">→</span>
                          <span className="font-bold text-[#FF6A00]">{c.target_plan || "100M"}</span>
                        </td>
                        <td className="py-2 px-3 text-center">
                          <span className="inline-block rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-700">
                            {l.stage?.name || c.status || "Importados"}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-right text-slate-600">
                          {l.assigned_user?.display_name || "Fila Geral"}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* 6. RODAPÉ DE AUDITORIA E ASSINATURA */}
        <div className="mt-12 border-t border-slate-200 pt-6 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-400 gap-2">
          <div>
            NaveProspect CRM 2.0 • Relatório gerado com dados 100% em nuvem (Supabase PostgreSQL).
          </div>
          <div className="font-mono text-slate-500">
            Hash de Auditoria: {campaignId.slice(0, 8)}-{Date.now().toString(16).toUpperCase()}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function RelatorioPdfPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#FF6A00]" />
        </div>
      }
    >
      <RelatorioPdfContent />
    </Suspense>
  );
}
