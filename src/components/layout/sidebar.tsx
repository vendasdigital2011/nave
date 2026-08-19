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
  ArrowUpRight,
  Database,
} from "lucide-react";
import { cn } from "@/lib/utils";

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
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-[#E2E8F0] bg-white text-[#0B0B0D] md:flex">
      {/* Brand Header with Navetech Symbol */}
      <div className="flex h-18 items-center justify-between border-b border-[#E2E8F0] px-6 py-4">
        <Link href="/" className="flex items-center gap-3">
          <img
            src="/images/brand/logo.png"
            alt="Navetech Telecom"
            className="h-8 w-8 rounded-lg object-contain shadow-xs"
          />
          <div>
            <h1 className="text-base font-black tracking-tight text-[#0B0B0D] leading-none">
              NAVETECH
            </h1>
            <p className="text-[10px] text-[#FF6A00] font-bold mt-0.5">
              NaveProspect
            </p>
          </div>
        </Link>
        <span className="rounded-md bg-[#FFF4EC] text-[#FF6A00] text-[10px] font-bold px-1.5 py-0.5 border border-[#FFD0A8]">
          100M
        </span>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto px-3 py-5">
        <div className="mb-2.5 px-3 text-[11px] font-bold uppercase tracking-wider text-[#64748B]">
          Menu Principal
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
                  "flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-all",
                  isActive
                    ? "bg-[#FFF4EC] text-[#FF6A00] border border-[#FFD0A8] font-bold shadow-xs"
                    : "text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#0B0B0D]"
                )}
              >
                <Icon className={cn("h-4 w-4", isActive ? "text-[#FF6A00]" : "text-[#64748B]")} />
                <span>{item.name}</span>
                {isActive && <ArrowUpRight className="ml-auto h-3.5 w-3.5 text-[#FF6A00]" />}
              </Link>
            );
          })}
        </nav>

        {/* Card Principal Atualizado */}
        <div className="mt-8 mb-2.5 px-3 text-[11px] font-bold uppercase tracking-wider text-[#64748B]">
          Campanha Ativa
        </div>
        <div className="rounded-2xl border border-[#FFD0A8] bg-[#FFF7F1] p-4 text-xs">
          <div className="flex items-center justify-between font-bold text-[#0B0B0D] mb-1.5">
            <span>Campanha Ativa</span>
            <span className="rounded-full bg-[#FF6A00] text-white px-2 py-0.5 text-[10px] font-bold">
              Ativa
            </span>
          </div>
          <p className="text-[11px] text-[#64748B] leading-relaxed">
            Objetivo: Upgrade de 50 Mega para 100 Mega, troca de roteador e aplicação de NPS para geração de indicações através do programa Indique e Ganhe.
          </p>
        </div>
      </div>

      {/* Bottom Status Atualizado: Sistema - Sincronizado */}
      <div className="border-t border-[#E2E8F0] p-4">
        <div className="flex items-center gap-2.5 rounded-xl bg-[#F8FAFC] px-3.5 py-2.5 text-xs border border-[#E2E8F0]">
          <Database className="h-4 w-4 text-[#FF6A00] animate-pulse" />
          <div className="flex flex-col">
            <span className="font-bold text-[#0B0B0D]">Sistema</span>
            <span className="text-[10px] text-[#16A34A] font-semibold">Sincronizado</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
