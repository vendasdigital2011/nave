"use client";

import React, { useState, useEffect, useRef } from "react";
import * as XLSX from "xlsx";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { Campaign } from "@/types/database";

interface ImportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImportComplete?: () => void;
  onImportSuccess?: () => void;
  defaultCampaignId?: string;
}

interface ParsedRecord {
  name: string;
  phone: string;
  condominium?: string;
  notes?: string;
}

export function ImportModal({
  open,
  onOpenChange,
  onImportComplete,
  onImportSuccess,
  defaultCampaignId = "c0000000-0000-0000-0000-000000000001",
}: ImportModalProps) {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [campaignId, setCampaignId] = useState(defaultCampaignId);
  const [file, setFile] = useState<File | null>(null);
  const [records, setRecords] = useState<ParsedRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [importedSummary, setImportedSummary] = useState<any | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      fetch("/api/campaigns")
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data?.success && data.campaigns && data.campaigns.length > 0) {
            setCampaigns(data.campaigns);
          }
        })
        .catch(() => {});
    }
  }, [open]);

  const resetState = () => {
    setFile(null);
    setRecords([]);
    setError(null);
    setImportedSummary(null);
    setIsLoading(false);
  };

  const processWorkbookData = (workbook: XLSX.WorkBook) => {
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const rawJson = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, { defval: "" });

    if (rawJson.length === 0) {
      setError("A planilha está vazia.");
      setIsLoading(false);
      return;
    }

    const parsed: ParsedRecord[] = [];

    for (const row of rawJson) {
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
      const rawPhone = phoneKey ? String(row[phoneKey]).trim() : "";

      if (!name && !rawPhone) continue;

      const condKey = Object.keys(row).find((k) => k.toLowerCase().includes("condom") || k.toLowerCase().includes("bairro"));
      const notesKey = Object.keys(row).find((k) => k.toLowerCase().includes("obs") || k.toLowerCase().includes("feed"));

      parsed.push({
        name: name || "Cliente",
        phone: rawPhone,
        condominium: condKey ? String(row[condKey]).trim() : "Geral",
        notes: notesKey ? String(row[notesKey]).trim() : undefined,
      });
    }

    if (parsed.length === 0) {
      setError("Não foram encontradas colunas de Nome e Telefone válidas.");
    } else {
      setRecords(parsed);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setIsLoading(true);

    try {
      const buffer = await selectedFile.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: "array" });
      processWorkbookData(workbook);
    } catch (err: any) {
      setError("Erro ao ler a planilha (.xlsx, .csv).");
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmImport = async () => {
    if (records.length === 0) return;
    setIsLoading(true);
    setError(null);

    try {
      const targetCampId = campaignId || "c0000000-0000-0000-0000-000000000001";
      const res = await fetch(`/api/campaigns/${targetCampId}/imports`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          file_name: file?.name || "planilha.xlsx",
          rows: records,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setImportedSummary(data.summary);
        onImportComplete?.();
        onImportSuccess?.();
      } else {
        setError(data.error || "Falha na importação do lote.");
      }
    } catch (err: any) {
      setError("Erro de conexão ao salvar clientes.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(val) => {
        if (!val) resetState();
        onOpenChange(val);
      }}
    >
      <DialogContent className="max-w-md bg-white border-[#E2E8F0] p-6 text-[#0B0B0D] rounded-2xl">
        <DialogHeader className="border-b border-[#E2E8F0] pb-3">
          <DialogTitle className="text-base font-bold text-[#0B0B0D] flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-[#FF6A00]" />
            Importar Lote de Clientes
          </DialogTitle>
          <DialogDescription className="text-xs text-[#64748B]">
            Selecione a campanha e envie o arquivo Excel/CSV com deduplicação automática.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          {importedSummary === null ? (
            <>
              {/* Campaign Selector */}
              {campaigns.length > 0 && (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#0B0B0D]">Campanha de Destino</label>
                  <select
                    value={campaignId}
                    onChange={(e) => setCampaignId(e.target.value)}
                    className="w-full h-10 px-3 text-xs sm:text-sm font-semibold border border-[#E2E8F0] rounded-xl bg-white text-[#0B0B0D] focus:outline-[#FF6A00]"
                  >
                    {campaigns.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Dropzone */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-[#E2E8F0] hover:border-[#FF6A00] hover:bg-[#FFF7F1] rounded-2xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center space-y-2 bg-[#F8FAFC]"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <div className="h-10 w-10 rounded-full bg-white border border-[#E2E8F0] flex items-center justify-center text-[#FF6A00] shadow-xs">
                  <Upload className="h-5 w-5" />
                </div>
                <div className="text-xs font-bold text-[#0B0B0D]">
                  {file ? file.name : "Clique para selecionar a planilha"}
                </div>
                <p className="text-[11px] text-[#64748B]">
                  Formatos aceitos: .xlsx, .xls, .csv
                </p>
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {records.length > 0 && (
                <div className="rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] p-3 text-xs space-y-1">
                  <div className="font-bold text-[#0B0B0D]">
                    {records.length} registros prontos para validação
                  </div>
                  <div className="text-[11px] text-[#64748B]">
                    Amostra: {records[0].name} ({records[0].phone})
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="py-4 text-center space-y-3">
              <div className="h-12 w-12 rounded-full bg-[#ECFDF5] text-[#059669] flex items-center justify-center mx-auto">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <h3 className="font-bold text-sm text-[#0B0B0D]">
                Lote Processado com Sucesso!
              </h3>
              <div className="text-xs text-[#64748B] space-y-1">
                <p>
                  <strong>+{importedSummary.linked_leads}</strong> novos leads vinculados ao funil.
                </p>
                <p>
                  <strong>{importedSummary.duplicate_leads}</strong> registros repetidos preservados.
                </p>
                {importedSummary.rejected_rows > 0 && (
                  <p className="text-rose-600">
                    {importedSummary.rejected_rows} linhas ignoradas por telefone inválido.
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="border-t border-[#E2E8F0] pt-3 flex gap-2">
          {importedSummary === null ? (
            <>
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
                disabled={records.length === 0 || isLoading}
                onClick={handleConfirmImport}
                className="bg-[#FF6A00] hover:bg-[#E85C00] text-white font-bold text-xs"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
                    Processando...
                  </>
                ) : (
                  "Confirmar Importação"
                )}
              </Button>
            </>
          ) : (
            <Button
              type="button"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="bg-[#0B0B0D] hover:bg-[#1E293B] text-white font-bold text-xs w-full"
            >
              Fechar
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
