import fs from "node:fs";
import path from "node:path";
import {
  type CatalogProgramItem,
  slugify,
  createProgramSlug,
  findProgramBySlug,
} from "./slugUtils";

export { type CatalogProgramItem, slugify, createProgramSlug, findProgramBySlug };

let cachedCatalog: CatalogProgramItem[] | null = null;

function loadServerCatalog(): CatalogProgramItem[] {
  if (cachedCatalog) return cachedCatalog;
  const filePath = path.join(process.cwd(), "public", "data", "all_programs_catalog.json");
  const raw = fs.readFileSync(filePath, "utf8");
  cachedCatalog = JSON.parse(raw) as CatalogProgramItem[];
  return cachedCatalog;
}

export function getAllPrograms(): CatalogProgramItem[] {
  return loadServerCatalog();
}

export function getProgramBySlug(slug: string): CatalogProgramItem | null {
  return findProgramBySlug(loadServerCatalog(), slug);
}
