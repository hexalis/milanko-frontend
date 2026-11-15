import { Suspense } from "react";
import { ApiStatus } from "@/modules/workspace/ui/api-status";
import { HomeScreen } from "@/modules/workspace/ui/home-screen";
import { getHealth } from "@/server/integrations/milanko-api/health";
import { LoadingPanel } from "@/shared/ui/notice";

async function CurrentApiStatus() {
  const result = await getHealth().then(
    (health) => ({ health }),
    (error: unknown) => ({ reason: error instanceof Error ? error.message : "error desconocido" }),
  );
  if ("reason" in result) return <ApiStatus isAvailable={false} reason={result.reason} />;
  const { health } = result;
  return (
    <ApiStatus
      isAvailable
      version={health.version}
      coreVariables={health.core_variables}
      database={health.database}
    />
  );
}

export default function Home() {
  return (
    <HomeScreen
      apiStatus={
        <Suspense fallback={<LoadingPanel label="Consultando la API…" />}>
          <CurrentApiStatus />
        </Suspense>
      }
    />
  );
}
