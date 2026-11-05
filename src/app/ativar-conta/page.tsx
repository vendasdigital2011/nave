"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Lock, Eye, EyeOff, CheckCircle2, AlertCircle, ArrowRight, ShieldCheck } from "lucide-react";

export default function AtivarContaPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    async function checkSession() {
      try {
        const supabase = createClient();

        // 1. Verificar sessão ativa já estabelecida pelo hash de convite
        const { data: sessionData, error: sessionErr } = await supabase.auth.getSession();

        if (sessionData?.session?.user) {
          setUserEmail(sessionData.session.user.email || null);
          setUserId(sessionData.session.user.id);
          setIsVerifying(false);
          return;
        }

        // 2. Ouvir evento de autenticação (onAuthStateChange para tokens em hash)
        const { data: authListener } = supabase.auth.onAuthStateChange(
          async (event, session) => {
            if (session?.user) {
              setUserEmail(session.user.email || null);
              setUserId(session.user.id);
              setIsVerifying(false);
            }
          }
        );

        // Timeout preventivo caso o link seja inválido ou não contenha tokens
        const timer = setTimeout(() => {
          setIsVerifying(false);
        }, 3000);

        return () => {
          clearTimeout(timer);
          authListener?.subscription?.unsubscribe();
        };
      } catch (err: any) {
        setError("Erro ao validar credenciais do link de ativação.");
        setIsVerifying(false);
      }
    }

    checkSession();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres.");
      return;
    }

    if (password !== confirmPassword) {
      setError("As senhas digitadas não coincidem.");
      return;
    }

    try {
      setIsLoading(true);
      const supabase = createClient();

      // Atualiza a senha no Supabase Auth
      const { data: updateData, error: updateErr } = await supabase.auth.updateUser({
        password: password,
      });

      if (updateErr) {
        throw new Error(updateErr.message || "Erro ao definir senha.");
      }

      const activeUserId = updateData.user?.id || userId;

      // Confirma a ativação no módulo de equipe no backend
      if (activeUserId) {
        try {
          await fetch("/api/ativar-conta/confirm", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId: activeUserId }),
          });
        } catch (confirmErr) {
          console.warn("Aviso ao sincronizar ativação:", confirmErr);
        }
      }

      setSuccess(true);
    } catch (err: any) {
      setError(err.message || "Falha ao definir nova senha. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950 flex flex-col items-center justify-center p-4 sm:p-6 overflow-y-auto">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-zinc-200 overflow-hidden">
        {/* Header do Card */}
        <div className="p-6 bg-gradient-to-b from-orange-500/10 to-transparent border-b border-zinc-100 text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-orange-600 text-white shadow-lg shadow-orange-500/30 mb-4">
            <Lock className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold text-zinc-900 tracking-tight">
            Ativação de Conta
          </h2>
          <p className="text-xs text-zinc-500 mt-1">
            NaveProspect CRM &bull; Navetech Telecom
          </p>
        </div>

        {/* Conteúdo */}
        <div className="p-6">
          {success ? (
            <div className="text-center space-y-4 py-4 animate-in fade-in zoom-in-95 duration-200">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-zinc-900">
                  Conta Ativada com Sucesso!
                </h3>
                <p className="text-xs text-zinc-600 mt-1.5 leading-relaxed">
                  Sua senha foi definida com segurança. Você já pode acessar o sistema usando seu e-mail e a senha cadastrada.
                </p>
              </div>

              <div className="pt-2">
                <Link
                  href="/login"
                  className="w-full inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-orange-600 hover:bg-orange-700 rounded-lg shadow-sm transition"
                >
                  <span>Ir para a Página de Login</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          ) : isVerifying ? (
            <div className="text-center py-10 space-y-3">
              <div className="w-8 h-8 border-3 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs text-zinc-600 font-medium">
                Validando seu convite de acesso...
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2.5 text-xs text-red-700">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {userEmail && (
                <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-lg text-xs">
                  <span className="text-zinc-500 block">Ativando conta para:</span>
                  <span className="font-semibold text-zinc-800 break-all">{userEmail}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">
                  Defina sua Nova Senha *
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    className="w-full pr-10 pl-3 py-2 text-sm bg-white border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">
                  Confirme a Nova Senha *
                </label>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repita a senha digitada"
                  className="w-full px-3 py-2 text-sm bg-white border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                />
              </div>

              {/* Tag de confirmação sem MFA */}
              <div className="flex items-center gap-1.5 p-2 bg-emerald-50/60 border border-emerald-100 rounded-md text-[11px] text-emerald-800">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Ativação direta sem aplicativo autenticador (SEM MFA/2FA).</span>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 px-4 text-sm font-semibold text-white bg-orange-600 hover:bg-orange-700 rounded-lg shadow-sm transition flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Salvando Senha...</span>
                  </>
                ) : (
                  <>
                    <span>Ativar Minha Conta</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}
        </div>

        {/* Rodapé com link de volta ao login */}
        <div className="p-4 bg-zinc-50 border-t border-zinc-100 text-center text-xs text-zinc-500">
          Já ativou sua conta antes?{" "}
          <Link href="/login" className="text-orange-600 font-semibold hover:underline">
            Fazer login
          </Link>
        </div>
      </div>
    </div>
  );
}
