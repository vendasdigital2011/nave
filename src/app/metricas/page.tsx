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
  Calendar,
  Filter,
  Download,
  RefreshCw,
  Users,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Layers,
  Flame,
  MessageSquare,
  Clock,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
  PieChart,
  Pie,
} from "recharts";

interface MetricsResponse {
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
  nps: {
    score: number | null;
    respondents: number;
    promoters: number;
    passives: number;
    detractors: number;
    promoters_pct: number;
    passives_pct: number;
    detractors_pct: number;
  };
  objections: Array<{
    objection: string;
    count: number;
    percentage: number;
  }>;
}

export default function MetricasPage() {
  const [loading, setLoading] = useState(true);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState<string>("all");
  const [selectedPeriod, setSelectedPeriod] = useState<string>("all");
  const [activeTab, setActiveTab] = useState<"funnel" | "sellers" | "objections" | "nps">("funnel");

  const [data, setData] = useState<MetricsResponse>({
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
    nps: {
      score: null,
      respondents: 0,
      promoters: 0,
      passives: 0,
      detractors: 0,
      promoters_pct: 0,
      passives_pct: 0,
      detractors_pct: 0,
    },
    objections: [],
  });

  const loadCampaigns = async () => {
    try {
      const res = await fetch("/api/campaigns");
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.campaigns) {
          setCampaigns(json.campaigns);
        }
      }
    } catch (err) {
      console.error("Erro ao carregar campanhas:", err);
    }
  };

  const loadMetrics = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedCampaign !== "all") params.append("campaign_id", selectedCampaign);
      if (selectedPeriod !== "all") params.append("period", selectedPeriod);

      const res = await fetch(`/api/reports/metrics?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          setData(json);
        }
      }
    } catch (err) {
      console.error("Erro ao carregar métricas:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCampaigns();
  }, []);

  useEffect(() => {
    loadMetrics();
  }, [selectedCampaign, selectedPeriod]);

  const handleExportCsv = (type: "leads" | "funnel") => {
    const params = new URLSearchParams();
    params.append("type", type);
    if (selectedCampaign !== "all") params.append("campaign_id", selectedCampaign);
    if (selectedPeriod !== "all") params.append("period", selectedPeriod);

    window.open(`/api/reports/export?${params.toString()}`, "_blank");
  };

  const npsPieData = [
    { name: "Promotores (9-10)", value: data.nps.promoters, color: "#10B981" },
    { name: "Neutros (7-8)", value: data.nps.passives, color: "#F59E0B" },
    { name: "Detratores (0-6)", value: data.nps.detractors, color: "#EF4444" },
  ];

  return (
    <div className="flex-1 space-y-6 p-6">
      {/* Header com Filtros e Exportação */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-[#E2E8F0] pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#FFF4EC] text-[#FF6A00] border border-[#FFD0A8]">
              <BarChart3 className="h-5 w-5" />
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-[#0F172A]">
              Métricas & Desempenho Comercial
            </h1>
          </div>
          <p className="mt-1 text-xs text-[#64748B]">
            Indicadores de conversão, atendimento e satisfação auditados no PostgreSQL.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Seletor de Campanha */}
          <div className="flex items-center gap-2 rounded-lg border border-[#E2E8F0] bg-white px-3 py-1.5 shadow-2xs">
            <Layers className="h-3.5 w-3.5 text-[#64748B]" />
            <select
              value={selectedCampaign}
              onChange={(e) => setSelectedCampaign(e.target.value)}
              className="bg-transparent text-xs font-semibold text-[#0F172A] outline-none"
            >
              <option value="all">Todas as Campanhas</option>
              {campaigns.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Seletor de Período */}
          <div className="flex items-center gap-2 rounded-lg border border-[#E2E8F0] bg-white px-3 py-1.5 shadow-2xs">
            <Calendar className="h-3.5 w-3.5 text-[#64748B]" />
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="bg-transparent text-xs font-semibold text-[#0F172A] outline-none"
            >
              <option value="all">Histórico Geral</option>
              <option value="30d">Últimos 30 Dias</option>
              <option value="7d">Últimos 7 Dias</option>
            </select>
          </div>

          {/* Botão de Exportação */}
          <Button
            size="sm"
            onClick={() => handleExportCsv("leads")}
            className="bg-[#0F172A] hover:bg-[#1E293B] text-white text-xs h-8 px-3 rounded-lg shadow-2xs"
          >
            <Download className="h-3.5 w-3.5 mr-1.5 text-[#FF6A00]" />
            Exportar CSV
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={loadMetrics}
            disabled={loading}
            className="border-[#E2E8F0] text-xs h-8 hover:bg-[#F8FAFC]"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      {/* 4 Cards de KPIs Executivos com Fórmulas e Denominadores Explícitos */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Card 1: Taxa de Conversão */}
        <Card className="border border-[#E2E8F0] bg-white shadow-2xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-[#64748B]">
              Taxa de Conversão
            </CardTitle>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
              <Award className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#0F172A]">
              {data.kpis.total_leads > 0 ? `${data.kpis.conversion_rate}%` : "—"}
            </div>
            <p className="text-[11px] text-[#64748B] mt-1">
              <strong>{data.kpis.converted_leads}</strong> convertidos de <strong>{data.kpis.total_leads}</strong> leads
            </p>
          </CardContent>
        </Card>

        {/* Card 2: Taxa de Contato */}
        <Card className="border border-[#E2E8F0] bg-white shadow-2xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-[#64748B]">
              Taxa de Contato
            </CardTitle>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-100 text-blue-700">
              <TrendingUp className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#0F172A]">
              {data.kpis.total_leads > 0 ? `${data.kpis.contact_rate}%` : "—"}
            </div>
            <p className="text-[11px] text-[#64748B] mt-1">
              <strong>{data.kpis.contacted_leads}</strong> contatados além de importados
            </p>
          </CardContent>
        </Card>

        {/* Card 3: Taxa de Resposta Inbound */}
        <Card className="border border-[#E2E8F0] bg-white shadow-2xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-[#64748B]">
              Taxa de Resposta Inbound
            </CardTitle>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
              <MessageSquare className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#0F172A]">
              {data.kpis.contacted_leads > 0 ? `${data.kpis.response_rate}%` : "—"}
            </div>
            <p className="text-[11px] text-[#64748B] mt-1">
              <strong>{data.kpis.responded_leads}</strong> responderam de <strong>{data.kpis.contacted_leads}</strong> contatados
            </p>
          </CardContent>
        </Card>

        {/* Card 4: NPS Real */}
        <Card className="border border-[#E2E8F0] bg-white shadow-2xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-[#64748B]">
              Net Promoter Score (NPS)
            </CardTitle>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-orange-100 text-[#FF6A00]">
              <Star className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#0F172A]">
              {data.nps.score !== null ? `${data.nps.score}` : "—"}
            </div>
            <p className="text-[11px] text-[#64748B] mt-1">
              {data.nps.respondents > 0
                ? `${data.nps.respondents} avaliações respondentes`
                : "Sem respostas de NPS ainda"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Navegação por Abas de Relatório */}
      <div className="flex items-center gap-2 border-b border-[#E2E8F0]">
        <button
          onClick={() => setActiveTab("funnel")}
          className={`flex items-center gap-2 pb-3 px-1 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === "funnel"
              ? "border-[#FF6A00] text-[#FF6A00]"
              : "border-transparent text-[#64748B] hover:text-[#0F172A]"
          }`}
        >
          <BarChart3 className="h-4 w-4" />
          Funil de Vendas ({data.funnel.length} Etapas)
        </button>

        <button
          onClick={() => setActiveTab("sellers")}
          className={`flex items-center gap-2 pb-3 px-1 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === "sellers"
              ? "border-[#FF6A00] text-[#FF6A00]"
              : "border-transparent text-[#64748B] hover:text-[#0F172A]"
          }`}
        >
          <Users className="h-4 w-4" />
          Desempenho da Equipe ({data.sellers.length} Vendedores)
        </button>

        <button
          onClick={() => setActiveTab("objections")}
          className={`flex items-center gap-2 pb-3 px-1 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === "objections"
              ? "border-[#FF6A00] text-[#FF6A00]"
              : "border-transparent text-[#64748B] hover:text-[#0F172A]"
          }`}
        >
          <AlertTriangle className="h-4 w-4" />
          Objeções Registradas ({data.objections.length})
        </button>

        <button
          onClick={() => setActiveTab("nps")}
          className={`flex items-center gap-2 pb-3 px-1 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === "nps"
              ? "border-[#FF6A00] text-[#FF6A00]"
              : "border-transparent text-[#64748B] hover:text-[#0F172A]"
          }`}
        >
          <Star className="h-4 w-4" />
          Satisfação & NPS
        </button>
      </div>

      {/* CONTEÚDO DA ABA 1: FUNIL DE VENDAS */}
      {activeTab === "funnel" && (
        <div className="grid gap-6 md:grid-cols-3">
          <Card className="md:col-span-2 border border-[#E2E8F0] shadow-sm">
            <CardHeader>
              <CardTitle className="text-base font-bold text-[#0F172A]">
                Distribuição de Leads pelas Etapas do Funil
              </CardTitle>
            </CardHeader>
            <CardContent>
              {data.funnel.length === 0 ? (
                <div className="py-12 text-center text-xs text-[#64748B]">
                  Nenhum dado encontrado para o filtro de campanha selecionado.
                </div>
              ) : (
                <div className="h-80 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.funnel} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                      <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#64748B" }} />
                      <YAxis tick={{ fontSize: 11, fill: "#64748B" }} />
                      <Tooltip
                        formatter={(val: any, name: any) => [`${val} leads`, "Volume"]}
                        contentStyle={{
                          borderRadius: "12px",
                          border: "1px solid #E2E8F0",
                          boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                          fontSize: "12px",
                        }}
                      />
                      <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                        {data.funnel.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color || "#FF6A00"} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Tabela Resumo do Funil */}
          <Card className="border border-[#E2E8F0] shadow-sm">
            <CardHeader>
              <CardTitle className="text-base font-bold text-[#0F172A]">
                Resumo Percentual
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="divide-y divide-[#E2E8F0]">
                {data.funnel.map((item) => (
                  <div key={item.stage_id} className="py-2.5 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span
                        className="h-2.5 w-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="font-semibold text-[#0F172A]">{item.name}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-[#0F172A]">{item.count}</span>
                      <span className="text-[11px] text-[#64748B] ml-1">({item.percentage}%)</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* CONTEÚDO DA ABA 2: DESEMPENHO DA EQUIPE */}
      {activeTab === "sellers" && (
        <Card className="border border-[#E2E8F0] shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-bold text-[#0F172A]">
              Produtividade e Conversão Individual
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.sellers.length === 0 ? (
              <div className="py-8 text-center text-xs text-[#64748B]">
                Nenhum vendedor com leads atribuídos no período.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4 font-bold">Vendedor</th>
                      <th className="py-3 px-4 font-bold">Função</th>
                      <th className="py-3 px-4 font-bold">Leads Atribuídos</th>
                      <th className="py-3 px-4 font-bold">Contatados</th>
                      <th className="py-3 px-4 font-bold">Conversões (Fechados)</th>
                      <th className="py-3 px-4 font-bold">Taxa Individual</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {data.sellers.map((s) => (
                      <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-4 font-bold text-[#0F172A]">{s.name}</td>
                        <td className="py-3 px-4 text-slate-500 capitalize">{s.role}</td>
                        <td className="py-3 px-4 font-semibold text-slate-700">{s.assigned_leads}</td>
                        <td className="py-3 px-4 font-semibold text-slate-700">{s.contacted_leads}</td>
                        <td className="py-3 px-4 font-bold text-emerald-700">{s.converted_leads}</td>
                        <td className="py-3 px-4">
                          <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700 border border-emerald-200">
                            {s.assigned_leads > 0 ? `${s.conversion_rate}%` : "—"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* CONTEÚDO DA ABA 3: OBJEÇÕES */}
      {activeTab === "objections" && (
        <Card className="border border-[#E2E8F0] shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-bold text-[#0F172A]">
              Principais Objeções Identificadas nas Conversas
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.objections.length === 0 ? (
              <div className="py-8 text-center text-xs text-[#64748B]">
                Nenhuma objeção registrada nas anotações de conversa ainda.
              </div>
            ) : (
              <div className="space-y-3.5 max-w-2xl">
                {data.objections.map((item, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-semibold text-slate-800">{item.objection}</span>
                      <span className="font-bold text-slate-600">
                        {item.count} citações ({item.percentage}%)
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full bg-[#FF6A00] rounded-full transition-all"
                        style={{ width: `${item.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* CONTEÚDO DA ABA 4: NPS & SATISFAÇÃO */}
      {activeTab === "nps" && (
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="border border-[#E2E8F0] shadow-sm">
            <CardHeader>
              <CardTitle className="text-base font-bold text-[#0F172A]">
                Distribuição de Respondentes
              </CardTitle>
            </CardHeader>
            <CardContent>
              {data.nps.respondents === 0 ? (
                <div className="py-12 text-center text-xs text-[#64748B]">
                  Nenhuma avaliação com nota de 0 a 10 encontrada na base.
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3.5 rounded-xl bg-emerald-50 border border-emerald-200">
                    <div>
                      <h4 className="font-bold text-xs text-emerald-900">Promotores (Notas 9 e 10)</h4>
                      <p className="text-[11px] text-emerald-700">Clientes altamente satisfeitos e leais</p>
                    </div>
                    <div className="text-right">
                      <span className="text-lg font-bold text-emerald-900">{data.nps.promoters}</span>
                      <span className="text-xs text-emerald-700 ml-1">({data.nps.promoters_pct}%)</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3.5 rounded-xl bg-amber-50 border border-amber-200">
                    <div>
                      <h4 className="font-bold text-xs text-amber-900">Neutros (Notas 7 e 8)</h4>
                      <p className="text-[11px] text-amber-700">Satisfeitos, porém vulneráveis a ofertas concorrentes</p>
                    </div>
                    <div className="text-right">
                      <span className="text-lg font-bold text-amber-900">{data.nps.passives}</span>
                      <span className="text-xs text-amber-700 ml-1">({data.nps.passives_pct}%)</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3.5 rounded-xl bg-red-50 border border-red-200">
                    <div>
                      <h4 className="font-bold text-xs text-red-900">Detratores (Notas 0 a 6)</h4>
                      <p className="text-[11px] text-red-700">Clientes insatisfeitos com risco de cancelamento</p>
                    </div>
                    <div className="text-right">
                      <span className="text-lg font-bold text-red-900">{data.nps.detractors}</span>
                      <span className="text-xs text-red-700 ml-1">({data.nps.detractors_pct}%)</span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border border-[#E2E8F0] shadow-sm flex flex-col justify-between">
            <CardHeader>
              <CardTitle className="text-base font-bold text-[#0F172A]">
                Fórmula e Amostra do NPS
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-xs text-slate-600">
              <p>
                O Net Promoter Score é calculado subtraindo o percentual de <strong>Detratores</strong> do percentual de <strong>Promotores</strong>:
              </p>
              <div className="rounded-lg bg-slate-50 p-3 font-mono text-[11px] text-[#0F172A] border border-slate-200">
                NPS = % Promotores ({data.nps.promoters_pct}%) − % Detratores ({data.nps.detractors_pct}%) = {data.nps.score !== null ? data.nps.score : "—"}
              </div>
              <p className="text-[11px] text-[#64748B]">
                Apenas avaliações válidas entre 0 e 10 são computadas. Contatos sem nota preenchida são formalmente desconsiderados para não distorcer a média.
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
