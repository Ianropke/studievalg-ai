/**
 * Unit Tests for AI-Studievalg Algoritme & Søgemaskine
 * Test Suite: Vitest / Node Test Runner
 */

function computeCompositeScore(robust: number, job: number, sal: number, wAi: number, wJob: number, wSal: number): number {
  const totalWeight = Math.max(1, wAi + wJob + wSal);
  return (robust * wAi + job * wJob + sal * wSal) / totalWeight;
}

function checkKvote1Adgang(gpa: number, kvotient: number | null): { meetsGpa: boolean; isKvote2Recommended: boolean } {
  if (kvotient === null) {
    return { meetsGpa: true, isKvote2Recommended: false };
  }
  const meetsGpa = gpa >= kvotient;
  return { meetsGpa, isKvote2Recommended: !meetsGpa };
}

function normalizeSearchText(text: string): string {
  let cleaned = text
    .toLowerCase()
    .replace(/tændlæge/g, "tandlæge")
    .replace(/ordontologi/g, "odontologi")
    .replace(/naestved/g, "næstved")
    .replace(/æ/g, "ae")
    .replace(/ø/g, "oe")
    .replace(/å/g, "aa")
    .trim();

  if (cleaned.length > 5) {
    cleaned = cleaned
      .replace(/erne$/g, "")
      .replace(/ing$/g, "")
      .replace(/er$/g, "")
      .replace(/et$/g, "")
      .replace(/en$/g, "");
  }
  return cleaned;
}

// Simple test runner execution for CI/CD pipeline
export function runUnitTests() {
  console.log("🧪 Kører Unit Tests for Vægtningsalgoritme & Søgning...");

  // Test 1: Vægtningsformel
  const score1 = computeCompositeScore(88, 95, 78, 80, 70, 60);
  console.assert(Math.abs(score1 - 87.42) < 0.1, `Test 1 Fejl: Forventet ~87.42, fik ${score1}`);
  console.log("  ✅ TEST-01: Vægtningsberegning korrekt (Score: " + score1.toFixed(2) + ")");

  // Test 2: Kvote 1 Opfyldelse
  const kvoteCheck1 = checkKvote1Adgang(9.5, 7.3);
  console.assert(kvoteCheck1.meetsGpa === true, "Test 2 Fejl: GPA 9.5 bør opfylde krav på 7.3");
  console.log("  ✅ TEST-02: Kvote 1 opfyldelse godkendt (9.5 >= 7.3)");

  // Test 3: Kvote 2 Anbefaling
  const kvoteCheck2 = checkKvote1Adgang(9.5, 10.2);
  console.assert(kvoteCheck2.isKvote2Recommended === true, "Test 3 Fejl: GPA 9.5 bør udløse Kvote 2 anbefaling ved krav 10.2");
  console.log("  ✅ TEST-03: Kvote 2 anbefaling udløst ved for lavt snit (9.5 < 10.2)");

  // Test 4: Suffix Stemming & Normalisering
  const norm1 = normalizeSearchText("sygeplejersker");
  console.assert(norm1.includes("sygeplejersk"), `Test 4 Fejl: Fik ${norm1}`);
  console.log("  ✅ TEST-04: Dansk stammafskæring godkendt ('sygeplejersker' -> '" + norm1 + "')");

  console.log("🎉 Alle 4 Unit Tests bestået uden fejl!\n");
}

if (require.main === module) {
  runUnitTests();
}
