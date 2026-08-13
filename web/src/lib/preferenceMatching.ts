export type PreferenceMode = "priority" | "requirements";
export type RequirementMatchMode = "all" | "any";

export interface PreferenceScores {
  ai: number;
  job: number;
  salary: number;
}

export interface PreferenceSettings {
  mode: PreferenceMode;
  requirementMatchMode: RequirementMatchMode;
  ai: number;
  job: number;
  salary: number;
}

export interface PreferenceEvaluation {
  composite: number;
  meetsRequirements: boolean;
  requirementsMet: number;
  activeRequirementCount: number;
}

/**
 * Evaluates the homepage preference controls.
 *
 * Priority mode uses the slider values as relative weights. Requirements mode
 * uses them as minimum score thresholds; zero disables that requirement and the
 * selected all/any logic decides whether a programme remains visible.
 */
export function evaluatePreference(
  scores: PreferenceScores,
  settings: PreferenceSettings
): PreferenceEvaluation {
  const totalWeight = Math.max(1, settings.ai + settings.job + settings.salary);
  const weightedComposite = (
    scores.ai * settings.ai +
    scores.job * settings.job +
    scores.salary * settings.salary
  ) / totalWeight;

  const profileAverage = (scores.ai + scores.job + scores.salary) / 3;
  const thresholds = [
    { score: scores.ai, minimum: settings.ai },
    { score: scores.job, minimum: settings.job },
    { score: scores.salary, minimum: settings.salary },
  ];
  const activeRequirements = thresholds.filter(({ minimum }) => minimum > 0);
  const requirementsMet = activeRequirements.filter(({ score, minimum }) => score >= minimum).length;
  const meetsRequirements = activeRequirements.length === 0 || (
    settings.requirementMatchMode === "all"
      ? requirementsMet === activeRequirements.length
      : requirementsMet > 0
  );

  return {
    composite: settings.mode === "priority" ? weightedComposite : profileAverage,
    meetsRequirements,
    requirementsMet,
    activeRequirementCount: activeRequirements.length,
  };
}
