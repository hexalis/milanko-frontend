import createClient from "openapi-fetch";
import { getServerEnv } from "@/server/env";
import type { paths } from "./schema";

const REQUEST_TIMEOUT_MS = 30_000;

export class MilankoApiError extends Error {
  readonly status: number;

  constructor(status: number, path: string, detail?: string) {
    super(`La API respondió ${status} en ${path}${detail ? `: ${detail}` : ""}`);
    this.name = "MilankoApiError";
    this.status = status;
  }
}

export function createMilankoClient() {
  const env = getServerEnv();
  return createClient<paths>({
    baseUrl: env.apiUrl,
    headers: {
      Accept: "application/json",
      ...(env.apiKey ? { "X-API-Key": env.apiKey } : {}),
    },
    fetch: (request) => fetch(request, { signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) }),
  });
}

type ApiResult<T> = { data?: T; error?: unknown; response: Response };

function describeError(error: unknown): string | undefined {
  if (typeof error === "string") return error;
  if (error && typeof error === "object" && "detail" in error) {
    const { detail } = error;
    return typeof detail === "string" ? detail : JSON.stringify(detail);
  }
  return undefined;
}

/** Returns the payload of a successful call or throws a MilankoApiError. */
export async function unwrap<T>(call: Promise<ApiResult<T>>): Promise<T> {
  const { data, error, response } = await call;
  if (data === undefined || error !== undefined || !response.ok) {
    const path = new URL(response.url || "http://unknown").pathname;
    throw new MilankoApiError(response.status, path, describeError(error));
  }
  return data;
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
