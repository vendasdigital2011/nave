"use client";

import React, { useState } from "react";
import { UserPlus, Loader2 } from "lucide-react";
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
import { DataService } from "@/lib/data-service";
import { ClientStatus } from "@/types/database";

interface AddClientModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function AddClientModal({ open, onOpenChange, onSuccess }: AddClientModalProps) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [condominium, setCondominium] = useState("Condomínio Geral");
  const [currentPlan, setCurrentPlan] = useState("50 Mega");
  const [targetPlan, setTargetPlan] = useState("100 Mega");
  const [status, setStatus] = useState<ClientStatus>("frio");
  const [notes, setNotes] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) return;

    setIsLoading(true);
    try {
      await DataService.addClient({
        name: name.trim(),
        phone: phone.trim(),
        condominium: condominium.trim(),
        current_plan: currentPlan,
        target_plan: targetPlan,
        status,
        notes: notes.trim() || undefined,
        wants_upgrade: status === "quente" || status === "vendido",
        gave_referral: false,
      });

      setName("");
      setPhone("");
      setNotes("");
      onOpenChange(false);
      if (onSuccess) onSuccess();
    } catch (err) {
      console.error("Erro adicionando cliente:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogClose onClick={() => onOpenChange(false)} />
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2 text-slate-900">
          <UserPlus className="h-5 w-5 text-blue-600" />
          Cadastrar Novo Cliente
        </DialogTitle>
        <DialogDescription>
          Adicione um cliente para a esteira comercial de migração 50 Mega para 100 Mega.
        </DialogDescription>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="space-y-4 py-2">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-700">Nome Completo *</label>
          <Input
            placeholder="Ex: João da Silva"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">WhatsApp / Telefone *</label>
            <Input
              placeholder="(77) 99999-9999"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">Condomínio / Local</label>
            <Input
              placeholder="Ex: Condomínio Primavera"
              value={condominium}
              onChange={(e) => setCondominium(e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">Plano Atual</label>
            <Input value={currentPlan} onChange={(e) => setCurrentPlan(e.target.value)} />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">Plano Alvo (Upgrade)</label>
            <Input value={targetPlan} onChange={(e) => setTargetPlan(e.target.value)} />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">Status Inicial</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as ClientStatus)}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="frio">❄️ Frio (Não abordado)</option>
              <option value="morno">🌤️ Morno (Em contato)</option>
              <option value="quente">🔥 Quente (Interessado)</option>
              <option value="vendido">🏆 Vendido (Fechado)</option>
            </select>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-700">Observações Iniciais</label>
          <Textarea
            placeholder="Informações relevantes sobre o cliente ou preferências..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
          />
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isLoading} className="bg-blue-600 hover:bg-blue-700 text-white">
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salvar Cliente"}
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  );
}
