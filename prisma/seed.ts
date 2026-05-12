import { PrismaClient } from "@prisma/client";
import { createClient } from "@supabase/supabase-js";

const prisma = new PrismaClient();

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórios no .env");
  }
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

async function main() {
  const supabase = getSupabaseAdmin();
  const adminEmail = (process.env.ADMIN_EMAIL || "admin@bolao.local").toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD || "admin123";

  // 1) Cria admin no Supabase Auth (idempotente)
  let adminAuthId: string | null = null;
  const { data: list, error: listErr } = await supabase.auth.admin.listUsers();
  if (listErr) throw listErr;
  const existing = list.users.find((u) => (u.email || "").toLowerCase() === adminEmail);

  if (existing) {
    adminAuthId = existing.id;
    console.log(`Admin já existe no Supabase Auth: ${adminEmail}`);
  } else {
    const { data, error } = await supabase.auth.admin.createUser({
      email: adminEmail,
      password: adminPassword,
      email_confirm: true,
      user_metadata: { name: "Admin" },
    });
    if (error || !data.user) throw error || new Error("Falha ao criar admin");
    adminAuthId = data.user.id;
    console.log(`Admin criado no Supabase Auth: ${adminEmail} / ${adminPassword}`);
  }

  // 2) Espelha na tabela User do Prisma
  await prisma.user.upsert({
    where: { id: adminAuthId! },
    create: { id: adminAuthId!, email: adminEmail, name: "Admin", isAdmin: true },
    update: { isAdmin: true },
  });
  console.log(`User mirror garantido para admin.`);

  // 3) Cria partidas da fase de grupos (idempotente)
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
