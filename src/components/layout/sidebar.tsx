"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Kanban,
  MessageSquare,
  Upload,
  Settings,
  Zap,
  ArrowUpRight,
  Database,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Itens oficiais do menu conforme docs/DESIGN-SYSTEM-NAVETECH.md
const navigationItems = [
  {
    name: "Dashboard",
    href: "/",
    icon: LayoutDashboard,
  },
  {
    name: "Clientes",
    href: "/clientes",
    icon: Users,
  },
  {
    name: "Kanban",
    href: "/kanban",
    icon: Kanban,
  },
  {
    name: "Conversas",
    href: "/conversas",
    icon: MessageSquare,
  },
  {
    name: "Importação",
    href: "/importacao",
    icon: Upload,
  },
  {
    name: "Configurações",
    href: "/configuracoes",
    icon: Settings,
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-slate-800 bg-[#0F172A] text-white md:flex">
      {/* Brand Header */}
      <div className="flex h-16 items-center gap-3 border-b border-slate-800 px-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#2563EB] font-bold text-white shadow-lg shadow-blue-500/30">
          <Zap className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-base font-bold tracking-tight text-white">
            NaveProspect
          </h1>
          <p className="text-[11px] text-blue-400 font-medium">
            Navetech CRM
          </p>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto px-3 py-4">
        <div className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          Navegação Principal
        </div>
        <nav className="space-y-1">
          {navigationItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                  isActive
                    ? "bg-[#2563EB] text-white shadow-md shadow-blue-600/20 font-semibold"
                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                )}
              >
                <Icon className={cn("h-4 w-4", isActive ? "text-white" : "text-slate-400")} />
                <span>{item.name}</span>
                {isActive && <ArrowUpRight className="ml-auto h-3 w-3 opacity-60" />}
              </Link>
            );
          })}
        </nav>

        <div className="mt-8 mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          Campanha Ativa
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-800/60 p-3.5 text-xs">
          <div className="flex items-center justify-between font-semibold text-slate-200 mb-1">
            <span>Upgrade 50M → 100M</span>
            <span className="rounded bg-blue-500/20 px-1.5 py-0.5 text-[10px] text-blue-300 font-bold">
              Ativa
            </span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Operação de migração de clientes em condomínios para dobro de velocidade.
          </p>
        </div>
      </div>

      {/* Bottom Status */}
      <div className="border-t border-slate-800 p-4">
        <div className="flex items-center gap-2.5 rounded-lg bg-slate-800/80 px-3 py-2 text-xs">
          <Database className="h-4 w-4 text-emerald-400 animate-pulse" />
          <div className="flex flex-col">
            <span className="font-medium text-slate-200">Supabase DB</span>
            <span className="text-[10px] text-emerald-400">Online & Sincronizado</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
