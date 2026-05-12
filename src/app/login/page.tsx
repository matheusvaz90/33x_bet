"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Falha no login");
      setLoading(false);
      return;
    }
    router.push("/ranking");
    router.refresh();
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
          <h2 className="font-display text-2xl tracking-wider mb-1">ENTRAR</h2>
          <p className="text-zinc-500 text-sm mb-5">Faça login pra dar seus palpites</p>
          <form onSubmit={onSubmit} className="space-y-4">
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
              />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wider text-zinc-400 mb-1">
                Senha
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
            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? "ENTRANDO..." : "ENTRAR"}
            </button>
          </form>
          <p className="text-sm text-zinc-500 mt-5 text-center">
            Ainda sem conta?{" "}
            <Link href="/register" className="text-amber-300 hover:text-amber-200 font-semibold">
              Cadastre-se
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
