import "server-only";
import fs from "node:fs";
import path from "node:path";

export interface CatalogProgram {
  id?: string;
  udbud_titel?: string;
  [key: string]: unknown;
}

let catalogCache: CatalogProgram[] | undefined;

/**
 * Loads the large catalog from public/ at runtime/build time instead of importing
 * it into the webpack module graph. This keeps the 4MB+ JSON out of the JS bundle
 * while preserving the public URL /data/all_programs_catalog.json.
 */
export function getProgramCatalog(): CatalogProgram[] {
  if (catalogCache) return catalogCache;

  const filePath = path.join(process.cwd(), "public", "data", "all_programs_catalog.json");
  const raw = fs.readFileSync(filePath, "utf8");
  const parsed: unknown = JSON.parse(raw);

  if (!Array.isArray(parsed)) {
    throw new Error(`Program catalog must be a JSON array: ${filePath}`);
  }

  catalogCache = parsed as CatalogProgram[];
  return catalogCache;
}
