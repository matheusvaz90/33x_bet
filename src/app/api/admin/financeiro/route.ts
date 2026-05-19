import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  await requireAdmin();

  const usuarios = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ...(true as any), // workaround: fields added after migration
    },
    orderBy: { createdAt: "asc" },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  }) as any[];

  const confirmados = usuarios.filter((u) => u.statusInscricao === "CONFIRMADA");
  const poolTotal = confirmados.reduce((s: number, u: Record<string, unknown>) => s + ((u.valorInscricao as number) ?? 50), 0);

  const pct1 = Number(process.env.PRIZE_1ST_PCT ?? 50) / 100;
  const pct2 = Number(process.env.PRIZE_2ND_PCT ?? 30) / 100;
  const pct3 = Number(process.env.PRIZE_3RD_PCT ?? 20) / 100;

  return NextResponse.json({
    usuarios,
    resumo: {
      total: usuarios.length,
      confirmados: confirmados.length,
      pendentes: usuarios.filter((u) => u.statusInscricao === "PENDENTE" || !u.statusInscricao).length,
      recusados: usuarios.filter((u) => u.statusInscricao === "RECUSADA").length,
      poolTotal,
      premios: {
        primeiro: poolTotal * pct1,
        segundo: poolTotal * pct2,
        terceiro: poolTotal * pct3,
      },
    },
  });
}

export async function PATCH(req: NextRequest) {
  await requireAdmin();
  const { userId, status, observacao } = await req.json();

  if (!["PENDENTE", "CONFIRMADA", "RECUSADA"].includes(status)) {
    return NextResponse.json({ error: "Status inválido" }, { status: 400 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const user = await (prisma.user as any).update({
    where: { id: userId },
    data: { statusInscricao: status, observacaoAdmin: observacao ?? null },
  });

  return NextResponse.json({ user });
}
