"use client";

import React, { useState } from "react";
import {
  Settings,
  ShieldCheck,
  Database,
  MessageSquare,
  Zap,
  Save,
  CheckCircle2,
  Lock,
  Mail,
  Server,
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
        <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
          <Settings className="h-6 w-6 text-blue-600" />
          Configurações do NaveProspect
        </h1>
        <p className="text-xs md:text-sm text-slate-500">
          Gerencie os parâmetros de segurança, integrações e dados da campanha comercial.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* 1. Integração WhatsApp Evolution API */}
        <Card className="bg-white border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-emerald-600" />
              Integração WhatsApp (Evolution API)
            </CardTitle>
            <CardDescription>
              Configure o endpoint da Evolution API para envio e recepção de mensagens.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Evolution API Endpoint</label>
                <Input
                  value={evolutionUrl}
                  onChange={(e) => setEvolutionUrl(e.target.value)}
                  className="text-xs h-9"
                  placeholder="https://evolution.vps10855.panel.icontainer.net"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Nome da Instância</label>
                <Input
                  value={instanceName}
                  onChange={(e) => setInstanceName(e.target.value)}
                  className="text-xs h-9"
                  placeholder="nave-upgrade-01"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">API Key / Token de Autenticação</label>
              <Input
                type="password"
                value={evolutionApiKey}
                onChange={(e) => setEvolutionApiKey(e.target.value)}
                placeholder="Insira a chave da Evolution API..."
                className="text-xs h-9"
              />
            </div>
          </CardContent>
        </Card>

        {/* 2. Parâmetros da Campanha Comercial */}
        <Card className="bg-white border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Zap className="h-5 w-5 text-blue-600" />
              Parâmetros da Campanha de Migração
            </CardTitle>
            <CardDescription>
              Defina os planos de entrada e destino para preenchimento padrão de novos clientes.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Plano Origem (Atual)</label>
                <Input
                  value={campaignOrigin}
                  onChange={(e) => setCampaignOrigin(e.target.value)}
                  className="text-xs h-9"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Plano Destino (Upgrade)</label>
                <Input
                  value={campaignTarget}
                  onChange={(e) => setCampaignTarget(e.target.value)}
                  className="text-xs h-9"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 3. Segurança & Administrador */}
        <Card className="bg-white border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-slate-800" />
              Credenciais Administrativas
            </CardTitle>
            <CardDescription>
              E-mail e senha utilizados para acesso ao painel do NaveProspect.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">E-mail do Administrador</label>
                <div className="relative">
                  <Mail className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                  <Input
                    type="email"
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    className="pl-9 text-xs h-9"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Nova Senha (Opcional)</label>
                <div className="relative">
                  <Lock className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                  <Input
                    type="password"
                    placeholder="Deixe em branco para manter a atual"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    className="pl-9 text-xs h-9"
                  />
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="border-t pt-4 flex justify-between items-center">
            {isSaved ? (
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600">
                <CheckCircle2 className="h-4 w-4" /> Configurações salvas com sucesso!
              </span>
            ) : (
              <span className="text-xs text-slate-400">
                As alterações serão aplicadas na sessão atual.
              </span>
            )}

            <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold">
              <Save className="mr-1.5 h-3.5 w-3.5" /> Salvar Configurações
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
