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
  "kolding": "Kolding",
  "sønderborg": "Sønderborg",
  "soenderborg": "Sønderborg",
  "roskilde": "Roskilde",
  "herning": "Herning",
  "holstebro": "Holstebro",
  "horsens": "Horsens",
  "silkeborg": "Silkeborg",
};

/**
 * Capitalizes a city string like "aarhus c" -> "Aarhus C", "aalborg øst" -> "Aalborg Øst"
 */
export function formatCityName(cityStr: string): string {
  if (!cityStr) return "";
  const trimmed = cityStr.trim();
  
  return trimmed.split(" ").map((word, index) => {
    const wLower = word.toLowerCase();
    if (CITY_NAME_MAP[wLower]) return CITY_NAME_MAP[wLower];
    
    // Single letter directional codes: C, N, S, Ø, M, J, V
    if (word.length === 1) return word.toUpperCase();
    
    // Directional words: Øst, Vest, Nord, Syd
    if (["øst", "oest", "vest", "nord", "syd"].includes(wLower)) {
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    }

    if (index === 0) {
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    }
    return word.toLowerCase();
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

  // Format cities embedded in comma-separated title string: "Titel, by, Studiestart..."
  const parts = s.split(",").map(p => p.trim());
  if (parts.length >= 2) {
    const formattedParts = parts.map((part) => {
      const lower = part.toLowerCase();
      if (lower.startsWith("studiestart:")) {
        return "Studiestart: " + lower.replace("studiestart:", "").trim();
      }
      if (CITY_NAME_MAP[lower] || /^[a-zæøå\s]+\s[c|n|s|ø|m|j|v|øst|vest|nord|syd]$/i.test(part)) {
        return formatCityName(part);
      }
      return part;
    });
    return formattedParts.join(", ");
  }

  return s;
}
