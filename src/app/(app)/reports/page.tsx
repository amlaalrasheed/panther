import { requireRole } from "@/lib/auth-helpers";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ReportExportForm } from "@/components/reports/report-export-form";

export default async function ReportsPage() {
  await requireRole(["ADMIN", "FINANCE"]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Reports</h1>
        <p className="text-sm text-muted-foreground">
          Generate and export campaign reports with custom filters
        </p>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Export Campaign Report</CardTitle>
        </CardHeader>
        <CardContent>
          <ReportExportForm />
        </CardContent>
      </Card>
    </div>
  );
}
