"use client";

import React, { useState, useEffect } from "react";
import {
  Settings,
  ShieldCheck,
  MessageSquare,
  Zap,
  Save,
  CheckCircle2,
  Lock,
  Mail,
  RefreshCw,
  QrCode,
  Send,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function ConfiguracoesPage() {
  const [adminEmail, setAdminEmail] = useState("admin@navetech.com.br");
  const [adminPassword, setAdminPassword] = useState("");
  const [evolutionUrl, setEvolutionUrl] = useState("http://evolutionapi.vps10855.panel.icontainer.net");
  const [instanceName, setInstanceName] = useState("naveprospect");
  const [evolutionApiKey, setEvolutionApiKey] = useState("PMhtTHmZZyRRN4A7mi8m2FYHMEH6FYf8");
  const [campaignOrigin, setCampaignOrigin] = useState("50 Mega");
  const [campaignTarget, setCampaignTarget] = useState("100 Mega");
  const [isSaved, setIsSaved] = useState(false);

  // Evolution API Test State
  const [isTestingEvolution, setIsTestingEvolution] = useState(false);
  const [evolutionStatus, setEvolutionStatus] = useState<"connected" | "disconnected" | "checking" | null>(null);
  const [evolutionMessage, setEvolutionMessage] = useState<string | null>(null);
  const [qrCodeBase64, setQrCodeBase64] = useState<string | null>(null);

  // Test Message State
  const [testNumber, setTestNumber] = useState("");
  const [testMessageText, setTestMessageText] = useState("Teste de mensagem via Evolution API - NaveProspect");
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [testSendResult, setTestSendResult] = useState<string | null>(null);

  const checkEvolutionConnection = async () => {
    setIsTestingEvolution(true);
    setEvolutionStatus("checking");
    setEvolutionMessage(null);
    setQrCodeBase64(null);

    try {
      const res = await fetch("/api/evolution/instances");
      const data = await res.json();

      if (data.success) {
        setEvolutionStatus("connected");
        const count = Array.isArray(data.instances) ? data.instances.length : 0;
        setEvolutionMessage(`Conexão OK! ${count} instância(s) encontrada(s) no servidor.`);
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

  const handleCreateOrConnectInstance = async () => {
    setIsTestingEvolution(true);
    try {
      // 1. Tenta criar a instância
      await fetch("/api/evolution/instance/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ instanceName }),
      });

      // 2. Solicita QR Code de conexão
      const resConnect = await fetch(`/api/evolution/instance/connect?instanceName=${encodeURIComponent(instanceName)}`);
      const dataConnect = await resConnect.json();

      if (dataConnect.data?.base64) {
        setQrCodeBase64(dataConnect.data.base64);
        setEvolutionMessage("Escaneie o QR Code no seu WhatsApp para conectar.");
      } else if (dataConnect.data?.code) {
        setEvolutionMessage(`Código de pareamento: ${dataConnect.data.code}`);
      } else {
        setEvolutionMessage("Instância já conectada ou pronta para uso!");
      }
      setEvolutionStatus("connected");
    } catch (err: any) {
      setEvolutionMessage("Erro ao gerar QR Code: " + err.message);
    } finally {
      setIsTestingEvolution(false);
    }
  };

  const handleSendTestMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testNumber) return;

    setIsSendingTest(true);
    setTestSendResult(null);

    try {
      const res = await fetch("/api/evolution/message/sendText", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          number: testNumber,
          text: testMessageText,
          instanceName,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setTestSendResult("Mensagem enviada com sucesso!");
      } else {
        setTestSendResult("Erro: " + (data.error || "Falha ao enviar mensagem"));
      }
    } catch (err: any) {
      setTestSendResult("Erro de conexão: " + err.message);
    } finally {
      setIsSendingTest(false);
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
          Configurações
        </h1>
        <p className="text-xs md:text-sm text-[#64748B]">
          Gerencie os parâmetros de segurança, integração WhatsApp (Evolution API) e metas da campanha.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-5">
        {/* 1. Integração WhatsApp Evolution API */}
        <Card className="bg-white border-[#E2E8F0] shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-bold text-[#0B0B0D] flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-[#FF6A00]" />
                  Integração WhatsApp (Evolution API)
                </CardTitle>
                <CardDescription className="text-xs text-[#64748B] mt-0.5">
                  Conexão direta com o servidor de mensagens WhatsApp da Navetech.
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
            {/* Status Feedback */}
            {evolutionStatus && (
              <div
                className={`p-3 rounded-xl border text-xs flex items-center justify-between ${
                  evolutionStatus === "connected"
                    ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                    : "bg-rose-50 border-rose-200 text-rose-800"
                }`}
              >
                <div className="flex items-center gap-2">
                  {evolutionStatus === "connected" ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
                  )}
                  <span>{evolutionMessage || "Status verificado."}</span>
                </div>

                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={handleCreateOrConnectInstance}
                  className="text-[11px] h-7 bg-white border-emerald-300 text-emerald-900"
                >
                  <QrCode className="h-3 w-3 mr-1" />
                  Conectar WhatsApp (QR Code)
                </Button>
              </div>
            )}

            {/* QR Code se solicitado */}
            {qrCodeBase64 && (
              <div className="flex flex-col items-center justify-center p-4 bg-[#F8FAFC] border border-[#FFD0A8] rounded-xl text-center space-y-2">
                <span className="text-xs font-bold text-[#0B0B0D]">Escaneie com seu WhatsApp:</span>
                <img
                  src={qrCodeBase64}
                  alt="QR Code WhatsApp"
                  className="h-48 w-48 object-contain rounded-lg border border-[#E2E8F0] shadow-sm"
                />
                <p className="text-[11px] text-[#64748B]">WhatsApp &gt; Aparelhos Conectados &gt; Conectar Aparelho</p>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-[#0B0B0D]">Evolution API Endpoint</label>
                <Input
                  value={evolutionUrl}
                  onChange={(e) => setEvolutionUrl(e.target.value)}
                  className="text-xs h-9 bg-[#F8FAFC] border-[#E2E8F0]"
                  placeholder="http://evolutionapi.vps10855.panel.icontainer.net"
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

            {/* Test Send Box */}
            <div className="border-t border-[#E2E8F0] pt-3 space-y-2">
              <label className="text-xs font-bold text-[#0B0B0D] block">
                Disparo de Teste (WhatsApp)
              </label>
              <div className="flex gap-2">
                <Input
                  placeholder="DDD + Telefone (ex: 77999998888)"
                  value={testNumber}
                  onChange={(e) => setTestNumber(e.target.value)}
                  className="text-xs h-8 bg-[#F8FAFC] border-[#E2E8F0] flex-1 font-mono"
                />
                <Button
                  type="button"
                  size="sm"
                  onClick={handleSendTestMessage}
                  disabled={isSendingTest || !testNumber}
                  className="bg-[#FF6A00] hover:bg-[#E85C00] text-white text-xs font-bold h-8 px-3"
                >
                  {isSendingTest ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <span className="flex items-center gap-1">
                      <Send className="h-3 w-3" /> Enviar Teste
                    </span>
                  )}
                </Button>
              </div>

              {testSendResult && (
                <div
                  className={`text-[11px] p-2 rounded-lg ${
                    testSendResult.includes("sucesso")
                      ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                      : "bg-rose-50 text-rose-800 border border-rose-200"
                  }`}
                >
                  {testSendResult}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 2. Parâmetros da Campanha Comercial */}
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

        {/* 3. Segurança & Administrador */}
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
