"use client";

import React, { useState, useEffect } from "react";
import {
  Users,
  UserPlus,
  Shield,
  ShieldAlert,
  ShieldCheck,
  UserCheck,
  UserX,
  Search,
  Loader2,
  Lock,
  Mail,
  User as UserIcon,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { UserRole } from "@/types/database";

interface TeamUser {
  id: string;
  email: string;
  display_name: string;
  role: UserRole;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export default function UsuariosPage() {
  const [users, setUsers] = useState<TeamUser[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // Modal Novo Colaborador
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    display_name: "",
    email: "",
    password: "",
    role: "seller" as UserRole,
  });

  const fetchCurrentUser = async () => {
    try {
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const data = await res.json();
        if (data.success) setCurrentUser(data.user);
      }
    } catch (err) {
      console.error("Erro ao carregar usuário atual:", err);
    }
  };

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/users");
      const data = await res.json();
      if (res.ok && data.success) {
        setUsers(data.users || []);
      } else {
        toast.error(data.error || "Erro ao carregar colaboradores.");
      }
    } catch (err: any) {
      toast.error("Falha ao comunicar com o servidor: " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentUser();
    fetchUsers();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.display_name || !formData.email || !formData.password) {
      toast.error("Preencha todos os campos obrigatórios.");
      return;
    }

    if (formData.password.length < 6) {
      toast.error("A senha deve conter pelo menos 6 caracteres.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(`Colaborador ${formData.display_name} criado com sucesso!`);
        setIsModalOpen(false);
        setFormData({ display_name: "", email: "", password: "", role: "seller" });
        fetchUsers();
      } else {
        toast.error(data.error || "Não foi possível criar o usuário.");
      }
    } catch (err: any) {
      toast.error("Erro ao cadastrar: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (user: TeamUser) => {
    if (user.id === currentUser?.id) {
      toast.error("Você não pode suspender sua própria conta.");
      return;
    }

    const nextStatus = !user.is_active;
    const actionLabel = nextStatus ? "reativar" : "suspender";

    if (!confirm(`Deseja realmente ${actionLabel} o acesso de ${user.display_name}?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: nextStatus }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(`Acesso de ${user.display_name} ${nextStatus ? "reativado" : "suspenso"}.`);
        fetchUsers();
      } else {
        toast.error(data.error || "Erro ao atualizar status.");
      }
    } catch (err: any) {
      toast.error("Erro na requisição: " + err.message);
    }
  };

  const handleChangeRole = async (user: TeamUser, newRole: UserRole) => {
    if (user.id === currentUser?.id) {
      toast.error("Você não pode alterar seu próprio papel.");
      return;
    }

    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(`Função de ${user.display_name} atualizada para ${newRole}.`);
        fetchUsers();
      } else {
        toast.error(data.error || "Erro ao alterar função.");
      }
    } catch (err: any) {
      toast.error("Erro na requisição: " + err.message);
    }
  };

  const filteredUsers = users.filter((u) => {
    const term = searchTerm.toLowerCase();
    return (
      u.display_name?.toLowerCase().includes(term) ||
      u.email?.toLowerCase().includes(term) ||
      u.role?.toLowerCase().includes(term)
    );
  });

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case "admin":
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#FF6A00] bg-[#FFF4EC] border border-[#FFD0A8] px-2.5 py-0.5 rounded-full">
            <ShieldCheck className="h-3 w-3" />
            Administrador
          </span>
        );
      case "supervisor":
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#0284C7] bg-[#F0F9FF] border border-[#BAE6FD] px-2.5 py-0.5 rounded-full">
            <Shield className="h-3 w-3" />
            Supervisor
          </span>
        );
      case "seller":
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#475569] bg-[#F8FAFC] border border-[#E2E8F0] px-2.5 py-0.5 rounded-full">
            <UserIcon className="h-3 w-3" />
            Vendedor
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-[#E2E8F0] pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-[#0B0B0D] tracking-tight">
              Gestão de Equipe & Permissões (RBAC)
            </h1>
            <span className="rounded-md bg-[#FFF4EC] text-[#FF6A00] text-xs font-bold px-2 py-0.5 border border-[#FFD0A8]">
              Fase 1
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[#64748B] mt-1">
            Controle de acessos individuais, funções e estados de colaboradores da Navetech Telecom.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchUsers}
            disabled={isLoading}
            className="border-[#E2E8F0] text-[#64748B] hover:text-[#0B0B0D]"
          >
            <RefreshCw className={`h-3.5 w-3.5 mr-1 ${isLoading ? "animate-spin" : ""}`} />
            Atualizar
          </Button>

          <Button
            size="sm"
            onClick={() => setIsModalOpen(true)}
            className="bg-[#FF6A00] hover:bg-[#E85C00] text-white font-bold shadow-xs text-xs sm:text-sm h-9"
          >
            <UserPlus className="h-4 w-4 mr-1.5" />
            Novo Colaborador
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-[#E2E8F0] bg-white p-4 shadow-2xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B]">
            Total de Usuários
          </span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-2xl font-black text-[#0B0B0D]">{users.length}</span>
            <Users className="h-4 w-4 text-[#64748B]" />
          </div>
        </div>

        <div className="rounded-xl border border-[#E2E8F0] bg-white p-4 shadow-2xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B]">
            Administradores
          </span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-2xl font-black text-[#FF6A00]">
              {users.filter((u) => u.role === "admin").length}
            </span>
            <ShieldCheck className="h-4 w-4 text-[#FF6A00]" />
          </div>
        </div>

        <div className="rounded-xl border border-[#E2E8F0] bg-white p-4 shadow-2xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B]">
            Supervisores
          </span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-2xl font-black text-[#0284C7]">
              {users.filter((u) => u.role === "supervisor").length}
            </span>
            <Shield className="h-4 w-4 text-[#0284C7]" />
          </div>
        </div>

        <div className="rounded-xl border border-[#E2E8F0] bg-white p-4 shadow-2xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B]">
            Vendedores Ativos
          </span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-2xl font-black text-[#10B981]">
              {users.filter((u) => u.role === "seller" && u.is_active).length}
            </span>
            <UserCheck className="h-4 w-4 text-[#10B981]" />
          </div>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#64748B]" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por nome, e-mail ou função..."
            className="pl-9 h-9 text-xs sm:text-sm bg-white border-[#E2E8F0] rounded-xl"
          />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-[#E2E8F0] bg-white shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC] text-[11px] font-bold uppercase tracking-wider text-[#64748B]">
                <th className="px-5 py-3.5">Colaborador</th>
                <th className="px-5 py-3.5">Função (RBAC)</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0] text-sm">
              {isLoading ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-sm text-[#64748B]">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-[#FF6A00] mb-2" />
                    Carregando equipe...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-sm text-[#64748B]">
                    Nenhum colaborador encontrado.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => {
                  const isSelf = user.id === currentUser?.id;
                  return (
                    <tr key={user.id} className="hover:bg-[#F8FAFC]/80 transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-full bg-[#FFF4EC] border border-[#FFD0A8] flex items-center justify-center font-bold text-xs text-[#FF6A00]">
                            {user.display_name?.substring(0, 2).toUpperCase() || "US"}
                          </div>
                          <div>
                            <div className="font-bold text-[#0B0B0D] flex items-center gap-2">
                              {user.display_name}
                              {isSelf && (
                                <span className="text-[10px] bg-[#E2E8F0] text-[#475569] font-bold px-1.5 py-0.2 rounded">
                                  Você
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-[#64748B] flex items-center gap-1 mt-0.5">
                              <Mail className="h-3 w-3" />
                              {user.email}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          {getRoleBadge(user.role)}
                          {!isSelf && (
                            <select
                              value={user.role}
                              onChange={(e) => handleChangeRole(user, e.target.value as UserRole)}
                              className="text-xs border border-[#E2E8F0] rounded-lg bg-white px-2 py-1 text-[#0B0B0D] focus:outline-[#FF6A00]"
                            >
                              <option value="seller">Vendedor</option>
                              <option value="supervisor">Supervisor</option>
                              <option value="admin">Administrador</option>
                            </select>
                          )}
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        {user.is_active ? (
                          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#10B981]">
                            <span className="h-2 w-2 rounded-full bg-[#10B981]" />
                            Ativo
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#EF4444]">
                            <span className="h-2 w-2 rounded-full bg-[#EF4444]" />
                            Suspenso
                          </span>
                        )}
                      </td>

                      <td className="px-5 py-4 text-right">
                        {!isSelf ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleToggleStatus(user)}
                            className={`text-xs font-semibold h-8 rounded-lg ${
                              user.is_active
                                ? "border-[#FECDD3] text-[#E11D48] hover:bg-[#FFF1F2]"
                                : "border-[#A7F3D0] text-[#059669] hover:bg-[#ECFDF5]"
                            }`}
                          >
                            {user.is_active ? (
                              <>
                                <UserX className="h-3.5 w-3.5 mr-1" />
                                Suspender
                              </>
                            ) : (
                              <>
                                <UserCheck className="h-3.5 w-3.5 mr-1" />
                                Reativar
                              </>
                            )}
                          </Button>
                        ) : (
                          <span className="text-xs text-[#94A3B8] italic">Conta Atual</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Novo Colaborador */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-md bg-white rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-[#0B0B0D] flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-[#FF6A00]" />
              Cadastrar Novo Colaborador
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleCreateUser} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#0B0B0D]">Nome Completo</label>
              <Input
                value={formData.display_name}
                onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                placeholder="Ex: João da Silva"
                required
                className="h-10 text-xs sm:text-sm border-[#E2E8F0] rounded-xl"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#0B0B0D]">E-mail Institucional</label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="joao@navetech.com.br"
                required
                className="h-10 text-xs sm:text-sm border-[#E2E8F0] rounded-xl"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#0B0B0D]">Senha Inicial</label>
              <Input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Mínimo 6 caracteres"
                required
                className="h-10 text-xs sm:text-sm border-[#E2E8F0] rounded-xl"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#0B0B0D]">Função no Sistema (RBAC)</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                className="w-full h-10 px-3 text-xs sm:text-sm border border-[#E2E8F0] rounded-xl bg-white text-[#0B0B0D] focus:outline-[#FF6A00]"
              >
                <option value="seller">Vendedor (Acessa leads e WhatsApp próprios)</option>
                <option value="supervisor">Supervisor (Acessa campanhas e equipe)</option>
                <option value="admin">Administrador (Controle irrestrito e configurações)</option>
              </select>
            </div>

            <DialogFooter className="pt-4 flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsModalOpen(false)}
                className="border-[#E2E8F0] text-[#64748B]"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-[#FF6A00] hover:bg-[#E85C00] text-white font-bold"
              >
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                Criar Acesso
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
