"use client";

import React, { useState, useEffect } from "react";
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
import { DataService } from "@/lib/data-service";
import { ClientStatus } from "@/types/database";

interface AddClientModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onClientAdded?: () => void;
  onSuccess?: () => void;
  defaultStatus?: ClientStatus | string;
  campaignId?: string;
  stageId?: string;
}

export function AddClientModal({
  open,
  onOpenChange,
  onClientAdded,
  onSuccess,
  defaultStatus = "importados",
  campaignId = "c0000000-0000-0000-0000-000000000001",
  stageId,
}: AddClientModalProps) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [currentPlan, setCurrentPlan] = useState("50 Mega");
  const [targetPlan, setTargetPlan] = useState("100 Mega");
  const [status, setStatus] = useState<any>(defaultStatus);
  const [notes, setNotes] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setStatus(defaultStatus);
      setErrorMsg("");
    }
  }, [open, defaultStatus]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone) return;

    setIsSubmitting(true);
    setErrorMsg("");
    try {
      const campId = campaignId || "c0000000-0000-0000-0000-000000000001";
      const res = await fetch(`/api/campaigns/${campId}/leads`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim(),
          current_plan: currentPlan,
          target_plan: targetPlan,
          stage_id: stageId || defaultStatus,
          status: typeof status === "string" ? status : "importados",
          notes: notes.trim() || undefined,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Erro ao salvar cliente/lead.");
      }

      setName("");
      setPhone("");
      setNotes("");
      onClientAdded?.();
      onSuccess?.();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Erro ao adicionar cliente:", error);
      setErrorMsg(error.message || "Erro inesperado ao salvar cliente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-white border-[#E2E8F0] p-6 text-[#0B0B0D] rounded-2xl">
        <DialogHeader className="border-b border-[#E2E8F0] pb-3">
          <DialogTitle className="text-base font-bold text-[#0B0B0D]">
            Cadastrar Novo Cliente
          </DialogTitle>
        </DialogHeader>

        {errorMsg && (
          <div className="mt-2 p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5 py-3 text-xs">
          <div className="space-y-1">
            <label className="font-bold text-[#0B0B0D]">Nome Completo *</label>
            <Input
              required
              placeholder="Ex: João da Silva"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="text-xs bg-[#F8FAFC] border-[#E2E8F0] h-9 rounded-xl"
            />
          </div>

          <div className="space-y-1">
            <label className="font-bold text-[#0B0B0D]">WhatsApp / Telefone *</label>
            <Input
              required
              placeholder="Ex: (71) 98765-4321"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="text-xs bg-[#F8FAFC] border-[#E2E8F0] h-9 rounded-xl"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-bold text-[#0B0B0D]">Plano Atual</label>
              <Input
                value={currentPlan}
                onChange={(e) => setCurrentPlan(e.target.value)}
                className="text-xs bg-[#F8FAFC] border-[#E2E8F0] h-9 rounded-xl"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-[#0B0B0D]">Plano Alvo (Upgrade)</label>
              <Input
                value={targetPlan}
                onChange={(e) => setTargetPlan(e.target.value)}
                className="text-xs bg-[#F8FAFC] border-[#E2E8F0] h-9 rounded-xl"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="font-bold text-[#0B0B0D]">Status Inicial</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as ClientStatus)}
              className="w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-2 text-xs focus:outline-none focus:ring-1 focus:ring-[#FF6A00]"
            >
              <option value="importados">📥 Importados</option>
              <option value="frio">📩 Contato Iniciado</option>
              <option value="morno">💬 Em Conversa</option>
              <option value="quente">🔥 Interessado</option>
              <option value="vendido">🏆 Fechado</option>
              <option value="desativado">🚫 Não Interessado</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="font-bold text-[#0B0B0D]">Observações</label>
            <Textarea
              placeholder="Anotações iniciais..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="text-xs bg-[#F8FAFC] border-[#E2E8F0] rounded-xl"
            />
          </div>

          <DialogFooter className="border-t border-[#E2E8F0] pt-3 flex justify-end gap-2">
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
              type="submit"
              size="sm"
              disabled={isSubmitting}
              className="bg-[#FF6A00] hover:bg-[#E85C00] text-white font-bold text-xs"
            >
              {isSubmitting ? "Salvando..." : "Cadastrar Cliente"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
