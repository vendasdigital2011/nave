"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  ShieldCheck,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        router.push("/");
        router.refresh();
      } else {
        setError(data.error || "Credenciais inválidas. Verifique seu e-mail e senha.");
      }
    } catch (err: any) {
      setError("Erro ao conectar: " + (err.message || "Tente novamente."));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F8F8FA] p-4 sm:p-6 text-[#0B0B0D]">
      <div className="w-full max-w-md">
        {/* Logo and Brand */}
        <div className="mb-8 text-center flex flex-col items-center">
          <img
            src="/images/brand/navetech-logo.webp"
            alt="Navetech Telecom"
            className="h-11 w-auto mb-2 object-contain"
          />
          <span className="inline-flex items-center gap-1 text-[11px] font-bold tracking-wider text-[#FF6A00] uppercase bg-[#FFF4EC] px-2.5 py-0.5 rounded-full border border-[#FFD0A8]">
            NaveProspect CRM
          </span>
        </div>

        {/* Card Form */}
        <div className="rounded-2xl border border-[#E2E8F0] bg-white p-6 sm:p-8 shadow-sm">
          <div className="mb-6 flex items-center justify-between border-b border-[#E2E8F0] pb-4">
            <div>
              <h2 className="text-base font-bold text-[#0B0B0D]">Acesso Restrito</h2>
              <p className="text-xs text-[#64748B]">Informe suas credenciais para acessar o painel</p>
            </div>
            <ShieldCheck className="h-5 w-5 text-[#FF6A00]" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* E-mail */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#0B0B0D]">
                E-mail ou Usuário
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-[#64748B]" />
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu-email@navetech.com.br"
                  required
                  className="pl-9 bg-[#F8FAFC] border-[#E2E8F0] text-[#0B0B0D] placeholder:text-[#64748B] focus-visible:ring-[#FF6A00] focus-visible:border-[#FF6A00] text-xs sm:text-sm h-11 rounded-xl"
                />
              </div>
            </div>

            {/* Senha */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#0B0B0D]">
                Senha de Acesso
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-[#64748B]" />
                <Input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="pl-9 pr-9 bg-[#F8FAFC] border-[#E2E8F0] text-[#0B0B0D] placeholder:text-[#64748B] focus-visible:ring-[#FF6A00] focus-visible:border-[#FF6A00] text-xs sm:text-sm h-11 rounded-xl"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3.5 text-[#64748B] hover:text-[#0B0B0D]"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Erro */}
            {error && (
              <div className="flex items-center gap-2 rounded-xl bg-rose-50 p-3 text-xs text-rose-700 border border-rose-200">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
                <span>{error}</span>
              </div>
            )}

            {/* Botão Entrar com Laranja Navetech #FF6A00 */}
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#FF6A00] hover:bg-[#E85C00] text-white font-bold h-11 rounded-xl shadow-md shadow-[#FF6A00]/20 transition-all active:scale-[0.98] mt-3"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Autenticando...
                </>
              ) : (
                "Entrar no Sistema"
              )}
            </Button>
          </form>
        </div>

        {/* Footer */}
        <p className="mt-6 text-center text-xs text-[#64748B]">
          NAVETECH TELECOM • Todos os direitos reservados
        </p>
      </div>
    </div>
  );
}
