"use client";

import React, { useState, useEffect, useCallback } from "react";
import { TeamMember, TeamRole, TeamStatus, InviteMemberInput, TeamAuditEvent } from "@/modules/team-management/types";
import { TeamTable } from "@/modules/team-management/components/team-table";
import { InviteModal } from "@/modules/team-management/components/invite-modal";
import { AuditDrawer } from "@/modules/team-management/components/audit-drawer";
import { Users, UserPlus, History, ShieldAlert, CheckCircle2, AlertTriangle } from "lucide-react";

export default function AdminEquipePage() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [isAuditOpen, setIsAuditOpen] = useState(false);
  const [auditEvents, setAuditEvents] = useState<TeamAuditEvent[]>([]);
  const [isAuditLoading, setIsAuditLoading] = useState(false);
  const [notification, setNotification] = useState<{
    type: "success" | "error" | "warning";
    message: string;
  } | null>(null);

  const showNotification = (type: "success" | "error" | "warning", message: string) => {
    setNotification({ type, message });
    setTimeout(() => {
      setNotification((curr) => (curr?.message === message ? null : curr));
    }, 5000);
  };

  const fetchMembers = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/admin/team");
      const data = await res.json();

      if (!res.ok || !data.success) {
        showNotification("warning", data.error || "Não foi possível carregar os membros.");
        setMembers([]);
        return;
      }

      setMembers(data.members || []);
    } catch (err: any) {
      showNotification("error", "Erro ao conectar à API de equipe.");
      setMembers([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchAuditEvents = useCallback(async () => {
    try {
      setIsAuditLoading(true);
      const res = await fetch("/api/admin/team/audit");
      const data = await res.json();
      if (data.success && data.events) {
        setAuditEvents(data.events);
      }
    } catch {
      // Ignorar falhas silenciosas na abertura
    } finally {
      setIsAuditLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  const handleOpenAudit = () => {
    setIsAuditOpen(true);
    fetchAuditEvents();
  };

  const handleInvite = async (input: InviteMemberInput) => {
    const res = await fetch("/api/admin/team", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || "Erro ao convidar membro.");
    }

    showNotification("success", `Convite enviado com sucesso para ${input.email}!`);
    await fetchMembers();
  };

  const handleUpdateStatus = async (userId: string, status: TeamStatus) => {
    try {
      const res = await fetch(`/api/admin/team/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        showNotification("error", data.error || "Falha ao atualizar status.");
        return;
      }

      showNotification("success", "Status atualizado com sucesso.");
      await fetchMembers();
    } catch (err: any) {
      showNotification("error", err.message || "Erro na requisição.");
    }
  };

  const handleUpdateRole = async (userId: string, role: TeamRole) => {
    try {
      const res = await fetch(`/api/admin/team/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        showNotification("error", data.error || "Falha ao alterar perfil.");
        return;
      }

      showNotification("success", "Perfil alterado com sucesso.");
      await fetchMembers();
    } catch (err: any) {
      showNotification("error", err.message || "Erro na requisição.");
    }
  };

  const handleResendInvite = async (userId: string) => {
    try {
      const res = await fetch(`/api/admin/team/${userId}/resend`, {
        method: "POST",
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        showNotification("error", data.error || "Falha ao reenviar convite.");
        return;
      }

      showNotification("success", data.message || "Convite reenviado com sucesso.");
      await fetchMembers();
    } catch (err: any) {
      showNotification("error", err.message || "Erro na requisição.");
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Banner de Notificações */}
      {notification && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between text-sm shadow-sm transition-all animate-in slide-in-from-top-2 ${
            notification.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : notification.type === "warning"
              ? "bg-amber-50 border-amber-200 text-amber-800"
              : "bg-red-50 border-red-200 text-red-800"
          }`}
        >
          <div className="flex items-center gap-2.5">
            {notification.type === "success" ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : notification.type === "warning" ? (
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
            ) : (
              <ShieldAlert className="w-5 h-5 text-red-600 shrink-0" />
            )}
            <span>{notification.message}</span>
          </div>
          <button
            onClick={() => setNotification(null)}
            className="text-xs font-semibold underline ml-4 hover:opacity-75"
          >
            Fechar
          </button>
        </div>
      )}

      {/* Header da Página */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold text-orange-600 tracking-wider uppercase">
              Módulo Independente
            </span>
            <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-medium">
              v1.0
            </span>
          </div>
          <h1 className="text-2xl font-bold text-zinc-900 tracking-tight flex items-center gap-2.5">
            <Users className="w-7 h-7 text-orange-600" />
            Gestão de Equipe & Vendedores
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            Cadastre, convide e gerencie permissões de supervisores e vendedores com convite oficial via Supabase Auth.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleOpenAudit}
            className="px-3.5 py-2 text-sm font-medium text-zinc-700 bg-white hover:bg-zinc-50 border border-zinc-300 rounded-lg shadow-sm transition flex items-center gap-1.5"
          >
            <History className="w-4 h-4 text-zinc-500" />
            <span>Auditoria</span>
          </button>

          <button
            onClick={() => setIsInviteOpen(true)}
            className="px-4 py-2 text-sm font-semibold text-white bg-orange-600 hover:bg-orange-700 rounded-lg shadow-sm transition flex items-center gap-1.5"
          >
            <UserPlus className="w-4 h-4" />
            <span>Convidar Membro</span>
          </button>
        </div>
      </div>

      {/* Tabela de Membros */}
      <TeamTable
        members={members}
        isLoading={isLoading}
        onRefresh={fetchMembers}
        onOpenInvite={() => setIsInviteOpen(true)}
        onUpdateStatus={handleUpdateStatus}
        onUpdateRole={handleUpdateRole}
        onResendInvite={handleResendInvite}
      />

      {/* Modais e Gavetas */}
      <InviteModal
        isOpen={isInviteOpen}
        onClose={() => setIsInviteOpen(false)}
        onSubmit={handleInvite}
      />

      <AuditDrawer
        isOpen={isAuditOpen}
        onClose={() => setIsAuditOpen(false)}
        events={auditEvents}
        isLoading={isAuditLoading}
        onRefresh={fetchAuditEvents}
      />
    </div>
  );
}
