import { MAX_QUERY, MIN_QUERY } from "@/modules/ask/domain/place";
import { searchPlaces } from "@/server/integrations/open-meteo/geocode";
import { getLocale } from "@/server/locale";

/*
 * GET /place/search?q=… — the places matching what the reader typed in "my own place". Not under
 * /api: deploys hand /api to the backend before the request reaches Next (next.config.mjs).
 */
export async function GET(request: Request) {
  const query = new URL(request.url).searchParams.get("q")?.trim().slice(0, MAX_QUERY) ?? "";
  if (query.length < MIN_QUERY) return Response.json({ places: [] });
  try {
    const places = await searchPlaces(query, await getLocale());
    return Response.json({ places });
  } catch {
    return Response.json({ places: [], error: "unavailable" }, { status: 502 });
  }
}
