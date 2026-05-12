export const STAGE_MULTIPLIER: Record<string, number> = {
  GROUP: 1,
  R16: 1.5,
  QF: 2,
  SF: 2.5,
  TP: 3,
  FINAL: 3,
};

export const STAGE_LABEL: Record<string, string> = {
  GROUP: "Fase de Grupos",
  R16: "Oitavas",
  QF: "Quartas",
  SF: "Semifinal",
  TP: "Disputa de 3º",
  FINAL: "Final",
};

export function calcPoints(
  guessH: number,
  guessA: number,
  realH: number,
  realA: number,
  stage: string,
): number {
  const mult = STAGE_MULTIPLIER[stage] ?? 1;
  let base = 0;

  if (guessH === realH && guessA === realA) {
    base = 10;
  } else {
    const guessDiff = guessH - guessA;
    const realDiff = realH - realA;
    const guessWinner = Math.sign(guessDiff);
    const realWinner = Math.sign(realDiff);

    if (guessWinner === realWinner) {
      if (guessDiff === realDiff && guessWinner !== 0) {
        base = 7;
      } else {
        base = 5;
      }
    } else {
      base = 0;
    }
  }

  return Math.round(base * mult);
}
