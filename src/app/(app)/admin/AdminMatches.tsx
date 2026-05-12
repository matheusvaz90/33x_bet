"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { STAGE_LABEL } from "@/lib/scoring";

type MatchData = {
  id: string;
  stage: string;
  group: string | null;
  homeTeam: string;
  awayTeam: string;
  kickoff: string;
  finished: boolean;
  homeScore: number | null;
  awayScore: number | null;
};

function toLocalInput(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function AdminMatches({ matches }: { matches: MatchData[] }) {
  const router = useRouter();
  const [state, setState] = useState(() =>
    matches.map((m) => ({
      ...m,
      homeScoreInput: m.homeScore !== null ? String(m.homeScore) : "",
      awayScoreInput: m.awayScore !== null ? String(m.awayScore) : "",
      kickoffInput: toLocalInput(m.kickoff),
      status: "",
    })),
  );

  function upd(id: string, patch: Partial<(typeof state)[number]>) {
    setState((s) => s.map((m) => (m.id === id ? { ...m, ...patch } : m)));
  }

  async function saveMatch(id: string) {
    const m = state.find((x) => x.id === id)!;
    upd(id, { status: "Salvando..." });
    const res = await fetch("/api/admin/match", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id,
        homeTeam: m.homeTeam,
        awayTeam: m.awayTeam,
        kickoff: new Date(m.kickoffInput).toISOString(),
      }),
    });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      upd(id, { status: d.error || "Erro" });
      return;
    }
    upd(id, { status: "✓ Salvo" });
    router.refresh();
  }

  async function saveResult(id: string) {
    const m = state.find((x) => x.id === id)!;
    const h = parseInt(m.homeScoreInput, 10);
    const a = parseInt(m.awayScoreInput, 10);
    if (isNaN(h) || isNaN(a) || h < 0 || a < 0) {
      upd(id, { status: "Placar inválido" });
      return;
    }
    upd(id, { status: "Salvando resultado..." });
    const res = await fetch("/api/admin/resultado", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, homeScore: h, awayScore: a }),
    });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      upd(id, { status: d.error || "Erro" });
      return;
    }
    upd(id, { status: "✓ Resultado salvo" });
    router.refresh();
  }

  async function clearResult(id: string) {
    if (!confirm("Limpar resultado e zerar pontos dos palpites deste jogo?")) return;
    upd(id, { status: "Limpando..." });
    const res = await fetch("/api/admin/resultado", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, clear: true }),
    });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      upd(id, { status: d.error || "Erro" });
      return;
    }
    upd(id, { status: "✓ Limpo", homeScoreInput: "", awayScoreInput: "" });
    router.refresh();
  }

  return (
    <div className="space-y-3">
      {state.map((m) => (
        <div key={m.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs bg-zinc-800 border border-zinc-700 rounded-md px-2 py-1">
              {m.stage === "GROUP" ? `Grupo ${m.group}` : STAGE_LABEL[m.stage] || m.stage}
            </span>
            {m.finished && (
              <span className="text-xs text-emerald-400">Finalizado</span>
            )}
            <span className="ml-auto text-xs text-zinc-500">{m.status}</span>
          </div>

          <div className="grid sm:grid-cols-3 gap-2 items-end">
            <div>
              <label className="block text-xs text-zinc-400 mb-1">Mandante</label>
              <input
                value={m.homeTeam}
                onChange={(e) => upd(m.id, { homeTeam: e.target.value })}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-2 py-1 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-zinc-400 mb-1">Visitante</label>
              <input
                value={m.awayTeam}
                onChange={(e) => upd(m.id, { awayTeam: e.target.value })}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-2 py-1 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-zinc-400 mb-1">Kickoff</label>
              <input
                type="datetime-local"
                value={m.kickoffInput}
                onChange={(e) => upd(m.id, { kickoffInput: e.target.value })}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-2 py-1 text-sm"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => saveMatch(m.id)}
              className="bg-zinc-700 hover:bg-zinc-600 text-sm rounded-lg px-3 py-1"
            >
              Salvar jogo
            </button>

            <div className="flex items-center gap-2 ml-auto">
              <input
                type="number"
                min={0}
                value={m.homeScoreInput}
                onChange={(e) => upd(m.id, { homeScoreInput: e.target.value })}
                className="w-14 bg-zinc-800 border border-zinc-700 rounded-lg px-2 py-1 text-center text-sm"
              />
              <span className="text-zinc-500">×</span>
              <input
                type="number"
                min={0}
                value={m.awayScoreInput}
                onChange={(e) => upd(m.id, { awayScoreInput: e.target.value })}
                className="w-14 bg-zinc-800 border border-zinc-700 rounded-lg px-2 py-1 text-center text-sm"
              />
              <button
                onClick={() => saveResult(m.id)}
                className="bg-emerald-600 hover:bg-emerald-500 text-sm rounded-lg px-3 py-1"
              >
                Salvar resultado
              </button>
              {m.finished && (
                <button
                  onClick={() => clearResult(m.id)}
                  className="bg-red-700 hover:bg-red-600 text-sm rounded-lg px-3 py-1"
                >
                  Limpar
                </button>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
