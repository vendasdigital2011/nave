"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Upload, Plus, LogOut } from "lucide-react";
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
      <div className="flex items-center gap-3">
        {/* Mobile Logo */}
        <div className="flex md:hidden items-center">
          <img
            src="/images/brand/navetech-logo.webp"
            alt="Navetech"
            className="h-6 w-auto object-contain"
          />
        </div>
        <div className="hidden md:flex flex-col">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B]">
            Painel do Operador
          </span>
          <h2 className="text-sm md:text-base font-bold text-[#0B0B0D]">
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
            className="flex items-center gap-1.5 text-xs font-semibold border-[#E2E8F0] bg-white text-[#0B0B0D] hover:bg-[#F8FAFC]"
          >
            <Upload className="h-3.5 w-3.5 text-[#FF6A00]" />
            <span className="hidden sm:inline">Importar Planilha</span>
          </Button>
        )}

        {onOpenAddModal && (
          <Button
            size="sm"
            onClick={onOpenAddModal}
            className="flex items-center gap-1.5 text-xs font-bold bg-[#FF6A00] hover:bg-[#E85C00] text-white shadow-xs"
          >
            <Plus className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Novo Cliente</span>
          </Button>
        )}

        <div className="h-4 w-px bg-[#E2E8F0] mx-1" />

        {/* User Info */}
        <div className="flex items-center gap-2 rounded-xl border border-[#FFD0A8] bg-[#FFF4EC] px-2.5 py-1 text-xs">
          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#FF6A00] text-white font-bold text-[10px]">
            OP
          </div>
          <span className="hidden sm:inline font-bold text-[#FF6A00]">
            Operador
          </span>
        </div>

        {/* Logout Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLogout}
          className="text-xs text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#0B0B0D] px-2 py-1 flex items-center gap-1"
          title="Sair do Sistema"
        >
          <LogOut className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Sair</span>
        </Button>
      </div>
    </header>
  );
}
