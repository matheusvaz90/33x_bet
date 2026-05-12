import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function RankingPage() {
  const users = await prisma.user.findMany({
    include: {
      palpites: {
        include: { match: true },
      },
    },
  });

  const rows = users.map((u) => {
    let pontos = 0;
    let cravadas = 0;
    let acertos = 0;
    let total = 0;
    for (const p of u.palpites) {
      total++;
      pontos += p.points;
      if (p.match.finished && p.match.homeScore !== null && p.match.awayScore !== null) {
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

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">🏆 Ranking</h1>
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-zinc-900 border-b border-zinc-800 text-zinc-400">
            <tr>
              <th className="text-left px-3 py-2">#</th>
              <th className="text-left px-3 py-2">Nome</th>
              <th className="text-right px-3 py-2">Pontos</th>
              <th className="text-right px-3 py-2 hidden sm:table-cell">Cravadas</th>
              <th className="text-right px-3 py-2 hidden sm:table-cell">Acertos</th>
              <th className="text-right px-3 py-2 hidden sm:table-cell">Palpites</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.id} className="border-b border-zinc-800 last:border-0">
                <td className="px-3 py-2 text-zinc-400">{i + 1}</td>
                <td className="px-3 py-2 font-medium">{r.name}</td>
                <td className="px-3 py-2 text-right text-emerald-400 font-semibold">
                  {r.pontos}
                </td>
                <td className="px-3 py-2 text-right hidden sm:table-cell">{r.cravadas}</td>
                <td className="px-3 py-2 text-right hidden sm:table-cell">{r.acertos}</td>
                <td className="px-3 py-2 text-right hidden sm:table-cell text-zinc-400">
                  {r.total}
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-3 py-6 text-center text-zinc-500">
                  Nenhum usuário ainda.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-6 bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-sm text-zinc-400">
        <h2 className="text-zinc-200 font-semibold mb-2">Regra de pontuação</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li>Placar exato: <span className="text-emerald-400">10 pts</span></li>
          <li>Vencedor + saldo de gols igual: <span className="text-emerald-400">7 pts</span></li>
          <li>Só o vencedor (ou empate sem placar exato): <span className="text-emerald-400">5 pts</span></li>
          <li>Errou: 0</li>
          <li>
            Multiplicadores por fase: Grupos ×1, Oitavas ×1.5, Quartas ×2, Semifinal ×2.5,
            Disputa 3º ×3, Final ×3.
          </li>
        </ul>
        <p className="mt-2 text-xs">
          Desempate: pontos → cravadas → vencedores acertados.
        </p>
      </div>
    </div>
  );
}
