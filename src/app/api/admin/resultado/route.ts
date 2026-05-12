import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { calcBreakdown } from "@/lib/scoring";

export async function POST(req: Request) {
  const session = await getSession();
  if (!session || !session.isAdmin) {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }
  try {
    const body = await req.json();
    const { id, clear, homeScore, awayScore, totalFouls } = body;
    if (typeof id !== "string") {
      return NextResponse.json({ error: "id obrigatório" }, { status: 400 });
    }
    const match = await prisma.match.findUnique({ where: { id } });
    if (!match) {
      return NextResponse.json({ error: "Jogo não encontrado" }, { status: 404 });
    }

    if (clear) {
      await prisma.$transaction([
        prisma.match.update({
          where: { id },
          data: { homeScore: null, awayScore: null, totalFouls: null, finished: false },
        }),
        prisma.palpite.updateMany({
          where: { matchId: id },
          data: {
            points: 0,
            scorePoints: 0,
            winnerPoints: 0,
            goalsPoints: 0,
            foulsPoints: 0,
          },
        }),
      ]);
      return NextResponse.json({ ok: true });
    }

    if (
      typeof homeScore !== "number" ||
      typeof awayScore !== "number" ||
      !Number.isInteger(homeScore) ||
      !Number.isInteger(awayScore) ||
      homeScore < 0 ||
      awayScore < 0
    ) {
      return NextResponse.json({ error: "Placar inválido" }, { status: 400 });
    }
    const realFouls =
      totalFouls === null || totalFouls === undefined || totalFouls === ""
        ? null
        : Number.isInteger(totalFouls) && totalFouls >= 0
          ? totalFouls
          : null;

    const palpites = await prisma.palpite.findMany({ where: { matchId: id } });

    const updates = palpites.map((p) => {
      const b = calcBreakdown(
        {
          homeScore: p.homeScore,
          awayScore: p.awayScore,
          winnerGuess: p.winnerGuess,
          totalGoals: p.totalGoals,
          totalFouls: p.totalFouls,
        },
        { homeScore, awayScore, totalFouls: realFouls },
        match.stage,
      );
      return prisma.palpite.update({
        where: { id: p.id },
        data: {
          scorePoints: b.scorePoints,
          winnerPoints: b.winnerPoints,
          goalsPoints: b.goalsPoints,
          foulsPoints: b.foulsPoints,
          points: b.points,
        },
      });
    });

    await prisma.$transaction([
      prisma.match.update({
        where: { id },
        data: { homeScore, awayScore, totalFouls: realFouls, finished: true },
      }),
      ...updates,
    ]);

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Erro ao salvar resultado" }, { status: 500 });
  }
}
