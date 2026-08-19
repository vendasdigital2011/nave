"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { User, Bell, Upload, Plus, LogOut } from "lucide-react";
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
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b bg-background/95 px-4 md:px-6 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex items-center gap-4 md:gap-6">
        <div className="flex flex-col">
          <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            Painel do Operador
          </span>
          <h2 className="text-sm md:text-base font-extrabold text-foreground">
            Campanha Upgrade 100M
          </h2>
        </div>
      </div>

      <div className="flex items-center gap-2 md:gap-3">
        {onOpenImportModal && (
          <Button
            variant="outline"
            size="sm"
            onClick={onOpenImportModal}
            className="flex items-center gap-1.5 text-xs font-medium border-slate-300 hover:bg-slate-100"
          >
            <Upload className="h-3.5 w-3.5 text-blue-600" />
            <span className="hidden sm:inline">Importar Planilha</span>
          </Button>
        )}

        {onOpenAddModal && (
          <Button
            size="sm"
            onClick={onOpenAddModal}
            className="flex items-center gap-1.5 text-xs font-medium bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Plus className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Novo Cliente</span>
          </Button>
        )}

        <div className="h-4 w-px bg-border mx-1" />

        {/* User Info */}
        <div className="flex items-center gap-2 rounded-full border bg-card px-2.5 py-1 text-xs">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-blue-700 font-bold text-[10px]">
            AD
          </div>
          <span className="hidden sm:inline font-semibold text-slate-700">
            Admin
          </span>
        </div>

        {/* Logout Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLogout}
          className="text-xs text-rose-600 hover:bg-rose-50 hover:text-rose-700 px-2 py-1 flex items-center gap-1"
          title="Sair do Sistema"
        >
          <LogOut className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Sair</span>
        </Button>
      </div>
    </header>
  );
}
