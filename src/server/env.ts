const DEFAULT_API_URL = "https://dev-milanko.hexalis.org/api/v1";

const APP_ENVIRONMENTS = ["local", "develop", "qa", "production"] as const;

type AppEnvironment = (typeof APP_ENVIRONMENTS)[number];

type ServerEnv = {
  apiUrl: string;
  appEnvironment: AppEnvironment;
};

function readApiUrl(value: string | undefined): string {
  const raw = value?.trim() || DEFAULT_API_URL;
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new Error(`MILANKO_API_URL no es una URL válida: "${raw}"`);
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") {
    throw new Error(`MILANKO_API_URL debe usar http o https: "${raw}"`);
  }
  return url.toString().replace(/\/+$/, "");
}

function isAppEnvironment(value: string): value is AppEnvironment {
  return (APP_ENVIRONMENTS as readonly string[]).includes(value);
}

function readAppEnvironment(value: string | undefined): AppEnvironment {
  const raw = value?.trim() || "local";
  if (!isAppEnvironment(raw)) {
    throw new Error(`APP_ENV debe ser uno de ${APP_ENVIRONMENTS.join(", ")}; se recibió "${raw}"`);
  }
  return raw;
}

/** Reads and validates the server environment. Call it at request time, not at module load. */
export function getServerEnv(): ServerEnv {
  return {
    apiUrl: readApiUrl(process.env.MILANKO_API_URL),
    appEnvironment: readAppEnvironment(process.env.APP_ENV),
  };
}
