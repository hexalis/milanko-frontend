import { cacheLife } from "next/cache";
import type { FoundPlace } from "@/modules/ask/domain/place";
import type { Locale } from "@/shared/lib/i18n";

/*
 * Place search for "my own place" (POC sources.js geocode): Open-Meteo's free geocoder, GeoNames
 * data, no key. It runs on the server so the reader's browser talks to this site only, and the same
 * search is answered from the cache for a day.
 */

const GEOCODER = "https://geocoding-api.open-meteo.com/v1/search";
const RESULTS = 5;
const TIMEOUT_MS = 8_000;

type GeocoderResult = {
  name?: unknown;
  latitude?: unknown;
  longitude?: unknown;
  admin1?: unknown;
  country?: unknown;
};

const text = (value: unknown) => (typeof value === "string" && value.trim() ? value.trim() : "");

function toPlace(result: GeocoderResult): FoundPlace | undefined {
  const name = text(result.name);
  const { latitude: lat, longitude: lon } = result;
  if (!name || typeof lat !== "number" || typeof lon !== "number") return undefined;
  const admin = [text(result.admin1), text(result.country)].filter(Boolean).join(", ");
  return { name, admin, lat, lon };
}

/** Up to five places matching the query, in the reader's language. Throws when the service fails. */
export async function searchPlaces(query: string, locale: Locale): Promise<FoundPlace[]> {
  "use cache";
  cacheLife("days");
  const url = `${GEOCODER}?${new URLSearchParams({
    name: query,
    count: String(RESULTS),
    language: locale,
    format: "json",
  })}`;
  const response = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS) });
  if (!response.ok) throw new Error(`El geocodificador respondió ${response.status}`);
  const body: unknown = await response.json();
  const results =
    body && typeof body === "object" && "results" in body && Array.isArray(body.results)
      ? (body.results as GeocoderResult[])
      : [];
  return results.flatMap((result) => toPlace(result) ?? []);
}
