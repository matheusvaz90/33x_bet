import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const stages = await prisma.match.groupBy({
    by: ["stage"],
    _count: { _all: true },
  });
  const total = await prisma.match.count();
  console.log(`Total: ${total} partidas`);
  for (const s of stages) {
    console.log(`  ${s.stage.padEnd(6)} ${s._count._all}`);
  }
  const samples = await prisma.match.findMany({
    where: { stage: "GROUP", group: "A" },
    orderBy: { kickoff: "asc" },
    take: 6,
  });
  console.log("\nGrupo A:");
  for (const m of samples) {
    console.log(`  ${m.kickoff.toISOString()}  ${m.homeTeam} × ${m.awayTeam}`);
  }
  const ko = await prisma.match.findFirst({
    where: { stage: "FINAL" },
  });
  console.log("\nFinal:", ko?.kickoff.toISOString(), ko?.homeTeam, "×", ko?.awayTeam);
}
main().finally(() => prisma.$disconnect());
