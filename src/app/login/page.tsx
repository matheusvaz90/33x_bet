"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createSupabaseBrowser } from "@/lib/supabase/client";

async function loginWithOAuth(provider: "gitlab" | "google") {
  const supabase = createSupabaseBrowser();
  await supabase.auth.signInWithOAuth({
    provider,
    options: { redirectTo: `${window.location.origin}/api/auth/callback` },
  });
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<string | null>(null);

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

  async function handleOAuth(provider: "gitlab" | "google") {
    setOauthLoading(provider);
    setError(null);
    try {
      await loginWithOAuth(provider);
    } catch {
      setError("Erro ao iniciar login social.");
      setOauthLoading(null);
    }
  }

  const urlError = typeof window !== "undefined"
    ? new URLSearchParams(window.location.search).get("error")
    : null;

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <div className="text-5xl mb-2">🏆</div>
          <h1 className="font-display text-5xl tracking-wider">BOLÃO</h1>
          <p className="font-display text-sm tracking-[0.4em] wc-gradient-text mb-2">COPA DO MUNDO 2026</p>
          <p className="text-xs text-zinc-500 font-display tracking-[0.3em]">🇺🇸 USA · 🇨🇦 CANADA · 🇲🇽 MÉXICO</p>
        </div>

        <div className="card p-6 wc-border">
          <h2 className="font-display text-2xl tracking-wider mb-1">ENTRAR</h2>
          <p className="text-zinc-500 text-sm mb-5">Faça login pra dar seus palpites</p>

          {/* OAuth */}
          <div className="space-y-2 mb-5">
            <button
              onClick={() => handleOAuth("gitlab")}
              disabled={oauthLoading !== null}
              className="w-full flex items-center justify-center gap-3 px-4 py-2.5 rounded-lg bg-orange-600/20 hover:bg-orange-600/30 border border-orange-500/40 text-orange-300 font-semibold text-sm transition-colors disabled:opacity-60"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.65 14.39L12 22.13 1.35 14.39a.84.84 0 01-.3-.94l1.22-3.78 2.44-7.51A.42.42 0 014.82 2a.43.43 0 01.58 0 .42.42 0 01.11.18l2.44 7.49h8.1l2.44-7.51A.42.42 0 0118.6 2a.43.43 0 01.58 0 .42.42 0 01.11.18l2.44 7.51 1.22 3.78a.84.84 0 01-.3.94z"/>
              </svg>
              {oauthLoading === "gitlab" ? "Redirecionando..." : "Entrar com GitLab"}
            </button>
            <button
              onClick={() => handleOAuth("google")}
              disabled={oauthLoading !== null}
              className="w-full flex items-center justify-center gap-3 px-4 py-2.5 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/40 text-blue-300 font-semibold text-sm transition-colors disabled:opacity-60"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              {oauthLoading === "google" ? "Redirecionando..." : "Entrar com Google"}
            </button>
          </div>

          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-px bg-zinc-700" />
            <span className="text-xs text-zinc-500 uppercase tracking-wider">ou</span>
            <div className="flex-1 h-px bg-zinc-700" />
          </div>

          {(error || urlError) && (
            <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2 mb-4">
              {error ?? (urlError === "oauth_failed" ? "Falha no login social. Tente novamente." : urlError)}
            </p>
          )}

          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="block text-xs uppercase tracking-wider text-zinc-400 mb-1">Email</label>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="text-input" />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wider text-zinc-400 mb-1">Senha</label>
              <input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} className="text-input" />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? "ENTRANDO..." : "ENTRAR"}
            </button>
          </form>

          <p className="text-sm text-zinc-500 mt-5 text-center">
            Ainda sem conta?{" "}
            <Link href="/register" className="text-amber-300 hover:text-amber-200 font-semibold">Cadastre-se</Link>
          </p>
        </div>
      </div>
    </main>
  );
}
