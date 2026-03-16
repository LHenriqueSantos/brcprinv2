"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle2 } from "lucide-react";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  if (!token) {
    return (
      <div className="text-center">
        <div className="mb-4 text-red-400">Token inválido ou inexistente. Verifique o link enviado para o seu e-mail.</div>
        <Link href="/login" className="inline-flex items-center text-sm font-medium text-[#818cf8] hover:text-[#c7d2fe]">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar para o Login
        </Link>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("As senhas digitadas não coincidem. Verifique e tente novamente.");
      return;
    }

    if (password.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword: password }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage(data.message || "Senha redefinida com sucesso.");
        setTimeout(() => {
          router.push("/login?reset=success");
        }, 3000);
      } else {
        setError(data.error || "Código inválido ou erro ao redefinir a senha.");
      }
    } catch (err) {
      setError("Erro de rede ao processar. Tente novamente mais tarde.");
    } finally {
      setLoading(false);
    }
  };

  if (message) {
    return (
      <div className="text-center">
        <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-white mb-2">Sucesso!</h2>
        <p className="text-slate-300 mb-6">{message}</p>
        <p className="text-sm text-slate-400">Você será redirecionado para o login em instantes...</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-white">Criar Nova Senha</h2>
        <p className="mt-2 text-sm text-slate-400">
          Informe sua nova senha abaixo.
        </p>
      </div>

      {error && (
        <div className="p-3 rounded bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
          {error}
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label htmlFor="pass" className="block text-sm font-medium text-slate-300">Nova Senha</label>
          <input
            id="pass"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 appearance-none block w-full px-3 py-2 border border-slate-600 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-[#7c3aed] focus:border-[#7c3aed] sm:text-sm bg-slate-800 text-white"
            placeholder="Mínimo de 6 caracteres"
          />
        </div>

        <div>
          <label htmlFor="cpass" className="block text-sm font-medium text-slate-300">Confirmar Nova Senha</label>
          <input
            id="cpass"
            type="password"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="mt-1 appearance-none block w-full px-3 py-2 border border-slate-600 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-[#7c3aed] focus:border-[#7c3aed] sm:text-sm bg-slate-800 text-white"
            placeholder="Confirme a nova senha"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#6366f1] hover:bg-[#4f46e5] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#6366f1] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? "Salvando..." : "Salvar Nova Senha"}
      </button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0f172a] p-4 text-white">
      <div className="max-w-md w-full bg-[#1e293b] rounded-2xl shadow-xl overflow-hidden border border-[#334155] p-8">
        <div className="mb-6 flex justify-center">
          <img
            src="/brcprint.svg"
            alt="brcprint Logo"
            className="mx-auto"
            style={{ width: "180px", height: "auto" }}
          />
        </div>

        <Suspense fallback={<div className="text-center text-slate-400">Carregando informações seguras...</div>}>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  );
}
