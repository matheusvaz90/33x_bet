import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import FinanceiroTable from "./FinanceiroTable";

export const dynamic = "force-dynamic";

function moeda(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default async function FinanceiroPage() {
  await requireAdmin();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const usuarios = await (prisma.user as any).findMany({
    select: {
      id: true, name: true, email: true,
      statusInscricao: true, valorInscricao: true, observacaoAdmin: true, createdAt: true,
    },
    orderBy: { createdAt: "asc" },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  }) as any[];

  // Ranking atual para mostrar nomes dos premiados
  const todosUsers = await prisma.user.findMany({
    include: { palpites: { select: { points: true } } },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  }) as any[];

  const ranking = todosUsers
    .map((u: Record<string, unknown> & { palpites: Array<{ points: number }> }) => ({
      name: u.name as string,
      pontos: u.palpites.reduce((s: number, p: { points: number }) => s + p.points, 0) + ((u.palpiteOuro as Record<string, number> | null)?.pontosObtidos ?? 0),
    }))
    .sort((a: { pontos: number }, b: { pontos: number }) => b.pontos - a.pontos);

  const confirmados = usuarios.filter((u: Record<string, unknown>) => u.statusInscricao === "CONFIRMADA");
  const poolTotal = confirmados.reduce((s: number, u: Record<string, unknown>) => s + ((u.valorInscricao as number) ?? 50), 0);

  const pct1 = Number(process.env.PRIZE_1ST_PCT ?? 50) / 100;
  const pct2 = Number(process.env.PRIZE_2ND_PCT ?? 30) / 100;
  const pct3 = Number(process.env.PRIZE_3RD_PCT ?? 20) / 100;

  const premios = { primeiro: poolTotal * pct1, segundo: poolTotal * pct2, terceiro: poolTotal * pct3 };

  const tableUsuarios = usuarios.map((u: Record<string, unknown>) => ({
    id: u.id as string,
    name: u.name as string,
    email: u.email as string,
    statusInscricao: (u.statusInscricao as string) ?? "PENDENTE",
    valorInscricao: (u.valorInscricao as number) ?? 50,
    observacaoAdmin: u.observacaoAdmin as string | null,
    createdAt: (u.createdAt as Date).toISOString(),
  }));

  return (
    <div>
      <div className="mb-6 flex items-end gap-3 flex-wrap">
        <h1 className="font-display text-5xl tracking-wider leading-none">FINANCEIRO</h1>
        <span className="chip border-amber-400/40 bg-amber-400/10 text-amber-300">admin restrito</span>
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="card p-4">
          <div className="text-[0.65rem] uppercase tracking-widest text-zinc-500 mb-1">Total</div>
          <div className="font-display text-3xl text-zinc-100">{usuarios.length}</div>
        </div>
        <div className="card p-4">
          <div className="text-[0.65rem] uppercase tracking-widest text-zinc-500 mb-1">Confirmados</div>
          <div className="font-display text-3xl text-emerald-400">{confirmados.length}</div>
        </div>
        <div className="card p-4">
          <div className="text-[0.65rem] uppercase tracking-widest text-zinc-500 mb-1">Pendentes</div>
          <div className="font-display text-3xl text-amber-300">
            {usuarios.filter((u: Record<string, unknown>) => !u.statusInscricao || u.statusInscricao === "PENDENTE").length}
          </div>
        </div>
        <div className="card p-4">
          <div className="text-[0.65rem] uppercase tracking-widest text-zinc-500 mb-1">Pool Total</div>
          <div className="font-display text-2xl text-emerald-400">{moeda(poolTotal)}</div>
        </div>
      </div>

      {/* Premiação estimada */}
      <div className="card p-5 mb-6">
        <h2 className="font-display text-lg tracking-wider mb-4">PREMIAÇÃO ESTIMADA</h2>
        <div className="grid sm:grid-cols-3 gap-4">
          {[
            { pos: "1º", valor: premios.primeiro, nome: ranking[0]?.name, medal: "🥇" },
            { pos: "2º", valor: premios.segundo, nome: ranking[1]?.name, medal: "🥈" },
            { pos: "3º", valor: premios.terceiro, nome: ranking[2]?.name, medal: "🥉" },
          ].map(({ pos, valor, nome, medal }) => (
            <div key={pos} className="bg-[color:var(--c-bg-soft)] border border-[color:var(--c-border)] rounded-xl p-4 text-center">
              <div className="text-3xl mb-1">{medal}</div>
              <div className="font-display text-2xl text-emerald-400">{moeda(valor)}</div>
              <div className="text-[0.65rem] uppercase tracking-widest text-zinc-500 mt-1">{pos} lugar</div>
              {nome && <div className="text-sm text-zinc-300 mt-1 font-semibold">{nome}</div>}
            </div>
          ))}
        </div>
        <p className="text-xs text-zinc-600 mt-3">* Baseado no ranking atual. Premiados mudam conforme os jogos avançam.</p>
      </div>

      <FinanceiroTable usuarios={tableUsuarios} />
    </div>
  );
}
