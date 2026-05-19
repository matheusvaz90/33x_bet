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
  if (matchCount === 0) {
    const groups = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"];
    const order: Array<[number, number]> = [
      [1, 2],
      [3, 4],
      [1, 3],
      [2, 4],
      [4, 1],
      [2, 3],
    ];

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
  } else {
    console.log(`Já existem ${matchCount} partidas, pulando seed de jogos.`);
  }

  // 4) Seed das seleções para Palpite de Ouro (48 times da Copa 2026)
  const selecoes = [
    // Anfitriões
    { nome: "Estados Unidos", pais: "United States", bandeira: "🇺🇸" },
    { nome: "Canadá", pais: "Canada", bandeira: "🇨🇦" },
    { nome: "México", pais: "Mexico", bandeira: "🇲🇽" },
    // CONMEBOL
    { nome: "Brasil", pais: "Brazil", bandeira: "🇧🇷" },
    { nome: "Argentina", pais: "Argentina", bandeira: "🇦🇷" },
    { nome: "Colômbia", pais: "Colombia", bandeira: "🇨🇴" },
    { nome: "Uruguai", pais: "Uruguay", bandeira: "🇺🇾" },
    { nome: "Equador", pais: "Ecuador", bandeira: "🇪🇨" },
    { nome: "Venezuela", pais: "Venezuela", bandeira: "🇻🇪" },
    { nome: "Paraguai", pais: "Paraguay", bandeira: "🇵🇾" },
    { nome: "Chile", pais: "Chile", bandeira: "🇨🇱" },
    { nome: "Bolívia", pais: "Bolivia", bandeira: "🇧🇴" },
    { nome: "Peru", pais: "Peru", bandeira: "🇵🇪" },
    // UEFA
    { nome: "Espanha", pais: "Spain", bandeira: "🇪🇸" },
    { nome: "França", pais: "France", bandeira: "🇫🇷" },
    { nome: "Inglaterra", pais: "England", bandeira: "🏴󠁧󠁢󠁥󠁮󠁧󠁿" },
    { nome: "Alemanha", pais: "Germany", bandeira: "🇩🇪" },
    { nome: "Portugal", pais: "Portugal", bandeira: "🇵🇹" },
    { nome: "Holanda", pais: "Netherlands", bandeira: "🇳🇱" },
    { nome: "Bélgica", pais: "Belgium", bandeira: "🇧🇪" },
    { nome: "Croácia", pais: "Croatia", bandeira: "🇭🇷" },
    { nome: "Áustria", pais: "Austria", bandeira: "🇦🇹" },
    { nome: "Escócia", pais: "Scotland", bandeira: "🏴󠁧󠁢󠁳󠁣󠁴󠁿" },
    { nome: "Hungria", pais: "Hungary", bandeira: "🇭🇺" },
    { nome: "Romênia", pais: "Romania", bandeira: "🇷🇴" },
    { nome: "Dinamarca", pais: "Denmark", bandeira: "🇩🇰" },
    { nome: "Eslováquia", pais: "Slovakia", bandeira: "🇸🇰" },
    { nome: "Suíça", pais: "Switzerland", bandeira: "🇨🇭" },
    { nome: "Albânia", pais: "Albania", bandeira: "🇦🇱" },
    { nome: "Turquia", pais: "Turkey", bandeira: "🇹🇷" },
    { nome: "Sérvia", pais: "Serbia", bandeira: "🇷🇸" },
    { nome: "Ucrânia", pais: "Ukraine", bandeira: "🇺🇦" },
    // CONCACAF
    { nome: "Panamá", pais: "Panama", bandeira: "🇵🇦" },
    { nome: "Costa Rica", pais: "Costa Rica", bandeira: "🇨🇷" },
    { nome: "Honduras", pais: "Honduras", bandeira: "🇭🇳" },
    { nome: "Jamaica", pais: "Jamaica", bandeira: "🇯🇲" },
    // CAF
    { nome: "Marrocos", pais: "Morocco", bandeira: "🇲🇦" },
    { nome: "Senegal", pais: "Senegal", bandeira: "🇸🇳" },
    { nome: "Egito", pais: "Egypt", bandeira: "🇪🇬" },
    { nome: "Nigéria", pais: "Nigeria", bandeira: "🇳🇬" },
    { nome: "Camarões", pais: "Cameroon", bandeira: "🇨🇲" },
    { nome: "Costa do Marfim", pais: "Ivory Coast", bandeira: "🇨🇮" },
    { nome: "África do Sul", pais: "South Africa", bandeira: "🇿🇦" },
    { nome: "Mali", pais: "Mali", bandeira: "🇲🇱" },
    { nome: "RD Congo", pais: "DR Congo", bandeira: "🇨🇩" },
    // AFC
    { nome: "Japão", pais: "Japan", bandeira: "🇯🇵" },
    { nome: "Coreia do Sul", pais: "South Korea", bandeira: "🇰🇷" },
    { nome: "Arábia Saudita", pais: "Saudi Arabia", bandeira: "🇸🇦" },
    { nome: "Austrália", pais: "Australia", bandeira: "🇦🇺" },
    { nome: "Irã", pais: "Iran", bandeira: "🇮🇷" },
    { nome: "Uzbequistão", pais: "Uzbekistan", bandeira: "🇺🇿" },
  ];

  let selecoesCriadas = 0;
  for (const s of selecoes) {
    await prisma.selecao.upsert({
      where: { nome: s.nome },
      update: {},
      create: { nome: s.nome, pais: s.pais, bandeira: s.bandeira, pesoPalpiteOuro: 50 },
    });
    selecoesCriadas++;
  }
  console.log(`${selecoesCriadas} seleções garantidas no banco.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
