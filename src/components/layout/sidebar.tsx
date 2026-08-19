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
  Radio,
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
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-[#E2E8F0] bg-white text-[#0F172A] md:flex">
      {/* Brand Header */}
      <div className="flex h-16 items-center gap-3 border-b border-[#E2E8F0] px-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#2563EB] text-white shadow-sm">
          <Radio className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-base font-bold tracking-tight text-[#0F172A] flex items-center gap-1.5">
            <span>NAVETECH</span>
          </h1>
          <p className="text-[11px] text-[#64748B] font-medium">
            NaveProspect 100M
          </p>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto px-3 py-5">
        <div className="mb-2.5 px-3 text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">
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
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-[#EFF6FF] text-[#2563EB] font-semibold"
                    : "text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#0F172A]"
                )}
              >
                <Icon className={cn("h-4 w-4", isActive ? "text-[#2563EB]" : "text-[#64748B]")} />
                <span>{item.name}</span>
                {isActive && <ArrowUpRight className="ml-auto h-3.5 w-3.5 opacity-70" />}
              </Link>
            );
          })}
        </nav>

        <div className="mt-8 mb-2.5 px-3 text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">
          Campanha Ativa
        </div>
        <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-3.5 text-xs">
          <div className="flex items-center justify-between font-semibold text-[#0F172A] mb-1">
            <span>Upgrade 50M → 100M</span>
            <span className="rounded-md bg-[#EFF6FF] px-1.5 py-0.5 text-[10px] text-[#2563EB] font-semibold">
              Ativa
            </span>
          </div>
          <p className="text-[11px] text-[#64748B] leading-relaxed">
            Operação de migração de clientes em condomínios para 100 Mega.
          </p>
        </div>
      </div>

      {/* Bottom Status */}
      <div className="border-t border-[#E2E8F0] p-4">
        <div className="flex items-center gap-2.5 rounded-lg bg-[#F8FAFC] px-3 py-2 text-xs border border-[#E2E8F0]">
          <Database className="h-4 w-4 text-[#22C55E]" />
          <div className="flex flex-col">
            <span className="font-medium text-[#0F172A]">Supabase DB</span>
            <span className="text-[10px] text-[#64748B]">Online & Sincronizado</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
