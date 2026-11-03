"use client";

import React, { useState, useEffect, useRef } from "react";
import * as XLSX from "xlsx";
import {
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowRight,
  Layers,
  History,
  FileText,
  Copy,
  Users,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Campaign, ImportBatch } from "@/types/database";

interface PreviewRow {
  name: string;
  phone: string;
  notes?: string;
  condominium?: string;
  current_plan?: string;
  target_plan?: string;
  status?: string;
}

export default function ImportacaoPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"upload" | "history">("upload");
  const [batches, setBatches] = useState<ImportBatch[]>([]);

  // Estado do Arquivo e Prévia
  const [file, setFile] = useState<File | null>(null);
  const [rows, setRows] = useState<PreviewRow[]>([]);
  const [isParsing, setIsParsing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Carregar campanhas
  useEffect(() => {
    fetch("/api/campaigns")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.success && data.campaigns && data.campaigns.length > 0) {
          setCampaigns(data.campaigns);
          // Preferir Leads Hotspot para novas importações se existir
          const hotspot = data.campaigns.find((c: any) => c.type === "hotspot");
          setSelectedCampaignId(hotspot ? hotspot.id : data.campaigns[0].id);
        }
      })
      .catch(() => {});
  }, []);

  // Carregar histórico de lotes da campanha selecionada
  const fetchBatches = () => {
    if (!selectedCampaignId) return;
    fetch(`/api/campaigns/${selectedCampaignId}/imports`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.success) {
          setBatches(data.batches || []);
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    if (activeTab === "history") {
      fetchBatches();
    }
  }, [selectedCampaignId, activeTab]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setImportResult(null);
    setIsParsing(true);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const buffer = evt.target?.result;
        const workbook = XLSX.read(buffer, { type: "binary" });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const rawJson: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

        if (rawJson.length === 0) {
          toast.error("A planilha selecionada está vazia.");
          setIsParsing(false);
          return;
        }

        const parsedRows: PreviewRow[] = [];

        for (const row of rawJson) {
          // Detecção dinâmica de colunas
          const nameKey = Object.keys(row).find(
            (k) =>
              k.toLowerCase().includes("cliente") ||
              k.toLowerCase().includes("nome") ||
              k.toLowerCase().includes("name")
          );
          const name = nameKey ? String(row[nameKey]).trim() : "";

          const phoneKey = Object.keys(row).find(
            (k) =>
              k.toLowerCase().includes("contato") ||
              k.toLowerCase().includes("telefone") ||
              k.toLowerCase().includes("whatsapp") ||
              k.toLowerCase().includes("celular")
          );
          const phone = phoneKey ? String(row[phoneKey]).trim() : "";

          const condKey = Object.keys(row).find(
            (k) => k.toLowerCase().includes("condom") || k.toLowerCase().includes("bairro")
          );
          const condominium = condKey ? String(row[condKey]).trim() : "Geral";

          const notesKey = Object.keys(row).find(
            (k) => k.toLowerCase().includes("obs") || k.toLowerCase().includes("feed") || k.toLowerCase().includes("nota")
          );
          const notes = notesKey ? String(row[notesKey]).trim() : "";

          if (name || phone) {
            parsedRows.push({
              name,
              phone,
              condominium,
              notes,
            });
          }
        }

        setRows(parsedRows);
        toast.success(`${parsedRows.length} linhas lidas com sucesso da planilha!`);
      } catch (err: any) {
        toast.error("Erro ao processar planilha: " + err.message);
      } finally {
        setIsParsing(false);
      }
    };
    reader.readAsBinaryString(selectedFile);
  };

  const handleExecuteImport = async () => {
    if (!selectedCampaignId) {
      toast.error("Selecione a campanha de destino.");
      return;
    }

    if (rows.length === 0) {
      toast.error("Nenhuma linha pronta para importação.");
      return;
    }

    setIsImporting(true);
    try {
      const res = await fetch(`/api/campaigns/${selectedCampaignId}/imports`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          file_name: file?.name || "importacao.xlsx",
          rows,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setImportResult(data.summary);
        toast.success(`Lote importado! ${data.summary.linked_leads} leads vinculados com sucesso.`);
        setRows([]);
        setFile(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
      } else {
        toast.error(data.error || "Falha ao executar importação.");
      }
    } catch (err: any) {
      toast.error("Erro na importação: " + err.message);
    } finally {
      setIsImporting(false);
    }
  };

  const activeCampaign = campaigns.find((c) => c.id === selectedCampaignId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-[#E2E8F0] pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-[#0B0B0D] tracking-tight">
              Importação Recorrente por Campanha
            </h1>
            <span className="rounded-md bg-[#FFF4EC] text-[#FF6A00] text-xs font-bold px-2 py-0.5 border border-[#FFD0A8]">
              Fase 3
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[#64748B] mt-1">
            Importe planilhas semanais (.xlsx, .csv) com deduplicação e histórico auditável de lotes.
          </p>
        </div>

        {/* Campaign Selector */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-bold text-[#64748B] shrink-0">Campanha Alvo:</label>
          <select
            value={selectedCampaignId}
            onChange={(e) => setSelectedCampaignId(e.target.value)}
            className="h-10 px-3 text-xs sm:text-sm font-bold border border-[#E2E8F0] rounded-xl bg-white text-[#0B0B0D] focus:outline-[#FF6A00]"
          >
            {campaigns.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.type === "upgrade" ? "Migração" : "Aquisição"})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="flex gap-2 border-b border-[#E2E8F0] pb-3">
        <button
          type="button"
          onClick={() => setActiveTab("upload")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === "upload"
              ? "bg-[#FF6A00] text-white shadow-xs"
              : "text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#0B0B0D]"
          }`}
        >
          <Upload className="h-4 w-4" />
          <span>Nova Importação</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("history")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === "history"
              ? "bg-[#FF6A00] text-white shadow-xs"
              : "text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#0B0B0D]"
          }`}
        >
          <History className="h-4 w-4" />
          <span>Histórico de Lotes</span>
        </button>
      </div>

      {/* TAB 1: Upload e Prévia */}
      {activeTab === "upload" && (
        <div className="space-y-6">
          {/* Sucesso Anterior */}
          {importResult && (
            <div className="rounded-2xl border border-[#BBF7D0] bg-[#F0FDF4] p-5">
              <div className="flex items-center gap-2 text-[#16A34A] font-black text-sm mb-3">
                <CheckCircle2 className="h-5 w-5" />
                Lote Importado com Sucesso!
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
                <div className="bg-white p-3 rounded-xl border border-[#BBF7D0]">
                  <span className="text-[#64748B] block">Total Linhas:</span>
                  <span className="text-lg font-black text-[#0B0B0D]">{importResult.total_rows}</span>
                </div>
                <div className="bg-white p-3 rounded-xl border border-[#BBF7D0]">
                  <span className="text-[#64748B] block">Leads Vinculados:</span>
                  <span className="text-lg font-black text-[#16A34A]">+{importResult.linked_leads}</span>
                </div>
                <div className="bg-white p-3 rounded-xl border border-[#BBF7D0]">
                  <span className="text-[#64748B] block">Novos Clientes Criados:</span>
                  <span className="text-lg font-black text-[#2563EB]">+{importResult.inserted_clients}</span>
                </div>
                <div className="bg-white p-3 rounded-xl border border-[#BBF7D0]">
                  <span className="text-[#64748B] block">Duplicados (Preservados):</span>
                  <span className="text-lg font-black text-[#F59E0B]">{importResult.duplicate_leads}</span>
                </div>
                <div className="bg-white p-3 rounded-xl border border-[#BBF7D0]">
                  <span className="text-[#64748B] block">Rejeitados/Inválidos:</span>
                  <span className="text-lg font-black text-[#EF4444]">{importResult.rejected_rows}</span>
                </div>
              </div>
            </div>
          )}

          {/* Área de Drop de Arquivo */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#E2E8F0] bg-white p-10 hover:border-[#FF6A00] transition-colors cursor-pointer group text-center"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileChange}
              className="hidden"
            />
            <div className="h-14 w-14 rounded-2xl bg-[#FFF4EC] text-[#FF6A00] flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <FileSpreadsheet className="h-7 w-7" />
            </div>
            <h3 className="font-bold text-sm text-[#0B0B0D]">
              {file ? file.name : "Clique para selecionar ou arraste sua planilha Excel/CSV"}
            </h3>
            <p className="text-xs text-[#64748B] mt-1 max-w-sm">
              Suporta colunas como Cliente/Nome, Contato/Telefone, Bairro/Condomínio e Observações.
            </p>
            {file && (
              <span className="mt-3 text-[11px] font-bold text-[#FF6A00] bg-[#FFF4EC] px-3 py-1 rounded-full border border-[#FFD0A8]">
                {(file.size / 1024).toFixed(1)} KB selecionado
              </span>
            )}
          </div>

          {/* Prévia dos Dados */}
          {rows.length > 0 && (
            <div className="space-y-4 rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E2E8F0] pb-4">
                <div>
                  <h3 className="text-sm font-black text-[#0B0B0D]">
                    Prévia do Lote: {rows.length} registros prontos
                  </h3>
                  <p className="text-xs text-[#64748B]">
                    Destino: <strong className="text-[#0B0B0D]">{activeCampaign?.name}</strong>
                  </p>
                </div>

                <Button
                  onClick={handleExecuteImport}
                  disabled={isImporting}
                  className="bg-[#FF6A00] hover:bg-[#E85C00] text-white font-bold text-xs h-9 px-4 rounded-xl shadow-xs"
                >
                  {isImporting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                      Processando Deduplicação...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-1.5" />
                      Confirmar e Importar Lote
                    </>
                  )}
                </Button>
              </div>

              {/* Tabela de Amostra (Primeiras 10 linhas) */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-[#F8FAFC] text-[#64748B] font-bold uppercase tracking-wider border-b border-[#E2E8F0]">
                      <th className="px-3 py-2">#</th>
                      <th className="px-3 py-2">Nome</th>
                      <th className="px-3 py-2">Telefone Lido</th>
                      <th className="px-3 py-2">Condomínio / Local</th>
                      <th className="px-3 py-2">Observações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E2E8F0]">
                    {rows.slice(0, 10).map((r, idx) => (
                      <tr key={idx} className="hover:bg-[#F8FAFC]">
                        <td className="px-3 py-2 text-[#94A3B8] font-mono">{idx + 1}</td>
                        <td className="px-3 py-2 font-bold text-[#0B0B0D]">{r.name || "—"}</td>
                        <td className="px-3 py-2 text-[#2563EB] font-mono">{r.phone || "—"}</td>
                        <td className="px-3 py-2 text-[#64748B]">{r.condominium || "Geral"}</td>
                        <td className="px-3 py-2 text-[#64748B] truncate max-w-xs">{r.notes || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {rows.length > 10 && (
                <p className="text-[11px] text-[#94A3B8] text-center pt-2">
                  Exibindo 10 de {rows.length} linhas. Todas serão processadas na confirmação.
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: Histórico de Lotes */}
      {activeTab === "history" && (
        <div className="rounded-2xl border border-[#E2E8F0] bg-white shadow-xs overflow-hidden">
          <div className="p-4 border-b border-[#E2E8F0] flex items-center justify-between">
            <h3 className="text-sm font-black text-[#0B0B0D]">
              Histórico de Lotes Importados na Campanha
            </h3>
            <span className="text-xs text-[#64748B]">
              Total de {batches.length} execuções registradas
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-[#F8FAFC] text-[#64748B] font-bold uppercase tracking-wider border-b border-[#E2E8F0]">
                  <th className="px-4 py-3">Arquivo</th>
                  <th className="px-4 py-3">Data/Hora</th>
                  <th className="px-4 py-3">Operador</th>
                  <th className="px-4 py-3">Total Linhas</th>
                  <th className="px-4 py-3">Novos Leads</th>
                  <th className="px-4 py-3">Duplicados</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                {batches.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-[#94A3B8]">
                      Nenhum lote importado para esta campanha até o momento.
                    </td>
                  </tr>
                ) : (
                  batches.map((b) => (
                    <tr key={b.id} className="hover:bg-[#F8FAFC]">
                      <td className="px-4 py-3 font-bold text-[#0B0B0D] flex items-center gap-1.5">
                        <FileText className="h-4 w-4 text-[#FF6A00]" />
                        {b.file_name}
                      </td>
                      <td className="px-4 py-3 text-[#64748B]">
                        {new Date(b.created_at).toLocaleString("pt-BR")}
                      </td>
                      <td className="px-4 py-3 text-[#64748B]">{b.operator_email || "admin"}</td>
                      <td className="px-4 py-3 font-bold text-[#0B0B0D]">{b.total_rows}</td>
                      <td className="px-4 py-3 font-bold text-[#16A34A]">+{b.linked_leads}</td>
                      <td className="px-4 py-3 text-[#F59E0B]">{b.duplicate_leads}</td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#10B981] bg-[#F0FDF4] px-2 py-0.5 rounded-full border border-[#BBF7D0]">
                          Concluído
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
