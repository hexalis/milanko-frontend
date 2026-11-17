import { cacheLife } from "next/cache";
import type { MonthlyValue } from "@/modules/ask/domain/place";
import { createMilankoClient, unwrap } from "./client";

/** NASA POWER's monthly series reach back to 1981 (POC fetchPower). */
const FIRST_YEAR = 1981;

/**
 * The monthly NASA POWER series of one variable at a free point, as the API normalises it (POC
 * fetchPower, which asked the API first and NASA second), from 1981 to today: the year still under
 * way is incomplete and annualMeans leaves it out. A cell's past does not change, so the answer is
 * cached for days per point and variable.
 */
export async function getPointMonthly(
  lat: number,
  lon: number,
  variable: string,
): Promise<MonthlyValue[]> {
  "use cache";
  cacheLife("days");
  const data = await unwrap(
    createMilankoClient().GET("/observations", {
      params: {
        query: {
          variables: variable,
          lat,
          lon,
          start: `${FIRST_YEAR}0101`,
          community: "AG",
          granularity: "monthly",
        },
      },
    }),
  );
  const series = data.variables[variable];
  // Fill, missing and invalid months count as gaps, so their year is left out of the test.
  return (series?.values ?? []).map((point) => ({
    time: point.time,
    value: point.quality === "ok" ? point.value : null,
  }));
}
