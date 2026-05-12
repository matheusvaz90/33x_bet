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
  palpite: { homeScore: number; awayScore: number; points: number } | null;
};

function fmt(d: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "America/Sao_Paulo",
  }).format(d);
}

export default function PalpitesForm({ matches }: { matches: MatchData[] }) {
  const router = useRouter();
  const [values, setValues] = useState<Record<string, { h: string; a: string }>>(() => {
    const init: Record<string, { h: string; a: string }> = {};
    for (const m of matches) {
      init[m.id] = {
        h: m.palpite ? String(m.palpite.homeScore) : "",
        a: m.palpite ? String(m.palpite.awayScore) : "",
      };
    }
    return init;
  });
  const [status, setStatus] = useState<Record<string, string>>({});

  async function save(matchId: string) {
    const v = values[matchId];
    const homeScore = parseInt(v.h, 10);
    const awayScore = parseInt(v.a, 10);
    if (isNaN(homeScore) || isNaN(awayScore) || homeScore < 0 || awayScore < 0) {
      setStatus((s) => ({ ...s, [matchId]: "Placar inválido" }));
      return;
    }
    setStatus((s) => ({ ...s, [matchId]: "Salvando..." }));
    const res = await fetch("/api/palpites", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ matchId, homeScore, awayScore }),
    });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setStatus((s) => ({ ...s, [matchId]: d.error || "Erro" }));
      return;
    }
    setStatus((s) => ({ ...s, [matchId]: "✓ Salvo" }));
    router.refresh();
  }

  const now = Date.now();

  return (
    <div className="space-y-2">
      {matches.map((m) => {
        const kickoff = new Date(m.kickoff);
        const locked = kickoff.getTime() <= now;
        const v = values[m.id];
        return (
          <div key={m.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-3">
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <span className="text-xs bg-zinc-800 border border-zinc-700 rounded-md px-2 py-1 text-zinc-300">
                {m.stage === "GROUP" ? `Grupo ${m.group}` : STAGE_LABEL[m.stage] || m.stage}
              </span>
              <span className="text-xs text-zinc-500">{fmt(kickoff)}</span>
              {locked && <span className="text-xs text-amber-400">🔒 fechado</span>}
              {m.finished && m.homeScore !== null && m.awayScore !== null && (
                <span className="text-xs text-emerald-400 ml-auto">
                  Resultado: {m.homeScore} × {m.awayScore}
                  {m.palpite && ` · você fez ${m.palpite.points} pts`}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="flex-1 min-w-0 font-medium truncate">{m.homeTeam}</span>
              <input
                type="number"
                min={0}
                disabled={locked}
                value={v.h}
                onChange={(e) =>
                  setValues((s) => ({ ...s, [m.id]: { ...s[m.id], h: e.target.value } }))
                }
                className="w-14 bg-zinc-800 border border-zinc-700 rounded-lg px-2 py-1 text-center disabled:opacity-50"
              />
              <span className="text-zinc-500">×</span>
              <input
                type="number"
                min={0}
                disabled={locked}
                value={v.a}
                onChange={(e) =>
                  setValues((s) => ({ ...s, [m.id]: { ...s[m.id], a: e.target.value } }))
                }
                className="w-14 bg-zinc-800 border border-zinc-700 rounded-lg px-2 py-1 text-center disabled:opacity-50"
              />
              <span className="flex-1 min-w-0 font-medium truncate text-right">{m.awayTeam}</span>
              <button
                onClick={() => save(m.id)}
                disabled={locked}
                className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm rounded-lg px-3 py-1"
              >
                Salvar
              </button>
              {status[m.id] && (
                <span className="text-xs text-zinc-400 w-full sm:w-auto">{status[m.id]}</span>
              )}
            </div>
          </div>
        );
      })}
      {matches.length === 0 && (
        <p className="text-zinc-500 text-center py-6">Nenhum jogo cadastrado.</p>
      )}
    </div>
  );
}
