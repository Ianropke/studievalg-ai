export interface ProgramScores {
  automation_risk?: number;
  labour_demand?: number;
  salary_growth?: number;
  [key: string]: unknown;
}

export function getEnrichedScores(title?: string, rawScores?: ProgramScores): ProgramScores {
  // If explicitly custom non-default scores exist, keep them
  if (
    rawScores &&
    !(
      rawScores.automation_risk === 32 &&
      rawScores.labour_demand === 70 &&
      rawScores.salary_growth === 70
    )
  ) {
    return rawScores;
  }

  const t = (title || "").toLowerCase();

  // 1. Odontologi & Klinik (Sundhedsvidenskab)
  if (t.includes("odontologi") || t.includes("tandlæge") || t.includes("tandplej") || t.includes("klinisk")) {
    return { automation_risk: 15, labour_demand: 92, salary_growth: 88 };
  }

  // 2. Medicin & Kirurgi
  if (t.includes("medicin") || t.includes("læge") || t.includes("kirurgi") || t.includes("lægevidenskab")) {
    return { automation_risk: 12, labour_demand: 95, salary_growth: 92 };
  }

  // 3. Sygepleje, Ergoterapi, Fysioterapi & Jordemoder (Velfærd & Sundhed)
  if (t.includes("sygeplej") || t.includes("ergoterapi") || t.includes("fysioterapi") || t.includes("jordemoder") || t.includes("radiograf")) {
    return { automation_risk: 10, labour_demand: 96, salary_growth: 64 };
  }

  // 4. Teater, Skuespil, Scenekunst, Musik & Kunst
  if (t.includes("teater") || t.includes("performance") || t.includes("skuespil") || t.includes("musik") || t.includes("billedkunst") || t.includes("scenekunst") || t.includes("kunsthistorie")) {
    return { automation_risk: 20, labour_demand: 45, salary_growth: 48 };
  }

  // 5. Bioteknologi, Kemi, Biologi, Farmaci & Life Science
  if (t.includes("bioteknologi") || t.includes("biokemi") || t.includes("kemi") || t.includes("biologi") || t.includes("farmac") || t.includes("pharma") || t.includes("nanoteknologi")) {
    return { automation_risk: 22, labour_demand: 88, salary_growth: 84 };
  }

  // 6. IT, Datalogi, Software & AI
  if (t.includes("datalogi") || t.includes("software") || t.includes("cyber") || t.includes("datavidenskab") || t.includes("kunstigt begreb") || t.includes("it-")) {
    return { automation_risk: 35, labour_demand: 94, salary_growth: 90 };
  }

  // 7. Ingeniørvetenskab, Maskin, Byg & Robotik
  if (t.includes("ingeniør") || t.includes("robot") || t.includes("maskin") || t.includes("bygnings") || t.includes("mechatron")) {
    return { automation_risk: 18, labour_demand: 90, salary_growth: 86 };
  }

  // 8. Sprog, Kultur, Litteratur, Historie & Filosofi (Humaniora)
  if (t.includes("sprog") || t.includes("kultur") || t.includes("litteratur") || t.includes("historie") || t.includes("filosofi") || t.includes("retorik") || t.includes("indianske") || t.includes("finsk") || t.includes("italiensk") || t.includes("tysk") || t.includes("fransk") || t.includes("asien") || t.includes("kina") || t.includes("japan")) {
    return { automation_risk: 36, labour_demand: 55, salary_growth: 58 };
  }

  // 9. Pædagog, Lærer, Socialrådgiver & Psykologi
  if (t.includes("pædagog") || t.includes("lærer") || t.includes("socialrådgiver") || t.includes("psykolog") || t.includes("socialpædagog")) {
    return { automation_risk: 12, labour_demand: 94, salary_growth: 65 };
  }

  // 10. Erhvervsøkonomi, HA, Finans, Revision & Business
  if (t.includes("erhvervsøkonomi") || t.includes("ha ") || t.includes("ha(") || t.includes("finans") || t.includes("revision") || t.includes("auditing") || t.includes("marketing") || t.includes("international business")) {
    return { automation_risk: 30, labour_demand: 82, salary_growth: 84 };
  }

  // 11. Jura & Retssamfund
  if (t.includes("jura") || t.includes("juridisk") || t.includes("erhvervsret")) {
    return { automation_risk: 42, labour_demand: 75, salary_growth: 85 };
  }

  // Fallback for øvrige udbud
  return { automation_risk: 28, labour_demand: 72, salary_growth: 70 };
}
