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
    totalFouls: m.totalFouls,
  }));

  return (
    <div>
      <div className="mb-4 flex items-end gap-3 flex-wrap">
        <h1 className="font-display text-5xl tracking-wider leading-none">ADMIN</h1>
        <span className="chip border-amber-400/40 bg-amber-400/10 text-amber-300">
          painel restrito
        </span>
      </div>
      <p className="text-zinc-400 text-sm mb-4">
        Renomeie times, ajuste horários e registre resultados. Ao salvar um resultado, os pontos
        de todos os palpites desse jogo são recalculados.
      </p>
      <AdminMatches matches={data} />
    </div>
  );
}
