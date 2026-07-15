import Link from "next/link";
import { requireRole } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CompanyFormDialog } from "@/components/companies/company-form-dialog";
import { CUSTOMER_TYPE_LABELS } from "@/lib/constants";
import { formatCurrency } from "@/lib/format";

export default async function CompaniesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; type?: string }>;
}) {
  await requireRole(["ADMIN", "FINANCE"]);
  const { q, type } = await searchParams;

  const companies = await prisma.company.findMany({
    where: {
      deletedAt: null,
      ...(type && type !== "ALL" ? { type: type as "AGENCY" | "DIRECT_COMPANY" } : {}),
      ...(q
        ? {
            OR: [
              { name: { contains: q, mode: "insensitive" } },
              { nameAr: { contains: q, mode: "insensitive" } },
              { industry: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    select: {
      id: true,
      name: true,
      nameAr: true,
      type: true,
      industry: true,
      campaigns: {
        where: { deletedAt: null },
        select: { finance: { select: { finalAmount: true, remainingBalance: true } } },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Companies</h1>
          <p className="text-sm text-muted-foreground">
            Advertising agencies and direct company customers
          </p>
        </div>
        <CompanyFormDialog mode="create" />
      </div>

      <Card>
        <CardContent className="pt-6">
          <form className="mb-4 flex flex-wrap gap-2" action="/companies">
            <Input
              name="q"
              placeholder="Search by name or industry..."
              defaultValue={q}
              className="max-w-xs"
            />
          </form>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Company</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Industry</TableHead>
                  <TableHead className="text-right">Campaigns</TableHead>
                  <TableHead className="text-right">Lifetime Revenue</TableHead>
                  <TableHead className="text-right">Outstanding</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {companies.map((c) => {
                  const lifetimeRevenue = c.campaigns.reduce(
                    (sum, camp) => sum + Number(camp.finance?.finalAmount ?? 0),
                    0
                  );
                  const outstanding = c.campaigns.reduce(
                    (sum, camp) => sum + Number(camp.finance?.remainingBalance ?? 0),
                    0
                  );
                  return (
                    <TableRow key={c.id} className="cursor-pointer">
                      <TableCell>
                        <Link href={`/companies/${c.id}`} className="font-medium hover:underline">
                          {c.name}
                        </Link>
                        {c.nameAr && (
                          <div dir="rtl" className="text-xs text-muted-foreground">
                            {c.nameAr}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{CUSTOMER_TYPE_LABELS[c.type]}</Badge>
                      </TableCell>
                      <TableCell>{c.industry ?? "—"}</TableCell>
                      <TableCell className="text-right">{c.campaigns.length}</TableCell>
                      <TableCell className="text-right">{formatCurrency(lifetimeRevenue)}</TableCell>
                      <TableCell className="text-right">
                        {outstanding > 0 ? (
                          <span className="font-medium text-red-700 dark:text-red-400">
                            {formatCurrency(outstanding)}
                          </span>
                        ) : (
                          formatCurrency(0)
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
                {companies.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                      No companies found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
