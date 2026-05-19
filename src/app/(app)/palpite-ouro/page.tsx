import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import PalpiteOuroForm from "./PalpiteOuroForm";

export const dynamic = "force-dynamic";

export default async function PalpiteOuroPage() {
  await requireSession();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = prisma as any;

  const [selecoes, ultimoJogoGrupos] = await Promise.all([
    db.selecao.findMany({
      include: { _count: { select: { palpitesOuro: true } } },
      orderBy: { nome: "asc" },
    }),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (prisma.match as any).findFirst({
      where: { stage: "GROUP" },
      orderBy: { kickoff: "desc" },
    }),
  ]);

  const session = await requireSession();
  const meuPalpite = await db.palpiteOuro.findUnique({
    where: { userId: session.sub },
    include: { selecao: true },
  });

  const prazoEncerrado = ultimoJogoGrupos
    ? new Date() >= new Date(ultimoJogoGrupos.kickoff)
    : false;

  const selecoesComOdds = selecoes.map((s: Record<string, unknown> & { _count: { palpitesOuro: number }; pesoPalpiteOuro: number }) => ({
    id: s.id as string,
    nome: s.nome as string,
    pais: s.pais as string,
    bandeira: s.bandeira as string | null,
    pesoPalpiteOuro: s.pesoPalpiteOuro,
    totalApostadores: s._count.palpitesOuro,
    pontosEstimados: Math.round(s.pesoPalpiteOuro / Math.max(s._count.palpitesOuro + 1, 1)),
  }));

  const prazoTexto = ultimoJogoGrupos
    ? new Intl.DateTimeFormat("pt-BR", {
        day: "2-digit", month: "long", hour: "2-digit", minute: "2-digit",
        timeZone: "America/Sao_Paulo",
      }).format(new Date(ultimoJogoGrupos.kickoff))
    : null;

  return (
    <div>
      <div className="mb-6 flex items-end gap-3 flex-wrap">
        <h1 className="font-display text-5xl tracking-wider leading-none">PALPITE DE OURO</h1>
        <span className="chip border-amber-400/40 bg-amber-400/10 text-amber-300">Quem será campeão?</span>
      </div>

      <div className="card p-5 mb-6">
        <h2 className="font-display text-lg tracking-wider mb-2">Como funciona</h2>
        <ul className="text-sm text-zinc-400 space-y-1">
          <li>Aposte em qual seleção será campeã da Copa do Mundo 2026.</li>
          <li>Quanto menos pessoas apostarem no mesmo time, mais pontos você recebe se acertar.</li>
          <li>Fórmula: <span className="text-amber-300 font-display">Pontos = 50 ÷ nº de apostadores</span></li>
          {prazoTexto && (
            <li className="text-amber-300">Prazo: até {prazoTexto} (início do último jogo da fase de grupos).</li>
          )}
        </ul>
      </div>

      <PalpiteOuroForm
        selecoes={selecoesComOdds}
        meuPalpite={meuPalpite}
        prazoEncerrado={prazoEncerrado}
      />
    </div>
  );
}
