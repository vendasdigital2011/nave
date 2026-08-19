"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { User, Upload, Plus, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

interface HeaderProps {
  onOpenImportModal?: () => void;
  onOpenAddModal?: () => void;
}

export function Header({ onOpenImportModal, onOpenAddModal }: HeaderProps) {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } catch {
      router.push("/login");
    }
  };

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-[#E2E8F0] bg-white px-4 md:px-6">
      <div className="flex items-center gap-4">
        <div className="flex flex-col">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">
            Painel do Operador
          </span>
          <h2 className="text-sm md:text-base font-bold text-[#0F172A]">
            Campanha Upgrade 100M
          </h2>
        </div>
      </div>

      <div className="flex items-center gap-2.5">
        {onOpenImportModal && (
          <Button
            variant="outline"
            size="sm"
            onClick={onOpenImportModal}
            className="flex items-center gap-1.5 text-xs font-medium border-[#E2E8F0] bg-white text-[#0F172A] hover:bg-[#F8FAFC]"
          >
            <Upload className="h-3.5 w-3.5 text-[#2563EB]" />
            <span className="hidden sm:inline">Importar Planilha</span>
          </Button>
        )}

        {onOpenAddModal && (
          <Button
            size="sm"
            onClick={onOpenAddModal}
            className="flex items-center gap-1.5 text-xs font-medium bg-[#2563EB] hover:bg-[#1D4ED8] text-white"
          >
            <Plus className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Novo Cliente</span>
          </Button>
        )}

        <div className="h-4 w-px bg-[#E2E8F0] mx-1" />

        {/* User Info */}
        <div className="flex items-center gap-2 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] px-2.5 py-1 text-xs">
          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#EFF6FF] text-[#2563EB] font-bold text-[10px]">
            AD
          </div>
          <span className="hidden sm:inline font-medium text-[#0F172A]">
            Admin
          </span>
        </div>

        {/* Logout Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLogout}
          className="text-xs text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#0F172A] px-2 py-1 flex items-center gap-1"
          title="Sair do Sistema"
        >
          <LogOut className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Sair</span>
        </Button>
      </div>
    </header>
  );
}
