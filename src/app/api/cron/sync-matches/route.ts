import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { calcBreakdown } from "@/lib/scoring";

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const resultado = await syncMatchesFromAPI();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (prisma as any).cronLog.create({
      data: { tipo: "sync_matches", status: "success", mensagem: `${resultado.atualizados} jogo(s) atualizado(s)` },
    });
    return NextResponse.json({ success: true, ...resultado });
  } catch (error) {
    console.error("Cron sync failed:", error);
    await notificarFalha(String(error));
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

async function syncMatchesFromAPI() {
  const token = process.env.FOOTBALL_DATA_TOKEN;
  if (!token) throw new Error("FOOTBALL_DATA_TOKEN não configurado");

  const res = await fetch("https://api.football-data.org/v4/competitions/WC/matches", {
    headers: { "X-Auth-Token": token },
    next: { revalidate: 0 },
  });
  if (!res.ok) throw new Error(`API error: ${res.status} ${res.statusText}`);

  const data = await res.json();
  let atualizados = 0;

  for (const match of data.matches ?? []) {
    if (match.status !== "FINISHED") continue;
    if (match.score?.fullTime?.home === null || match.score?.fullTime?.away === null) continue;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const existing = await (prisma.match as any).findFirst({
      where: {
        homeTeam: { contains: match.homeTeam.shortName ?? match.homeTeam.name },
        awayTeam: { contains: match.awayTeam.shortName ?? match.awayTeam.name },
      },
    });

    if (!existing || existing.status === "FINISHED") continue;

    const homeScore = match.score.fullTime.home as number;
    const awayScore = match.score.fullTime.away as number;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (prisma.match as any).update({
      where: { id: existing.id },
      data: { homeScore, awayScore, status: "FINISHED" },
    });

    // Recalcular pontos dos palpites desta partida
    const palpites = await prisma.palpite.findMany({ where: { matchId: existing.id } });
    await prisma.$transaction(
      palpites.map((p) => {
        const b = calcBreakdown(
          { homeScore: p.homeScore, awayScore: p.awayScore, winnerGuess: p.winnerGuess, totalGoals: p.totalGoals, totalFouls: p.totalFouls },
          { homeScore, awayScore, totalFouls: null },
          existing.stage,
        );
        return prisma.palpite.update({
          where: { id: p.id },
          data: { scorePoints: b.scorePoints, winnerPoints: b.winnerPoints, goalsPoints: b.goalsPoints, foulsPoints: b.foulsPoints, points: b.points },
        });
      }),
    );

    atualizados++;
  }

  return { atualizados, timestamp: new Date().toISOString() };
}

async function notificarFalha(erro: string) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (prisma as any).cronLog.create({
      data: { tipo: "sync_matches", status: "error", mensagem: erro },
    });
  } catch (e) {
    console.error("Falha ao salvar log de erro:", e);
  }
}
