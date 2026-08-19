"use client";

import React, { useState } from "react";
import {
  Settings,
  ShieldCheck,
  MessageSquare,
  Zap,
  Save,
  CheckCircle2,
  Lock,
  Mail,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function ConfiguracoesPage() {
  const [adminEmail, setAdminEmail] = useState("admin@navetech.com.br");
  const [adminPassword, setAdminPassword] = useState("");
  const [evolutionUrl, setEvolutionUrl] = useState("https://evolution.vps10855.panel.icontainer.net");
  const [instanceName, setInstanceName] = useState("nave-upgrade-01");
  const [evolutionApiKey, setEvolutionApiKey] = useState("");
  const [campaignOrigin, setCampaignOrigin] = useState("50 Mega");
  const [campaignTarget, setCampaignTarget] = useState("100 Mega");
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-[#0F172A] tracking-tight">
          Configurações
        </h1>
        <p className="text-xs md:text-sm text-[#64748B]">
          Gerencie os parâmetros de segurança, integrações e metas da campanha.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-5">
        {/* 1. Integração WhatsApp Evolution API */}
        <Card className="bg-white border-[#E2E8F0] shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-[#0F172A] flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-[#2563EB]" />
              Integração WhatsApp (Evolution API)
            </CardTitle>
            <CardDescription className="text-xs text-[#64748B]">
              Configure o endpoint da Evolution API para envio e recepção de mensagens.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-[#0F172A]">Evolution API Endpoint</label>
                <Input
                  value={evolutionUrl}
                  onChange={(e) => setEvolutionUrl(e.target.value)}
                  className="text-xs h-9 bg-[#F8FAFC] border-[#E2E8F0]"
                  placeholder="https://evolution.vps10855.panel.icontainer.net"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-[#0F172A]">Nome da Instância</label>
                <Input
                  value={instanceName}
                  onChange={(e) => setInstanceName(e.target.value)}
                  className="text-xs h-9 bg-[#F8FAFC] border-[#E2E8F0]"
                  placeholder="nave-upgrade-01"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-[#0F172A]">API Key / Token</label>
              <Input
                type="password"
                value={evolutionApiKey}
                onChange={(e) => setEvolutionApiKey(e.target.value)}
                placeholder="Insira a chave da Evolution API..."
                className="text-xs h-9 bg-[#F8FAFC] border-[#E2E8F0]"
              />
            </div>
          </CardContent>
        </Card>

        {/* 2. Parâmetros da Campanha Comercial */}
        <Card className="bg-white border-[#E2E8F0] shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-[#0F172A] flex items-center gap-2">
              <Zap className="h-4 w-4 text-[#2563EB]" />
              Parâmetros da Campanha
            </CardTitle>
            <CardDescription className="text-xs text-[#64748B]">
              Defina os planos de entrada e destino para novos clientes.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-[#0F172A]">Plano Origem (Atual)</label>
                <Input
                  value={campaignOrigin}
                  onChange={(e) => setCampaignOrigin(e.target.value)}
                  className="text-xs h-9 bg-[#F8FAFC] border-[#E2E8F0]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-[#0F172A]">Plano Destino (Upgrade)</label>
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
            <CardTitle className="text-sm font-semibold text-[#0F172A] flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-[#2563EB]" />
              Credenciais Administrativas
            </CardTitle>
            <CardDescription className="text-xs text-[#64748B]">
              E-mail e senha de acesso ao painel.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-[#0F172A]">E-mail</label>
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
                <label className="text-xs font-medium text-[#0F172A]">Nova Senha (Opcional)</label>
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
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#22C55E]">
                <CheckCircle2 className="h-4 w-4" /> Configurações salvas!
              </span>
            ) : (
              <span className="text-xs text-[#64748B]">
                Alterações aplicadas na sessão atual.
              </span>
            )}

            <Button type="submit" className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-medium h-9 px-4 rounded-lg">
              <Save className="mr-1.5 h-3.5 w-3.5" /> Salvar Configurações
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
