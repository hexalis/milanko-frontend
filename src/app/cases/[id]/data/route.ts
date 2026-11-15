import { auditCsv, caseCsv } from "@/modules/cases/domain/case-csv";
import { findCaseFile, getCaseCatalog } from "@/modules/cases/domain/catalog";
import { findAuditCategory, getEventAudit } from "@/modules/cases/domain/event-audit";

/** CSV download of the series behind a case file or an audit file ("Download data (CSV)"). */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const csv = csvFor(id);
  if (!csv) return Response.json({ error: "Unknown case file." }, { status: 404 });
  return new Response(csv.body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${csv.filename}"`,
    },
  });
}

function csvFor(id: string) {
  const file = findCaseFile(id);
  if (file) return caseCsv(file, getCaseCatalog().eventWindowDays);
  const category = findAuditCategory(id);
  return category ? auditCsv(category, getEventAudit().generated) : undefined;
}
