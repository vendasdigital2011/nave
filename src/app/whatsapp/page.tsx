"use client";

import React, { useState } from "react";
import {
  MessageSquare,
  QrCode,
  Smartphone,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Zap,
  ShieldCheck,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function WhatsAppPage() {
  const [status, setStatus] = useState<"disconnected" | "connecting" | "connected">("connected");
  const [instanceName, setInstanceName] = useState("upgrade-crm-instancia-01");
  const [apiUrl, setApiUrl] = useState("https://evolution.vps10855.panel.icontainer.net");
  const [apiKey, setApiKey] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  const handleConnect = () => {
    setIsGenerating(true);
    setStatus("connecting");
    setTimeout(() => {
      setIsGenerating(false);
      setStatus("connected");
    }, 2000);
  };

  const handleDisconnect = () => {
    setStatus("disconnected");
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
          <MessageSquare className="h-6 w-6 text-emerald-600" />
          Conexão WhatsApp (Evolution API / QR Code)
        </h1>
        <p className="text-xs md:text-sm text-slate-500">
          Conecte o número de WhatsApp do operador comercial para envio manual e direto de mensagens para os clientes.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Status Card & QR Code */}
        <Card className="md:col-span-2 bg-white border-slate-200 shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-bold text-slate-900">
                Status da Sessão do WhatsApp
              </CardTitle>
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${
                  status === "connected"
                    ? "bg-emerald-100 text-emerald-800"
                    : status === "connecting"
                    ? "bg-amber-100 text-amber-800"
                    : "bg-slate-100 text-slate-700"
                }`}
              >
                <span
                  className={`h-2 w-2 rounded-full ${
                    status === "connected"
                      ? "bg-emerald-500 animate-pulse"
                      : status === "connecting"
                      ? "bg-amber-500 animate-ping"
                      : "bg-slate-400"
                  }`}
                />
                {status === "connected"
                  ? "Conectado & Pronto"
                  : status === "connecting"
                  ? "Aguardando Leitura do QR Code"
                  : "Desconectado"}
              </span>
            </div>
            <CardDescription>
              Abra o WhatsApp no seu celular, vá em Aparelhos Conectados e escaneie o código abaixo.
            </CardDescription>
          </CardHeader>

          <CardContent className="flex flex-col items-center justify-center p-6 space-y-4">
            {status === "connected" ? (
              <div className="flex flex-col items-center text-center p-6 rounded-2xl bg-emerald-50 border border-emerald-200 max-w-md w-full">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 mb-3 shadow-inner">
                  <CheckCircle2 className="h-9 w-9" />
                </div>
                <h3 className="text-base font-bold text-emerald-900">WhatsApp Conectado com Sucesso!</h3>
                <p className="text-xs text-emerald-700 mt-1">
                  O operador pode iniciar conversas diretamente através dos botões de WhatsApp no Kanban e na Lista de Clientes.
                </p>
                <div className="mt-4 flex gap-2 w-full justify-center">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDisconnect}
                    className="text-xs text-rose-600 border-rose-200 hover:bg-rose-50"
                  >
                    Desconectar Sessão
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center text-center p-6 rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 max-w-sm w-full">
                {isGenerating ? (
                  <div className="py-12 flex flex-col items-center gap-3">
                    <RefreshCw className="h-8 w-8 text-blue-600 animate-spin" />
                    <span className="text-xs font-semibold text-slate-600">Gerando QR Code...</span>
                  </div>
                ) : (
                  <>
                    <div className="bg-white p-3 rounded-xl border shadow-sm mb-3">
                      {/* Simulação visual de QR Code SVG */}
                      <svg
                        className="h-44 w-44 text-slate-900"
                        viewBox="0 0 100 100"
                        fill="currentColor"
                      >
                        <rect width="100" height="100" fill="white" />
                        <path d="M0 0h30v30H0zM10 10h10v10H10zM70 0h30v30H70zM80 10h10v10H80zM0 70h30v30H0zM10 80h10v10H10zM40 0h10v20H40zM50 10h10v20H50zM0 40h20v10H0zM10 50h20v10H10zM40 40h20v20H40zM70 40h10v10H70zM90 40h10v20H90zM70 60h20v10H70zM40 70h10v30H40zM60 70h20v10H60zM80 80h20v20H80zM60 90h10v10H60z" />
                      </svg>
                    </div>
                    <span className="text-xs font-bold text-slate-800">
                      Escaneie com a câmera do WhatsApp
                    </span>
                    <span className="text-[11px] text-slate-400 mt-0.5">
                      Atualiza a cada 30 segundos
                    </span>
                    <Button
                      size="sm"
                      onClick={handleConnect}
                      className="mt-4 bg-emerald-600 hover:bg-emerald-700 text-white text-xs w-full"
                    >
                      Confirmar Conexão
                    </Button>
                  </>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Configuration Info */}
        <div className="space-y-4">
          <Card className="bg-white border-slate-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-blue-600" />
                Configurações da API
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-slate-600">Evolution API Endpoint</label>
                <Input
                  value={apiUrl}
                  onChange={(e) => setApiUrl(e.target.value)}
                  className="text-xs h-8"
                  placeholder="https://sua-api.com"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-600">Nome da Instância</label>
                <Input
                  value={instanceName}
                  onChange={(e) => setInstanceName(e.target.value)}
                  className="text-xs h-8"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-600">API Key / Token</label>
                <Input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Bearer token..."
                  className="text-xs h-8"
                />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-blue-50/50 border-blue-200">
            <CardContent className="p-4 space-y-2 text-xs text-blue-950">
              <div className="font-bold flex items-center gap-1.5">
                <Zap className="h-4 w-4 text-blue-600" />
                Operação Segura Anti-Bloqueio:
              </div>
              <p className="text-blue-900 leading-relaxed text-[11px]">
                O MVP não realiza disparos em massa automáticos. Todas as abordagens são manuais e iniciadas pelo operador através do WhatsApp Web / App, garantindo taxa de entrega de 100% e proteção do número.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
