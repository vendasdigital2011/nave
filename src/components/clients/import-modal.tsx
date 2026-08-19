"use client";

import React, { useState, useRef } from "react";
import * as XLSX from "xlsx";
import { Upload, FileSpreadsheet, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { DataService } from "@/lib/data-service";
import { Client, ClientStatus } from "@/types/database";

interface ImportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImportSuccess?: () => void;
}

interface ParsedRecord {
  name: string;
  phone: string;
  condominium?: string;
  current_plan: string;
  target_plan: string;
  status: ClientStatus;
  feedback_first_contact?: string;
  feedback_second_contact?: string;
  notes?: string;
  wants_upgrade: boolean;
  gave_referral: boolean;
}

export function ImportModal({ open, onOpenChange, onImportSuccess }: ImportModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [records, setRecords] = useState<ParsedRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successCount, setSuccessCount] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetState = () => {
    setFile(null);
    setRecords([]);
    setError(null);
    setSuccessCount(null);
    setIsLoading(false);
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
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const rawJson = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, { defval: "" });

      if (rawJson.length === 0) {
        setError("A planilha está vazia ou não possui linhas válidas.");
        setIsLoading(false);
        return;
      }

      const parsed: ParsedRecord[] = [];

      for (const row of rawJson) {
        // Encontra coluna de Nome de forma flexível
        const nameKey = Object.keys(row).find(
          (k) =>
            k.toLowerCase().includes("cliente") ||
            k.toLowerCase().includes("nome") ||
            k.toLowerCase().includes("name")
        );
        const name = nameKey ? String(row[nameKey]).trim() : "";

        // Encontra coluna de Contato/Telefone
        const phoneKey = Object.keys(row).find(
          (k) =>
            k.toLowerCase().includes("contato") ||
            k.toLowerCase().includes("telefone") ||
            k.toLowerCase().includes("whatsapp") ||
            k.toLowerCase().includes("celular")
        );
        const rawPhone = phoneKey ? String(row[phoneKey]).trim() : "";

        // Se não tiver nome e telefone mínimos, ignora linha em branco
        if (!name && !rawPhone) continue;

        // Feedback / Observações
        const feedbackKeys = Object.keys(row).filter((k) =>
          k.toLowerCase().includes("feed") || k.toLowerCase().includes("obs") || k.toLowerCase().includes("status")
        );

        let feedback1 = "";
        let feedback2 = "";
        let status: ClientStatus = "frio";

        if (feedbackKeys.length > 0) {
          feedback1 = String(row[feedbackKeys[0]] || "");
        }
        if (feedbackKeys.length > 1) {
          feedback2 = String(row[feedbackKeys[1]] || "");
        }

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
          condominium: "Condomínios Gerais",
          current_plan: "50 Mega",
          target_plan: "100 Mega",
          status,
          feedback_first_contact: feedback1 || undefined,
          feedback_second_contact: feedback2 || undefined,
          notes: feedback1 || feedback2 ? `Feedback importado: ${[feedback1, feedback2].filter(Boolean).join(" | ")}` : undefined,
          wants_upgrade: status === "quente" || status === "vendido",
          gave_referral: false,
        });
      }

      if (parsed.length === 0) {
        setError("Não foi possível identificar colunas de Nome e Telefone na planilha.");
      } else {
        setRecords(parsed);
      }
    } catch (err: any) {
      console.error(err);
      setError("Erro ao processar o arquivo: " + (err.message || "Formato inválido"));
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
      setSuccessCount(count);
      setTimeout(() => {
        onOpenChange(false);
        resetState();
        if (onImportSuccess) onImportSuccess();
      }, 1500);
    } catch (err: any) {
      setError("Erro ao salvar registros: " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) resetState();
        onOpenChange(isOpen);
      }}
    >
      <DialogClose onClick={() => onOpenChange(false)} />
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2 text-slate-900">
          <FileSpreadsheet className="h-5 w-5 text-blue-600" />
          Importar Planilha de Clientes
        </DialogTitle>
        <DialogDescription>
          Faça upload da planilha XLSX ou CSV de clientes (ex: CONDOMINIOS.xlsx). Os campos de Nome, Telefone e Feedbacks serão mapeados automaticamente.
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4 py-2">
        {!file && (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50/50 p-8 text-center cursor-pointer hover:border-blue-500 hover:bg-blue-50/30 transition-all"
          >
            <Upload className="h-10 w-10 text-blue-600 mb-2" />
            <span className="text-sm font-semibold text-slate-800">
              Clique para selecionar o arquivo
            </span>
            <span className="text-xs text-slate-500 mt-1">
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

        {file && !successCount && (
          <div className="rounded-lg border bg-slate-50 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileSpreadsheet className="h-6 w-6 text-blue-600" />
                <div>
                  <div className="text-sm font-semibold text-slate-800">{file.name}</div>
                  <div className="text-xs text-slate-500">
                    {records.length} clientes identificados para importação
                  </div>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={resetState}
                className="text-xs text-slate-500 hover:text-red-600"
              >
                Trocar arquivo
              </Button>
            </div>

            {records.length > 0 && (
              <div className="mt-4 border-t pt-3">
                <div className="text-xs font-semibold text-slate-700 mb-2">
                  Prévia dos primeiros registros:
                </div>
                <div className="max-h-36 overflow-y-auto space-y-1.5 text-xs text-slate-600">
                  {records.slice(0, 5).map((r, i) => (
                    <div key={i} className="flex justify-between items-center bg-white p-2 rounded border">
                      <span className="font-medium truncate max-w-[180px]">{r.name}</span>
                      <span className="text-slate-500">{r.phone}</span>
                      <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-slate-100">
                        {r.status}
                      </span>
                    </div>
                  ))}
                  {records.length > 5 && (
                    <div className="text-center text-[11px] text-slate-400">
                      + outros {records.length - 5} clientes
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 rounded-lg bg-red-50 p-3 text-xs text-red-700 border border-red-200">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successCount !== null && (
          <div className="flex items-center gap-2 rounded-lg bg-emerald-50 p-4 text-sm text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
            <span className="font-medium">
              Sucesso! {successCount} clientes importados com sucesso.
            </span>
          </div>
        )}
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
          Cancelar
        </Button>
        {records.length > 0 && !successCount && (
          <Button
            onClick={handleImport}
            disabled={isLoading}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Importando...
              </>
            ) : (
              `Importar ${records.length} Clientes`
            )}
          </Button>
        )}
      </DialogFooter>
    </Dialog>
  );
}
