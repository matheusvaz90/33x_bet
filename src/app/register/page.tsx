"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (name.trim().length < 2) {
      setError("Nome deve ter pelo menos 2 caracteres.");
      return;
    }
    if (password.length < 6) {
      setError("Senha deve ter pelo menos 6 caracteres.");
      return;
    }

    setLoading(true);
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim(), email, password }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Falha no cadastro");
      setLoading(false);
      return;
    }

    setSuccess(true);
    setTimeout(() => {
      router.push("/ranking");
      router.refresh();
    }, 1500);
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <div className="text-5xl mb-2">🏆</div>
          <h1 className="font-display text-5xl tracking-wider">BOLÃO</h1>
          <p className="font-display text-sm tracking-[0.4em] wc-gradient-text mb-2">
            COPA DO MUNDO 2026
          </p>
          <p className="text-xs text-zinc-500 font-display tracking-[0.3em]">
            🇺🇸 USA · 🇨🇦 CANADA · 🇲🇽 MÉXICO
          </p>
        </div>

        <div className="card p-6 wc-border">
          <h2 className="font-display text-2xl tracking-wider mb-1">CRIAR CONTA</h2>
          <p className="text-zinc-500 text-sm mb-5">Entre no bolão e palpite</p>
          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="block text-xs uppercase tracking-wider text-zinc-400 mb-1">
                Nome
              </label>
              <input
                type="text"
                required
                minLength={2}
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="text-input"
                placeholder="Seu nome no bolão"
              />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wider text-zinc-400 mb-1">
                Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="text-input"
                placeholder="seu@email.com"
              />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wider text-zinc-400 mb-1">
                Senha <span className="text-zinc-600">(mín. 6 caracteres)</span>
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="text-input"
              />
            </div>

            {error && (
              <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">
                {error}
              </p>
            )}
            {success && (
              <p className="text-emerald-400 text-sm bg-emerald-500/10 border border-emerald-500/30 rounded-lg px-3 py-2">
                ✓ Conta criada com sucesso! Entrando no bolão...
              </p>
            )}

            <button
              type="submit"
              disabled={loading || success}
              className="btn-primary w-full"
            >
              {loading ? "CADASTRANDO..." : success ? "REDIRECIONANDO..." : "CADASTRAR"}
            </button>
          </form>
          <p className="text-sm text-zinc-500 mt-5 text-center">
            Já tem conta?{" "}
            <Link href="/login" className="text-amber-300 hover:text-amber-200 font-semibold">
              Entrar
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
