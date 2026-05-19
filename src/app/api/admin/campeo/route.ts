import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  await requireAdmin();
  const { selecaoId } = await req.json();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = prisma as any;

  const selecao = await db.selecao.findUnique({ where: { id: selecaoId } });
  if (!selecao) {
    return NextResponse.json({ error: "Seleção não encontrada" }, { status: 404 });
  }

  const palpitesVencedores = await db.palpiteOuro.findMany({ where: { selecaoId } });
  const totalApostadores = palpitesVencedores.length;
  const pontosParaCada =
    totalApostadores > 0 ? Math.round(selecao.pesoPalpiteOuro / totalApostadores) : 0;

  // Zera todos → atribui pontos apenas para quem acertou
  await db.$transaction([
    db.palpiteOuro.updateMany({ data: { pontosObtidos: 0 } }),
    db.palpiteOuro.updateMany({ where: { selecaoId }, data: { pontosObtidos: pontosParaCada } }),
  ]);

  return NextResponse.json({
    message: `Campeão definido: ${selecao.nome}. ${totalApostadores} apostador(es) recebem ${pontosParaCada} pts cada.`,
    selecao: selecao.nome,
    totalApostadores,
    pontosParaCada,
  });
}
