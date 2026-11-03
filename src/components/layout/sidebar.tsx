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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { AuthUser } from "@/lib/auth-constants";

const navigationItems = [
  {
    name: "Dashboard",
    href: "/",
    icon: LayoutDashboard,
  },
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
    name: "Conversas",
    href: "/conversas",
    icon: MessageSquare,
  },
  {
    name: "Meu WhatsApp",
    href: "/whatsapp",
    icon: QrCode,
  },
  {
    name: "Importação",
    href: "/importacao",
    icon: Upload,
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

  const visibleItems = navigationItems.filter((item) => {
    if (item.adminOnly && currentUser && currentUser.role === "seller") {
      return false;
    }
    return true;
  });

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
          CRM
        </span>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto px-3 py-5">
        <div className="mb-2.5 px-3 text-[11px] font-bold uppercase tracking-wider text-[#64748B]">
          Menu Principal
        </div>
        <nav className="space-y-1">
          {visibleItems.map((item) => {
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
                <Icon
                  className={cn(
                    "h-4 w-4",
                    isActive ? "text-[#FF6A00]" : "text-[#64748B]"
                  )}
                />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer System Status */}
      <div className="border-t border-[#E2E8F0] p-4">
        <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748B]">
              Ambiente
            </span>
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#10B981]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#10B981] animate-pulse" />
              Online
            </span>
          </div>
          <div className="mt-2 text-xs font-bold text-[#0B0B0D]">
            Navetech Telecom
          </div>
          <div className="text-[11px] text-[#64748B] truncate">
            {currentUser?.email || "NaveProspect CRM"}
          </div>
        </div>
      </div>
    </aside>
  );
}
