import allProgramsCatalog from "../../public/data/all_programs_catalog.json";

export interface CatalogProgramItem {
  [key: string]: unknown;
  kot_nr?: string;
  udbud_titel?: string;
  institution?: string;
  institution_navn?: string;
  by?: string;
  kvotient_2026?: number | string;
  kvotient_2025?: number | string;
  latest_kvotient?: number | string;
  disco08?: string;
  disco_titel?: string;
  scores?: {
    automation_risk?: number;
    labour_demand?: number;
    salary_growth?: number;
    mobility?: number;
    uncertainty?: number;
  };
  skills_hierarchy?: {
    courses?: string[];
    learning_outcomes?: string;
    skills?: string[];
    tasks?: string;
  };
  rag_evidence?: Array<{
    source_title?: string;
    excerpt?: string;
    relevance?: string;
  }>;
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/æ/g, "ae")
    .replace(/ø/g, "oe")
    .replace(/å/g, "aa")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function createProgramSlug(prog: Record<string, unknown>): string {
  const kot = String(prog.kot_nr || "");
  const title = String(prog.udbud_titel || "");
  const inst = String(prog.institution || prog.institution_navn || "");
  const city = String(prog.by || "");

  // Combine KOT, title, institution/city for a clear, unique, readable URL
  const raw = `${kot}-${title}-${inst}-${city}`;
  return slugify(raw);
}

export function getAllPrograms(): CatalogProgramItem[] {
  return allProgramsCatalog as CatalogProgramItem[];
}

export function getProgramBySlug(slug: string): CatalogProgramItem | null {
  const all = getAllPrograms();
  
  // First attempt: exact match on created slug
  const match = all.find((p) => createProgramSlug(p) === slug);
  if (match) return match;

  // Second attempt: match by KOT prefix at start of slug (e.g. '10140-...')
  const kotMatch = slug.match(/^(\d{5})/);
  if (kotMatch) {
    const targetKot = kotMatch[1];
    const found = all.find((p) => String(p.kot_nr) === targetKot);
    if (found) return found;
  }

  return null;
}
