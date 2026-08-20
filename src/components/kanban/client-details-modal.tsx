"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  MessageSquare,
  Star,
  Zap,
  UserCheck,
  Trash2,
  Save,
} from "lucide-react";
import { DataService } from "@/lib/data-service";
import { formatPhone, getStatusBadgeInfo } from "@/lib/utils";
import { Client, ClientStatus } from "@/types/database";

interface ClientDetailsModalProps {
  client: Client | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onClientUpdated: () => void;
  onClientDeleted: () => void;
}

const STATUS_OPTIONS: { value: ClientStatus; label: string }[] = [
  { value: "importados", label: "📥 Importados" },
  { value: "frio", label: "📩 Contato Iniciado" },
  { value: "morno", label: "💬 Em Conversa" },
  { value: "quente", label: "🔥 Interessado" },
  { value: "vendido", label: "🏆 Fechado" },
  { value: "desativado", label: "🚫 Não Interessado" },
];

export function ClientDetailsModal({
  client,
  open,
  onOpenChange,
  onClientUpdated,
  onClientDeleted,
}: ClientDetailsModalProps) {
  const [formData, setFormData] = useState<Partial<Client>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (client) {
      setFormData({
        name: client.name,
        phone: client.phone,
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
      setShowDeleteConfirm(false);
    }
  }, [client]);

  if (!client) return null;

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await DataService.updateClient(client.id, formData);
      onClientUpdated();
      onOpenChange(false);
    } catch (error) {
      console.error("Erro ao salvar cliente:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await DataService.deleteClient(client.id);
      onClientDeleted();
      onOpenChange(false);
    } catch (error) {
      console.error("Erro ao excluir cliente:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto bg-white border-[#E2E8F0] p-6 text-[#0B0B0D] rounded-2xl">
        <DialogHeader className="border-b border-[#E2E8F0] pb-4">
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle className="text-lg font-bold text-[#0B0B0D]">
                {formData.name}
              </DialogTitle>
              <div className="flex items-center gap-2 mt-1 text-xs text-[#64748B]">
                <span className="font-mono">{formatPhone(formData.phone || "")}</span>
              </div>
            </div>
            <Badge className={formData.status === "quente" ? "bg-[#FFF4EC] text-[#FF6A00] border-[#FFD0A8]" : getStatusBadgeInfo(formData.status || "frio").color}>
              {getStatusBadgeInfo(formData.status || "frio").label}
            </Badge>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-3 text-xs">
          {/* Chat Interno Direct Action */}
          <div className="flex items-center justify-between rounded-xl border border-[#FFD0A8] bg-[#FFF7F1] p-3">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-[#FF6A00]" />
              <div>
                <span className="font-bold text-[#0B0B0D]">Chat Interno Evolution API</span>
                <p className="text-[11px] text-[#64748B]">Abra a conversa diretamente na plataforma.</p>
              </div>
            </div>
            <Link
              href={`/conversas?clientId=${client.id}`}
              onClick={() => onOpenChange(false)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#FF6A00] hover:bg-[#E85C00] px-3.5 py-1.5 text-xs font-bold text-white shadow-sm transition-all"
            >
              <span>Abrir Conversa</span>
            </Link>
          </div>

          {/* Status e Planos */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-bold text-[#0B0B0D]">Status no Funil Comercial</label>
              <select
                value={formData.status}
                onChange={(e) =>
                  setFormData({ ...formData, status: e.target.value as ClientStatus })
                }
                className="w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-2 text-xs focus:outline-none focus:ring-1 focus:ring-[#FF6A00]"
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-[#0B0B0D]">Migração de Plano</label>
              <div className="flex items-center gap-2">
                <Input
                  value={formData.current_plan || "50 Mega"}
                  onChange={(e) =>
                    setFormData({ ...formData, current_plan: e.target.value })
                  }
                  placeholder="50 Mega"
                  className="h-8 text-xs bg-[#F8FAFC] border-[#E2E8F0]"
                />
                <span className="text-[#FF6A00] font-bold">→</span>
                <Input
                  value={formData.target_plan || "100 Mega"}
                  onChange={(e) =>
                    setFormData({ ...formData, target_plan: e.target.value })
                  }
                  placeholder="100 Mega"
                  className="h-8 text-xs bg-[#F8FAFC] border-[#E2E8F0]"
                />
              </div>
            </div>
          </div>

          {/* NPS Rating */}
          <div className="space-y-1.5 border-t border-[#E2E8F0] pt-3">
            <label className="font-bold text-[#0B0B0D] flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Star className="h-4 w-4 text-[#F59E0B]" />
                Avaliação de Satisfação (NPS: 0 a 10)
              </span>
              {formData.nps_score !== null && formData.nps_score !== undefined && (
                <span className="font-bold text-[#FF6A00]">Nota: {formData.nps_score}</span>
              )}
            </label>
            <div className="flex items-center gap-1">
              {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((score) => (
                <button
                  key={score}
                  type="button"
                  onClick={() =>
                    setFormData({
                      ...formData,
                      nps_score: formData.nps_score === score ? null : score,
                    })
                  }
                  className={`flex-1 h-7 rounded-lg text-xs font-bold border transition-all ${
                    formData.nps_score === score
                      ? score >= 9
                        ? "bg-[#22C55E] text-white border-[#22C55E]"
                        : score >= 7
                        ? "bg-[#F59E0B] text-white border-[#F59E0B]"
                        : "bg-[#EF4444] text-white border-[#EF4444]"
                      : "bg-[#F8FAFC] text-[#64748B] hover:bg-[#FFF4EC] border-[#E2E8F0]"
                  }`}
                >
                  {score}
                </button>
              ))}
            </div>
          </div>

          {/* Checkboxes de Interesse e Indicação */}
          <div className="grid grid-cols-2 gap-3 border-t border-[#E2E8F0] pt-3">
            <label className="flex items-center gap-2 p-2.5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] cursor-pointer hover:border-[#FFD0A8]">
              <input
                type="checkbox"
                checked={formData.wants_upgrade || false}
                onChange={(e) =>
                  setFormData({ ...formData, wants_upgrade: e.target.checked })
                }
                className="rounded border-[#CBD5E1] text-[#FF6A00] focus:ring-[#FF6A00]"
              />
              <span className="font-bold text-[#0B0B0D] flex items-center gap-1">
                <Zap className="h-3.5 w-3.5 text-[#FF6A00]" />
                Interesse no Upgrade
              </span>
            </label>

            <label className="flex items-center gap-2 p-2.5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] cursor-pointer hover:border-[#FFD0A8]">
              <input
                type="checkbox"
                checked={formData.gave_referral || false}
                onChange={(e) =>
                  setFormData({ ...formData, gave_referral: e.target.checked })
                }
                className="rounded border-[#CBD5E1] text-[#FF6A00] focus:ring-[#FF6A00]"
              />
              <span className="font-bold text-[#0B0B0D] flex items-center gap-1">
                <UserCheck className="h-3.5 w-3.5 text-[#7E22CE]" />
                Indique e Ganhe
              </span>
            </label>
          </div>

          {/* Dados do Indicado */}
          {formData.gave_referral && (
            <div className="space-y-2 rounded-xl border border-[#FFD0A8] bg-[#FFF7F1] p-3">
              <span className="font-bold text-[#FF6A00] text-[11px] uppercase tracking-wider block">
                Contato Indicado
              </span>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  placeholder="Nome do indicado"
                  value={formData.referral_name || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, referral_name: e.target.value })
                  }
                  className="h-8 text-xs bg-white border-[#FFD0A8]"
                />
                <Input
                  placeholder="Telefone do indicado"
                  value={formData.referral_phone || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, referral_phone: e.target.value })
                  }
                  className="h-8 text-xs bg-white border-[#FFD0A8]"
                />
              </div>
            </div>
          )}

          {/* Anotações */}
          <div className="space-y-1 border-t border-[#E2E8F0] pt-3">
            <label className="font-bold text-[#0B0B0D]">Observações & Histórico</label>
            <Textarea
              value={formData.notes || ""}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              placeholder="Histórico do contato..."
              rows={3}
              className="text-xs bg-[#F8FAFC] border-[#E2E8F0] rounded-xl"
            />
          </div>
        </div>

        <DialogFooter className="border-t border-[#E2E8F0] pt-3 flex items-center justify-between">
          {!showDeleteConfirm ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowDeleteConfirm(true)}
              className="text-xs text-rose-600 hover:bg-rose-50"
            >
              <Trash2 className="h-3.5 w-3.5 mr-1" />
              Excluir
            </Button>
          ) : (
            <div className="flex items-center gap-1">
              <span className="text-[11px] text-rose-600 font-bold">Confirmar?</span>
              <Button
                type="button"
                size="sm"
                variant="destructive"
                onClick={handleDelete}
                disabled={isDeleting}
                className="h-7 text-xs px-2"
              >
                {isDeleting ? "Excluindo..." : "Sim"}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => setShowDeleteConfirm(false)}
                className="h-7 text-xs px-2"
              >
                Não
              </Button>
            </div>
          )}

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="text-xs border-[#E2E8F0]"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleSave}
              disabled={isSaving}
              className="bg-[#FF6A00] hover:bg-[#E85C00] text-white font-bold text-xs"
            >
              <Save className="h-3.5 w-3.5 mr-1" />
              {isSaving ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
