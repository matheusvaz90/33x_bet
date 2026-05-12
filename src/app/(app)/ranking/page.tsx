import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function RankingPage() {
  const session = await getSession();
  const users = await prisma.user.findMany({
    include: { palpites: { include: { match: true } } },
  });

  const rows = users.map((u) => {
    let pontos = 0;
    let cravadas = 0;
    let acertos = 0;
    let total = 0;
    for (const p of u.palpites) {
      total++;
      pontos += p.points;
      if (
        p.match.finished &&
        p.match.homeScore !== null &&
        p.match.awayScore !== null &&
        p.homeScore !== null &&
        p.awayScore !== null
      ) {
        if (p.homeScore === p.match.homeScore && p.awayScore === p.match.awayScore) {
          cravadas++;
          acertos++;
        } else {
          const guessWinner = Math.sign(p.homeScore - p.awayScore);
          const realWinner = Math.sign(p.match.homeScore - p.match.awayScore);
          if (guessWinner === realWinner) acertos++;
        }
      }
    }
    return { id: u.id, name: u.name, pontos, cravadas, acertos, total };
  });

  rows.sort(
    (a, b) =>
      b.pontos - a.pontos ||
      b.cravadas - a.cravadas ||
      b.acertos - a.acertos ||
      a.name.localeCompare(b.name),
  );

  const podium = rows.slice(0, 3);
  const rest = rows.slice(3);
  const me = session ? rows.findIndex((r) => r.id === session.sub) : -1;

  return (
    <div>
      <div className="mb-6 flex items-end gap-3 flex-wrap">
        <h1 className="font-display text-5xl tracking-wider leading-none">RANKING</h1>
        <span className="chip">{rows.length} jogadores</span>
        {me >= 0 && (
          <span className="chip border-amber-400/40 bg-amber-400/10 text-amber-300">
            Você: #{me + 1} · {rows[me].pontos} pts
          </span>
        )}
      </div>

      {podium.length > 0 && <Podium podium={podium} />}

      {rest.length > 0 && (
        <div className="card overflow-hidden mt-6">
          <div className="px-4 py-3 border-b border-[color:var(--c-border)] flex items-center justify-between">
            <h2 className="font-display text-xl tracking-wider">CLASSIFICAÇÃO</h2>
            <span className="text-xs text-zinc-500 uppercase tracking-wider">
              {rest.length} restantes
            </span>
          </div>
          <table className="w-full text-sm">
            <thead className="text-zinc-500 text-xs uppercase tracking-wider">
              <tr>
                <th className="text-left px-4 py-2 w-12">#</th>
                <th className="text-left px-4 py-2">Jogador</th>
                <th className="text-right px-4 py-2">Pts</th>
                <th className="text-right px-4 py-2 hidden sm:table-cell">Cravadas</th>
                <th className="text-right px-4 py-2 hidden sm:table-cell">Acertos</th>
                <th className="text-right px-4 py-2 hidden sm:table-cell">Palpites</th>
              </tr>
            </thead>
            <tbody>
              {rest.map((r, i) => {
                const pos = i + 4;
                const isMe = session && r.id === session.sub;
                return (
                  <tr
                    key={r.id}
                    className={
                      "border-t border-[color:var(--c-border)] " +
                      (isMe ? "bg-amber-400/5" : "")
                    }
                  >
                    <td className="px-4 py-3 text-zinc-500 font-display text-lg">{pos}</td>
                    <td className="px-4 py-3 font-semibold">
                      {r.name}
                      {isMe && (
                        <span className="ml-2 text-[0.65rem] uppercase tracking-widest text-amber-300">
                          você
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right font-display text-xl text-emerald-400">
                      {r.pontos}
                    </td>
                    <td className="px-4 py-3 text-right hidden sm:table-cell text-zinc-300">
                      {r.cravadas}
                    </td>
                    <td className="px-4 py-3 text-right hidden sm:table-cell text-zinc-300">
                      {r.acertos}
                    </td>
                    <td className="px-4 py-3 text-right hidden sm:table-cell text-zinc-500">
                      {r.total}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {rows.length === 0 && (
        <div className="card p-10 text-center text-zinc-500">Nenhum jogador ainda.</div>
      )}

      <ScoringInfo />
    </div>
  );
}

function Podium({ podium }: { podium: Array<{ id: string; name: string; pontos: number; cravadas: number }> }) {
  // ordem visual: 2º, 1º, 3º
  const order = [1, 0, 2];
  const heights = ["h-32", "h-44", "h-24"];
  const colors = [
    "from-zinc-300 to-zinc-500", // 2nd silver
    "from-amber-300 to-yellow-500", // 1st gold
    "from-orange-400 to-amber-700", // 3rd bronze
  ];
  const medals = ["🥈", "🥇", "🥉"];

  return (
    <div className="card p-6">
      <h2 className="font-display text-xl tracking-wider mb-4 text-center">PÓDIO</h2>
      <div className="flex items-end justify-center gap-3 sm:gap-6">
        {order.map((idx, visualIdx) => {
          const p = podium[idx];
          if (!p) return <div key={visualIdx} className="w-24 sm:w-32" />;
          return (
            <div key={p.id} className="flex flex-col items-center w-24 sm:w-32">
              <div className="text-3xl sm:text-4xl mb-1">{medals[visualIdx]}</div>
              <div className="text-center mb-2">
                <div className="font-semibold text-sm sm:text-base truncate max-w-full">
                  {p.name}
                </div>
                <div className="text-emerald-400 font-display text-2xl leading-none">
                  {p.pontos}
                </div>
                <div className="text-[0.65rem] text-zinc-500 uppercase tracking-wider">
                  {p.cravadas} cravadas
                </div>
              </div>
              <div
                className={`w-full ${heights[visualIdx]} rounded-t-lg bg-gradient-to-b ${colors[visualIdx]} flex items-start justify-center pt-2`}
              >
                <span className="font-display text-3xl text-zinc-900/80">
                  {idx + 1}º
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ScoringInfo() {
  const markets: Array<{ title: string; icon: string; rules: Array<[string, string]> }> = [
    {
      title: "Placar exato",
      icon: "🎯",
      rules: [
        ["Cravou o placar", "10 pts"],
        ["Vencedor + saldo igual", "7 pts"],
        ["Só o vencedor", "5 pts"],
        ["Errou", "0"],
      ],
    },
    {
      title: "Vencedor (sem placar)",
      icon: "🏁",
      rules: [
        ["Acertou Mandante/Empate/Visitante", "3 pts"],
        ["Errou", "0"],
        ["(Se preencheu placar, este não conta)", ""],
      ],
    },
    {
      title: "Total de gols",
      icon: "⚽",
      rules: [
        ["Exato", "5 pts"],
        ["Errou por 1", "3 pts"],
        ["Errou por 2", "1 pt"],
        ["Errou por 3+", "0"],
      ],
    },
    {
      title: "Total de faltas",
      icon: "🟨",
      rules: [
        ["Exato", "5 pts"],
        ["Errou por até 2", "3 pts"],
        ["Errou por até 5", "1 pt"],
        ["Errou por mais", "0"],
      ],
    },
  ];

  return (
    <div className="card p-5 mt-6 text-sm">
      <h2 className="font-display text-xl tracking-wider mb-3">MERCADOS & PONTUAÇÃO</h2>
      <div className="grid sm:grid-cols-2 gap-4">
        {markets.map((m) => (
          <div
            key={m.title}
            className="bg-[color:var(--c-bg-soft)] border border-[color:var(--c-border)] rounded-lg p-3"
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl">{m.icon}</span>
              <h3 className="font-display tracking-wider text-zinc-200">{m.title}</h3>
            </div>
            <div className="space-y-1">
              {m.rules.map(([k, v]) => (
                <div key={k} className="flex justify-between text-xs text-zinc-400">
                  <span>{k}</span>
                  <span className="text-emerald-400 font-display text-base">{v}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 pt-4 border-t border-[color:var(--c-border)] text-zinc-400 text-xs">
        <div className="font-semibold text-zinc-200 mb-1 uppercase tracking-wider">
          Multiplicador por fase (vale pra TODOS os mercados)
        </div>
        <div className="flex flex-wrap gap-2 mt-1">
          {[
            ["Grupos", "×1"],
            ["16-avos", "×1.25"],
            ["Oitavas", "×1.5"],
            ["Quartas", "×2"],
            ["Semi", "×2.5"],
            ["3º lugar", "×3"],
            ["Final", "×3"],
          ].map(([k, v]) => (
            <span key={k} className="chip">
              {k} <span className="text-amber-300">{v}</span>
            </span>
          ))}
        </div>
        <div className="mt-3 text-[0.7rem]">
          Desempate: pontos → cravadas → vencedores acertados.
        </div>
      </div>
    </div>
  );
}
