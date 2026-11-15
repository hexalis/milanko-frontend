import { cacheLife } from "next/cache";
import type { VariableCoverage } from "@/modules/coverage/domain/coverage";
import { createMilankoClient, unwrap } from "./client";

/** Persisted variables changes when the ingest runs, so a few minutes of cache is safe. */
export async function getCoverage(): Promise<VariableCoverage[]> {
  "use cache";
  cacheLife("minutes");
  const data = await unwrap(createMilankoClient().GET("/data/coverage"));
  return data.variables;
}
