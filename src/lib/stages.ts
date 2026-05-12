// Cores/labels visuais por fase. Mantém consistência entre páginas.

export const STAGE_BADGE: Record<string, { label: string; cls: string }> = {
  GROUP: { label: "GRUPO", cls: "bg-blue-500/15 text-blue-300 border-blue-500/30" },
  R32: { label: "16-AVOS", cls: "bg-cyan-500/15 text-cyan-300 border-cyan-500/30" },
  R16: { label: "OITAVAS", cls: "bg-teal-500/15 text-teal-300 border-teal-500/30" },
  QF: { label: "QUARTAS", cls: "bg-amber-500/15 text-amber-300 border-amber-500/30" },
  SF: { label: "SEMI", cls: "bg-orange-500/15 text-orange-300 border-orange-500/30" },
  TP: { label: "3º LUGAR", cls: "bg-rose-500/15 text-rose-300 border-rose-500/30" },
  FINAL: { label: "FINAL", cls: "bg-yellow-400/20 text-yellow-300 border-yellow-400/40" },
};

export function stageBadge(stage: string, group?: string | null) {
  const def = STAGE_BADGE[stage] || {
    label: stage,
    cls: "bg-zinc-700/40 text-zinc-300 border-zinc-600/40",
  };
  const label = stage === "GROUP" && group ? `GRUPO ${group}` : def.label;
  return { label, cls: def.cls };
}

export function formatKickoff(d: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Sao_Paulo",
  }).format(d);
}

export function isLive(kickoff: Date, finished: boolean) {
  if (finished) return false;
  const now = Date.now();
  const start = kickoff.getTime();
  // janela "ao vivo": entre kickoff e kickoff + 2h30
  return now >= start && now <= start + 2.5 * 60 * 60 * 1000;
}
