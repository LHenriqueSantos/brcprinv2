"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage(data.message || "Se o e-mail existir, um link de recuperação foi enviado.");
      } else {
        setError(data.error || "Erro ao solicitar recuperação de senha.");
      }
    } catch (err) {
      setError("Erro de rede. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0f172a] p-4 text-white">
      <div className="max-w-md w-full bg-[#1e293b] rounded-2xl shadow-xl overflow-hidden border border-[#334155] p-8">
        <div className="text-center mb-8">
          <img
            src="/brcprint.svg"
            alt="brcprint Logo"
            className="mx-auto"
            style={{ width: "180px", height: "auto" }}
          />
          <h2 className="mt-6 text-2xl font-bold">Recuperar Senha</h2>
          <p className="mt-2 text-sm text-slate-400">
            Digite seu e-mail abaixo para receber um link de redefinição de senha.
          </p>
        </div>

        {message && (
          <div className="mb-6 p-4 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm text-center">
            {message}
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 rounded bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-300">
              E-mail
            </label>
            <div className="mt-1">
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="appearance-none block w-full px-3 py-2 border border-slate-600 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-[#7c3aed] focus:border-[#7c3aed] sm:text-sm bg-slate-800 text-white"
                placeholder="seu@email.com"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading || message !== ""}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#6366f1] hover:bg-[#4f46e5] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#6366f1] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? "Enviando..." : "Enviar Link de Recuperação"}
            </button>
          </div>
        </form>

        <div className="mt-6 text-center">
          <Link href="/login" className="inline-flex items-center text-sm font-medium text-[#818cf8] hover:text-[#c7d2fe]">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar para o Login
          </Link>
        </div>
      </div>
    </div>
  );
}
