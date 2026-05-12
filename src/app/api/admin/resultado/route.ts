import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { calcPoints } from "@/lib/scoring";

export async function POST(req: Request) {
  const session = await getSession();
  if (!session || !session.isAdmin) {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }
  try {
    const body = await req.json();
    const { id, clear, homeScore, awayScore } = body;
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
          data: { homeScore: null, awayScore: null, finished: false },
        }),
        prisma.palpite.updateMany({ where: { matchId: id }, data: { points: 0 } }),
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

    const palpites = await prisma.palpite.findMany({ where: { matchId: id } });

    const updates = palpites.map((p) =>
      prisma.palpite.update({
        where: { id: p.id },
        data: {
          points: calcPoints(p.homeScore, p.awayScore, homeScore, awayScore, match.stage),
        },
      }),
    );

    await prisma.$transaction([
      prisma.match.update({
        where: { id },
        data: { homeScore, awayScore, finished: true },
      }),
      ...updates,
    ]);

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Erro ao salvar resultado" }, { status: 500 });
  }
}
