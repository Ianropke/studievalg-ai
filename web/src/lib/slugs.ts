import catalogData from "../../public/data/all_programs_catalog.json";

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

const catalog = catalogData as CatalogProgramItem[];

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

  const raw = kot ? `${kot}-${title}` : title;
  return slugify(raw);
}

export function findProgramBySlug(all: CatalogProgramItem[], slug: string): CatalogProgramItem | null {
  const match = all.find((p) => createProgramSlug(p) === slug);
  if (match) return match;

  const kotMatch = slug.match(/^(\d{5})/);
  if (kotMatch) {
    const targetKot = kotMatch[1];
    return all.find((p) => String(p.kot_nr) === targetKot) ?? null;
  }

  return null;
}


export function getAllPrograms(): CatalogProgramItem[] {
  return catalog;
}

export function getProgramBySlug(slug: string): CatalogProgramItem | null {
  return findProgramBySlug(catalog, slug);
}
