import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }
  try {
    const { matchId, homeScore, awayScore } = await req.json();
    if (
      typeof matchId !== "string" ||
      typeof homeScore !== "number" ||
      typeof awayScore !== "number" ||
      homeScore < 0 ||
      awayScore < 0 ||
      !Number.isInteger(homeScore) ||
      !Number.isInteger(awayScore)
    ) {
      return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
    }
    const match = await prisma.match.findUnique({ where: { id: matchId } });
    if (!match) {
      return NextResponse.json({ error: "Jogo não encontrado" }, { status: 404 });
    }
    if (match.kickoff.getTime() <= Date.now()) {
      return NextResponse.json({ error: "Palpites encerrados para este jogo" }, { status: 403 });
    }

    await prisma.palpite.upsert({
      where: { userId_matchId: { userId: session.sub, matchId } },
      create: { userId: session.sub, matchId, homeScore, awayScore },
      update: { homeScore, awayScore },
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Erro ao salvar palpite" }, { status: 500 });
  }
}
