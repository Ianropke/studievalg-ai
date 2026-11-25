/**
 * Helper functions for Danish title casing, city name capitalization, and clean UI formatting.
 */

const CITY_NAME_MAP: Record<string, string> = {
  "koebenhavn": "København",
  "københavn": "København",
  "aarhus": "Aarhus",
  "odense": "Odense",
  "aalborg": "Aalborg",
  "esbjerg": "Esbjerg",
  "frederiksberg": "Frederiksberg",
  "slagelse": "Slagelse",
  "vejle": "Vejle",
  "randers": "Randers",
  "rønne": "Rønne",
  "roenne": "Rønne",
  "næstved": "Næstved",
  "naestved": "Næstved",
  "viby": "Viby",
  "svendborg": "Svendborg",
  "ballerup": "Ballerup",
  "tjele": "Tjele",
  "kgs. lyngby": "Kgs. Lyngby",
  "kongens lyngby": "Kongens Lyngby",
  "lyngby": "Lyngby",
  "kolding": "Kolding",
  "sønderborg": "Sønderborg",
  "soenderborg": "Sønderborg",
  "roskilde": "Roskilde",
  "herning": "Herning",
  "holstebro": "Holstebro",
  "horsens": "Horsens",
  "silkeborg": "Silkeborg",
  "kbh. s": "Kbh. S",
  "kbh. n": "Kbh. N",
  "kbh. v": "Kbh. V",
  "kbh. k": "Kbh. K",
  "kbh. ø": "Kbh. Ø",
  "kbh. nv": "Kbh. NV",
  "kbh. sv": "Kbh. SV",
};

/**
 * Capitalizes a city string like "aarhus c" -> "Aarhus C", "kgs. lyngby" -> "Kgs. Lyngby"
 */
export function formatCityName(cityStr: string): string {
  if (!cityStr) return "";
  const trimmed = cityStr.trim();
  const lowerFull = trimmed.toLowerCase();

  // 1. Direct full string match in city dictionary
  if (CITY_NAME_MAP[lowerFull]) {
    return CITY_NAME_MAP[lowerFull];
  }

  // 2. Word-by-word formatting
  return trimmed.split(/\s+/).map((word, index) => {
    const wLower = word.toLowerCase();
    if (CITY_NAME_MAP[wLower]) return CITY_NAME_MAP[wLower];

    // Directional or campus suffixes: C, N, S, Ø, M, J, V, NV, SV
    if (word.length <= 2 && /^[a-zæøå]+$/i.test(word)) {
      return word.toUpperCase();
    }

    // Directional words: Øst, Vest, Nord, Syd
    if (["øst", "oest", "vest", "nord", "syd"].includes(wLower)) {
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    }

    // Small prepositions remain lowercase unless first word
    if (index > 0 && ["og", "ved", "i", "af", "på"].includes(wLower)) {
      return wLower;
    }

    // Default: Capitalize first letter of word
    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
  }).join(" ");
}

/**
 * Formats program titles to standard Danish sentence case:
 * Only first word capitalized, proper nouns capitalized, no English Title Case.
 */
export function formatProgramTitle(title: string): string {
  if (!title) return "";
  let s = title.trim();

  // Fix common job title & course title casing mistakes
  s = s.replace(/Sundhedsadministrativ Koordinator/g, "Sundhedsadministrativ koordinator");
  s = s.replace(/Erhvervssprog & Tekstredigering/g, "Erhvervssprog og tekstredigering");
  s = s.replace(/Erhvervssprog og Tekstredigering/g, "Erhvervssprog og tekstredigering");
  s = s.replace(/\s&\s/g, " og ");

  // Fix English study start labels embedded in titles
  s = s.replace(/study start:\s*summer start/gi, "Studiestart: sommerstart");
  s = s.replace(/study start:\s*winter start/gi, "Studiestart: vinterstart");
  s = s.replace(/studiestart:\s*Sommerstart/g, "Studiestart: sommerstart");
  s = s.replace(/studiestart:\s*Vinterstart/g, "Studiestart: vinterstart");

  // Separate double title case fragments: "Teknisk videnskab (civilingeniør) Teknisk biomedicin" -> "Teknisk videnskab (civilingeniør) — Teknisk biomedicin"
  s = s.replace(/(\([\w\sæøå]+\))\s+([A-ZÆØÅ][a-zæøå]+)/g, "$1 — $2");

  // Format cities embedded in comma-separated title string: "Titel, by, Studiestart..."
  const parts = s.split(",").map(p => p.trim());
  if (parts.length >= 2) {
    const formattedParts = parts.map((part) => {
      const lower = part.toLowerCase();
      if (lower.startsWith("studiestart:")) {
        return "Studiestart: " + lower.replace("studiestart:", "").trim();
      }
      if (CITY_NAME_MAP[lower] || /^[a-zæøå\s\.]+\s[c|n|s|ø|m|j|v|øst|vest|nord|syd]$/i.test(part)) {
        return formatCityName(part);
      }
      return part;
    });
    return formattedParts.join(", ");
  }

  return s;
}

/**
 * Extracts the study location/city from a structured KOT program title like
 * "Professionsbachelor, pædagog, Aarhus C, Studiestart: sommer- og vinterstart"
 * so legacy parser artifacts in `program.by` (e.g. "pædagog", "HA") never leak into the UI.
 */
export function extractProgramCity(title?: string | null): string {
  if (!title) return "";
  const parts = title
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
  const withoutStart = parts.filter(
    (part) => !/^studiestart:/i.test(part) && !/^study start:/i.test(part),
  );
  if (withoutStart.length < 2) return "";
  const candidate = withoutStart[withoutStart.length - 1];
  if (!candidate) return "";
  if (/^e-l[æa]ring$/i.test(candidate)) return "E-læring";
  return formatCityName(candidate);
}
