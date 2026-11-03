"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  MessageSquare,
  QrCode,
  CheckCircle2,
  AlertCircle,
  Loader2,
  RefreshCw,
  Send,
  User,
  Phone,
  ShieldCheck,
  Plus,
  PowerOff,
  Layers,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { formatPhone } from "@/lib/utils";

interface InstanceItem {
  id: string;
  provider_instance_name: string;
  owner_user_id?: string;
  display_phone_masked?: string;
  profile_name?: string;
  status: "open" | "close" | "connecting" | "disconnected";
  is_default: boolean;
  is_active: boolean;
  connected_at?: string;
  last_seen_at?: string;
  owner?: {
    id: string;
    display_name: string;
    role: string;
  };
}

export default function WhatsAppPage() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [myInstance, setMyInstance] = useState<InstanceItem | null>(null);
  const [isPersonal, setIsPersonal] = useState(false);
  const [teamInstances, setTeamInstances] = useState<InstanceItem[]>([]);
  const [activeTab, setActiveTab] = useState<"my" | "team">("my");

  const [qrCodeBase64, setQrCodeBase64] = useState<string | null>(null);
  const [pairingCode, setPairingCode] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Test Message State
  const [testNumber, setTestNumber] = useState("");
  const [testMessageText, setTestMessageText] = useState(
    "Teste de envio de mensagem via Evolution API - NaveProspect"
  );
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [testSendResult, setTestSendResult] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const loadUserData = async () => {
    try {
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.user) {
          setCurrentUser(data.user);
        }
      }
    } catch (err) {
      console.error("Erro ao carregar usuário:", err);
    }
  };

  const loadMyInstance = async () => {
    setIsLoading(true);
    setStatusMessage(null);
    try {
      const res = await fetch("/api/evolution/instance/my");
      const data = await res.json();
      if (data.success && data.instance) {
        setMyInstance(data.instance);
        setIsPersonal(data.is_personal || false);
        if (data.instance.status === "open") {
          setQrCodeBase64(null);
          setPairingCode(null);
        }
      } else {
        setStatusMessage(data.error || "Não foi possível identificar a instância.");
      }
    } catch (err: any) {
      setStatusMessage("Erro ao consultar instância: " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const loadTeamInstances = async () => {
    try {
      const res = await fetch("/api/evolution/instances");
      const data = await res.json();
      if (data.success && Array.isArray(data.db_instances)) {
        setTeamInstances(data.db_instances);
      }
    } catch (err) {
      console.error("Erro ao carregar instâncias da equipe:", err);
    }
  };

  useEffect(() => {
    loadUserData();
    loadMyInstance();
  }, []);

  useEffect(() => {
    if (currentUser?.role === "admin" || currentUser?.role === "supervisor") {
      loadTeamInstances();
    }
  }, [currentUser]);

  const handleCreatePersonalInstance = async () => {
    setIsCreating(true);
    setStatusMessage("Criando sua instância pessoal...");
    try {
      const res = await fetch("/api/evolution/instance/my", {
        method: "POST",
      });
      const data = await res.json();
      if (data.success && data.instance) {
        setMyInstance(data.instance);
        setIsPersonal(true);
        setStatusMessage("Instância criada! Clique em 'Conectar via QR Code' para parear.");
        await handleConnect(data.instance.provider_instance_name);
      } else {
        alert(`Erro: ${data.error || "Não foi possível criar a instância."}`);
      }
    } catch (err: any) {
      alert(`Falha na requisição: ${err.message}`);
    } finally {
      setIsCreating(false);
    }
  };

  const handleConnect = async (targetName?: string) => {
    setIsLoading(true);
    setStatusMessage("Gerando QR Code de pareamento...");
    setQrCodeBase64(null);
    setPairingCode(null);

    const nameToConnect = targetName || myInstance?.provider_instance_name || "nave";

    try {
      const res = await fetch(
        `/api/evolution/instance/connect?instanceName=${encodeURIComponent(nameToConnect)}`
      );
      const data = await res.json();

      if (data.already_connected) {
        setStatusMessage(data.message);
        loadMyInstance();
        return;
      }

      if (data.data?.base64) {
        setQrCodeBase64(data.data.base64);
        setStatusMessage("Escaneie o QR Code abaixo no seu aplicativo do WhatsApp.");
      } else if (data.data?.code) {
        setPairingCode(data.data.code);
        setStatusMessage(`Código de pareamento: ${data.data.code}`);
      } else {
        loadMyInstance();
      }
    } catch (err: any) {
      setStatusMessage("Erro ao iniciar conexão: " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnect = async () => {
    if (!myInstance || myInstance.provider_instance_name === "nave") {
      alert("A instância corporativa principal 'nave' não pode ser desconectada.");
      return;
    }

    if (!confirm(`Deseja realmente desconectar a instância ${myInstance.provider_instance_name}?`)) {
      return;
    }

    setIsDisconnecting(true);
    try {
      const res = await fetch("/api/evolution/instance/disconnect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ instanceName: myInstance.provider_instance_name }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setStatusMessage("Instância desconectada com sucesso.");
        setQrCodeBase64(null);
        await loadMyInstance();
      } else {
        alert(`Erro: ${data.error || "Falha ao desconectar."}`);
      }
    } catch (err: any) {
      alert(`Erro: ${err.message}`);
    } finally {
      setIsDisconnecting(false);
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
          instanceName: myInstance?.provider_instance_name,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setTestSendResult({
          type: "success",
          text: "Mensagem de teste enviada com sucesso! (Status 201)",
        });
      } else {
        setTestSendResult({
          type: "error",
          text: "Erro ao enviar mensagem: " + (data.error || "Verifique a conexão"),
        });
      }
    } catch (err: any) {
      setTestSendResult({
        type: "error",
        text: "Falha de rede: " + err.message,
      });
    } finally {
      setIsSendingTest(false);
    }
  };

  const isAdminOrSupervisor =
    currentUser?.role === "admin" || currentUser?.role === "supervisor";

  return (
    <div className="flex-1 space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-[#E2E8F0] pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0]">
              <QrCode className="h-5 w-5" />
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-[#0F172A]">
              Meu WhatsApp & Instâncias
            </h1>
          </div>
          <p className="mt-1 text-xs text-[#64748B]">
            Gerenciamento individual de conexão WhatsApp via Evolution API com preservação de canal.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              loadMyInstance();
              if (isAdminOrSupervisor) loadTeamInstances();
            }}
            disabled={isLoading}
            className="border-[#E2E8F0] text-xs font-medium hover:bg-[#F8FAFC]"
          >
            <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${isLoading ? "animate-spin" : ""}`} />
            Atualizar Status
          </Button>
        </div>
      </div>

      {/* Navegação por Abas (para Admin/Supervisor) */}
      {isAdminOrSupervisor && (
        <div className="flex items-center gap-2 border-b border-[#E2E8F0]">
          <button
            onClick={() => setActiveTab("my")}
            className={`flex items-center gap-2 pb-3 px-1 text-sm font-semibold border-b-2 transition-colors ${
              activeTab === "my"
                ? "border-[#FF6A00] text-[#FF6A00]"
                : "border-transparent text-[#64748B] hover:text-[#0F172A]"
            }`}
          >
            <QrCode className="h-4 w-4" />
            Meu WhatsApp Conectado
          </button>

          <button
            onClick={() => setActiveTab("team")}
            className={`flex items-center gap-2 pb-3 px-1 text-sm font-semibold border-b-2 transition-colors ${
              activeTab === "team"
                ? "border-[#FF6A00] text-[#FF6A00]"
                : "border-transparent text-[#64748B] hover:text-[#0F172A]"
            }`}
          >
            <Users className="h-4 w-4" />
            Instâncias da Equipe ({teamInstances.length})
          </button>
        </div>
      )}

      {/* ABA 1: MEU WHATSAPP */}
      {activeTab === "my" && (
        <div className="grid gap-6 md:grid-cols-2">
          {/* Card: Status da Conexão */}
          <Card className="border border-[#E2E8F0] shadow-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-bold text-[#0F172A]">
                  Status da Conexão
                </CardTitle>
                {myInstance?.status === "open" ? (
                  <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">
                    <CheckCircle2 className="h-3 w-3 mr-1 text-emerald-600" />
                    Conectado
                  </Badge>
                ) : myInstance?.status === "connecting" || qrCodeBase64 ? (
                  <Badge className="bg-amber-100 text-amber-800 border-amber-200">
                    <Loader2 className="h-3 w-3 mr-1 animate-spin text-amber-600" />
                    Aguardando Leitura
                  </Badge>
                ) : (
                  <Badge className="bg-red-100 text-red-800 border-red-200">
                    <AlertCircle className="h-3 w-3 mr-1 text-red-600" />
                    Desconectado
                  </Badge>
                )}
              </div>
              <CardDescription className="text-xs text-[#64748B]">
                Instância: <strong className="text-[#0F172A]">{myInstance?.provider_instance_name || "nave"}</strong>
                {myInstance?.is_default && (
                  <span className="ml-2 rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700 border border-blue-200">
                    🛡️ Canal Corporativo Padrão
                  </span>
                )}
                {isPersonal && (
                  <span className="ml-2 rounded-full bg-purple-50 px-2 py-0.5 text-[10px] font-bold text-purple-700 border border-purple-200">
                    👤 Instância Pessoal
                  </span>
                )}
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Informações da Instância */}
              <div className="rounded-xl border border-[#E2E8F0] bg-slate-50/50 p-3.5 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-[#64748B]">Identificador:</span>
                  <span className="font-mono font-bold text-[#0F172A]">{myInstance?.provider_instance_name || "nave"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#64748B]">Perfil / Titular:</span>
                  <span className="font-semibold text-[#0F172A]">
                    {myInstance?.profile_name || "Navetech Telecom"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#64748B]">Telefone Conectado:</span>
                  <span className="font-mono text-[#0F172A]">
                    {myInstance?.display_phone_masked || "+55 77 9****-0295"}
                  </span>
                </div>
              </div>

              {/* Mensagem de Estado */}
              {statusMessage && (
                <div className="rounded-lg bg-slate-100 p-3 text-xs text-[#334155] border border-slate-200">
                  {statusMessage}
                </div>
              )}

              {/* QR Code de Conexão */}
              {qrCodeBase64 && (
                <div className="flex flex-col items-center justify-center p-4 border border-[#FFD0A8] rounded-xl bg-[#FFFBF8]">
                  <p className="text-xs font-bold text-[#FF6A00] mb-3">
                    Abra o WhatsApp &gt; Aparelhos conectados &gt; Conectar aparelho
                  </p>
                  <img
                    src={qrCodeBase64}
                    alt="QR Code WhatsApp"
                    className="w-56 h-56 rounded-lg shadow-sm border border-[#E2E8F0] bg-white p-2"
                  />
                  <p className="text-[11px] text-[#64748B] mt-3">
                    O QR Code expira automaticamente em alguns segundos.
                  </p>
                </div>
              )}

              {pairingCode && (
                <div className="flex flex-col items-center justify-center p-4 border border-blue-200 rounded-xl bg-blue-50">
                  <p className="text-xs text-blue-700 mb-1">Código de Pareamento:</p>
                  <span className="text-xl font-mono font-bold text-blue-900 tracking-widest">
                    {pairingCode}
                  </span>
                </div>
              )}
            </CardContent>

            <CardFooter className="flex flex-wrap gap-2 justify-between border-t border-[#E2E8F0] pt-4">
              {myInstance?.status !== "open" ? (
                <Button
                  onClick={() => handleConnect()}
                  disabled={isLoading}
                  className="bg-[#059669] hover:bg-[#047857] text-white text-xs"
                >
                  <QrCode className="h-3.5 w-3.5 mr-1.5" />
                  Conectar via QR Code
                </Button>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-emerald-700">
                    Sessão ativa e protegida
                  </span>
                </div>
              )}

              {/* Ações para instâncias pessoais */}
              {isPersonal && myInstance?.status === "open" && (
                <Button
                  variant="outline"
                  onClick={handleDisconnect}
                  disabled={isDisconnecting}
                  className="border-red-200 text-red-600 hover:bg-red-50 text-xs"
                >
                  <PowerOff className="h-3.5 w-3.5 mr-1" />
                  Desconectar
                </Button>
              )}

              {/* Botão de provisionamento pessoal se estiver usando corporativo */}
              {!isPersonal && (
                <Button
                  variant="outline"
                  onClick={handleCreatePersonalInstance}
                  disabled={isCreating}
                  className="text-xs border-[#E2E8F0] hover:bg-slate-50"
                  title="Conectar seu próprio número do WhatsApp individual"
                >
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  Criar Instância Própria
                </Button>
              )}
            </CardFooter>
          </Card>

          {/* Card: Teste Manual de Mensagem */}
          <Card className="border border-[#E2E8F0] shadow-sm">
            <CardHeader>
              <CardTitle className="text-base font-bold text-[#0F172A]">
                Teste de Envio Manual
              </CardTitle>
              <CardDescription className="text-xs text-[#64748B]">
                Envie uma mensagem de teste para validar a entrega pela instância ativa.
              </CardDescription>
            </CardHeader>

            <form onSubmit={handleSendTestMessage}>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-[#0F172A]">
                    Telefone com DDD (apenas números)
                  </label>
                  <Input
                    type="text"
                    placeholder="Ex: 77999998888"
                    value={testNumber}
                    onChange={(e) => setTestNumber(e.target.value)}
                    className="mt-1 text-xs"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#0F172A]">
                    Texto da Mensagem
                  </label>
                  <textarea
                    rows={3}
                    value={testMessageText}
                    onChange={(e) => setTestMessageText(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-[#E2E8F0] bg-white p-2.5 text-xs outline-none focus:border-[#FF6A00]"
                    required
                  />
                </div>

                {testSendResult && (
                  <div
                    className={`rounded-lg p-3 text-xs border ${
                      testSendResult.type === "success"
                        ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                        : "bg-red-50 text-red-800 border-red-200"
                    }`}
                  >
                    {testSendResult.text}
                  </div>
                )}
              </CardContent>

              <CardFooter className="border-t border-[#E2E8F0] pt-4">
                <Button
                  type="submit"
                  disabled={isSendingTest || !testNumber}
                  className="bg-[#0F172A] hover:bg-[#1E293B] text-white text-xs"
                >
                  {isSendingTest ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Send className="h-3.5 w-3.5 mr-1.5" />
                      Enviar Mensagem de Teste
                    </>
                  )}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </div>
      )}

      {/* ABA 2: INSTÂNCIAS DA EQUIPE (Apenas Admin/Supervisor) */}
      {isAdminOrSupervisor && activeTab === "team" && (
        <Card className="border border-[#E2E8F0] shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-bold text-[#0F172A]">
              Instâncias de WhatsApp da Equipe
            </CardTitle>
            <CardDescription className="text-xs text-[#64748B]">
              Visão consolidada de todas as linhas conectadas. Tokens e credenciais nunca são expostos.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {teamInstances.length === 0 ? (
              <p className="text-xs text-[#64748B] py-6 text-center">
                Nenhuma instância cadastrada além da padrão corporativa.
              </p>
            ) : (
              <div className="divide-y divide-[#E2E8F0]">
                {teamInstances.map((inst) => (
                  <div
                    key={inst.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between py-3.5 gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-sm text-[#0F172A]">
                          {inst.provider_instance_name}
                        </h4>
                        {inst.is_default && (
                          <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700 border border-blue-200">
                            🛡️ Corporativo Padrão
                          </span>
                        )}
                        <Badge
                          className={`text-[10px] ${
                            inst.status === "open"
                              ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                              : "bg-red-100 text-red-800 border-red-200"
                          }`}
                        >
                          {inst.status === "open" ? "Conectado" : "Desconectado"}
                        </Badge>
                      </div>

                      <p className="text-xs text-[#64748B] mt-1">
                        Titular: <strong>{inst.profile_name || "Navetech"}</strong> •{" "}
                        Telefone: <span className="font-mono">{inst.display_phone_masked || "Não informado"}</span>
                        {inst.owner && (
                          <span> • Operador: {inst.owner.display_name} ({inst.owner.role})</span>
                        )}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-[#94A3B8]">
                        {inst.last_seen_at
                          ? `Visto em: ${new Date(inst.last_seen_at).toLocaleDateString("pt-BR")}`
                          : "Recém criada"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
