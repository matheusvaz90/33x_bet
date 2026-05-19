"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { team } from "@/lib/teams";
import { stageBadge, formatKickoff, isLive } from "@/lib/stages";

type Palpite = {
  homeScore: number | null;
  awayScore: number | null;
  winnerGuess: string | null;
  totalGoals: number | null;
  totalFouls: number | null;
  points: number;
  scorePoints: number;
  winnerPoints: number;
  goalsPoints: number;
  foulsPoints: number;
};

type MatchData = {
  id: string;
  stage: string;
  group: string | null;
  homeTeam: string;
  awayTeam: string;
  kickoff: string;
  status: string;
  homeScore: number | null;
  awayScore: number | null;
  totalFouls: number | null;
  palpite: Palpite | null;
};

type Filter = "all" | "open" | "done";

const LOCK_MINUTES = 30;

export default function PalpitesForm({ matches }: { matches: MatchData[] }) {
  const [filter, setFilter] = useState<Filter>("open");

  const stats = useMemo(() => {
    const now = Date.now();
    let open = 0;
    let placed = 0;
    let pending = 0;
    let points = 0;
    for (const m of matches) {
      const lockTime = new Date(m.kickoff).getTime() - LOCK_MINUTES * 60 * 1000;
      const isOpen = lockTime > now;
      if (isOpen) open++;
      if (m.palpite) placed++;
      else if (isOpen) pending++;
      if (m.palpite) points += m.palpite.points;
    }
    return { open, placed, pending, points, total: matches.length };
  }, [matches]);

  const visible = useMemo(() => {
    const now = Date.now();
    return matches.filter((m) => {
      if (filter === "all") return true;
      const lockTime = new Date(m.kickoff).getTime() - LOCK_MINUTES * 60 * 1000;
      const isOpen = lockTime > now;
      if (filter === "open") return isOpen;
      if (filter === "done") return !isOpen;
      return true;
    });
  }, [matches, filter]);

  return (
    <div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        <Stat label="Pontos" value={stats.points} accent="emerald" />
        <Stat label="Palpitados" value={`${stats.placed}/${stats.total}`} />
        <Stat label="Pendentes" value={stats.pending} accent="amber" />
        <Stat label="Abertos" value={stats.open} />
      </div>

      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <FilterBtn active={filter === "open"} onClick={() => setFilter("open")}>Em aberto</FilterBtn>
        <FilterBtn active={filter === "done"} onClick={() => setFilter("done")}>Encerrados</FilterBtn>
        <FilterBtn active={filter === "all"} onClick={() => setFilter("all")}>Todos</FilterBtn>
        <span className="ml-auto text-xs text-zinc-500 uppercase tracking-wider">{visible.length} jogos</span>
      </div>

      <div className="space-y-4">
        {visible.map((m) => <PalpiteCard key={m.id} match={m} />)}
        {visible.length === 0 && (
          <div className="card p-10 text-center text-zinc-500">Nenhum jogo aqui.</div>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: number | string; accent?: "emerald" | "amber" }) {
  const color = accent === "emerald" ? "text-emerald-400" : accent === "amber" ? "text-amber-300" : "text-zinc-100";
  return (
    <div className="card p-3">
      <div className="text-[0.65rem] uppercase tracking-widest text-zinc-500">{label}</div>
      <div className={`font-display text-3xl leading-none mt-1 ${color}`}>{value}</div>
    </div>
  );
}

function FilterBtn({ active, children, onClick }: { active: boolean; children: React.ReactNode; onClick: () => void }) {
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

function PalpiteCard({ match: m }: { match: MatchData }) {
  const router = useRouter();
  const home = team(m.homeTeam);
  const away = team(m.awayTeam);
  const badge = stageBadge(m.stage, m.group);
  const kickoff = new Date(m.kickoff);
  const lockTime = new Date(kickoff.getTime() - LOCK_MINUTES * 60 * 1000);
  const locked = lockTime.getTime() <= Date.now();
  const live = isLive(kickoff, m.status);
  const finished = m.status === "FINISHED";

  const minutosRestantes = Math.floor((lockTime.getTime() - Date.now()) / 60000);
  const fechandoEm = !locked && minutosRestantes <= 30;

  const [h, setH] = useState(m.palpite?.homeScore != null ? String(m.palpite.homeScore) : "");
  const [a, setA] = useState(m.palpite?.awayScore != null ? String(m.palpite.awayScore) : "");
  const [winner, setWinner] = useState<string>(m.palpite?.winnerGuess || "");
  const [totalGoals, setTotalGoals] = useState(m.palpite?.totalGoals != null ? String(m.palpite.totalGoals) : "");
  const [totalFouls, setTotalFouls] = useState(m.palpite?.totalFouls != null ? String(m.palpite.totalFouls) : "");
  const [status, setStatus] = useState<{ kind: "ok" | "err"; msg: string } | null>(null);
  const [saving, setSaving] = useState(false);

  async function save() {
    const payload: Record<string, unknown> = { matchId: m.id };
    if (h !== "" && a !== "") { payload.homeScore = parseInt(h, 10); payload.awayScore = parseInt(a, 10); }
    else { payload.homeScore = null; payload.awayScore = null; }
    payload.winnerGuess = winner || null;
    payload.totalGoals = totalGoals === "" ? null : parseInt(totalGoals, 10);
    payload.totalFouls = totalFouls === "" ? null : parseInt(totalFouls, 10);

    setSaving(true);
    setStatus(null);
    const res = await fetch("/api/palpites", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setSaving(false);
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setStatus({ kind: "err", msg: d.error || "Erro" });
      return;
    }
    setStatus({ kind: "ok", msg: "Salvo" });
    router.refresh();
  }

  const showResult = finished && m.homeScore !== null && m.awayScore !== null;
  const teamGradient = `linear-gradient(90deg, ${home.color}26, transparent 35%, transparent 65%, ${away.color}26)`;

  return (
    <div className="card p-4 relative overflow-hidden" style={{ backgroundImage: teamGradient, backgroundBlendMode: "screen" }}>
      <span className="absolute left-0 top-0 bottom-0 w-1" style={{ background: home.color }} />
      <span className="absolute right-0 top-0 bottom-0 w-1" style={{ background: away.color }} />

      <div className="flex items-center justify-between mb-3 gap-2 flex-wrap relative">
        <span className={`chip border ${badge.cls}`}>{badge.label}</span>
        <div className="flex items-center gap-2">
          {fechandoEm && (
            <span className="text-[0.7rem] font-bold tracking-widest text-amber-300 uppercase">
              Fecha em {minutosRestantes}min
            </span>
          )}
          {live && (
            <span className="flex items-center gap-2 text-[0.7rem] font-bold tracking-widest text-red-400 uppercase">
              <span className="live-dot" /> Ao vivo
            </span>
          )}
          {locked && !live && !showResult && (
            <span className="text-[0.7rem] uppercase tracking-widest text-amber-300">🔒 Fechado</span>
          )}
          {showResult && (
            <span className="text-[0.7rem] uppercase tracking-widest text-emerald-400">
              Resultado: {m.homeScore} × {m.awayScore}
              {m.totalFouls !== null && ` · ${m.totalFouls} faltas`}
            </span>
          )}
          <span className="text-[0.7rem] text-zinc-500 uppercase tracking-wider">{formatKickoff(kickoff)}</span>
        </div>
      </div>

      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 mb-4 relative">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-3xl shrink-0">{home.flag}</span>
          <div className="min-w-0">
            <div className="font-semibold truncate">{home.name}</div>
            <div className="text-[0.65rem] uppercase tracking-widest text-zinc-500">mandante</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <input type="number" inputMode="numeric" min={0} disabled={locked} value={h} onChange={(e) => setH(e.target.value)} placeholder="-" className="score-input" style={{ borderColor: h !== "" ? home.color : undefined }} />
          <span className="text-zinc-600 font-display text-xl">×</span>
          <input type="number" inputMode="numeric" min={0} disabled={locked} value={a} onChange={(e) => setA(e.target.value)} placeholder="-" className="score-input" style={{ borderColor: a !== "" ? away.color : undefined }} />
        </div>
        <div className="flex items-center gap-2 min-w-0 justify-end">
          <div className="min-w-0 text-right">
            <div className="font-semibold truncate">{away.name}</div>
            <div className="text-[0.65rem] uppercase tracking-widest text-zinc-500">visitante</div>
          </div>
          <span className="text-3xl shrink-0">{away.flag}</span>
        </div>
      </div>

      <div className="mb-3 relative">
        <div className="text-[0.65rem] uppercase tracking-widest text-zinc-500 mb-1.5">Quem vence? (palpite sem placar)</div>
        <div className="grid grid-cols-3 gap-2">
          <OddBtn label="Mandante" sub={home.flag} active={winner === "HOME"} color={home.color} disabled={locked} onClick={() => setWinner(winner === "HOME" ? "" : "HOME")} />
          <OddBtn label="Empate" sub="🟰" active={winner === "DRAW"} color="#a1a1aa" disabled={locked} onClick={() => setWinner(winner === "DRAW" ? "" : "DRAW")} />
          <OddBtn label="Visitante" sub={away.flag} active={winner === "AWAY"} color={away.color} disabled={locked} onClick={() => setWinner(winner === "AWAY" ? "" : "AWAY")} />
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-3 mb-3 relative">
        <NumberMarket label="Total de gols" icon="⚽" value={totalGoals} disabled={locked} onChange={setTotalGoals} />
        <NumberMarket label="Total de faltas" icon="🟨" value={totalFouls} disabled={locked} onChange={setTotalFouls} />
      </div>

      <div className="flex items-center justify-between gap-2 flex-wrap pt-3 border-t border-[color:var(--c-border)] relative">
        <div className="text-xs text-zinc-400 flex items-center gap-2 flex-wrap">
          {m.palpite ? (
            <><span className="text-emerald-400">✓</span><SummaryChips p={m.palpite} showResult={showResult} /></>
          ) : locked ? (
            <span className="text-zinc-600">Sem palpite</span>
          ) : (
            <span className="text-amber-300">Você ainda não palpitou</span>
          )}
        </div>
        {!locked && (
          <div className="flex items-center gap-2">
            {status && (
              <span className={"text-xs " + (status.kind === "ok" ? "text-emerald-400" : "text-red-400")}>{status.msg}</span>
            )}
            <button onClick={save} disabled={saving} className="btn-primary text-xs">{saving ? "..." : "Salvar"}</button>
          </div>
        )}
      </div>
    </div>
  );
}

function OddBtn({ label, sub, active, color, disabled, onClick }: { label: string; sub: string; active: boolean; color: string; disabled?: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} disabled={disabled}
      className="rounded-lg border px-3 py-2 text-center transition-all relative overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed"
      style={{ borderColor: active ? color : "var(--c-border)", background: active ? `${color}1a` : "var(--c-bg-soft)", boxShadow: active ? `0 0 0 1px ${color}80 inset` : undefined }}
    >
      <div className="text-2xl leading-none">{sub}</div>
      <div className="text-[0.7rem] uppercase tracking-wider font-semibold mt-1 text-zinc-200">{label}</div>
    </button>
  );
}

function NumberMarket({ label, icon, value, disabled, onChange }: { label: string; icon: string; value: string; disabled?: boolean; onChange: (v: string) => void }) {
  return (
    <div className="bg-[color:var(--c-bg-soft)] border border-[color:var(--c-border)] rounded-lg p-2.5 flex items-center gap-3">
      <span className="text-2xl">{icon}</span>
      <div className="flex-1 min-w-0">
        <div className="text-[0.65rem] uppercase tracking-widest text-zinc-500 leading-tight">{label}</div>
        <div className="text-[0.6rem] text-zinc-600">na partida toda</div>
      </div>
      <input type="number" inputMode="numeric" min={0} disabled={disabled} value={value} onChange={(e) => onChange(e.target.value)} placeholder="-" className="score-input h-12 w-14 text-xl" />
    </div>
  );
}

function SummaryChips({ p, showResult }: { p: Palpite; showResult: boolean }) {
  const chips: Array<{ label: string; value: string; pts?: number }> = [];
  if (p.homeScore !== null && p.awayScore !== null) chips.push({ label: "Placar", value: `${p.homeScore} × ${p.awayScore}`, pts: showResult ? p.scorePoints : undefined });
  if (p.winnerGuess) { const v = p.winnerGuess === "HOME" ? "Mandante" : p.winnerGuess === "AWAY" ? "Visitante" : "Empate"; chips.push({ label: "Vencedor", value: v, pts: showResult ? p.winnerPoints : undefined }); }
  if (p.totalGoals !== null) chips.push({ label: "Gols", value: String(p.totalGoals), pts: showResult ? p.goalsPoints : undefined });
  if (p.totalFouls !== null) chips.push({ label: "Faltas", value: String(p.totalFouls), pts: showResult ? p.foulsPoints : undefined });
  if (chips.length === 0) return <span className="text-zinc-600">Sem palpites preenchidos</span>;
  return (
    <>
      {chips.map((c) => (
        <span key={c.label} className="chip">
          <span className="text-zinc-500">{c.label}:</span>
          <b className="text-zinc-100">{c.value}</b>
          {typeof c.pts === "number" && (
            <span className={c.pts > 0 ? "text-emerald-400 font-display" : "text-zinc-500 font-display"}>{c.pts > 0 ? `+${c.pts}` : "0"}</span>
          )}
        </span>
      ))}
      {showResult && (
        <span className="chip border-emerald-500/40 bg-emerald-500/15 text-emerald-300">Total +{p.points} pts</span>
      )}
    </>
  );
}
