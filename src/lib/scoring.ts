export const STAGE_MULTIPLIER: Record<string, number> = {
  GROUP: 1,
  R32: 1.25,
  R16: 1.5,
  QF: 2,
  SF: 2.5,
  TP: 3,
  FINAL: 3,
};

export const STAGE_LABEL: Record<string, string> = {
  GROUP: "Fase de Grupos",
  R32: "16-avos",
  R16: "Oitavas",
  QF: "Quartas",
  SF: "Semifinal",
  TP: "Disputa de 3º",
  FINAL: "Final",
};

export type Outcome = "HOME" | "DRAW" | "AWAY";

export function outcomeFromScore(home: number, away: number): Outcome {
  if (home > away) return "HOME";
  if (home < away) return "AWAY";
  return "DRAW";
}

export type Guess = {
  homeScore: number | null;
  awayScore: number | null;
  winnerGuess: string | null;
  totalGoals: number | null;
  totalFouls: number | null;
};

export type Result = {
  homeScore: number;
  awayScore: number;
  totalFouls: number | null;
};

export type Breakdown = {
  scorePoints: number;
  winnerPoints: number;
  goalsPoints: number;
  foulsPoints: number;
  points: number;
};

/** Mercado 1 — Placar exato. Base 10 / 7 / 5 / 0. */
function scoreBase(gH: number, gA: number, rH: number, rA: number): number {
  if (gH === rH && gA === rA) return 10;
  const gd = gH - gA;
  const rd = rH - rA;
  const gw = Math.sign(gd);
  const rw = Math.sign(rd);
  if (gw !== rw) return 0;
  if (gw !== 0 && gd === rd) return 7;
  return 5;
}

/** Mercado 2 — Vencedor (só direção). 3 pts se acertar. */
function winnerBase(g: string, rH: number, rA: number): number {
  const real = outcomeFromScore(rH, rA);
  return g === real ? 3 : 0;
}

/** Mercado 3 — Total de gols. 5 / 3 / 1 / 0. */
function goalsBase(g: number, real: number): number {
  const diff = Math.abs(g - real);
  if (diff === 0) return 5;
  if (diff === 1) return 3;
  if (diff === 2) return 1;
  return 0;
}

/** Mercado 4 — Total de faltas. 5 / 3 / 1 / 0. */
function foulsBase(g: number, real: number): number {
  const diff = Math.abs(g - real);
  if (diff === 0) return 5;
  if (diff <= 2) return 3;
  if (diff <= 5) return 1;
  return 0;
}

export function calcBreakdown(guess: Guess, real: Result, stage: string): Breakdown {
  const mult = STAGE_MULTIPLIER[stage] ?? 1;
  const round = (n: number) => Math.round(n * mult);

  let scorePoints = 0;
  let winnerPoints = 0;
  let goalsPoints = 0;
  let foulsPoints = 0;

  if (guess.homeScore !== null && guess.awayScore !== null) {
    scorePoints = round(scoreBase(guess.homeScore, guess.awayScore, real.homeScore, real.awayScore));
  }

  // Winner: usa winnerGuess se preenchido; senão deriva do placar (sem dobrar pontos)
  if (guess.winnerGuess && !(guess.homeScore !== null && guess.awayScore !== null)) {
    winnerPoints = round(winnerBase(guess.winnerGuess, real.homeScore, real.awayScore));
  }

  if (guess.totalGoals !== null) {
    goalsPoints = round(goalsBase(guess.totalGoals, real.homeScore + real.awayScore));
  }

  if (guess.totalFouls !== null && real.totalFouls !== null) {
    foulsPoints = round(foulsBase(guess.totalFouls, real.totalFouls));
  }

  return {
    scorePoints,
    winnerPoints,
    goalsPoints,
    foulsPoints,
    points: scorePoints + winnerPoints + goalsPoints + foulsPoints,
  };
}

/** Mantida para compatibilidade. */
export function calcPoints(
  guessH: number,
  guessA: number,
  realH: number,
  realA: number,
  stage: string,
): number {
  const mult = STAGE_MULTIPLIER[stage] ?? 1;
  return Math.round(scoreBase(guessH, guessA, realH, realA) * mult);
}
