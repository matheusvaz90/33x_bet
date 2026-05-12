import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL || "admin@bolao.local";

  const existingAdmin = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (!existingAdmin) {
    await prisma.user.create({
      data: {
        email: adminEmail,
        name: "Admin",
        password: await bcrypt.hash("admin123", 10),
        isAdmin: true,
      },
    });
    console.log(`Admin criado: ${adminEmail} / admin123`);
  } else {
    console.log(`Admin já existe: ${adminEmail}`);
  }

  const matchCount = await prisma.match.count();
  if (matchCount > 0) {
    console.log(`Já existem ${matchCount} partidas, pulando seed de jogos.`);
    return;
  }

  const groups = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"];
  const order: Array<[number, number]> = [
    [1, 2],
    [3, 4],
    [1, 3],
    [2, 4],
    [4, 1],
    [2, 3],
  ];

  // 2026-06-11 13:00 -03:00 = 2026-06-11 16:00 UTC
  let kickoff = new Date(Date.UTC(2026, 5, 11, 16, 0, 0));

  for (const g of groups) {
    for (const [h, a] of order) {
      await prisma.match.create({
        data: {
          stage: "GROUP",
          group: g,
          homeTeam: `${g}${h}`,
          awayTeam: `${g}${a}`,
          kickoff: new Date(kickoff),
        },
      });
      kickoff = new Date(kickoff.getTime() + 3 * 60 * 60 * 1000);
    }
  }

  console.log(`Criadas ${groups.length * order.length} partidas da fase de grupos.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
