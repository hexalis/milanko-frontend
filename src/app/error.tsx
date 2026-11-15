"use client";

import { Button } from "@/shared/ui/button";
import { Notice } from "@/shared/ui/notice";
import { PageShell } from "@/shared/ui/page-shell";

type ErrorPageProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  return (
    <PageShell lang="es" kicker="Earth Trend Detective" title="No pudimos cargar esta vista">
      {/* The e2e sweep tells this view from the page it replaced by this test id. */}
      <div data-testid="error-view" className="grid gap-4">
        <Notice tone="error">{error.message || "Ocurrió un error inesperado."}</Notice>
        <div>
          <Button onClick={reset}>Reintentar</Button>
        </div>
      </div>
    </PageShell>
  );
}
