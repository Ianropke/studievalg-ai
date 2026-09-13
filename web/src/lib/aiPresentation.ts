export type AiBand = "Højere" | "Mellem" | "Lavere";

/** Public AI values are deliberately rounded to avoid false precision. */
export function roundAiScore(score: number): number {
  return Math.round(score / 5) * 5;
}

export function aiBand(score: number): AiBand {
  if (score >= 75) return "Højere";
  if (score >= 55) return "Mellem";
  return "Lavere";
}
