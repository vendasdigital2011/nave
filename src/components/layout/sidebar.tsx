"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Kanban,
  MessageSquare,
  Upload,
  Settings,
  QrCode,
  ShieldCheck,
  Layers,
  CalendarCheck,
  BarChart3,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { AuthUser } from "@/lib/auth-constants";

interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
  adminOnly?: boolean;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const navigationSections: NavSection[] = [
  {
    title: "Visão Geral",
    items: [
      {
        name: "Dashboard",
        href: "/",
        icon: LayoutDashboard,
      },
      {
        name: "Meu Dia",
        href: "/meu-dia",
        icon: CalendarCheck,
      },
    ],
  },
  {
    title: "Comercial",
    items: [
      {
        name: "Campanhas",
        href: "/campanhas",
        icon: Layers,
      },
      {
        name: "Kanban",
        href: "/kanban",
        icon: Kanban,
      },
      {
        name: "Clientes",
        href: "/clientes",
        icon: Users,
      },
      {
        name: "Importação",
        href: "/importacao",
        icon: Upload,
      },
    ],
  },
  {
    title: "Atendimento",
    items: [
      {
        name: "Conversas",
        href: "/conversas",
        icon: MessageSquare,
      },
      {
        name: "Meu WhatsApp",
        href: "/whatsapp",
        icon: QrCode,
      },
    ],
  },
  {
    title: "Gestão & Inteligência",
    items: [
      {
        name: "Relatórios & Métricas",
        href: "/metricas",
        icon: BarChart3,
      },
      {
        name: "Equipe & RBAC",
        href: "/usuarios",
        icon: ShieldCheck,
        adminOnly: true,
      },
      {
        name: "Configurações",
        href: "/configuracoes",
        icon: Settings,
      },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.success && data.user) {
          setCurrentUser(data.user);
        }
      })
      .catch(() => {});
  }, []);

  const isSeller = currentUser?.role === "seller";

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-[#E2E8F0] bg-white text-[#0B0B0D] md:flex">
      {/* Brand Header */}
      <div className="flex h-16 items-center justify-between border-b border-[#E2E8F0] px-6 py-4">
        <Link href="/" className="flex items-center gap-2.5">
          <img
            src="/images/brand/logo.png"
            alt="Navetech Telecom"
            className="h-7 w-7 rounded-lg object-contain shadow-2xs"
          />
          <div>
            <h1 className="text-sm font-black tracking-tight text-[#0B0B0D] leading-none">
              NAVETECH
            </h1>
            <p className="text-[10px] text-[#FF6A00] font-bold mt-0.5">
              NaveProspect CRM
            </p>
          </div>
        </Link>
        <span className="rounded-md bg-[#FFF4EC] text-[#FF6A00] text-[10px] font-bold px-1.5 py-0.5 border border-[#FFD0A8]">
          v2.0
        </span>
      </div>

      {/* Navigation Sections */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
        {navigationSections.map((section) => {
          const visibleItems = section.items.filter((item) => {
            if (item.adminOnly && isSeller) return false;
            return true;
          });

          if (visibleItems.length === 0) return null;

          return (
            <div key={section.title} className="space-y-1">
              <div className="px-3 text-[10px] font-bold uppercase tracking-wider text-[#94A3B8]">
                {section.title}
              </div>
              <nav className="space-y-0.5">
                {visibleItems.map((item) => {
                  const isActive = pathname === item.href;
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={cn(
                        "flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold transition-all",
                        isActive
                          ? "bg-[#FFF4EC] text-[#FF6A00] border border-[#FFD0A8] font-bold shadow-2xs"
                          : "text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#0B0B0D]"
                      )}
                    >
                      <Icon
                        className={cn(
                          "h-4 w-4 shrink-0",
                          isActive ? "text-[#FF6A00]" : "text-[#64748B]"
                        )}
                      />
                      <span className="truncate">{item.name}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>
          );
        })}
      </div>

      {/* Footer System Status */}
      <div className="border-t border-[#E2E8F0] p-3.5">
        <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748B]">
              Ambiente Cloud
            </span>
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#10B981]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#10B981] animate-pulse" />
              Conectado
            </span>
          </div>
          <div className="mt-1.5 text-xs font-bold text-[#0B0B0D] truncate">
            {currentUser?.name || "Operador Navetech"}
          </div>
          <div className="text-[10px] text-[#64748B] truncate">
            {currentUser?.email || "vendas@navetech.com.br"}
          </div>
        </div>
      </div>
    </aside>
  );
}
