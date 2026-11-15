import { formatRegionCode } from "@/modules/regions/domain/region";
import { toObservationsCsv, type Observation } from "@/modules/regions/domain/series";
import { MilankoApiError } from "@/server/integrations/milanko-api/client";
import { getRegionObservations } from "@/server/integrations/milanko-api/regions";
import {
  orderedRange,
  readIsoDate,
  readString,
  todayIsoDate,
  type SearchParams,
} from "@/shared/lib/search-params";

const RECORD_START = "2006-01-01";
const VARIABLE_PATTERN = /^[A-Za-z0-9_]+$/;

/** CSV download of the series shown in the region explorer. */
export async function GET(request: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const query: SearchParams = Object.fromEntries(new URL(request.url).searchParams);
  const variable = readString(query, "variable");
  if (!/^\d+$/.test(code) || !variable || !VARIABLE_PATTERN.test(variable)) {
    return Response.json(
      { error: "Se requieren una región numérica y una variable válida." },
      { status: 400 },
    );
  }
  const { start, end } = orderedRange(
    readIsoDate(query, "start") ?? RECORD_START,
    readIsoDate(query, "end") ?? todayIsoDate(),
  );
  let observations: Observation[];
  try {
    ({ observations } = await getRegionObservations(Number(code), { variable, start, end }));
  } catch (error) {
    if (error instanceof MilankoApiError && (error.status === 404 || error.status === 422)) {
      return Response.json({ error: "La región o la variable no existen." }, { status: 404 });
    }
    console.error("CSV de observaciones: la API falló", error);
    return Response.json({ error: "La API de datos no respondió." }, { status: 502 });
  }
  const filename = `region-${formatRegionCode(Number(code))}-${variable}-${start}-${end}.csv`;
  return new Response(toObservationsCsv(observations), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
