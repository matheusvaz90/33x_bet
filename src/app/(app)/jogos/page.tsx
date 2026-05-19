import { prisma } from "@/lib/db";
import { team } from "@/lib/teams";
import { stageBadge, formatKickoff, isLive } from "@/lib/stages";

export const dynamic = "force-dynamic";

interface MatchItem {
  id: string;
  stage: string;
  group: string | null;
  homeTeam: string;
  awayTeam: string;
  kickoff: Date;
  homeScore: number | null;
  awayScore: number | null;
  totalFouls: number | null;
  status: string;
}

export default async function JogosPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const raw = await prisma.match.findMany({ orderBy: { kickoff: "asc" } }) as any[];
  const matches: MatchItem[] = raw.map((m) => ({
    id: m.id,
    stage: m.stage,
    group: m.group,
    homeTeam: m.homeTeam,
    awayTeam: m.awayTeam,
    kickoff: m.kickoff,
    homeScore: m.homeScore,
    awayScore: m.awayScore,
    totalFouls: m.totalFouls,
    status: m.status ?? "SCHEDULED",
  }));

  const teamStats = new Map<string, { w: number; d: number; l: number; gf: number; ga: number }>();
  function ensure(name: string) {
    let s = teamStats.get(name);
    if (!s) {
      s = { w: 0, d: 0, l: 0, gf: 0, ga: 0 };
      teamStats.set(name, s);
    }
    return s;
  }
  for (const m of matches) {
    if (m.status !== "FINISHED" || m.homeScore === null || m.awayScore === null) continue;
    const h = ensure(m.homeTeam);
    const a = ensure(m.awayTeam);
    h.gf += m.homeScore;
    h.ga += m.awayScore;
    a.gf += m.awayScore;
    a.ga += m.homeScore;
    if (m.homeScore > m.awayScore) { h.w++; a.l++; }
    else if (m.homeScore < m.awayScore) { a.w++; h.l++; }
    else { h.d++; a.d++; }
  }

  const byDay = new Map<string, MatchItem[]>();
  for (const m of matches) {
    const day = new Intl.DateTimeFormat("pt-BR", {
      weekday: "long", day: "2-digit", month: "long", timeZone: "America/Sao_Paulo",
    }).format(m.kickoff);
    if (!byDay.has(day)) byDay.set(day, []);
    byDay.get(day)!.push(m);
  }

  return (
    <div>
      <div className="mb-6 flex items-end gap-3 flex-wrap">
        <h1 className="font-display text-5xl tracking-wider leading-none">JOGOS</h1>
        <span className="chip">{matches.length} partidas</span>
      </div>

      {matches.length === 0 && (
        <div className="card p-10 text-center text-zinc-500">Nenhum jogo cadastrado.</div>
      )}

      <div className="space-y-6">
        {Array.from(byDay.entries()).map(([day, list]) => (
          <section key={day}>
            <h2 className="font-display text-lg tracking-wider text-zinc-400 mb-2 uppercase">{day}</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {list.map((m) => (
                <MatchCard
                  key={m.id}
                  match={m}
                  homeStats={teamStats.get(m.homeTeam)}
                  awayStats={teamStats.get(m.awayTeam)}
                />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

function MatchCard({
  match: m,
  homeStats,
  awayStats,
}: {
  match: MatchItem;
  homeStats?: { w: number; d: number; l: number; gf: number; ga: number };
  awayStats?: { w: number; d: number; l: number; gf: number; ga: number };
}) {
  const home = team(m.homeTeam);
  const away = team(m.awayTeam);
  const badge = stageBadge(m.stage, m.group);
  const live = isLive(m.kickoff, m.status);
  const finished = m.status === "FINISHED";

  const lockTime = new Date(m.kickoff.getTime() - 30 * 60 * 1000);
  const agora = new Date();
  const minutosRestantes = Math.floor((lockTime.getTime() - agora.getTime()) / 60000);
  const fechandoEm = minutosRestantes > 0 && minutosRestantes <= 30;

  return (
    <div
      className="card p-4 relative overflow-hidden hover:border-amber-500/40 transition-colors"
      style={{ backgroundImage: `linear-gradient(135deg, ${home.color}1f 0%, transparent 35%, transparent 65%, ${away.color}1f 100%)` }}
    >
      <span className="absolute left-0 top-0 bottom-0 w-1" style={{ background: home.color }} />
      <span className="absolute right-0 top-0 bottom-0 w-1" style={{ background: away.color }} />

      <div className="flex items-center justify-between mb-3 relative">
        <span className={`chip border ${badge.cls}`}>{badge.label}</span>
        <div className="flex items-center gap-2 flex-wrap justify-end">
          {fechandoEm && (
            <span className="text-xs font-semibold tracking-widest text-amber-300 uppercase">
              Palpites encerram em {minutosRestantes}min
            </span>
          )}
          {live ? (
            <span className="flex items-center gap-2 text-xs font-bold tracking-widest text-red-400 uppercase">
              <span className="live-dot" /> Ao vivo
            </span>
          ) : finished ? (
            <span className="text-xs font-semibold tracking-widest text-emerald-400 uppercase">Finalizado</span>
          ) : (
            <span className="text-xs text-zinc-500 uppercase tracking-wider">{formatKickoff(m.kickoff)}</span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 relative">
        <TeamCol team={home} stats={homeStats} align="left" />
        <div className="text-center">
          {finished && m.homeScore !== null && m.awayScore !== null ? (
            <div className="font-display text-4xl text-emerald-400 leading-none whitespace-nowrap">
              {m.homeScore}<span className="text-zinc-700 mx-1.5">×</span>{m.awayScore}
            </div>
          ) : (
            <div className="font-display text-3xl text-zinc-700 leading-none">VS</div>
          )}
          {finished && m.totalFouls !== null && (
            <div className="text-[0.65rem] mt-1 text-amber-300 uppercase tracking-widest">
              🟨 {m.totalFouls} faltas
            </div>
          )}
        </div>
        <TeamCol team={away} stats={awayStats} align="right" />
      </div>
    </div>
  );
}

function TeamCol({
  team: t, stats, align,
}: {
  team: { flag: string; name: string; color: string };
  stats?: { w: number; d: number; l: number; gf: number; ga: number };
  align: "left" | "right";
}) {
  const a = align === "left" ? "items-start text-left" : "items-end text-right";
  return (
    <div className={`flex flex-col gap-1 min-w-0 ${a}`}>
      <div className={`flex items-center gap-2 ${align === "right" ? "flex-row-reverse" : ""}`}>
        <span className="text-3xl shrink-0">{t.flag}</span>
        <span className="font-semibold truncate" style={{ color: t.color }}>{t.name}</span>
      </div>
      {stats && stats.w + stats.d + stats.l > 0 ? (
        <div className="flex items-center gap-1 text-[0.6rem] uppercase tracking-wider">
          <span className="text-emerald-400">{stats.w}V</span>
          <span className="text-zinc-500">{stats.d}E</span>
          <span className="text-red-400">{stats.l}D</span>
          <span className="text-zinc-600">·</span>
          <span className="text-zinc-400 tabular-nums">{stats.gf}<span className="text-zinc-600">/</span>{stats.ga}</span>
        </div>
      ) : (
        <span className="text-[0.6rem] uppercase tracking-wider text-zinc-600">sem dados</span>
      )}
    </div>
  );
}
