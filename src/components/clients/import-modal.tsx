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
      let status: ClientStatus = "frio";

      if (feedbackKeys.length > 0) feedback1 = String(row[feedbackKeys[0]] || "");
      if (feedbackKeys.length > 1) feedback2 = String(row[feedbackKeys[1]] || "");

      const combinedFeed = (feedback1 + " " + feedback2).toLowerCase();
      if (combinedFeed.includes("desativ") || combinedFeed.includes("cancel")) {
        status = "desativado";
      } else if (combinedFeed.includes("vend") || combinedFeed.includes("fech") || combinedFeed.includes("instal")) {
        status = "vendido";
      } else if (combinedFeed.includes("interess") || combinedFeed.includes("quente")) {
        status = "quente";
      } else if (feedback1 || feedback2) {
        status = "morno";
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
      setError("Erro ao ler arquivo: " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImport = async () => {
    if (records.length === 0) return;
    setIsLoading(true);
    setError(null);

    try {
      const count = await DataService.importBulkClients(records);
      setImportedCount(count);
      onImportComplete?.();
      onImportSuccess?.();
    } catch (err: any) {
      setError("Erro ao salvar no banco de dados: " + err.message);
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
      <DialogContent className="max-w-lg bg-white border-[#E2E8F0] p-6 text-[#0B0B0D] rounded-2xl">
        <DialogHeader className="border-b border-[#E2E8F0] pb-3">
          <DialogTitle className="text-base font-bold text-[#0B0B0D] flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-[#FF6A00]" />
            Importar Clientes via Planilha
          </DialogTitle>
          <DialogDescription className="text-xs text-[#64748B]">
            Faça upload da planilha XLSX ou CSV de clientes. Os campos de Nome, Telefone e Feedbacks serão mapeados automaticamente.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-3">
          {!file && (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#E2E8F0] bg-[#F8FAFC] p-8 text-center cursor-pointer hover:border-[#FF6A00] hover:bg-[#FFF4EC]/30 transition-all group"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FFF4EC] text-[#FF6A00] mb-2 group-hover:scale-105 transition-transform border border-[#FFD0A8]">
                <Upload className="h-5 w-5" />
              </div>
              <span className="text-xs font-bold text-[#0B0B0D]">
                Clique aqui ou arraste seu arquivo
              </span>
              <span className="text-[10px] text-[#64748B] mt-0.5">
                Formatos suportados: .xlsx, .xls, .csv
              </span>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>
          )}

          {file && (
            <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-3 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#FF6A00] text-white font-bold">
                    <FileSpreadsheet className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-[#0B0B0D] truncate max-w-[200px]">
                      {file.name}
                    </div>
                    <div className="text-[10px] text-[#64748B]">
                      {records.length} clientes válidos identificados
                    </div>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={resetState}
                  className="text-xs text-[#64748B] hover:text-rose-600 h-7"
                >
                  Remover
                </Button>
              </div>

              {records.length > 0 && !importedCount && (
                <div className="border-t border-[#E2E8F0] pt-2">
                  <span className="text-[11px] font-bold text-[#0B0B0D] block mb-1">
                    Prévia ({records.length} clientes):
                  </span>
                  <div className="max-h-36 overflow-y-auto space-y-1 text-xs">
                    {records.slice(0, 4).map((r, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between bg-white p-2 rounded-lg border border-[#E2E8F0] text-[11px]"
                      >
                        <span className="font-bold truncate max-w-[140px]">{r.name}</span>
                        <span className="text-[#64748B] font-mono">{r.phone}</span>
                        <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-[#F1F5F9] text-[#475569] uppercase">
                          {r.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {error && (
                <div className="flex items-center gap-2 rounded-lg bg-rose-50 p-2.5 text-xs text-rose-700 border border-rose-200">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {importedCount !== null && (
                <div className="flex flex-col items-center justify-center p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-center space-y-1">
                  <CheckCircle2 className="h-7 w-7 text-emerald-600" />
                  <h4 className="text-xs font-bold text-emerald-900">
                    {importedCount} clientes importados com sucesso!
                  </h4>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="border-t border-[#E2E8F0] pt-3 flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="text-xs border-[#E2E8F0]"
          >
            {importedCount !== null ? "Fechar" : "Cancelar"}
          </Button>

          {records.length > 0 && importedCount === null && (
            <Button
              type="button"
              size="sm"
              onClick={handleImport}
              disabled={isLoading}
              className="bg-[#FF6A00] hover:bg-[#E85C00] text-white font-bold text-xs"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  Importando...
                </>
              ) : (
                `Importar ${records.length} Clientes`
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
