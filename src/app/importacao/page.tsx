"use client";

import React, { useState, useRef } from "react";
import * as XLSX from "xlsx";
import {
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { DataService } from "@/lib/data-service";
import { ClientStatus } from "@/types/database";
import Link from "next/link";

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

export default function ImportacaoPage() {
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

  const processWorkbookData = (workbook: XLSX.WorkBook, fileName: string) => {
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
        condominium: "Condomínios Gerais",
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
      processWorkbookData(workbook, selectedFile.name);
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
    } catch (err: any) {
      setError("Erro ao salvar no banco de dados: " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-[#0F172A] tracking-tight">
          Importação de Planilhas
        </h1>
        <p className="text-xs md:text-sm text-[#64748B]">
          Carregue planilhas de clientes (XLSX, XLS ou CSV) para abastecer o funil comercial do NaveProspect.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Upload Box */}
        <div className="md:col-span-2 space-y-4">
          <Card className="bg-white border-[#E2E8F0] shadow-sm">
            <CardHeader>
              <CardTitle className="text-sm font-semibold text-[#0F172A] flex items-center gap-2">
                <FileSpreadsheet className="h-4 w-4 text-[#2563EB]" />
                Upload de Planilha
              </CardTitle>
              <CardDescription className="text-xs text-[#64748B]">
                Selecione a planilha com as colunas de clientes 50 Mega para processamento automático.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              {!file && (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-[#E2E8F0] bg-[#F8FAFC] p-10 text-center cursor-pointer hover:border-[#2563EB] hover:bg-[#EFF6FF]/40 transition-all group"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#EFF6FF] text-[#2563EB] mb-3 group-hover:scale-105 transition-transform">
                    <Upload className="h-6 w-6" />
                  </div>
                  <span className="text-xs font-semibold text-[#0F172A]">
                    Clique aqui ou arraste seu arquivo
                  </span>
                  <span className="text-[11px] text-[#64748B] mt-1">
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
                <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#2563EB] text-white font-bold">
                        <FileSpreadsheet className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-[#0F172A]">{file.name}</div>
                        <div className="text-[11px] text-[#64748B]">
                          {records.length} registros válidos identificados
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={resetState}
                      className="text-xs text-[#64748B] hover:text-rose-600"
                    >
                      Remover
                    </Button>
                  </div>

                  {records.length > 0 && !importedCount && (
                    <div className="border-t border-[#E2E8F0] pt-3">
                      <span className="text-xs font-semibold text-[#0F172A] block mb-2">
                        Prévia dos dados:
                      </span>
                      <div className="max-h-48 overflow-y-auto space-y-1.5 text-xs">
                        {records.slice(0, 5).map((r, i) => (
                          <div
                            key={i}
                            className="flex items-center justify-between bg-white p-2.5 rounded-lg border border-[#E2E8F0] text-[#0F172A]"
                          >
                            <span className="font-semibold truncate max-w-[200px]">{r.name}</span>
                            <span className="text-[#64748B] font-mono text-[11px]">{r.phone}</span>
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-[#F1F5F9] text-[#475569] uppercase">
                              {r.status}
                            </span>
                          </div>
                        ))}
                        {records.length > 5 && (
                          <div className="text-center text-[11px] text-[#64748B] py-1">
                            + {records.length - 5} outros clientes na lista
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {error && (
                    <div className="flex items-center gap-2 rounded-lg bg-rose-50 p-3 text-xs text-rose-700 border border-rose-200">
                      <AlertCircle className="h-4 w-4 shrink-0" />
                      <span>{error}</span>
                    </div>
                  )}

                  {importedCount !== null && (
                    <div className="flex flex-col items-center justify-center p-6 rounded-xl bg-emerald-50 border border-emerald-200 text-center space-y-2">
                      <CheckCircle2 className="h-8 w-8 text-emerald-600" />
                      <h3 className="text-xs font-bold text-emerald-900">
                        {importedCount} clientes importados com sucesso!
                      </h3>
                      <p className="text-[11px] text-emerald-700 max-w-sm">
                        Os contatos já estão disponíveis no Kanban e na lista de clientes.
                      </p>
                      <div className="flex gap-2 mt-2">
                        <Link href="/kanban">
                          <Button size="sm" className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-medium">
                            Ver no Kanban <ArrowRight className="ml-1 h-3 w-3" />
                          </Button>
                        </Link>
                        <Button variant="outline" size="sm" onClick={resetState} className="text-xs border-[#E2E8F0]">
                          Nova Importação
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>

            {records.length > 0 && importedCount === null && (
              <CardFooter className="border-t border-[#E2E8F0] pt-4 flex justify-end gap-2">
                <Button variant="outline" onClick={resetState} disabled={isLoading} className="text-xs border-[#E2E8F0]">
                  Cancelar
                </Button>
                <Button
                  onClick={handleImport}
                  disabled={isLoading}
                  className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-medium"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processando...
                    </>
                  ) : (
                    `Confirmar Importação (${records.length} Clientes)`
                  )}
                </Button>
              </CardFooter>
            )}
          </Card>
        </div>

        {/* Instructions */}
        <div className="space-y-4">
          <Card className="bg-white border-[#E2E8F0] shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-xs font-semibold text-[#0F172A]">
                Padrão de Colunas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs text-[#64748B]">
              <div className="p-2 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0]">
                <span className="font-semibold text-[#0F172A] block">Nome:</span>
                <span className="text-[11px] text-[#64748B]">Colunas com "CLIENTE", "NOME"</span>
              </div>
              <div className="p-2 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0]">
                <span className="font-semibold text-[#0F172A] block">Contato:</span>
                <span className="text-[11px] text-[#64748B]">Colunas com "CONTATO", "TELEFONE"</span>
              </div>
              <div className="p-2 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0]">
                <span className="font-semibold text-[#0F172A] block">Feedbacks:</span>
                <span className="text-[11px] text-[#64748B]">Colunas com "FEEDBECK", "OBS"</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
