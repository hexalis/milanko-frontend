import { findCaseFile, getCaseCatalog } from "@/modules/cases/domain/catalog";
import { caseCsv } from "@/modules/cases/domain/case-csv";

/** CSV download of the series behind a case file (POC "Download CSV" in the appendix). */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const file = findCaseFile(id);
  if (!file) return Response.json({ error: "Unknown case file." }, { status: 404 });
  const { filename, body } = caseCsv(file, getCaseCatalog().eventWindowDays);
  return new Response(body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
