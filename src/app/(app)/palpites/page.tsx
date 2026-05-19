import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import PalpitesForm from "./PalpitesForm";

export const dynamic = "force-dynamic";

export default async function PalpitesPage() {
  const session = await requireSession();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const raw = await prisma.match.findMany({
    orderBy: { kickoff: "asc" },
    include: { palpites: { where: { userId: session.sub } } },
  }) as any[];

  const data = raw.map((m) => ({
    id: m.id as string,
    stage: m.stage as string,
    group: m.group as string | null,
    homeTeam: m.homeTeam as string,
    awayTeam: m.awayTeam as string,
    kickoff: (m.kickoff as Date).toISOString(),
    status: (m.status as string) ?? "SCHEDULED",
    homeScore: m.homeScore as number | null,
    awayScore: m.awayScore as number | null,
    totalFouls: m.totalFouls as number | null,
    palpite: m.palpites[0]
      ? {
          homeScore: m.palpites[0].homeScore as number | null,
          awayScore: m.palpites[0].awayScore as number | null,
          winnerGuess: m.palpites[0].winnerGuess as string | null,
          totalGoals: m.palpites[0].totalGoals as number | null,
          totalFouls: m.palpites[0].totalFouls as number | null,
          points: m.palpites[0].points as number,
          scorePoints: m.palpites[0].scorePoints as number,
          winnerPoints: m.palpites[0].winnerPoints as number,
          goalsPoints: m.palpites[0].goalsPoints as number,
          foulsPoints: m.palpites[0].foulsPoints as number,
        }
      : null,
  }));

  return (
    <div>
      <div className="mb-6 flex items-end gap-3 flex-wrap">
        <h1 className="font-display text-5xl tracking-wider leading-none">PALPITES</h1>
        <span className="chip">{data.length} jogos</span>
      </div>
      <PalpitesForm matches={data} />
    </div>
  );
}
