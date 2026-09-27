/**
 * Launch cities. The canonical list lives in the `cities` table and is
 * editable from admin; this constant is only the fallback used before the
 * database is reachable (and for static params at build time).
 */
export const FALLBACK_CITIES = [
  { slug: "mumbai", name: "Mumbai" },
  { slug: "pune", name: "Pune" },
  { slug: "agra", name: "Agra" },
] as const;

export const DEFAULT_CITY = "mumbai";
export const CITY_COOKIE = "thirtyml_city";
