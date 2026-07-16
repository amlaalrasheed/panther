import Link from "next/link";
import { requireUser, canSeeFinance } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Prisma } from "@/generated/prisma/client";

const POSTED_STATUSES = new Set(["POSTED", "WAITING_FOR_RESULTS", "COMPLETED", "FEEDBACK_RECEIVED"]);

export default async function CampaignsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; paid?: string; trusted?: string }>;
}) {
  const user = await requireUser();
  const { q, paid, trusted } = await searchParams;
  const showFinance = canSeeFinance(user.role);
  const showCompany = user.role !== "MARKETING";

  const where: Prisma.CampaignWhereInput = {
    deletedAt: null,
    ...(user.role === "MARKETING" ? { assignedUserId: user.id } : {}),
    ...(trusted === "yes" ? { company: { trustedCustomer: true } } : {}),
    ...(trusted === "no" ? { company: { trustedCustomer: false } } : {}),
    ...(q
      ? {
          OR: [
            { campaignTitle: { contains: q, mode: "insensitive" } },
            { campaignCode: { contains: q, mode: "insensitive" } },
            { productName: { contains: q, mode: "insensitive" } },
            { company: { name: { contains: q, mode: "insensitive" } } },
          ],
        }
      : {}),
    ...(paid === "paid" ? { finance: { paymentStatus: "PAID" } } : {}),
    ...(paid === "unpaid" ? { finance: { paymentStatus: { in: ["PENDING", "PARTIALLY_PAID"] } } } : {}),
  };

  const campaigns = await prisma.campaign.findMany({
    where,
    select: {
      id: true,
      campaignTitle: true,
      campaignCode: true,
      productName: true,
      numberOfSnaps: true,
      adDate: true,
      status: true,
      company: { select: { name: true } },
      assignedTo: { select: { name: true } },
      finance: { select: { finalAmount: true, paymentStatus: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Campaigns</h1>
          <p className="text-sm text-muted-foreground">
            {user.role === "MARKETING" ? "Your assigned advertisement campaigns" : "All advertisement bookings"}
          </p>
        </div>
        {user.role === "FINANCE" && (
          <Button
            nativeButton={false}
            render={
              <Link href="/campaigns/new">
                <Plus className="size-4" />
                New Booking
              </Link>
            }
          />
        )}
      </div>

      <Card>
        <CardContent className="pt-6">
          <form className="mb-4 flex flex-wrap gap-2" action="/campaigns">
            <Input name="q" placeholder="Search campaigns..." defaultValue={q} className="max-w-xs" />
            {showFinance && (
              <Select name="paid" defaultValue={paid ?? "ALL"}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Payment" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="unpaid">Not Paid</SelectItem>
                </SelectContent>
              </Select>
            )}
            <Button type="submit" variant="secondary">
              Filter
            </Button>
          </form>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Campaign</TableHead>
                  {showCompany && <TableHead>Company</TableHead>}
                  <TableHead>Snaps</TableHead>
                  <TableHead>Scheduled</TableHead>
                  <TableHead>Assigned</TableHead>
                  {showFinance && <TableHead className="text-right">Price</TableHead>}
                  {showFinance && <TableHead>Payment</TableHead>}
                  <TableHead>Posted</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {campaigns.map((c) => {
                  const isPaid = c.finance?.paymentStatus === "PAID";
                  const isPosted = POSTED_STATUSES.has(c.status);
                  return (
                    <TableRow key={c.id}>
                      <TableCell>
                        <Link href={`/campaigns/${c.id}`} className="font-medium hover:underline">
                          {c.campaignTitle}
                        </Link>
                        <div className="text-xs text-muted-foreground">
                          {c.campaignCode} · {c.productName}
                        </div>
                      </TableCell>
                      {showCompany && <TableCell>{c.company.name}</TableCell>}
                      <TableCell>{c.numberOfSnaps}</TableCell>
                      <TableCell>{formatDate(c.adDate)}</TableCell>
                      <TableCell>{c.assignedTo?.name ?? "—"}</TableCell>
                      {showFinance && (
                        <TableCell className="text-right">
                          {formatCurrency(Number(c.finance?.finalAmount ?? 0))}
                        </TableCell>
                      )}
                      {showFinance && (
                        <TableCell>
                          <Badge
                            className={cn(
                              "border-0",
                              isPaid
                                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                                : "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300"
                            )}
                          >
                            {isPaid ? "Paid" : "Not Paid"}
                          </Badge>
                        </TableCell>
                      )}
                      <TableCell>
                        <Badge
                          className={cn(
                            "border-0",
                            isPosted
                              ? "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300"
                              : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                          )}
                        >
                          {isPosted ? "Posted" : "Not Posted"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {campaigns.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={5 + (showCompany ? 1 : 0) + (showFinance ? 2 : 0)}
                      className="py-10 text-center text-muted-foreground"
                    >
                      No campaigns found.
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
