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
    palpite: m.palpites[0]
      ? {
          homeScore: m.palpites[0].homeScore,
          awayScore: m.palpites[0].awayScore,
          points: m.palpites[0].points,
        }
      : null,
  }));

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">🎯 Meus palpites</h1>
      <PalpitesForm matches={data} />
    </div>
  );
}
