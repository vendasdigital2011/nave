"use client";

import React, { useState, useEffect } from "react";
import {
  Settings,
  ShieldCheck,
  Zap,
  Save,
  CheckCircle2,
  Lock,
  Mail,
  RefreshCw,
  AlertCircle,
  Loader2,
  History,
  Sparkles,
  Bot,
  Cpu,
  Key,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { DataService } from "@/lib/data-service";
import { AuditLog } from "@/types/database";

export default function ConfiguracoesPage() {
  const [adminEmail, setAdminEmail] = useState("admin@navetech.com.br");
  const [adminPassword, setAdminPassword] = useState("");
  const [evolutionUrl, setEvolutionUrl] = useState("https://evolutionapi.vps10855.panel.icontainer.net");
  const [instanceName, setInstanceName] = useState("nave");
  const [evolutionApiKey, setEvolutionApiKey] = useState("70F1798929B5-44FA-95E9-03C39D69E51E");
  const [campaignOrigin, setCampaignOrigin] = useState("50 Mega");
  const [campaignTarget, setCampaignTarget] = useState("100 Mega");
  const [isSaved, setIsSaved] = useState(false);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  // Evolution API Connection Test State
  const [isTestingEvolution, setIsTestingEvolution] = useState(false);
  const [evolutionStatus, setEvolutionStatus] = useState<"connected" | "disconnected" | "checking" | null>(null);
  const [evolutionMessage, setEvolutionMessage] = useState<string | null>(null);

  // AI Copilot Configuration State
  const [selectedAiProvider, setSelectedAiProvider] = useState<"gemini" | "openai">("gemini");
  const [aiConfig, setAiConfig] = useState<{
    configured: boolean;
    provider: string;
    model: string;
    maskedKey: string | null;
    description: string;
    geminiConfigured?: boolean;
    openAiConfigured?: boolean;
  } | null>(null);
  const [aiApiKeyInput, setAiApiKeyInput] = useState("");
  const [aiModelInput, setAiModelInput] = useState("gemini-1.5-flash");
  const [isTestingAi, setIsTestingAi] = useState(false);
  const [aiTestResult, setAiTestResult] = useState<{
    success: boolean;
    provider?: string;
    message?: string;
    error?: string;
    latencyMs?: number;
  } | null>(null);

  const loadAiConfig = () => {
    fetch("/api/ai/config")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d && d.success) {
          setAiConfig(d);
          if (d.provider === "gemini") {
            setSelectedAiProvider("gemini");
            setAiModelInput(d.model || "gemini-1.5-flash");
          } else if (d.provider === "openai") {
            setSelectedAiProvider("openai");
            setAiModelInput(d.model || "gpt-4o-mini");
          }
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    DataService.getAuditLogs().then((logs) => {
      if (logs) setAuditLogs(logs);
    });
    loadAiConfig();
  }, []);

  const handleTestAi = async () => {
    setIsTestingAi(true);
    setAiTestResult(null);

    try {
      const res = await fetch("/api/ai/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: selectedAiProvider,
          apiKey: aiApiKeyInput || undefined,
          model: aiModelInput,
        }),
      });

      const data = await res.json();
      setAiTestResult(data);
      if (data.success) {
        loadAiConfig();
      }
    } catch (err: any) {
      setAiTestResult({
        success: false,
        error: "Erro na comunicação: " + err.message,
      });
    } finally {
      setIsTestingAi(false);
    }
  };

  const checkEvolutionConnection = async () => {
    setIsTestingEvolution(true);
    setEvolutionStatus("checking");
    setEvolutionMessage(null);

    try {
      const res = await fetch("/api/evolution/instances");
      const data = await res.json();

      if (data.success) {
        setEvolutionStatus("connected");
        const count = Array.isArray(data.instances) ? data.instances.length : 0;
        setEvolutionMessage(`Servidor Evolution API respondendo! ${count} instância(s) encontrada(s).`);
      } else {
        setEvolutionStatus("disconnected");
        setEvolutionMessage(data.error || "Servidor não respondeu adequadamente.");
      }
    } catch (err: any) {
      setEvolutionStatus("disconnected");
      setEvolutionMessage("Falha ao conectar: " + err.message);
    } finally {
      setIsTestingEvolution(false);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-[#0B0B0D] tracking-tight">
          Configurações & Auditoria
        </h1>
        <p className="text-xs md:text-sm text-[#64748B]">
          Gerencie os parâmetros de API, credenciais do sistema e consulte logs de rastreabilidade.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-5">
        {/* 1. Parâmetros da Evolution API (Limpo e Exclusivo) */}
        <Card className="bg-white border-[#E2E8F0] shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-bold text-[#0B0B0D] flex items-center gap-2">
                  <Settings className="h-4 w-4 text-[#FF6A00]" />
                  Parâmetros da Evolution API
                </CardTitle>
                <CardDescription className="text-xs text-[#64748B] mt-0.5">
                  Chaves de conexão e endpoint oficial do servidor.
                </CardDescription>
              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={checkEvolutionConnection}
                disabled={isTestingEvolution}
                className="text-xs border-[#E2E8F0] text-[#0B0B0D] hover:bg-[#F8FAFC]"
              >
                {isTestingEvolution ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin mr-1 text-[#FF6A00]" />
                ) : (
                  <RefreshCw className="h-3.5 w-3.5 mr-1 text-[#FF6A00]" />
                )}
                Testar Conexão
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3.5">
            {evolutionStatus && (
              <div
                className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
                  evolutionStatus === "connected"
                    ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                    : "bg-rose-50 border-rose-200 text-rose-800"
                }`}
              >
                {evolutionStatus === "connected" ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
                )}
                <span>{evolutionMessage || "Status verificado."}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-[#0B0B0D]">Endpoint Evolution API</label>
                <Input
                  value={evolutionUrl}
                  onChange={(e) => setEvolutionUrl(e.target.value)}
                  className="text-xs h-9 bg-[#F8FAFC] border-[#E2E8F0]"
                  placeholder="https://evolutionapi.vps10855.panel.icontainer.net"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-[#0B0B0D]">Nome da Instância</label>
                <Input
                  value={instanceName}
                  onChange={(e) => setInstanceName(e.target.value)}
                  className="text-xs h-9 bg-[#F8FAFC] border-[#E2E8F0]"
                  placeholder="naveprospect"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-[#0B0B0D]">API Key / Header Obrigatório (apikey)</label>
              <Input
                type="password"
                value={evolutionApiKey}
                onChange={(e) => setEvolutionApiKey(e.target.value)}
                placeholder="Insira a chave da Evolution API..."
                className="text-xs h-9 bg-[#F8FAFC] border-[#E2E8F0] font-mono"
              />
            </div>
          </CardContent>
        </Card>

        {/* 2. Parâmetros do Copiloto de IA (Google Gemini & OpenAI) */}
        <Card className="bg-white border-[#E2E8F0] shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-bold text-[#0B0B0D] flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-[#FF6A00]" />
                  Copiloto de IA & Provedor LLM (Google Gemini / OpenAI)
                </CardTitle>
                <CardDescription className="text-xs text-[#64748B] mt-0.5">
                  Motor de análise conversacional e sugestão de respostas comerciais (envio 100% humano).
                </CardDescription>
              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleTestAi}
                disabled={isTestingAi}
                className="text-xs border-orange-200 bg-orange-50/70 hover:bg-orange-100/90 text-orange-900 font-semibold"
              >
                {isTestingAi ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin mr-1 text-[#FF6A00]" />
                ) : (
                  <Bot className="h-3.5 w-3.5 mr-1 text-[#FF6A00]" />
                )}
                Testar Conexão IA
              </Button>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Status do Provedor Atual */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 text-xs">
              <div className="flex items-center gap-2.5">
                <div className={`h-2.5 w-2.5 rounded-full ${aiConfig?.configured ? "bg-emerald-500 animate-pulse" : "bg-amber-500"}`} />
                <div>
                  <div className="font-bold text-[#0B0B0D]">
                    {aiConfig?.provider === "gemini"
                      ? "Provedor Google Gemini Ativo"
                      : aiConfig?.provider === "openai"
                      ? "Provedor OpenAI Ativo"
                      : "Modo Heurístico Ativo (Regras Internas Navetech)"}
                  </div>
                  <div className="text-[11px] text-[#64748B]">
                    {aiConfig?.description || "Verificando configuração de inteligência artificial..."}
                  </div>
                </div>
              </div>

              {aiConfig?.maskedKey && (
                <div className="font-mono text-[11px] bg-white px-2.5 py-1 rounded-md border border-slate-200 text-slate-700">
                  Chave: {aiConfig.maskedKey} ({aiConfig.provider?.toUpperCase()})
                </div>
              )}
            </div>

            {/* Alternador de Provedor */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#0B0B0D]">Selecione o Provedor de IA:</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedAiProvider("gemini");
                    setAiModelInput("gemini-3.5-flash");
                  }}
                  className={`flex-1 py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                    selectedAiProvider === "gemini"
                      ? "bg-blue-50 border-blue-400 text-blue-900 shadow-xs"
                      : "bg-[#F8FAFC] border-[#E2E8F0] text-slate-600 hover:border-slate-300"
                  }`}
                >
                  <Sparkles className="h-4 w-4 text-blue-600" />
                  Google Gemini (Recomendado - Gratuito no AI Studio)
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedAiProvider("openai");
                    setAiModelInput("gpt-4o-mini");
                  }}
                  className={`flex-1 py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                    selectedAiProvider === "openai"
                      ? "bg-emerald-50 border-emerald-400 text-emerald-900 shadow-xs"
                      : "bg-[#F8FAFC] border-[#E2E8F0] text-slate-600 hover:border-slate-300"
                  }`}
                >
                  <Bot className="h-4 w-4 text-emerald-600" />
                  OpenAI (ChatGPT API)
                </button>
              </div>
            </div>

            {/* Resultado do Teste */}
            {aiTestResult && (
              <div
                className={`p-3.5 rounded-xl border text-xs space-y-1 ${
                  aiTestResult.success
                    ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                    : "bg-rose-50 border-rose-200 text-rose-900"
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold">
                  {aiTestResult.success ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
                  )}
                  <span>
                    {aiTestResult.success ? aiTestResult.message : "Falha na comunicação com a IA:"}
                  </span>
                  {aiTestResult.latencyMs && (
                    <span className="text-[10px] font-mono opacity-80">
                      ({aiTestResult.latencyMs}ms)
                    </span>
                  )}
                </div>
                {aiTestResult.error && (
                  <p className="text-[11px] pl-5.5 font-mono">{aiTestResult.error}</p>
                )}
              </div>
            )}

            {/* Inputs de Configuração */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2 space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-[#0B0B0D]">
                    {selectedAiProvider === "gemini"
                      ? "Chave de API Gemini (GEMINI_API_KEY)"
                      : "Chave de API OpenAI (OPENAI_API_KEY)"}
                  </label>
                  {selectedAiProvider === "gemini" && (
                    <a
                      href="https://aistudio.google.com/app/apikey"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-blue-600 hover:underline flex items-center gap-1 font-semibold"
                    >
                      Gerar chave no Google AI Studio
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
                <Input
                  type="password"
                  value={aiApiKeyInput}
                  onChange={(e) => setAiApiKeyInput(e.target.value)}
                  placeholder={
                    selectedAiProvider === "gemini"
                      ? (aiConfig?.geminiConfigured ? "Chave Gemini já configurada no servidor" : "AIzaSy...")
                      : (aiConfig?.openAiConfigured ? "Chave OpenAI já configurada no servidor" : "sk-proj-...")
                  }
                  className="text-xs h-9 bg-[#F8FAFC] border-[#E2E8F0] font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-[#0B0B0D]">Modelo</label>
                <select
                  value={aiModelInput}
                  onChange={(e) => setAiModelInput(e.target.value)}
                  className="w-full h-9 px-3 text-xs border border-[#E2E8F0] rounded-lg bg-[#F8FAFC] text-[#0B0B0D] focus:outline-[#FF6A00]"
                >
                  {selectedAiProvider === "gemini" ? (
                    <>
                      <option value="gemini-3.5-flash">gemini-3.5-flash (Recomendado - Ultra Rápido e Eficiente)</option>
                      <option value="gemini-2.5-flash">gemini-2.5-flash (Alta Performance)</option>
                      <option value="gemini-3.8-flash">gemini-3.8-flash (Raciocínio Expandido)</option>
                      <option value="gemini-1.5-flash">gemini-1.5-flash (Legado)</option>
                    </>
                  ) : (
                    <>
                      <option value="gpt-4o-mini">gpt-4o-mini (Recomendado)</option>
                      <option value="gpt-4o">gpt-4o (Alta Precisão)</option>
                      <option value="gpt-3.5-turbo">gpt-3.5-turbo (Legado)</option>
                    </>
                  )}
                </select>
              </div>
            </div>

            {/* Guia de Como Configurar na Vercel / Produção */}
            <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-3.5 text-xs text-blue-900 space-y-2">
              <div className="font-bold flex items-center gap-1.5 text-blue-950">
                <Key className="h-3.5 w-3.5 text-blue-600" />
                Como ativar o {selectedAiProvider === "gemini" ? "Google Gemini" : "OpenAI"} em Produção na Vercel:
              </div>
              <ol className="list-decimal pl-4 space-y-1 text-[11px] text-blue-800">
                <li>
                  Acesse o painel da Vercel:{" "}
                  <a
                    href="https://vercel.com/vendasdigital2011-5220s-projects/nave/settings/environment-variables"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-bold underline text-blue-700"
                  >
                    Vercel Project Settings &gt; Environment Variables
                  </a>
                </li>
                <li>
                  Adicione a variável de ambiente:
                  <ul className="list-disc pl-4 mt-1 font-mono text-[10px] space-y-0.5 text-blue-900">
                    {selectedAiProvider === "gemini" ? (
                      <>
                        <li><strong>Nome:</strong> GEMINI_API_KEY</li>
                        <li><strong>Valor:</strong> sua chave do Google AI Studio (iniciada em AIzaSy...)</li>
                      </>
                    ) : (
                      <>
                        <li><strong>Nome:</strong> OPENAI_API_KEY</li>
                        <li><strong>Valor:</strong> sua chave da OpenAI (iniciada em sk-...)</li>
                      </>
                    )}
                  </ul>
                </li>
                <li>
                  Clique em <strong>Save</strong>. O Copiloto IA no atendimento passa a responder imediatamente via {selectedAiProvider === "gemini" ? "Google Gemini" : "OpenAI"}!
                </li>
              </ol>
            </div>
          </CardContent>
        </Card>

        {/* 3. Rastreabilidade & Auditoria de Atendimentos (PRD-24) */}
        <Card className="bg-white border-[#E2E8F0] shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold text-[#0B0B0D] flex items-center gap-2">
              <History className="h-4 w-4 text-[#FF6A00]" />
              Auditoria de Ações & Operadores
            </CardTitle>
            <CardDescription className="text-xs text-[#64748B]">
              Histórico de alterações e atendimentos registrados pelos operadores.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {auditLogs.length > 0 ? (
              <div className="max-h-60 overflow-y-auto divide-y divide-[#E2E8F0] border border-[#E2E8F0] rounded-xl bg-[#F8FAFC]">
                {auditLogs.map((log) => (
                  <div key={log.id} className="p-3 text-xs flex items-center justify-between">
                    <div className="space-y-0.5">
                      <div className="font-bold text-[#0B0B0D] flex items-center gap-1.5">
                        <span className="text-[#FF6A00]">{log.operator_email}</span>
                        <span>•</span>
                        <span>{log.action}</span>
                      </div>
                      {log.target_client_name && (
                        <div className="text-[11px] text-[#64748B]">
                          Cliente: <strong>{log.target_client_name}</strong>
                        </div>
                      )}
                    </div>
                    <span className="text-[10px] text-[#94A3B8] font-mono shrink-0 ml-2">
                      {new Date(log.timestamp).toLocaleString("pt-BR")}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 text-center text-xs text-[#64748B] border border-dashed border-[#E2E8F0] rounded-xl bg-[#F8FAFC]">
                Nenhum log de auditoria registrado ainda nesta sessão.
              </div>
            )}
          </CardContent>
        </Card>

        {/* 3. Parâmetros da Campanha Comercial */}
        <Card className="bg-white border-[#E2E8F0] shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold text-[#0B0B0D] flex items-center gap-2">
              <Zap className="h-4 w-4 text-[#FF6A00]" />
              Parâmetros da Campanha
            </CardTitle>
            <CardDescription className="text-xs text-[#64748B]">
              Defina os planos de entrada e destino para novos clientes.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-[#0B0B0D]">Plano Origem (Atual)</label>
                <Input
                  value={campaignOrigin}
                  onChange={(e) => setCampaignOrigin(e.target.value)}
                  className="text-xs h-9 bg-[#F8FAFC] border-[#E2E8F0]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-[#0B0B0D]">Plano Destino (Upgrade)</label>
                <Input
                  value={campaignTarget}
                  onChange={(e) => setCampaignTarget(e.target.value)}
                  className="text-xs h-9 bg-[#F8FAFC] border-[#E2E8F0]"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 4. Segurança & Administrador */}
        <Card className="bg-white border-[#E2E8F0] shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold text-[#0B0B0D] flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-[#FF6A00]" />
              Credenciais Administrativas
            </CardTitle>
            <CardDescription className="text-xs text-[#64748B]">
              E-mail e senha de acesso ao painel.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-[#0B0B0D]">E-mail</label>
                <div className="relative">
                  <Mail className="absolute left-2.5 top-2.5 h-4 w-4 text-[#64748B]" />
                  <Input
                    type="email"
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    className="pl-9 text-xs h-9 bg-[#F8FAFC] border-[#E2E8F0]"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-[#0B0B0D]">Nova Senha (Opcional)</label>
                <div className="relative">
                  <Lock className="absolute left-2.5 top-2.5 h-4 w-4 text-[#64748B]" />
                  <Input
                    type="password"
                    placeholder="Deixe em branco para manter a atual"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    className="pl-9 text-xs h-9 bg-[#F8FAFC] border-[#E2E8F0]"
                  />
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="border-t border-[#E2E8F0] pt-4 flex justify-between items-center">
            {isSaved ? (
              <span className="inline-flex items-center gap-1 text-xs font-bold text-[#16A34A]">
                <CheckCircle2 className="h-4 w-4" /> Configurações salvas!
              </span>
            ) : (
              <span className="text-xs text-[#64748B]">
                Alterações aplicadas na sessão atual.
              </span>
            )}

            <Button type="submit" className="bg-[#FF6A00] hover:bg-[#E85C00] text-white text-xs font-bold h-9 px-4 rounded-xl">
              <Save className="mr-1.5 h-3.5 w-3.5" /> Salvar Configurações
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
