"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Selecao = {
  id: string;
  nome: string;
  pais: string;
  bandeira: string | null;
  pesoPalpiteOuro: number;
  totalApostadores: number;
  pontosEstimados: number;
};

type MeuPalpite = {
  selecaoId: string;
  pontosObtidos: number;
  selecao: { id: string; nome: string; bandeira: string | null };
} | null;

export default function PalpiteOuroForm({
  selecoes,
  meuPalpite,
  prazoEncerrado,
}: {
  selecoes: Selecao[];
  meuPalpite: MeuPalpite;
  prazoEncerrado: boolean;
}) {
  const router = useRouter();
  const [selecionado, setSelecionado] = useState<string>(meuPalpite?.selecaoId ?? "");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  async function confirmar() {
    if (!selecionado) { setMsg({ kind: "err", text: "Selecione uma seleção." }); return; }
    setSaving(true);
    setMsg(null);
    const res = await fetch("/api/palpite-ouro", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ selecaoId: selecionado }),
    });
    setSaving(false);
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setMsg({ kind: "err", text: d.error || "Erro ao salvar." });
      return;
    }
    setMsg({ kind: "ok", text: "Palpite de Ouro salvo!" });
    router.refresh();
  }

  if (prazoEncerrado) {
    return (
      <div className="card p-6 text-center">
        <div className="text-4xl mb-3">🔒</div>
        <p className="text-zinc-400 mb-4">Prazo encerrado. A fase de grupos já iniciou.</p>
        {meuPalpite ? (
          <div className="inline-flex flex-col items-center gap-2 p-4 bg-amber-400/10 border border-amber-400/30 rounded-xl">
            <span className="text-3xl">{meuPalpite.selecao.bandeira ?? "⚽"}</span>
            <span className="font-display text-xl tracking-wider text-amber-300">{meuPalpite.selecao.nome}</span>
            {meuPalpite.pontosObtidos > 0 && (
              <span className="text-emerald-400 font-display text-2xl">+{meuPalpite.pontosObtidos} pts</span>
            )}
          </div>
        ) : (
          <p className="text-zinc-600">Você não fez um Palpite de Ouro.</p>
        )}
      </div>
    );
  }

  return (
    <div>
      {meuPalpite && (
        <div className="card p-4 mb-5 flex items-center gap-3 border-amber-400/30 bg-amber-400/5">
          <span className="text-2xl">{meuPalpite.selecao.bandeira ?? "⚽"}</span>
          <div>
            <div className="text-[0.65rem] uppercase tracking-widest text-zinc-500">Seu palpite atual</div>
            <div className="font-semibold text-amber-300">{meuPalpite.selecao.nome}</div>
          </div>
          <span className="ml-auto text-[0.7rem] text-zinc-500">Pode trocar até o prazo</span>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-5">
        {selecoes.map((s) => {
          const ativa = selecionado === s.id;
          return (
            <button
              key={s.id}
              onClick={() => setSelecionado(s.id)}
              className={
                "card p-3 text-center flex flex-col items-center gap-1 transition-all border " +
                (ativa
                  ? "border-amber-400/60 bg-amber-400/10 shadow-[0_0_0_1px_rgba(251,191,36,0.3)]"
                  : "border-[color:var(--c-border)] hover:border-zinc-500")
              }
            >
              <span className="text-3xl">{s.bandeira ?? "⚽"}</span>
              <span className={`font-semibold text-sm truncate w-full ${ativa ? "text-amber-300" : "text-zinc-200"}`}>
                {s.nome}
              </span>
              <span className="text-[0.6rem] text-zinc-500 uppercase tracking-wider">
                {s.totalApostadores} apostador{s.totalApostadores !== 1 ? "es" : ""}
              </span>
              <span className="text-[0.7rem] text-emerald-400 font-display">
                ~{s.pontosEstimados} pts
              </span>
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        {msg && (
          <span className={msg.kind === "ok" ? "text-emerald-400 text-sm" : "text-red-400 text-sm"}>
            {msg.text}
          </span>
        )}
        <button
          onClick={confirmar}
          disabled={saving || !selecionado}
          className="btn-primary ml-auto"
        >
          {saving ? "Salvando..." : "Confirmar Palpite de Ouro"}
        </button>
      </div>
    </div>
  );
}
