"use client";

import React, { useState, useEffect } from "react";
import * as XLSX from "xlsx";
import {
  Users,
  Search,
  Filter,
  Download,
  MessageSquare,
  Building,
  Star,
  Zap,
  UserCheck,
  Edit2,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DataService } from "@/lib/data-service";
import { formatPhone, getCleanPhoneForWhatsApp, getStatusBadgeInfo } from "@/lib/utils";
import { Client, ClientStatus } from "@/types/database";
import { ClientDetailsModal } from "@/components/kanban/client-details-modal";

export default function ClientesPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const loadData = async () => {
    const data = await DataService.getClients();
    setClients(data);
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredClients = clients.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.phone.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.condominium && c.condominium.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = statusFilter === "all" || c.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleExportXLSX = () => {
    const dataToExport = filteredClients.map((c) => ({
      Nome: c.name,
      Telefone: c.phone,
      Condomínio: c.condominium || "",
      "Plano Atual": c.current_plan,
      "Plano Alvo": c.target_plan,
      Status: c.status,
      NPS: c.nps_score ?? "",
      "Interesse Upgrade": c.wants_upgrade ? "Sim" : "Não",
      "Fez Indicação": c.gave_referral ? "Sim" : "Não",
      "Nome Indicado": c.referral_name || "",
      "Telefone Indicado": c.referral_phone || "",
      Observações: c.notes || "",
      "Data Cadastro": new Date(c.created_at).toLocaleDateString("pt-BR"),
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Clientes Upgrade");
    XLSX.writeFile(workbook, `Clientes_Upgrade_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Users className="h-6 w-6 text-blue-600" />
            Base de Clientes
          </h1>
          <p className="text-xs md:text-sm text-slate-500">
            Gerencie e filtre todos os clientes importados e acompanhe cada atendimento.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={handleExportXLSX}
          className="flex items-center gap-1.5 text-xs text-slate-700 bg-white"
        >
          <Download className="h-3.5 w-3.5" />
          <span>Exportar Excel</span>
        </Button>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3 bg-white p-3.5 rounded-xl border">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por nome, telefone ou condomínio..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-slate-50 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="h-4 w-4 text-slate-400 shrink-0" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="all">Todos os Status ({clients.length})</option>
            <option value="frio">❄️ Frio</option>
            <option value="morno">🌤️ Morno</option>
            <option value="quente">🔥 Quente</option>
            <option value="vendido">🏆 Vendido</option>
            <option value="desativado">⛔ Desativado</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b bg-slate-50 font-semibold text-slate-600 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="p-3.5">Cliente</th>
                <th className="p-3.5">Contato</th>
                <th className="p-3.5">Condomínio</th>
                <th className="p-3.5">Planos</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-center">NPS</th>
                <th className="p-3.5 text-center">Indicação</th>
                <th className="p-3.5 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredClients.length > 0 ? (
                filteredClients.map((client) => {
                  const statusInfo = getStatusBadgeInfo(client.status);
                  const cleanPhone = getCleanPhoneForWhatsApp(client.phone);
                  const waUrl = `https://wa.me/${cleanPhone}`;

                  return (
                    <tr
                      key={client.id}
                      className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                      onClick={() => {
                        setSelectedClient(client);
                        setIsDetailsOpen(true);
                      }}
                    >
                      <td className="p-3.5 font-bold text-slate-900">
                        {client.name}
                      </td>
                      <td className="p-3.5 font-medium text-slate-600">
                        {formatPhone(client.phone)}
                      </td>
                      <td className="p-3.5 text-slate-500">
                        {client.condominium || "Condomínio Geral"}
                      </td>
                      <td className="p-3.5">
                        <span className="font-semibold text-slate-500">
                          {client.current_plan}
                        </span>{" "}
                        →{" "}
                        <span className="font-bold text-blue-600">
                          {client.target_plan}
                        </span>
                      </td>
                      <td className="p-3.5">
                        <Badge className={statusInfo.color}>
                          {statusInfo.icon} {statusInfo.label}
                        </Badge>
                      </td>
                      <td className="p-3.5 text-center">
                        {client.nps_score !== null && client.nps_score !== undefined ? (
                          <span
                            className={`inline-flex items-center gap-0.5 rounded px-2 py-0.5 font-bold ${
                              client.nps_score >= 9
                                ? "bg-emerald-100 text-emerald-800"
                                : client.nps_score >= 7
                                ? "bg-amber-100 text-amber-800"
                                : "bg-rose-100 text-rose-800"
                            }`}
                          >
                            <Star className="h-3 w-3 fill-current" />
                            {client.nps_score}
                          </span>
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>
                      <td className="p-3.5 text-center">
                        {client.gave_referral ? (
                          <span className="inline-flex items-center rounded-full bg-purple-100 text-purple-800 p-1">
                            <UserCheck className="h-3.5 w-3.5" />
                          </span>
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>
                      <td
                        className="p-3.5 text-right"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-end gap-1.5">
                          <a
                            href={waUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 rounded bg-emerald-50 px-2 py-1 text-emerald-700 hover:bg-emerald-600 hover:text-white font-semibold transition-all"
                          >
                            <MessageSquare className="h-3 w-3" />
                            <span>WhatsApp</span>
                          </a>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setSelectedClient(client);
                              setIsDetailsOpen(true);
                            }}
                            className="h-7 w-7 text-slate-500 hover:text-slate-800"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400">
                    Nenhum cliente encontrado com os filtros atuais.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ClientDetailsModal
        client={selectedClient}
        open={isDetailsOpen}
        onOpenChange={setIsDetailsOpen}
        onClientUpdated={loadData}
        onClientDeleted={loadData}
      />
    </div>
  );
}
