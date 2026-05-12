import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

function intOrNull(v: unknown): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  if (!Number.isInteger(n) || n < 0) return null;
  return n;
}

function winnerOrNull(v: unknown): string | null {
  if (v === "HOME" || v === "DRAW" || v === "AWAY") return v;
  return null;
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }
  try {
    const body = await req.json();
    if (typeof body.matchId !== "string") {
      return NextResponse.json({ error: "matchId obrigatório" }, { status: 400 });
    }

    const homeScore = intOrNull(body.homeScore);
    const awayScore = intOrNull(body.awayScore);
    const winnerGuess = winnerOrNull(body.winnerGuess);
    const totalGoals = intOrNull(body.totalGoals);
    const totalFouls = intOrNull(body.totalFouls);

    // pelo menos um mercado preenchido
    const hasAny =
      (homeScore !== null && awayScore !== null) ||
      winnerGuess !== null ||
      totalGoals !== null ||
      totalFouls !== null;
    if (!hasAny) {
      return NextResponse.json(
        { error: "Preencha ao menos um palpite" },
        { status: 400 },
      );
    }

    const match = await prisma.match.findUnique({ where: { id: body.matchId } });
    if (!match) {
      return NextResponse.json({ error: "Jogo não encontrado" }, { status: 404 });
    }
    if (match.kickoff.getTime() <= Date.now()) {
      return NextResponse.json({ error: "Palpites encerrados para este jogo" }, { status: 403 });
    }

    await prisma.palpite.upsert({
      where: { userId_matchId: { userId: session.sub, matchId: body.matchId } },
      create: {
        userId: session.sub,
        matchId: body.matchId,
        homeScore,
        awayScore,
        winnerGuess,
        totalGoals,
        totalFouls,
      },
      update: {
        homeScore,
        awayScore,
        winnerGuess,
        totalGoals,
        totalFouls,
      },
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Erro ao salvar palpite" }, { status: 500 });
  }
}
