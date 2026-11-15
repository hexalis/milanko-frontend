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
    <PageShell kicker="Earth Trend Detective" title="No pudimos cargar esta vista">
      <Notice tone="error">{error.message || "Ocurrió un error inesperado."}</Notice>
      <div>
        <Button onClick={reset}>Reintentar</Button>
      </div>
    </PageShell>
  );
}
