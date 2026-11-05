"use client";

import React, { useState, useMemo } from "react";
import { TeamMember, TeamRole, TeamStatus } from "../types";
import {
  Search,
  Filter,
  UserCheck,
  UserX,
  Clock,
  Shield,
  Send,
  MoreVertical,
  CheckCircle,
  AlertCircle,
  XCircle,
  RefreshCw,
} from "lucide-react";

interface TeamTableProps {
  members: TeamMember[];
  isLoading: boolean;
  onRefresh: () => void;
  onOpenInvite: () => void;
  onUpdateStatus: (userId: string, status: TeamStatus) => Promise<void>;
  onUpdateRole: (userId: string, role: TeamRole) => Promise<void>;
  onResendInvite: (userId: string) => Promise<void>;
}

export function TeamTable({
  members,
  isLoading,
  onRefresh,
  onOpenInvite,
  onUpdateStatus,
  onUpdateRole,
  onResendInvite,
}: TeamTableProps) {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const filteredMembers = useMemo(() => {
    return members.filter((m) => {
      const matchesSearch =
        m.full_name.toLowerCase().includes(search.toLowerCase()) ||
        (m.email_snapshot || "").toLowerCase().includes(search.toLowerCase());

      const matchesRole = roleFilter === "all" || m.role === roleFilter;
      const matchesStatus = statusFilter === "all" || m.status === statusFilter;

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [members, search, roleFilter, statusFilter]);

  const handleAction = async (actionId: string, fn: () => Promise<void>) => {
    try {
      setActionLoading(actionId);
      await fn();
    } finally {
      setActionLoading(null);
    }
  };

  const getRoleBadge = (role: TeamRole) => {
    switch (role) {
      case "admin":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-800 border border-red-200">
            <Shield className="w-3 h-3 text-red-600" />
            Administrador
          </span>
        );
      case "supervisor":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 border border-purple-200">
            <Shield className="w-3 h-3 text-purple-600" />
            Supervisor
          </span>
        );
      case "vendedor":
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200">
            Vendedor
          </span>
        );
    }
  };

  const getStatusBadge = (status: TeamStatus) => {
    switch (status) {
      case "ativo":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
            <CheckCircle className="w-3 h-3 text-emerald-600" />
            Ativo
          </span>
        );
      case "convite_pendente":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
            <Clock className="w-3 h-3 text-amber-600" />
            Convite Pendente
          </span>
        );
      case "suspenso":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
            <AlertCircle className="w-3 h-3 text-orange-600" />
            Suspenso
          </span>
        );
      case "desativado":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-zinc-200 text-zinc-700">
            <XCircle className="w-3 h-3 text-zinc-500" />
            Desativado
          </span>
        );
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-zinc-200 overflow-hidden">
      {/* Barra de Filtros e Busca */}
      <div className="p-4 sm:p-5 border-b border-zinc-200 bg-zinc-50/50 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="flex-1 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nome ou e-mail..."
              className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
            />
          </div>

          <div className="flex gap-2">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              aria-label="Filtrar por perfil"
              className="px-3 py-2 text-sm bg-white border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-zinc-700"
            >
              <option value="all">Todos os Perfis</option>
              <option value="admin">Administrador</option>
              <option value="supervisor">Supervisor</option>
              <option value="vendedor">Vendedor</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              aria-label="Filtrar por status"
              className="px-3 py-2 text-sm bg-white border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-zinc-700"
            >
              <option value="all">Todos os Status</option>
              <option value="ativo">Ativo</option>
              <option value="convite_pendente">Convite Pendente</option>
              <option value="suspenso">Suspenso</option>
              <option value="desativado">Desativado</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2 justify-end">
          <button
            onClick={onRefresh}
            disabled={isLoading}
            title="Atualizar lista"
            className="p-2 text-zinc-600 hover:text-zinc-900 border border-zinc-300 bg-white hover:bg-zinc-100 rounded-lg transition"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Tabela de Membros */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-zinc-50 border-b border-zinc-200 text-xs uppercase tracking-wider text-zinc-500">
            <tr>
              <th className="px-5 py-3 font-semibold">Membro</th>
              <th className="px-4 py-3 font-semibold">Perfil</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold hidden md:table-cell">Último Acesso</th>
              <th className="px-4 py-3 font-semibold hidden lg:table-cell">Data Convite</th>
              <th className="px-5 py-3 font-semibold text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200">
            {isLoading ? (
              <tr>
                <td colSpan={6} className="px-5 py-10 text-center text-zinc-500">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <RefreshCw className="w-6 h-6 animate-spin text-orange-500" />
                    <span>Carregando membros da equipe...</span>
                  </div>
                </td>
              </tr>
            ) : filteredMembers.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-12 text-center text-zinc-500">
                  <div className="flex flex-col items-center justify-center max-w-sm mx-auto">
                    <div className="w-12 h-12 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-400 mb-3">
                      <UserCheck className="w-6 h-6" />
                    </div>
                    <p className="text-zinc-800 font-medium text-base mb-1">
                      Nenhum membro encontrado
                    </p>
                    <p className="text-zinc-500 text-xs mb-4">
                      {search || roleFilter !== "all" || statusFilter !== "all"
                        ? "Nenhum resultado corresponde aos filtros selecionados."
                        : "Sua equipe ainda não possui outros membros cadastrados. Convide vendedores ou supervisores para começar."}
                    </p>
                    <button
                      onClick={onOpenInvite}
                      className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-sm font-medium transition"
                    >
                      Convidar Primeiro Membro
                    </button>
                  </div>
                </td>
              </tr>
            ) : (
              filteredMembers.map((member) => (
                <tr
                  key={member.user_id}
                  className="hover:bg-zinc-50/80 transition group"
                >
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-orange-100 text-orange-700 flex items-center justify-center font-bold text-sm shrink-0">
                        {member.full_name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="font-medium text-zinc-900 truncate">
                          {member.full_name}
                        </div>
                        <div className="text-xs text-zinc-500 truncate">
                          {member.email_snapshot}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">{getRoleBadge(member.role)}</td>
                  <td className="px-4 py-4">{getStatusBadge(member.status)}</td>
                  <td className="px-4 py-4 text-xs text-zinc-500 hidden md:table-cell">
                    {member.last_sign_in_at
                      ? new Date(member.last_sign_in_at).toLocaleDateString("pt-BR", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "Nunca acessou"}
                  </td>
                  <td className="px-4 py-4 text-xs text-zinc-500 hidden lg:table-cell">
                    {new Date(member.invited_at).toLocaleDateString("pt-BR")}
                  </td>
                  <td className="px-5 py-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {member.status === "convite_pendente" && (
                        <button
                          onClick={() =>
                            handleAction(`resend-${member.user_id}`, () =>
                              onResendInvite(member.user_id)
                            )
                          }
                          disabled={actionLoading === `resend-${member.user_id}`}
                          title="Reenviar convite por e-mail"
                          className="px-2.5 py-1 text-xs font-medium text-amber-700 hover:bg-amber-50 border border-amber-200 rounded-md transition flex items-center gap-1"
                        >
                          <Send className="w-3 h-3" />
                          <span>
                            {actionLoading === `resend-${member.user_id}`
                              ? "Enviando..."
                              : "Reenviar"}
                          </span>
                        </button>
                      )}

                      {member.status === "ativo" && (
                        <button
                          onClick={() =>
                            handleAction(`suspend-${member.user_id}`, () =>
                              onUpdateStatus(member.user_id, "suspenso")
                            )
                          }
                          disabled={actionLoading === `suspend-${member.user_id}`}
                          title="Suspender acesso"
                          className="px-2.5 py-1 text-xs font-medium text-orange-700 hover:bg-orange-50 border border-orange-200 rounded-md transition flex items-center gap-1"
                        >
                          <UserX className="w-3 h-3" />
                          <span>Suspender</span>
                        </button>
                      )}

                      {member.status === "suspenso" && (
                        <button
                          onClick={() =>
                            handleAction(`reactivate-${member.user_id}`, () =>
                              onUpdateStatus(member.user_id, "ativo")
                            )
                          }
                          disabled={actionLoading === `reactivate-${member.user_id}`}
                          title="Reativar acesso"
                          className="px-2.5 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-50 border border-emerald-200 rounded-md transition flex items-center gap-1"
                        >
                          <UserCheck className="w-3 h-3" />
                          <span>Reativar</span>
                        </button>
                      )}

                      {/* Seletor rápido de perfil */}
                      <select
                        value={member.role}
                        onChange={(e) =>
                          handleAction(`role-${member.user_id}`, () =>
                            onUpdateRole(member.user_id, e.target.value as TeamRole)
                          )
                        }
                        disabled={actionLoading === `role-${member.user_id}`}
                        aria-label="Alterar perfil do membro"
                        className="text-xs bg-white border border-zinc-200 text-zinc-600 rounded px-1.5 py-1 focus:outline-none focus:border-orange-500"
                      >
                        <option value="vendedor">Vendedor</option>
                        <option value="supervisor">Supervisor</option>
                        <option value="admin">Admin</option>
                      </select>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
