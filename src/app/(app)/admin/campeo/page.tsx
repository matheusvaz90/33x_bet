"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Selecao = { id: string; nome: string; bandeira: string | null; totalApostadores: number; pontosEstimados: number };

export default function CampeoPage() {
  const router = useRouter();
  const [selecoes, setSelecoes] = useState<Selecao[]>([]);
  const [selecionado, setSelecionado] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/palpite-ouro")
      .then((r) => r.json())
      .then((d) => { setSelecoes(d.selecoes ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  async function definir() {
    if (!selecionado) { setMsg({ kind: "err", text: "Selecione a seleção campeã." }); return; }
    if (!confirm(`Confirmar campeão: ${selecoes.find((s) => s.id === selecionado)?.nome}? Esta ação recalcula todos os pontos do Palpite de Ouro.`)) return;
    setSaving(true);
    setMsg(null);
    const res = await fetch("/api/admin/campeo", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ selecaoId: selecionado }),
    });
    setSaving(false);
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setMsg({ kind: "err", text: d.error || "Erro ao definir campeão." });
      return;
    }
    const d = await res.json();
    setMsg({ kind: "ok", text: d.message });
    router.refresh();
  }

  return (
    <div>
      <div className="mb-6 flex items-end gap-3 flex-wrap">
        <h1 className="font-display text-5xl tracking-wider leading-none">DEFINIR CAMPEÃO</h1>
        <span className="chip border-amber-400/40 bg-amber-400/10 text-amber-300">admin restrito</span>
      </div>

      <div className="card p-5 mb-6">
        <p className="text-zinc-400 text-sm">
          Selecione a seleção campeã da Copa do Mundo 2026. O sistema irá calcular automaticamente os pontos do Palpite de Ouro para todos os usuários que apostaram corretamente.
        </p>
      </div>

      {loading ? (
        <div className="card p-10 text-center text-zinc-500">Carregando seleções...</div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-5">
            {selecoes.map((s) => {
              const ativa = selecionado === s.id;
              return (
                <button key={s.id} onClick={() => setSelecionado(s.id)}
                  className={
                    "card p-3 text-center flex flex-col items-center gap-1 transition-all border " +
                    (ativa ? "border-amber-400/60 bg-amber-400/10" : "border-[color:var(--c-border)] hover:border-zinc-500")
                  }
                >
                  <span className="text-3xl">{s.bandeira ?? "⚽"}</span>
                  <span className={`font-semibold text-sm ${ativa ? "text-amber-300" : "text-zinc-200"}`}>{s.nome}</span>
                  <span className="text-[0.6rem] text-zinc-500">{s.totalApostadores} apostadores</span>
                  <span className="text-[0.7rem] text-emerald-400 font-display">~{s.pontosEstimados} pts</span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {msg && (
              <span className={`text-sm ${msg.kind === "ok" ? "text-emerald-400" : "text-red-400"}`}>{msg.text}</span>
            )}
            <button onClick={definir} disabled={saving || !selecionado} className="btn-primary ml-auto">
              {saving ? "Salvando..." : "Confirmar Campeão"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
