/**
 * Browser-safe program title normalization shared by client and server code.
 */
export function normalizeProgramName(title: string): string {
  let s = title;
  s = s.replace(/,?\s*[Ss]tudiestart:.*$/i, "").trim();
  s = s.replace(/,?\s*[Ss]tudy start:.*$/i, "").trim();
  s = s.replace(/,?\s*[Ee]-læring/i, "").trim();
  s = s.replace(/,?\s*(sommer- og vinterstart|vinterstart|sommerstart)/gi, "").trim();

  const parts = s.split(",").map((p) => p.trim()).filter(Boolean);
  if (parts.length === 0) return title.toLowerCase().slice(0, 40);

  const token0 = parts[0];
  const token1 = parts[1];
  if (!token1) return token0.toLowerCase();

  const specializationKeywords = [
    "bach", "kand", "cand", "ing.", "ing ", "mester", "plejer", "moder",
    "læge", "psyk", "økon", "videnskab", "teknik", "studie", "science",
    "business", "design", "kunst", "pæd", "social", "fysiote", "biomed",
    "kemi", "biolog", "matematik", "inform", "logi", "grafi", "terapi",
    "audiolo", "tand", "cyber", "robot", "data", "maskin", "maskinme",
  ];
  const token1Lower = token1.toLowerCase();
  const isSpecialization = specializationKeywords.some((kw) => token1Lower.includes(kw));
  const isCityLike = !isSpecialization && token1.split(" ").length <= 3;

  if (isCityLike) return token0.toLowerCase();
  return `${token0}, ${token1}`.toLowerCase();
}

