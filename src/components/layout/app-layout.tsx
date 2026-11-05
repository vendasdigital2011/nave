"use client";

import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "./sidebar";
import { Header } from "./header";
import { ImportModal } from "@/components/clients/import-modal";
import { AddClientModal } from "@/components/clients/add-client-modal";
import { cn } from "@/lib/utils";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Inicializar estado salvo ou recolher automaticamente na tela de conversas
  useEffect(() => {
    const saved = localStorage.getItem("nave_sidebar_collapsed");
    if (saved !== null) {
      setIsSidebarCollapsed(saved === "true");
    } else if (pathname === "/conversas") {
      setIsSidebarCollapsed(true);
    }
  }, [pathname]);

  const toggleSidebar = () => {
    setIsSidebarCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem("nave_sidebar_collapsed", String(next));
      return next;
    });
  };

  // Se for página de login, renderiza apenas o conteúdo limpo
  if (pathname === "/login") {
    return <main className="min-h-screen bg-slate-900">{children}</main>;
  }

  const handleRefresh = () => {
    window.location.reload();
  };

  const isConversasPage = pathname === "/conversas";

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={toggleSidebar}
      />
      <div
        className={cn(
          "flex flex-col transition-all duration-300",
          isSidebarCollapsed ? "md:pl-16" : "md:pl-64"
        )}
      >
        <Header
          onOpenImportModal={() => setIsImportOpen(true)}
          onOpenAddModal={() => setIsAddOpen(true)}
          isSidebarCollapsed={isSidebarCollapsed}
          onToggleSidebar={toggleSidebar}
        />
        <main
          className={cn(
            "flex-1",
            isConversasPage ? "p-0 overflow-hidden" : "p-4 md:p-8"
          )}
        >
          {children}
        </main>
      </div>

      <ImportModal
        open={isImportOpen}
        onOpenChange={setIsImportOpen}
        onImportSuccess={handleRefresh}
      />

      <AddClientModal
        open={isAddOpen}
        onOpenChange={setIsAddOpen}
        onSuccess={handleRefresh}
      />
    </div>
  );
}
