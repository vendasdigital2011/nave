"use client";

import React, { useState, useEffect } from "react";
import {
  User,
  Phone,
  MessageSquare,
  Star,
  UserCheck,
  TrendingUp,
  Save,
  Trash2,
  ExternalLink,
  Check,
} from "lucide-react";
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { DataService } from "@/lib/data-service";
import { formatPhone, getCleanPhoneForWhatsApp, getStatusBadgeInfo } from "@/lib/utils";
import { Client, ClientStatus } from "@/types/database";

interface ClientDetailsModalProps {
  client: Client | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onClientUpdated?: () => void;
  onClientDeleted?: () => void;
}

export function ClientDetailsModal({
  client,
  open,
  onOpenChange,
  onClientUpdated,
  onClientDeleted,
}: ClientDetailsModalProps) {
  const [formData, setFormData] = useState<Partial<Client>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (client) {
      setFormData({
        name: client.name,
        phone: client.phone,
        condominium: client.condominium || "",
        current_plan: client.current_plan,
        target_plan: client.target_plan,
        status: client.status,
        nps_score: client.nps_score,
        wants_upgrade: client.wants_upgrade,
        gave_referral: client.gave_referral,
        referral_name: client.referral_name || "",
        referral_phone: client.referral_phone || "",
        notes: client.notes || "",
      });
      setSavedSuccess(false);
    }
  }, [client]);

  if (!client) return null;

  const statusInfo = getStatusBadgeInfo(formData.status || client.status);
  const cleanPhone = getCleanPhoneForWhatsApp(formData.phone || client.phone);
  const whatsappUrl = `https://wa.me/${cleanPhone}?text=Ol%C3%A1%20${encodeURIComponent(
    formData.name || client.name
  )}%2C%20tudo%20bem%3F%20Aqui%20%C3%A9%20da%20equipe%20de%20atendimento%20da%20sua%20internet.%20Gostaria%20de%20apresentar%20uma%20oportunidade%20especial%20de%20upgrade%20para%20o%20plano%20de%20100%20Mega!`;

  const handleSave = async () => {
    if (!client) return;
    setIsSaving(true);
    try {
      await DataService.updateClient(client.id, formData);
      setSavedSuccess(true);
      if (onClientUpdated) onClientUpdated();
      setTimeout(() => {
        setSavedSuccess(false);
      }, 2000);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!client) return;
    if (confirm("Tem certeza que deseja excluir este cliente?")) {
      await DataService.deleteClient(client.id);
      onOpenChange(false);
      if (onClientDeleted) onClientDeleted();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogClose onClick={() => onOpenChange(false)} />
      <DialogHeader>
        <div className="flex items-center gap-2 mb-1">
          <Badge className={statusInfo.color}>
            {statusInfo.icon} {statusInfo.label}
          </Badge>
          <span className="text-xs text-muted-foreground">
            {client.current_plan} → <strong className="text-blue-600">{client.target_plan}</strong>
          </span>
        </div>
        <DialogTitle className="text-xl font-bold text-slate-900">
          {formData.name || client.name}
        </DialogTitle>
        <DialogDescription className="flex items-center gap-3 text-xs text-slate-500">
          <span>{formatPhone(formData.phone || client.phone)}</span>
          <span>•</span>
          <span>{formData.condominium || "Condomínio Geral"}</span>
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-5 py-2">
        {/* WhatsApp Quick Action Button */}
        <div className="flex gap-2">
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2.5 px-4 text-sm shadow-sm transition-all active:scale-[0.98]"
          >
            <MessageSquare className="h-4 w-4" />
            <span>Conversar no WhatsApp</span>
            <ExternalLink className="h-3.5 w-3.5 opacity-70" />
          </a>
        </div>

        {/* Status Selector */}
        <div className="rounded-lg border bg-slate-50 p-3 space-y-2">
          <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
            <TrendingUp className="h-3.5 w-3.5 text-blue-600" />
            Etapa no Funil de Vendas
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
            {(["frio", "morno", "quente", "vendido"] as ClientStatus[]).map((st) => {
              const info = getStatusBadgeInfo(st);
              const isSelected = formData.status === st;
              return (
                <button
                  key={st}
                  type="button"
                  onClick={() => setFormData({ ...formData, status: st })}
                  className={`flex items-center justify-center gap-1.5 p-2 rounded-md text-xs font-semibold border transition-all ${
                    isSelected
                      ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                      : "bg-white text-slate-700 hover:bg-slate-100 border-slate-200"
                  }`}
                >
                  <span>{info.icon}</span>
                  <span>{info.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* NPS Score Selector */}
        <div className="rounded-lg border bg-slate-50 p-3 space-y-2">
          <label className="text-xs font-semibold text-slate-700 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Star className="h-3.5 w-3.5 text-amber-500" />
              Avaliação de Satisfação (NPS do Cliente)
            </span>
            {formData.nps_score !== null && formData.nps_score !== undefined && (
              <span className="text-xs font-bold text-amber-600">
                Nota: {formData.nps_score} / 10
              </span>
            )}
          </label>
          <div className="grid grid-cols-11 gap-1">
            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((score) => {
              const isSelected = formData.nps_score === score;
              let btnClass = "bg-white text-slate-700 hover:bg-slate-100";
              if (isSelected) {
                if (score >= 9) btnClass = "bg-emerald-600 text-white border-emerald-600";
                else if (score >= 7) btnClass = "bg-amber-500 text-white border-amber-500";
                else btnClass = "bg-rose-500 text-white border-rose-500";
              }
              return (
                <button
                  key={score}
                  type="button"
                  onClick={() => setFormData({ ...formData, nps_score: score })}
                  className={`h-8 rounded border text-xs font-bold transition-all ${btnClass}`}
                >
                  {score}
                </button>
              );
            })}
          </div>
          <div className="flex justify-between text-[10px] text-slate-400 font-medium px-1">
            <span>0: Detrator</span>
            <span>7-8: Neutro</span>
            <span>9-10: Promotor</span>
          </div>
        </div>

        {/* Upgrade & Indicações */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Interesse em Upgrade */}
          <div className="rounded-lg border bg-white p-3 space-y-2">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={formData.wants_upgrade || false}
                onChange={(e) => setFormData({ ...formData, wants_upgrade: e.target.checked })}
                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-xs font-semibold text-slate-800">
                Interessado no Upgrade (100M)
              </span>
            </label>
            <p className="text-[11px] text-slate-500">
              Marque se o cliente demonstrou interesse real na migração de plano.
            </p>
          </div>

          {/* Indicação */}
          <div className="rounded-lg border bg-white p-3 space-y-2">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={formData.gave_referral || false}
                onChange={(e) => setFormData({ ...formData, gave_referral: e.target.checked })}
                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-xs font-semibold text-slate-800">
                Cliente Fez Indicação
              </span>
            </label>
            <p className="text-[11px] text-slate-500">
              O cliente indicou um vizinho ou amigo para instalação.
            </p>
          </div>
        </div>

        {/* Detalhes da Indicação se marcado */}
        {formData.gave_referral && (
          <div className="rounded-lg border border-blue-200 bg-blue-50/50 p-3 space-y-2 animate-in fade-in-50">
            <span className="text-xs font-semibold text-blue-900 flex items-center gap-1.5">
              <UserCheck className="h-3.5 w-3.5 text-blue-600" />
              Dados do Indicado
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <Input
                placeholder="Nome do indicado"
                value={formData.referral_name || ""}
                onChange={(e) => setFormData({ ...formData, referral_name: e.target.value })}
                className="bg-white text-xs h-8"
              />
              <Input
                placeholder="Telefone do indicado"
                value={formData.referral_phone || ""}
                onChange={(e) => setFormData({ ...formData, referral_phone: e.target.value })}
                className="bg-white text-xs h-8"
              />
            </div>
          </div>
        )}

        {/* Anotações e Feedbacks */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-700">
            Anotações do Atendimento / Histórico
          </label>
          <Textarea
            value={formData.notes || ""}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="Registre aqui o que o cliente respondeu, dúvidas de roteador, agendamento de visita..."
            rows={3}
            className="text-xs"
          />
        </div>
      </div>

      <DialogFooter className="justify-between sm:justify-between">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleDelete}
          className="text-xs text-rose-600 hover:bg-rose-50 hover:text-rose-700"
        >
          <Trash2 className="h-3.5 w-3.5 mr-1" />
          Excluir
        </Button>

        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={isSaving}
            className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1.5"
          >
            {savedSuccess ? (
              <>
                <Check className="h-3.5 w-3.5 text-white" />
                <span>Salvo!</span>
              </>
            ) : (
              <>
                <Save className="h-3.5 w-3.5" />
                <span>Salvar Alterações</span>
              </>
            )}
          </Button>
        </div>
      </DialogFooter>
    </Dialog>
  );
}
