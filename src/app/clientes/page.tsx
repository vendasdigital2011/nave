"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import * as XLSX from "xlsx";
import {
  Search,
  Filter,
  Download,
  MessageSquare,
  Star,
  UserCheck,
  Edit2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DataService } from "@/lib/data-service";
import { formatPhone, getStatusBadgeInfo } from "@/lib/utils";
import { Client } from "@/types/database";
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
      c.phone.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === "all" || c.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleExportXLSX = () => {
    const dataToExport = filteredClients.map((c) => ({
      Nome: c.name,
      Telefone: c.phone,
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
    XLSX.writeFile(workbook, `Clientes_NaveProspect_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-[#0B0B0D] tracking-tight">
            Base de Clientes
          </h1>
          <p className="text-xs md:text-sm text-[#64748B]">
            Gerencie e filtre todos os clientes individuais da campanha de upgrade de velocidade.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={handleExportXLSX}
          className="flex items-center gap-1.5 text-xs text-[#0B0B0D] bg-white border-[#E2E8F0] hover:bg-[#F8FAFC]"
        >
          <Download className="h-3.5 w-3.5 text-[#FF6A00]" />
          <span>Exportar Excel</span>
        </Button>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3 bg-white p-3.5 rounded-2xl border border-[#E2E8F0] shadow-sm">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#64748B]" />
          <input
            type="text"
            placeholder="Buscar por nome ou telefone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] text-[#0B0B0D] placeholder:text-[#64748B] focus:outline-none focus:ring-1 focus:ring-[#FF6A00]"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="h-4 w-4 text-[#64748B] shrink-0" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-3 py-1.5 text-[#0B0B0D] focus:outline-none focus:ring-1 focus:ring-[#FF6A00]"
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

      {/* Table: Cliente | Contato | Plano | Status | NPS | Indicação | Ações */}
      <div className="rounded-2xl border border-[#E2E8F0] bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-[#E2E8F0] bg-[#F8FAFC] font-bold text-[#64748B] uppercase tracking-wider text-[11px]">
              <tr>
                <th className="p-3.5">Cliente</th>
                <th className="p-3.5">Contato</th>
                <th className="p-3.5">Plano</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-center">NPS</th>
                <th className="p-3.5 text-center">Indicação</th>
                <th className="p-3.5 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0] text-[#0B0B0D]">
              {filteredClients.length > 0 ? (
                filteredClients.map((client) => {
                  const statusInfo = getStatusBadgeInfo(client.status);

                  return (
                    <tr
                      key={client.id}
                      className="hover:bg-[#F8FAFC] transition-colors cursor-pointer"
                      onClick={() => {
                        setSelectedClient(client);
                        setIsDetailsOpen(true);
                      }}
                    >
                      <td className="p-3.5 font-bold text-[#0B0B0D]">
                        {client.name}
                      </td>
                      <td className="p-3.5 font-mono text-[#64748B]">
                        {formatPhone(client.phone)}
                      </td>
                      <td className="p-3.5">
                        <span className="font-semibold text-[#64748B]">
                          {client.current_plan}
                        </span>{" "}
                        →{" "}
                        <span className="font-bold text-[#FF6A00]">
                          {client.target_plan}
                        </span>
                      </td>
                      <td className="p-3.5">
                        <Badge className={client.status === "quente" ? "bg-[#FFF4EC] text-[#FF6A00] border-[#FFD0A8]" : statusInfo.color}>
                          {statusInfo.label}
                        </Badge>
                      </td>
                      <td className="p-3.5 text-center">
                        {client.nps_score !== null && client.nps_score !== undefined ? (
                          <span
                            className={`inline-flex items-center gap-0.5 rounded px-2 py-0.5 font-bold text-[11px] ${
                              client.nps_score >= 9
                                ? "bg-[#DCFCE7] text-[#15803D]"
                                : client.nps_score >= 7
                                ? "bg-[#FEF3C7] text-[#B45309]"
                                : "bg-[#FEE2E2] text-[#B91C1C]"
                            }`}
                          >
                            <Star className="h-3 w-3 fill-current" />
                            {client.nps_score}
                          </span>
                        ) : (
                          <span className="text-[#CBD5E1]">-</span>
                        )}
                      </td>
                      <td className="p-3.5 text-center">
                        {client.gave_referral ? (
                          <span className="inline-flex items-center rounded-full bg-[#FFF4EC] text-[#FF6A00] border border-[#FFD0A8] p-1">
                            <UserCheck className="h-3.5 w-3.5" />
                          </span>
                        ) : (
                          <span className="text-[#CBD5E1]">-</span>
                        )}
                      </td>
                      <td
                        className="p-3.5 text-right"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Internal Chat Link (PRD-CORRECAO-01) */}
                          <Link
                            href={`/conversas?clientId=${client.id}`}
                            className="inline-flex items-center gap-1 rounded-lg bg-[#FFF4EC] px-2.5 py-1 text-[#FF6A00] border border-[#FFD0A8] hover:bg-[#FF6A00] hover:text-white font-bold transition-colors"
                          >
                            <MessageSquare className="h-3 w-3" />
                            <span>Conversa</span>
                          </Link>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setSelectedClient(client);
                              setIsDetailsOpen(true);
                            }}
                            className="h-7 w-7 text-[#64748B] hover:text-[#0B0B0D]"
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
                  <td colSpan={7} className="p-8 text-center text-[#64748B]">
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
