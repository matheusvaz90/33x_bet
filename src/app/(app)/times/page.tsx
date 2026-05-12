import { prisma } from "@/lib/db";
import { team } from "@/lib/teams";

export const dynamic = "force-dynamic";

type Stat = {
  name: string;
  group: string | null;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  gf: number;
  ga: number;
  pts: number;
};

export default async function TimesPage() {
  const matches = await prisma.match.findMany({
    where: { stage: "GROUP" },
    orderBy: { kickoff: "asc" },
  });

  const teams = new Map<string, Stat>();

  function ensure(name: string, group: string | null): Stat {
    let s = teams.get(name);
    if (!s) {
      s = {
        name,
        group,
        played: 0,
        wins: 0,
        draws: 0,
        losses: 0,
        gf: 0,
        ga: 0,
        pts: 0,
      };
      teams.set(name, s);
    }
    return s;
  }

  for (const m of matches) {
    if (m.homeTeam === "A definir" || m.awayTeam === "A definir") continue;
    ensure(m.homeTeam, m.group);
    ensure(m.awayTeam, m.group);
    if (m.finished && m.homeScore !== null && m.awayScore !== null) {
      const h = ensure(m.homeTeam, m.group);
      const a = ensure(m.awayTeam, m.group);
      h.played++;
      a.played++;
      h.gf += m.homeScore;
      h.ga += m.awayScore;
      a.gf += m.awayScore;
      a.ga += m.homeScore;
      if (m.homeScore > m.awayScore) {
        h.wins++;
        h.pts += 3;
        a.losses++;
      } else if (m.homeScore < m.awayScore) {
        a.wins++;
        a.pts += 3;
        h.losses++;
      } else {
        h.draws++;
        a.draws++;
        h.pts++;
        a.pts++;
      }
    }
  }

  const byGroup = new Map<string, Stat[]>();
  for (const t of teams.values()) {
    const g = t.group || "?";
    if (!byGroup.has(g)) byGroup.set(g, []);
    byGroup.get(g)!.push(t);
  }
  for (const arr of byGroup.values()) {
    arr.sort(
      (a, b) =>
        b.pts - a.pts ||
        b.gf - b.ga - (a.gf - a.ga) ||
        b.gf - a.gf ||
        a.name.localeCompare(b.name),
    );
  }

  const groupKeys = Array.from(byGroup.keys()).sort();

  return (
    <div>
      <div className="mb-6 flex items-end gap-3 flex-wrap">
        <h1 className="font-display text-5xl tracking-wider leading-none">SELEÇÕES</h1>
        <span className="chip">{teams.size} times</span>
        <span className="chip border-emerald-500/30 bg-emerald-500/10 text-emerald-300">
          tabela ao vivo
        </span>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {groupKeys.map((g) => (
          <GroupTable key={g} group={g} rows={byGroup.get(g)!} />
        ))}
      </div>
    </div>
  );
}

function GroupTable({ group, rows }: { group: string; rows: Stat[] }) {
  return (
    <div className="card overflow-hidden">
      <div className="px-4 py-3 border-b border-[color:var(--c-border)] flex items-center gap-3 bg-gradient-to-r from-blue-500/10 to-transparent">
        <span className="font-display text-2xl tracking-wider">GRUPO {group}</span>
        <span className="ml-auto text-[0.65rem] uppercase tracking-widest text-zinc-500">
          P V E D · GP GS SG · PTS
        </span>
      </div>
      <table className="w-full text-sm">
        <tbody>
          {rows.map((r, i) => {
            const t = team(r.name);
            const sg = r.gf - r.ga;
            const qualified = i < 2;
            return (
              <tr
                key={r.name}
                className="border-t border-[color:var(--c-border)] hover:bg-white/[0.02]"
              >
                <td className="pl-3 pr-2 py-2 w-7">
                  <span
                    className={
                      "inline-block w-5 text-center font-display text-base " +
                      (qualified ? "text-emerald-400" : "text-zinc-500")
                    }
                  >
                    {i + 1}
                  </span>
                </td>
                <td className="pr-2 py-2 w-9">
                  <span
                    className="block w-1 h-7 rounded-full"
                    style={{ background: t.color }}
                  />
                </td>
                <td className="pr-2 py-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{t.flag}</span>
                    <span className="font-semibold truncate">{t.name}</span>
                  </div>
                </td>
                <td className="px-1 py-2 text-center text-zinc-400 tabular-nums w-6">
                  {r.played}
                </td>
                <td className="px-1 py-2 text-center text-emerald-400 tabular-nums w-6">
                  {r.wins}
                </td>
                <td className="px-1 py-2 text-center text-zinc-400 tabular-nums w-6">
                  {r.draws}
                </td>
                <td className="px-1 py-2 text-center text-red-400 tabular-nums w-6">
                  {r.losses}
                </td>
                <td className="px-1 py-2 text-center text-zinc-300 tabular-nums w-7 border-l border-[color:var(--c-border)]">
                  {r.gf}
                </td>
                <td className="px-1 py-2 text-center text-zinc-500 tabular-nums w-7">
                  {r.ga}
                </td>
                <td className="px-1 py-2 text-center tabular-nums w-9">
                  <span
                    className={
                      sg > 0
                        ? "text-emerald-400"
                        : sg < 0
                          ? "text-red-400"
                          : "text-zinc-400"
                    }
                  >
                    {sg > 0 ? "+" : ""}
                    {sg}
                  </span>
                </td>
                <td className="px-3 py-2 text-right font-display text-xl text-amber-300 tabular-nums border-l border-[color:var(--c-border)]">
                  {r.pts}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
