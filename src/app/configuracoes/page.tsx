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
  const [instanceName, setInstanceName] = useState("naveprospect");
  const [evolutionApiKey, setEvolutionApiKey] = useState("PMhtTHmZZyRRN4A7mi8m2FYHMEH6FYf8");
  const [campaignOrigin, setCampaignOrigin] = useState("50 Mega");
  const [campaignTarget, setCampaignTarget] = useState("100 Mega");
  const [isSaved, setIsSaved] = useState(false);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  // Evolution API Connection Test State
  const [isTestingEvolution, setIsTestingEvolution] = useState(false);
  const [evolutionStatus, setEvolutionStatus] = useState<"connected" | "disconnected" | "checking" | null>(null);
  const [evolutionMessage, setEvolutionMessage] = useState<string | null>(null);

  useEffect(() => {
    setAuditLogs(DataService.getAuditLogs());
  }, []);

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

        {/* 2. Rastreabilidade & Auditoria de Atendimentos (PRD-24) */}
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
