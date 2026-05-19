import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await requireSession();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = prisma as any;

  const [selecoes, meuPalpite] = await Promise.all([
    db.selecao.findMany({
      include: { _count: { select: { palpitesOuro: true } } },
      orderBy: { nome: "asc" },
    }),
    db.palpiteOuro.findUnique({
      where: { userId: session.sub },
      include: { selecao: true },
    }),
  ]);

  // Calcular prazo: último jogo da fase de grupos
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ultimoJogoGrupos = await (prisma.match as any).findFirst({
    where: { stage: "GROUP" },
    orderBy: { kickoff: "desc" },
  });
  const prazoEncerrado = ultimoJogoGrupos
    ? new Date() >= new Date(ultimoJogoGrupos.kickoff)
    : false;

  const selecoesComOdds = selecoes.map((s: Record<string, unknown> & { _count: { palpitesOuro: number }; pesoPalpiteOuro: number }) => ({
    id: s.id,
    nome: s.nome,
    pais: s.pais,
    bandeira: s.bandeira,
    pesoPalpiteOuro: s.pesoPalpiteOuro,
    totalApostadores: s._count.palpitesOuro,
    pontosEstimados: Math.round(s.pesoPalpiteOuro / Math.max(s._count.palpitesOuro + 1, 1)),
  }));

  return NextResponse.json({ selecoes: selecoesComOdds, meuPalpite, prazoEncerrado });
}

export async function POST(req: NextRequest) {
  const session = await requireSession();
  const { selecaoId } = await req.json();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = prisma as any;

  // Verificar prazo: kickoff do último jogo da fase de grupos
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ultimoJogoGrupos = await (prisma.match as any).findFirst({
    where: { stage: "GROUP" },
    orderBy: { kickoff: "desc" },
  });

  if (!ultimoJogoGrupos) {
    return NextResponse.json({ error: "Partidas não cadastradas" }, { status: 400 });
  }
  if (new Date() >= new Date(ultimoJogoGrupos.kickoff)) {
    return NextResponse.json({ error: "Prazo encerrado. Fase de grupos já iniciou." }, { status: 403 });
  }

  const selecao = await db.selecao.findUnique({ where: { id: selecaoId } });
  if (!selecao) {
    return NextResponse.json({ error: "Seleção não encontrada" }, { status: 404 });
  }

  const palpite = await db.palpiteOuro.upsert({
    where: { userId: session.sub },
    update: { selecaoId, pontosObtidos: 0 },
    create: { userId: session.sub, selecaoId, pontosObtidos: 0 },
    include: { selecao: true },
  });

  return NextResponse.json({ palpite });
}
