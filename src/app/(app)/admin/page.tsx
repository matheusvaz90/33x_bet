import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import AdminMatches from "./AdminMatches";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  await requireAdmin();
  const matches = await prisma.match.findMany({ orderBy: { kickoff: "asc" } });
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
  }));

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">⚙️ Admin</h1>
      <p className="text-zinc-400 text-sm mb-4">
        Renomeie times, ajuste horários e registre resultados. Ao salvar um resultado, os
        pontos de todos os palpites desse jogo são recalculados.
      </p>
      <AdminMatches matches={data} />
    </div>
  );
}
