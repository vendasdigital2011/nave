"use client";

import React, { useState, useEffect } from "react";
import {
  MessageSquare,
  QrCode,
  CheckCircle2,
  AlertCircle,
  Loader2,
  RefreshCw,
  Phone,
  Radio,
  ShieldCheck,
  Zap,
  ArrowRight,
  LogOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { EvolutionService } from "@/lib/evolution-api";
import Link from "next/link";

export default function WhatsAppPage() {
  const [currentUser, setCurrentUser] = useState("admin@navetech.com.br");
  const instanceName = EvolutionService.getInstanceNameForUser(currentUser);

  const [connectionState, setConnectionState] = useState<"open" | "close" | "connecting" | "unknown">("unknown");
  const [qrCodeBase64, setQrCodeBase64] = useState<string | null>(null);
  const [pairingCode, setPairingCode] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const checkStatus = async () => {
    setIsLoading(true);
    setStatusMessage(null);
    try {
      const res = await fetch(`/api/evolution/instances`);
      const data = await res.json();

      if (data.success && Array.isArray(data.instances)) {
        const myInstance = data.instances.find((i: any) => i.instanceName === instanceName);
        if (myInstance && (myInstance.status === "open" || myInstance.connectionStatus === "open")) {
          setConnectionState("open");
          setQrCodeBase64(null);
          setStatusMessage("Seu WhatsApp está conectado e pronto para atendimento!");
        } else {
          setConnectionState("close");
          setStatusMessage("WhatsApp desconectado. Clique abaixo para conectar.");
        }
      } else {
        setConnectionState("close");
      }
    } catch (err: any) {
      setConnectionState("close");
      setStatusMessage("Erro ao verificar conexão: " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnect = async () => {
    setIsLoading(true);
    setStatusMessage("Criando/Conectando sua instância...");
    setQrCodeBase64(null);
    setPairingCode(null);

    try {
      // 1. Garante que a instância existe
      await fetch("/api/evolution/instance/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ instanceName }),
      });

      // 2. Solicita QR Code
      const res = await fetch(`/api/evolution/instance/connect?instanceName=${encodeURIComponent(instanceName)}`);
      const data = await res.json();

      if (data.data?.base64) {
        setQrCodeBase64(data.data.base64);
        setConnectionState("connecting");
        setStatusMessage("Escaneie o QR Code com o aplicativo WhatsApp no seu celular.");
      } else if (data.data?.code) {
        setPairingCode(data.data.code);
        setConnectionState("connecting");
        setStatusMessage(`Código de pareamento: ${data.data.code}`);
      } else {
        checkStatus();
      }
    } catch (err: any) {
      setStatusMessage("Erro ao iniciar conexão: " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkStatus();
  }, []);

  // Polling quando estiver exibindo QR Code
  useEffect(() => {
    let interval: any;
    if (connectionState === "connecting") {
      interval = setInterval(() => {
        checkStatus();
      }, 5000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [connectionState]);

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-[#0B0B0D] tracking-tight">
            Meu WhatsApp (Evolution API)
          </h1>
          <p className="text-xs md:text-sm text-[#64748B]">
            Instância individual e exclusiva para seu atendimento humano de clientes.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={checkStatus}
          disabled={isLoading}
          className="text-xs border-[#E2E8F0] text-[#0B0B0D] hover:bg-[#F8FAFC]"
        >
          {isLoading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5 text-[#FF6A00]" />
          ) : (
            <RefreshCw className="h-3.5 w-3.5 mr-1.5 text-[#FF6A00]" />
          )}
          Atualizar Status
        </Button>
      </div>

      {/* Main Connection Card */}
      <Card className="bg-white border-[#E2E8F0] shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FFF4EC] text-[#FF6A00] border border-[#FFD0A8]">
                <MessageSquare className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-sm font-bold text-[#0B0B0D]">
                  Instância: {instanceName}
                </CardTitle>
                <CardDescription className="text-xs text-[#64748B]">
                  Vinculada ao operador: {currentUser}
                </CardDescription>
              </div>
            </div>

            {/* Connection Badge */}
            <div>
              {connectionState === "open" ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800 border border-emerald-200">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  Conectado
                </span>
              ) : connectionState === "connecting" ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-800 border border-amber-200">
                  <span className="h-2 w-2 rounded-full bg-amber-500 animate-ping" />
                  Aguardando Leitura
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#F1F5F9] px-3 py-1 text-xs font-bold text-[#64748B] border border-[#E2E8F0]">
                  <span className="h-2 w-2 rounded-full bg-[#94A3B8]" />
                  Desconectado
                </span>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Status Message */}
          {statusMessage && (
            <div
              className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
                connectionState === "open"
                  ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                  : connectionState === "connecting"
                  ? "bg-amber-50 border-amber-200 text-amber-800"
                  : "bg-[#F8FAFC] border-[#E2E8F0] text-[#64748B]"
              }`}
            >
              {connectionState === "open" ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
              )}
              <span>{statusMessage}</span>
            </div>
          )}

          {/* QR Code Container */}
          {qrCodeBase64 && connectionState === "connecting" && (
            <div className="flex flex-col items-center justify-center p-6 bg-[#F8FAFC] border border-[#FFD0A8] rounded-2xl text-center space-y-3">
              <span className="text-xs font-bold text-[#0B0B0D]">
                Aponte a câmera do WhatsApp para o QR Code:
              </span>
              <img
                src={qrCodeBase64}
                alt="QR Code WhatsApp"
                className="h-52 w-52 object-contain rounded-xl border border-[#E2E8F0] shadow-md bg-white p-2"
              />
              <div className="space-y-1 text-[11px] text-[#64748B] max-w-sm">
                <p>1. Abra o WhatsApp no celular</p>
                <p>2. Toque em <strong>Aparelhos Conectados</strong> &gt; <strong>Conectar Aparelho</strong></p>
                <p>3. Escaneie este código</p>
              </div>
            </div>
          )}

          {/* Connected state call to action */}
          {connectionState === "open" && (
            <div className="p-4 rounded-2xl bg-[#FFF7F1] border border-[#FFD0A8] flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-[#0B0B0D] block">
                  Pronto para Atender Clientes!
                </span>
                <span className="text-[11px] text-[#64748B]">
                  Abra a Central de Conversas para iniciar atendimentos individuais.
                </span>
              </div>

              <Link href="/conversas">
                <Button size="sm" className="bg-[#FF6A00] hover:bg-[#E85C00] text-white text-xs font-bold">
                  Ir para Conversas <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                </Button>
              </Link>
            </div>
          )}

          {/* Guidelines */}
          <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-3.5 space-y-2 text-xs text-[#64748B]">
            <span className="font-bold text-[#0B0B0D] flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-[#FF6A00]" />
              Diretrizes de Segurança e Privacidade
            </span>
            <ul className="list-disc list-inside space-y-1 text-[11px] pl-1">
              <li>Sua instância é exclusiva e não compartilha conversas com outros operadores.</li>
              <li>Todas as mensagens são enviadas como atendimento humano direto.</li>
              <li>Sem disparos em massa, sem bots e sem automações invasivas.</li>
            </ul>
          </div>
        </CardContent>

        <CardFooter className="border-t border-[#E2E8F0] pt-4 flex justify-between">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={checkStatus}
            disabled={isLoading}
            className="text-xs border-[#E2E8F0]"
          >
            Verificar Conexão
          </Button>

          {connectionState !== "open" ? (
            <Button
              type="button"
              size="sm"
              onClick={handleConnect}
              disabled={isLoading}
              className="bg-[#FF6A00] hover:bg-[#E85C00] text-white font-bold text-xs shadow-sm"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  Conectando...
                </>
              ) : (
                <>
                  <QrCode className="mr-1.5 h-3.5 w-3.5" />
                  Conectar Meu WhatsApp (QR Code)
                </>
              )}
            </Button>
          ) : (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleConnect}
              disabled={isLoading}
              className="text-xs text-rose-600 hover:bg-rose-50 border-rose-200"
            >
              Reconectar WhatsApp
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
