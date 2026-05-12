import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import PalpitesForm from "./PalpitesForm";

export const dynamic = "force-dynamic";

export default async function PalpitesPage() {
  const session = await requireSession();
  const matches = await prisma.match.findMany({
    orderBy: { kickoff: "asc" },
    include: {
      palpites: { where: { userId: session.sub } },
    },
  });

  const data = matches.map((m) => ({
    id: m.id,
    stage: m.stage,
    group: m.group,
    homeTeam: m.homeTeam,
    awayTeam: m.awayTeam,
    kickoff: m.kickoff.toISOString(),
    finished: m.finished,
    homeScore: m.homeScore,
    awayScore: m.awayScore,
    totalFouls: m.totalFouls,
    palpite: m.palpites[0]
      ? {
          homeScore: m.palpites[0].homeScore,
          awayScore: m.palpites[0].awayScore,
          winnerGuess: m.palpites[0].winnerGuess,
          totalGoals: m.palpites[0].totalGoals,
          totalFouls: m.palpites[0].totalFouls,
          points: m.palpites[0].points,
          scorePoints: m.palpites[0].scorePoints,
          winnerPoints: m.palpites[0].winnerPoints,
          goalsPoints: m.palpites[0].goalsPoints,
          foulsPoints: m.palpites[0].foulsPoints,
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
