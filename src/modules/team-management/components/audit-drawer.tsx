"use client";

import React from "react";
import { TeamAuditEvent } from "../types";
import { X, History, RefreshCw, Clock, ArrowRight } from "lucide-react";

interface AuditDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  events: TeamAuditEvent[];
  isLoading: boolean;
  onRefresh: () => void;
}

export function AuditDrawer({
  isOpen,
  onClose,
  events,
  isLoading,
  onRefresh,
}: AuditDrawerProps) {
  if (!isOpen) return null;

  const getActionLabel = (action: string) => {
    switch (action) {
      case "team.member_invited":
        return { label: "Convite Enviado", color: "bg-blue-100 text-blue-800" };
      case "team.member_updated":
        return { label: "Perfil/Status Alterado", color: "bg-amber-100 text-amber-800" };
      case "team.invite_resent":
        return { label: "Convite Reenviado", color: "bg-purple-100 text-purple-800" };
      case "team.account_activated":
        return { label: "Conta Ativada", color: "bg-emerald-100 text-emerald-800" };
      default:
        return { label: action, color: "bg-zinc-100 text-zinc-800" };
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl border-l border-zinc-200 flex flex-col">
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-zinc-200 flex items-center justify-between bg-zinc-50/70">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-orange-100 rounded-lg text-orange-600">
                <History className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-zinc-900">
                  Trilha de Auditoria
                </h3>
                <p className="text-xs text-zinc-500">
                  Histórico de ações no módulo de equipe
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={onRefresh}
                disabled={isLoading}
                title="Atualizar logs"
                className="p-1.5 text-zinc-500 hover:text-zinc-800 rounded-lg hover:bg-zinc-200/60 transition"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
              </button>
              <button
                onClick={onClose}
                aria-label="Fechar gaveta"
                className="p-1.5 text-zinc-500 hover:text-zinc-800 rounded-lg hover:bg-zinc-200/60 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Lista de Eventos */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-16 text-zinc-500 gap-2">
                <RefreshCw className="w-6 h-6 animate-spin text-orange-500" />
                <span className="text-xs">Carregando trilha de auditoria...</span>
              </div>
            ) : events.length === 0 ? (
              <div className="text-center py-16 text-zinc-400">
                <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm font-medium text-zinc-600">
                  Nenhum evento registrado
                </p>
                <p className="text-xs text-zinc-400 mt-1">
                  Ações como convites, alterações de perfil e ativações aparecerão aqui.
                </p>
              </div>
            ) : (
              events.map((ev) => {
                const badge = getActionLabel(ev.action);
                return (
                  <div
                    key={ev.id}
                    className="p-3.5 bg-zinc-50/70 border border-zinc-200 rounded-xl space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold ${badge.color}`}
                      >
                        {badge.label}
                      </span>
                      <span className="text-[11px] text-zinc-400">
                        {new Date(ev.created_at).toLocaleString("pt-BR", {
                          day: "2-digit",
                          month: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>

                    {/* Detalhes antes / depois */}
                    {ev.before_data && ev.after_data && (
                      <div className="bg-white p-2.5 rounded-lg border border-zinc-100 space-y-1 text-zinc-700 font-mono text-[11px]">
                        {Object.keys(ev.after_data).map((key) => {
                          const beforeVal = ev.before_data?.[key];
                          const afterVal = ev.after_data?.[key];
                          if (beforeVal === afterVal) return null;
                          return (
                            <div key={key} className="flex items-center gap-1.5">
                              <span className="text-zinc-400">{key}:</span>
                              <span className="text-red-600 line-through">
                                {String(beforeVal ?? "—")}
                              </span>
                              <ArrowRight className="w-3 h-3 text-zinc-400" />
                              <span className="text-emerald-700 font-bold">
                                {String(afterVal ?? "—")}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {!ev.before_data && ev.after_data && (
                      <div className="bg-white p-2.5 rounded-lg border border-zinc-100 text-zinc-700 font-mono text-[11px]">
                        {Object.entries(ev.after_data).map(([k, v]) => (
                          <div key={k} className="truncate">
                            <span className="text-zinc-400">{k}: </span>
                            <span className="text-zinc-800">{String(v)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
