"use client";

import React, { useState, useRef } from "react";
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
import { DataService } from "@/lib/data-service";
import { ClientStatus } from "@/types/database";

interface ImportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImportComplete?: () => void;
  onImportSuccess?: () => void;
}

interface ParsedRecord {
  name: string;
  phone: string;
  current_plan: string;
  target_plan: string;
  status: ClientStatus;
  feedback_first_contact?: string;
  feedback_second_contact?: string;
  notes?: string;
  wants_upgrade: boolean;
  gave_referral: boolean;
}

export function ImportModal({
  open,
  onOpenChange,
  onImportComplete,
  onImportSuccess,
}: ImportModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [records, setRecords] = useState<ParsedRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [importedCount, setImportedCount] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetState = () => {
    setFile(null);
    setRecords([]);
    setError(null);
    setImportedCount(null);
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

      const feedbackKeys = Object.keys(row).filter((k) =>
        k.toLowerCase().includes("feed") || k.toLowerCase().includes("obs") || k.toLowerCase().includes("status")
      );

      let feedback1 = "";
      let feedback2 = "";
      let status: ClientStatus = "importados";

      if (feedbackKeys.length > 0) feedback1 = String(row[feedbackKeys[0]] || "");
      if (feedbackKeys.length > 1) feedback2 = String(row[feedbackKeys[1]] || "");

      const combinedFeed = (feedback1 + " " + feedback2).toLowerCase();
      if (combinedFeed.includes("desativ") || combinedFeed.includes("cancel")) {
        status = "desativado";
      } else if (combinedFeed.includes("vend") || combinedFeed.includes("fech") || combinedFeed.includes("instal")) {
        status = "vendido";
      } else if (combinedFeed.includes("interess") || combinedFeed.includes("quente")) {
        status = "quente";
      } else if (combinedFeed.includes("morno") || combinedFeed.includes("convers")) {
        status = "morno";
      } else if (combinedFeed.includes("iniciad") || combinedFeed.includes("enviad")) {
        status = "frio";
      } else {
        status = "importados";
      }

      parsed.push({
        name: name || "Cliente sem Nome",
        phone: rawPhone,
        current_plan: "50 Mega",
        target_plan: "100 Mega",
        status,
        feedback_first_contact: feedback1 || undefined,
        feedback_second_contact: feedback2 || undefined,
        notes: feedback1 || feedback2 ? `Feedback: ${[feedback1, feedback2].filter(Boolean).join(" | ")}` : undefined,
        wants_upgrade: status === "quente" || status === "vendido",
        gave_referral: false,
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
      console.error(err);
      setError("Erro ao ler o arquivo Excel. Verifique a extensão (.xlsx, .csv, .xls).");
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmImport = async () => {
    if (records.length === 0) return;
    setIsLoading(true);

    try {
      const count = await DataService.importBulkClients(records);
      setImportedCount(count);
      onImportComplete?.();
      onImportSuccess?.();
    } catch (err: any) {
      console.error(err);
      setError("Falha ao salvar clientes no banco de dados.");
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
            Importar Planilha de Clientes
          </DialogTitle>
          <DialogDescription className="text-xs text-[#64748B]">
            Selecione uma planilha Excel (.xlsx, .csv) contendo os nomes e telefones dos clientes.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          {importedCount === null ? (
            <>
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
                  Suporta arquivos .xlsx, .xls e .csv com colunas Nome e Telefone
                </p>
              </div>

              {/* Error Alert */}
              {error && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Preview records */}
              {records.length > 0 && !error && (
                <div className="p-3 rounded-xl bg-[#FFF7F1] border border-[#FFD0A8] text-xs text-[#0B0B0D] space-y-1">
                  <div className="font-bold text-[#FF6A00] flex items-center justify-between">
                    <span>Pronto para importar</span>
                    <span>{records.length} contatos encontrados</span>
                  </div>
                  <p className="text-[11px] text-[#64748B]">
                    Exemplo: {records[0].name} ({records[0].phone}) → Status: Importados
                  </p>
                </div>
              )}
            </>
          ) : (
            /* Success Feedback */
            <div className="py-6 text-center space-y-3">
              <div className="h-12 w-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="h-7 w-7" />
              </div>
              <h3 className="text-sm font-bold text-[#0B0B0D]">
                Importação Concluída com Sucesso!
              </h3>
              <p className="text-xs text-[#64748B]">
                {importedCount} clientes foram adicionados na coluna <strong>Importados</strong> e já estão disponíveis no Kanban.
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="border-t border-[#E2E8F0] pt-3 flex justify-end gap-2">
          {importedCount === null ? (
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
                className="bg-[#FF6A00] hover:bg-[#E85C00] text-white font-bold text-xs min-w-[100px]"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  `Importar ${records.length > 0 ? records.length : ""} Clientes`
                )}
              </Button>
            </>
          ) : (
            <Button
              type="button"
              size="sm"
              onClick={() => {
                resetState();
                onOpenChange(false);
              }}
              className="bg-[#FF6A00] hover:bg-[#E85C00] text-white font-bold text-xs"
            >
              Concluir
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
