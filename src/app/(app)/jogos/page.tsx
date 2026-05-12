import { prisma } from "@/lib/db";
import { STAGE_LABEL } from "@/lib/scoring";

export const dynamic = "force-dynamic";

function fmt(d: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "America/Sao_Paulo",
  }).format(d);
}

export default async function JogosPage() {
  const matches = await prisma.match.findMany({ orderBy: { kickoff: "asc" } });

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">📅 Jogos</h1>
      <div className="space-y-2">
        {matches.map((m) => (
          <div
            key={m.id}
            className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 flex items-center gap-3"
          >
            <div className="text-xs bg-zinc-800 border border-zinc-700 rounded-md px-2 py-1 text-zinc-300 whitespace-nowrap">
              {m.stage === "GROUP" ? `Grupo ${m.group}` : STAGE_LABEL[m.stage] || m.stage}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 font-medium">
                <span className="truncate">{m.homeTeam}</span>
                <span className="text-zinc-500">×</span>
                <span className="truncate">{m.awayTeam}</span>
              </div>
              <div className="text-xs text-zinc-500">{fmt(m.kickoff)}</div>
            </div>
            <div className="text-right font-mono">
              {m.finished && m.homeScore !== null && m.awayScore !== null ? (
                <span className="text-emerald-400 font-bold">
                  {m.homeScore} × {m.awayScore}
                </span>
              ) : (
                <span className="text-zinc-500">× ×</span>
              )}
            </div>
          </div>
        ))}
        {matches.length === 0 && (
          <p className="text-zinc-500 text-center py-6">Nenhum jogo cadastrado.</p>
        )}
      </div>
    </div>
  );
}
