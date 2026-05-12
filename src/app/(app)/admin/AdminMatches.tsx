"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { team } from "@/lib/teams";
import { stageBadge, formatKickoff } from "@/lib/stages";

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
  totalFouls: number | null;
};

function toLocalInput(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

const STAGES = ["GROUP", "R32", "R16", "QF", "SF", "TP", "FINAL"];

export default function AdminMatches({ matches }: { matches: MatchData[] }) {
  const router = useRouter();
  const [filter, setFilter] = useState<string>("ALL");
  const [state, setState] = useState(() =>
    matches.map((m) => ({
      ...m,
      homeScoreInput: m.homeScore !== null ? String(m.homeScore) : "",
      awayScoreInput: m.awayScore !== null ? String(m.awayScore) : "",
      foulsInput: m.totalFouls !== null ? String(m.totalFouls) : "",
      kickoffInput: toLocalInput(m.kickoff),
      status: "",
    })),
  );

  const visible = useMemo(
    () => (filter === "ALL" ? state : state.filter((m) => m.stage === filter)),
    [state, filter],
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
    const foulsRaw = m.foulsInput.trim();
    const fouls = foulsRaw === "" ? null : parseInt(foulsRaw, 10);
    if (fouls !== null && (isNaN(fouls) || fouls < 0)) {
      upd(id, { status: "Faltas inválido" });
      return;
    }
    upd(id, { status: "Salvando..." });
    const res = await fetch("/api/admin/resultado", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, homeScore: h, awayScore: a, totalFouls: fouls }),
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
    <div>
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <FilterBtn active={filter === "ALL"} onClick={() => setFilter("ALL")}>
          Todos
        </FilterBtn>
        {STAGES.map((s) => (
          <FilterBtn key={s} active={filter === s} onClick={() => setFilter(s)}>
            {stageBadge(s).label}
          </FilterBtn>
        ))}
        <span className="ml-auto text-xs text-zinc-500 uppercase tracking-wider">
          {visible.length} jogos
        </span>
      </div>

      <div className="space-y-3">
        {visible.map((m) => {
          const badge = stageBadge(m.stage, m.group);
          const home = team(m.homeTeam);
          const away = team(m.awayTeam);
          return (
            <div key={m.id} className="card p-4">
              <div className="flex items-center gap-2 flex-wrap mb-3">
                <span className={`chip border ${badge.cls}`}>{badge.label}</span>
                {m.finished && (
                  <span className="text-[0.7rem] uppercase tracking-widest text-emerald-400">
                    Finalizado · {m.homeScore} × {m.awayScore}
                  </span>
                )}
                <span className="text-xs text-zinc-500 uppercase tracking-wider">
                  {formatKickoff(new Date(m.kickoff))}
                </span>
                <span className="ml-auto text-xs text-zinc-500">{m.status}</span>
              </div>

              <div className="flex items-center gap-3 mb-3 text-sm">
                <span className="text-2xl">{home.flag}</span>
                <span className="text-zinc-300 font-semibold">{home.name}</span>
                <span className="text-zinc-600 mx-1">×</span>
                <span className="text-2xl">{away.flag}</span>
                <span className="text-zinc-300 font-semibold">{away.name}</span>
              </div>

              <div className="grid sm:grid-cols-3 gap-2 items-end mb-3">
                <div>
                  <label className="block text-[0.65rem] uppercase tracking-widest text-zinc-500 mb-1">
                    Mandante
                  </label>
                  <input
                    value={m.homeTeam}
                    onChange={(e) => upd(m.id, { homeTeam: e.target.value })}
                    className="text-input text-sm"
                  />
                </div>
                <div>
                  <label className="block text-[0.65rem] uppercase tracking-widest text-zinc-500 mb-1">
                    Visitante
                  </label>
                  <input
                    value={m.awayTeam}
                    onChange={(e) => upd(m.id, { awayTeam: e.target.value })}
                    className="text-input text-sm"
                  />
                </div>
                <div>
                  <label className="block text-[0.65rem] uppercase tracking-widest text-zinc-500 mb-1">
                    Kickoff
                  </label>
                  <input
                    type="datetime-local"
                    value={m.kickoffInput}
                    onChange={(e) => upd(m.id, { kickoffInput: e.target.value })}
                    className="text-input text-sm"
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-[color:var(--c-border)]">
                <button
                  onClick={() => saveMatch(m.id)}
                  className="bg-zinc-800 hover:bg-zinc-700 border border-[color:var(--c-border)] text-xs uppercase tracking-wider font-semibold rounded-lg px-3 py-1.5"
                >
                  Salvar jogo
                </button>

                <div className="flex items-center gap-2 ml-auto flex-wrap">
                  <span className="text-[0.65rem] uppercase tracking-widest text-zinc-500">
                    Placar
                  </span>
                  <input
                    type="number"
                    min={0}
                    value={m.homeScoreInput}
                    onChange={(e) => upd(m.id, { homeScoreInput: e.target.value })}
                    className="score-input h-10 w-12 text-lg"
                  />
                  <span className="text-zinc-600">×</span>
                  <input
                    type="number"
                    min={0}
                    value={m.awayScoreInput}
                    onChange={(e) => upd(m.id, { awayScoreInput: e.target.value })}
                    className="score-input h-10 w-12 text-lg"
                  />
                  <span className="text-[0.65rem] uppercase tracking-widest text-zinc-500 ml-2">
                    🟨 Faltas
                  </span>
                  <input
                    type="number"
                    min={0}
                    value={m.foulsInput}
                    placeholder="-"
                    onChange={(e) => upd(m.id, { foulsInput: e.target.value })}
                    className="score-input h-10 w-12 text-lg"
                  />
                  <button onClick={() => saveResult(m.id)} className="btn-primary text-xs">
                    Salvar resultado
                  </button>
                  {m.finished && (
                    <button
                      onClick={() => clearResult(m.id)}
                      className="bg-red-900/40 hover:bg-red-800/50 border border-red-500/30 text-red-300 text-xs uppercase tracking-wider font-semibold rounded-lg px-3 py-1.5"
                    >
                      Limpar
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function FilterBtn({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={
        "text-xs uppercase tracking-wider font-semibold px-3 py-1.5 rounded-lg border transition-colors " +
        (active
          ? "bg-amber-400/10 border-amber-400/40 text-amber-300"
          : "bg-transparent border-[color:var(--c-border)] text-zinc-400 hover:text-zinc-200")
      }
    >
      {children}
    </button>
  );
}
