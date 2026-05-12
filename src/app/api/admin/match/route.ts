import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function POST(req: Request) {
  const session = await getSession();
  if (!session || !session.isAdmin) {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }
  try {
    const { id, homeTeam, awayTeam, kickoff } = await req.json();
    if (typeof id !== "string") {
      return NextResponse.json({ error: "id obrigatório" }, { status: 400 });
    }
    const data: {
      homeTeam?: string;
      awayTeam?: string;
      kickoff?: Date;
    } = {};
    if (typeof homeTeam === "string" && homeTeam.trim()) data.homeTeam = homeTeam.trim();
    if (typeof awayTeam === "string" && awayTeam.trim()) data.awayTeam = awayTeam.trim();
    if (typeof kickoff === "string") {
      const d = new Date(kickoff);
      if (!isNaN(d.getTime())) data.kickoff = d;
    }
    await prisma.match.update({ where: { id }, data });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Erro ao atualizar jogo" }, { status: 500 });
  }
}
