/**
 * Sincroniza os jogos da Copa do Mundo 2026 a partir de football-data.org.
 *
 * Uso:
 *   1. Adicione FOOTBALL_DATA_TOKEN no .env
 *   2. npm run db:sync
 *
 * Mapeia o "competition WC" (FIFA World Cup) e faz upsert por (stage, group, homeTeam, awayTeam).
 * - Se a partida já existe (mesma chave), atualiza kickoff e placar (se houver).
 * - Se não existe, cria nova com placar nulo e finished=false.
 * - Partidas placeholder (A1/A2/...) do seed inicial NÃO são removidas automaticamente — se
 *   você quiser limpar antes, rode `npm run db:reset` e depois `npm run db:sync`.
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const STAGE_MAP: Record<string, string> = {
  GROUP_STAGE: "GROUP",
  LAST_32: "R32",
  LAST_16: "R16",
  QUARTER_FINALS: "QF",
  SEMI_FINALS: "SF",
  THIRD_PLACE: "TP",
  FINAL: "FINAL",
};

const TBD = "A definir";

type ApiMatch = {
  id: number;
  utcDate: string;
  status: string;
  stage: string;
  group: string | null;
  homeTeam: { id: number | null; name: string | null };
  awayTeam: { id: number | null; name: string | null };
  score: {
    fullTime: { home: number | null; away: number | null };
    winner: string | null;
  };
};

type ApiResponse = {
  matches: ApiMatch[];
};

async function fetchMatches(token: string): Promise<ApiMatch[]> {
  const res = await fetch("https://api.football-data.org/v4/competitions/WC/matches", {
    headers: { "X-Auth-Token": token },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`football-data.org ${res.status}: ${body.slice(0, 200)}`);
  }
  const data = (await res.json()) as ApiResponse;
  return data.matches;
}

async function main() {
  const token = process.env.FOOTBALL_DATA_TOKEN;
  if (!token) {
    throw new Error("FOOTBALL_DATA_TOKEN não definido no .env");
  }

  console.log("→ Buscando partidas em football-data.org...");
  const apiMatches = await fetchMatches(token);
  console.log(`→ ${apiMatches.length} partidas recebidas.`);

  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const m of apiMatches) {
    const stage = STAGE_MAP[m.stage];
    if (!stage) {
      console.warn(`  skip: stage desconhecido "${m.stage}"`);
      skipped++;
      continue;
    }

    const homeTeam = m.homeTeam.name?.trim() || TBD;
    const awayTeam = m.awayTeam.name?.trim() || TBD;
    const teamsKnown = homeTeam !== TBD && awayTeam !== TBD;

    const group =
      stage === "GROUP" && m.group?.startsWith("GROUP_") ? m.group.replace("GROUP_", "") : null;

    const kickoff = new Date(m.utcDate);
    const homeScore = m.score.fullTime.home;
    const awayScore = m.score.fullTime.away;
    const finished = m.status === "FINISHED";

    // Chave de upsert para mata-mata: stage + kickoff (cada jogo tem horário único).
    // Para grupos: stage + group + homeTeam + awayTeam (times já são reais nesse ponto).
    const existing =
      stage === "GROUP" && teamsKnown
        ? await prisma.match.findFirst({ where: { stage, group, homeTeam, awayTeam } })
        : await prisma.match.findFirst({ where: { stage, kickoff } });

    if (existing) {
      await prisma.match.update({
        where: { id: existing.id },
        data: {
          kickoff,
          // Atualiza times se ainda eram TBD e agora vieram preenchidos
          ...(teamsKnown && (existing.homeTeam === TBD || existing.awayTeam === TBD)
            ? { homeTeam, awayTeam }
            : {}),
          ...(finished && homeScore !== null && awayScore !== null
            ? { homeScore, awayScore, finished: true }
            : {}),
        },
      });
      updated++;
    } else {
      // Se for fase de grupos e ainda houver placeholders (ex.: A1, A2) ocupando esse
      // jogo, atualiza o placeholder ao invés de criar duplicata.
      let placeholderToReplace = null;
      if (stage === "GROUP" && group) {
        const placeholders = await prisma.match.findMany({
          where: { stage: "GROUP", group, homeTeam: { startsWith: group } },
          orderBy: { kickoff: "asc" },
        });
        // Pega o primeiro placeholder ainda não renomeado (homeTeam ainda começa com o grupo)
        placeholderToReplace = placeholders.find(
          (p) => /^[A-L]\d$/.test(p.homeTeam) && /^[A-L]\d$/.test(p.awayTeam),
        );
      }

      if (placeholderToReplace) {
        await prisma.match.update({
          where: { id: placeholderToReplace.id },
          data: {
            homeTeam,
            awayTeam,
            kickoff,
            ...(finished && homeScore !== null && awayScore !== null
              ? { homeScore, awayScore, finished: true }
              : {}),
          },
        });
        updated++;
      } else {
        await prisma.match.create({
          data: {
            stage,
            group,
            homeTeam,
            awayTeam,
            kickoff,
            ...(finished && homeScore !== null && awayScore !== null
              ? { homeScore, awayScore, finished: true }
              : {}),
          },
        });
        created++;
      }
    }
  }

  console.log(`✓ sync concluído. ${created} criados, ${updated} atualizados, ${skipped} ignorados.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
