import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import AdminMatches from "./AdminMatches";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  await requireAdmin();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const raw = await prisma.match.findMany({ orderBy: { kickoff: "asc" } }) as any[];
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
  }));

  // Logs recentes do cron
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const logsRecentes = await (prisma as any).cronLog?.findMany({
    orderBy: { createdAt: "desc" },
    take: 10,
  }).catch(() => []) ?? [];

  const temErroRecente = logsRecentes.some((l: Record<string, unknown>) => {
    const t = l.createdAt as Date;
    const duasHorasAtras = new Date(Date.now() - 2 * 60 * 60 * 1000);
    return l.status === "error" && t > duasHorasAtras;
  });

  return (
    <div>
      <div className="mb-4 flex items-end gap-3 flex-wrap">
        <h1 className="font-display text-5xl tracking-wider leading-none">ADMIN</h1>
        <span className="chip border-amber-400/40 bg-amber-400/10 text-amber-300">painel restrito</span>
      </div>

      <div className="flex flex-wrap gap-3 mb-6">
        <Link href="/admin/financeiro" className="bg-emerald-900/40 hover:bg-emerald-800/50 border border-emerald-500/30 text-emerald-300 text-sm font-semibold rounded-lg px-4 py-2">
          Gestão Financeira
        </Link>
        <Link href="/admin/campeo" className="bg-amber-900/40 hover:bg-amber-800/50 border border-amber-500/30 text-amber-300 text-sm font-semibold rounded-lg px-4 py-2">
          Definir Campeão
        </Link>
      </div>

      <p className="text-zinc-400 text-sm mb-4">
        Renomeie times, ajuste horários e registre resultados. Ao salvar um resultado, os pontos de todos os palpites desse jogo são recalculados.
      </p>

      {logsRecentes.length > 0 && (
        <div className="card p-4 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <h2 className="font-display text-lg tracking-wider">LOGS DO CRON</h2>
            {temErroRecente && (
              <span className="chip border-red-500/40 bg-red-500/10 text-red-400">Erro nas últimas 2h</span>
            )}
          </div>
          <div className="space-y-1">
            {logsRecentes.map((l: Record<string, unknown>) => (
              <div key={l.id as string} className="flex items-center gap-3 text-xs">
                <span className={l.status === "error" ? "text-red-400" : "text-emerald-400"}>
                  {l.status === "error" ? "✗" : "✓"}
                </span>
                <span className="text-zinc-400">{new Date(l.createdAt as string).toLocaleString("pt-BR")}</span>
                <span className="text-zinc-500">{l.tipo as string}</span>
                {l.mensagem != null && <span className="text-zinc-600 truncate">{String(l.mensagem)}</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      <AdminMatches matches={data} />
    </div>
  );
}
