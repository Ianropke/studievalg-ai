import type { CatalogProgramItem } from "./slugs";

const CATALOG_URL = "/data/all_programs_catalog.json";

let catalogPromise: Promise<CatalogProgramItem[]> | null = null;

export function loadProgramsCatalog(): Promise<CatalogProgramItem[]> {
  if (!catalogPromise) {
    catalogPromise = fetch(CATALOG_URL, { cache: "force-cache" }).then((response) => {
      if (!response.ok) {
        throw new Error(`Unable to load programme catalogue (${response.status})`);
      }
      return response.json() as Promise<CatalogProgramItem[]>;
    });
  }

  return catalogPromise;
}
