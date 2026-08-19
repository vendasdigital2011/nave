"use client";

import React, { useState } from "react";
import { Sidebar } from "./sidebar";
import { Header } from "./header";
import { ImportModal } from "@/components/clients/import-modal";
import { AddClientModal } from "@/components/clients/add-client-modal";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);

  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar />
      <div className="flex flex-col md:pl-64">
        <Header
          onOpenImportModal={() => setIsImportOpen(true)}
          onOpenAddModal={() => setIsAddOpen(true)}
        />
        <main className="flex-1 p-4 md:p-8">{children}</main>
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
