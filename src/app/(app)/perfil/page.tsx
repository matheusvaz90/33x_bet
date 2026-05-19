import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { stageBadge } from "@/lib/stages";
import Link from "next/link";

export const dynamic = "force-dynamic";

const STATUS_CLS: Record<string, string> = {
  PENDENTE: "text-amber-300 border-amber-400/40 bg-amber-400/10",
  CONFIRMADA: "text-emerald-400 border-emerald-400/40 bg-emerald-400/10",
  RECUSADA: "text-red-400 border-red-400/40 bg-red-400/10",
};
const STATUS_LABEL: Record<string, string> = {
  PENDENTE: "Pendente",
  CONFIRMADA: "Confirmada",
  RECUSADA: "Recusada",
};

export default async function PerfilPage() {
  const session = await requireSession();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = prisma as any;

  const [userRaw, palpites, palpiteOuro, totalMatches, todosUsers] = await Promise.all([
    db.user.findUnique({
      where: { id: session.sub },
      select: { id: true, name: true, email: true, statusInscricao: true, valorInscricao: true, createdAt: true },
    }),
    prisma.palpite.findMany({
      where: { userId: session.sub },
      include: { match: true },
      orderBy: { match: { kickoff: "desc" } },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    }) as any[],
    db.palpiteOuro.findUnique({
      where: { userId: session.sub },
      include: { selecao: true },
    }),
    prisma.match.count(),
    // Para calcular posição no ranking
    db.user.findMany({
      include: {
        palpites: { select: { points: true, scorePoints: true, winnerPoints: true } },
        palpiteOuro: { select: { pontosObtidos: true } },
      },
    }),
  ]);

  const user = userRaw as Record<string, unknown>;

  // Calcular pontos totais e posição no ranking
  interface UserRow { id: string; palpites: Array<{ points: number; scorePoints: number; winnerPoints: number }>; palpiteOuro?: { pontosObtidos: number } | null }
  const ranking = (todosUsers as UserRow[])
    .map((u) => ({
      id: u.id,
      total: u.palpites.reduce((s, p) => s + p.points, 0) + (u.palpiteOuro?.pontosObtidos ?? 0),
    }))
    .sort((a, b) => b.total - a.total);

  const minhaPosicao = ranking.findIndex((r) => r.id === session.sub) + 1;

  const pontosRegulares = palpites.reduce((s: number, p: Record<string, number>) => s + p.points, 0);
  const pontosOuro = palpiteOuro?.pontosObtidos ?? 0;
  const totalPontos = pontosRegulares + pontosOuro;
  const cravadas = palpites.filter((p: Record<string, unknown> & { match: Record<string, unknown> }) => {
    const m = p.match as Record<string, unknown>;
    return m.status === "FINISHED" && p.homeScore === m.homeScore && p.awayScore === m.awayScore && p.homeScore !== null;
  }).length;
  const acertos = palpites.filter((p: Record<string, number | null | undefined> & { match: Record<string, unknown> }) => {
    const m = p.match as Record<string, unknown>;
    if (m.status !== "FINISHED" || m.homeScore === null || m.awayScore === null) return false;
    const realVencedor = Math.sign((m.homeScore as number) - (m.awayScore as number));
    if (p.homeScore !== null && p.awayScore !== null) {
      return Math.sign(p.homeScore - p.awayScore) === realVencedor;
    }
    if (p.winnerGuess) {
      const guess = p.winnerGuess === "HOME" ? 1 : p.winnerGuess === "AWAY" ? -1 : 0;
      return guess === realVencedor;
    }
    return false;
  }).length;

  const inicial = (user.name as string)?.[0]?.toUpperCase() ?? "?";
  const statusInscricao = (user.statusInscricao as string) ?? "PENDENTE";
  const valorInscricao = (user.valorInscricao as number) ?? 50;

  return (
    <div>
      <div className="mb-6 flex items-end gap-3 flex-wrap">
        <h1 className="font-display text-5xl tracking-wider leading-none">MEU PERFIL</h1>
      </div>

      {/* Cabeçalho do perfil */}
      <div className="card p-5 mb-5 flex items-center gap-4 flex-wrap">
        <div className="w-14 h-14 rounded-full bg-amber-400/20 border border-amber-400/40 flex items-center justify-center font-display text-2xl text-amber-300 shrink-0">
          {inicial}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-display text-2xl tracking-wider">{user.name as string}</div>
          <div className="text-zinc-500 text-sm">{user.email as string}</div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className={`chip border text-[0.65rem] ${STATUS_CLS[statusInscricao] ?? ""}`}>
            Inscrição: {STATUS_LABEL[statusInscricao] ?? statusInscricao}
          </span>
          <span className="text-xs text-zinc-500">
            Valor: R$ {valorInscricao.toFixed(2).replace(".", ",")}
          </span>
        </div>
      </div>

      {/* Cards de estatísticas */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 mb-5">
        <div className="card p-4 text-center">
          <div className="text-[0.6rem] uppercase tracking-widest text-zinc-500 mb-1">Pontuação</div>
          <div className="font-display text-3xl text-emerald-400">{totalPontos}</div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-[0.6rem] uppercase tracking-widest text-zinc-500 mb-1">Posição</div>
          <div className="font-display text-3xl text-amber-300">#{minhaPosicao}</div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-[0.6rem] uppercase tracking-widest text-zinc-500 mb-1">Cravadas</div>
          <div className="font-display text-3xl text-zinc-100">{cravadas}</div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-[0.6rem] uppercase tracking-widest text-zinc-500 mb-1">Acertos</div>
          <div className="font-display text-3xl text-zinc-100">{acertos}</div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-[0.6rem] uppercase tracking-widest text-zinc-500 mb-1">Palpites</div>
          <div className="font-display text-3xl text-zinc-100">{palpites.length}<span className="text-zinc-600 text-xl">/{totalMatches}</span></div>
        </div>
      </div>

      {/* Palpite de Ouro */}
      <div className="card p-5 mb-5">
        <h2 className="font-display text-lg tracking-wider mb-3">PALPITE DE OURO</h2>
        {palpiteOuro ? (
          <div className="flex items-center gap-3">
            <span className="text-3xl">{palpiteOuro.selecao.bandeira ?? "⚽"}</span>
            <div>
              <div className="font-semibold text-amber-300">{palpiteOuro.selecao.nome}</div>
              {palpiteOuro.pontosObtidos > 0 ? (
                <div className="text-emerald-400 font-display text-xl">+{palpiteOuro.pontosObtidos} pts conquistados</div>
              ) : (
                <div className="text-zinc-500 text-sm">Aguardando resultado da Copa</div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <p className="text-zinc-500 text-sm">Você ainda não escolheu um campeão.</p>
            <Link href="/palpite-ouro" className="btn-primary text-xs">Fazer Palpite de Ouro</Link>
          </div>
        )}
      </div>

      {/* Histórico de palpites */}
      <div className="card overflow-hidden">
        <div className="px-4 py-3 border-b border-[color:var(--c-border)] flex items-center justify-between">
          <h2 className="font-display text-lg tracking-wider">HISTÓRICO DE PALPITES</h2>
          <span className="text-xs text-zinc-500">{palpites.length} palpites</span>
        </div>
        {palpites.length === 0 ? (
          <div className="p-10 text-center text-zinc-500">Você ainda não fez nenhum palpite.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="text-zinc-500 text-xs uppercase tracking-wider">
              <tr>
                <th className="text-left px-4 py-2">Partida</th>
                <th className="text-left px-4 py-2 hidden sm:table-cell">Meu Palpite</th>
                <th className="text-left px-4 py-2 hidden md:table-cell">Resultado</th>
                <th className="text-right px-4 py-2">Pts</th>
              </tr>
            </thead>
            <tbody>
              {palpites.map((p: Record<string, unknown> & { match: Record<string, unknown> }) => {
                const m = p.match;
                const badge = stageBadge(m.stage as string, m.group as string | null);
                const finished = m.status === "FINISHED";
                return (
                  <tr key={p.id as string} className="border-t border-[color:var(--c-border)]">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className={`chip border text-[0.55rem] ${badge.cls}`}>{badge.label}</span>
                        <span className="text-zinc-300">{m.homeTeam as string} × {m.awayTeam as string}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell text-zinc-400">
                      {p.homeScore !== null && p.awayScore !== null ? `${p.homeScore} × ${p.awayScore}` : ""}
                      {p.winnerGuess && !p.homeScore ? (p.winnerGuess === "HOME" ? "Mandante" : p.winnerGuess === "AWAY" ? "Visitante" : "Empate") : ""}
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      {finished && m.homeScore !== null
                        ? <span className="text-emerald-400">{m.homeScore as number} × {m.awayScore as number}</span>
                        : <span className="text-zinc-600">Pendente</span>}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {finished ? (
                        <span className={`font-display text-lg ${(p.points as number) > 0 ? "text-emerald-400" : "text-zinc-600"}`}>
                          {(p.points as number) > 0 ? `+${p.points}` : "0"}
                        </span>
                      ) : (
                        <span className="text-zinc-600">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
