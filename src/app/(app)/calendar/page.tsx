import Link from "next/link";
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  format,
  addMonths,
  subMonths,
} from "date-fns";
import { requireUser } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const user = await requireUser();
  const { month } = await searchParams;
  const anchor = month ? new Date(`${month}-01T00:00:00`) : new Date();

  const monthStart = startOfMonth(anchor);
  const monthEnd = endOfMonth(anchor);
  const gridStart = startOfWeek(monthStart);
  const gridEnd = endOfWeek(monthEnd);
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd });

  const campaigns = await prisma.campaign.findMany({
    where: {
      deletedAt: null,
      adDate: { gte: gridStart, lte: gridEnd },
      ...(user.role === "MARKETING" ? { assignedUserId: user.id } : {}),
    },
    select: {
      id: true,
      campaignTitle: true,
      adDate: true,
      posted: true,
      company: { select: { name: true } },
    },
    orderBy: { adDate: "asc" },
  });

  const campaignsByDay = new Map<string, typeof campaigns>();
  for (const c of campaigns) {
    if (!c.adDate) continue;
    const key = format(c.adDate, "yyyy-MM-dd");
    campaignsByDay.set(key, [...(campaignsByDay.get(key) ?? []), c]);
  }

  const prevMonth = format(subMonths(monthStart, 1), "yyyy-MM");
  const nextMonth = format(addMonths(monthStart, 1), "yyyy-MM");

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Calendar</h1>
          <p className="text-sm text-muted-foreground">All scheduled advertisement campaigns</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            nativeButton={false}
            render={<Link href={`/calendar?month=${prevMonth}`} />}
          >
            <ChevronLeft className="size-4" />
          </Button>
          <span className="w-32 text-center text-sm font-medium">{format(monthStart, "MMMM yyyy")}</span>
          <Button
            variant="outline"
            size="icon"
            nativeButton={false}
            render={<Link href={`/calendar?month=${nextMonth}`} />}
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-7 gap-px overflow-hidden rounded-lg border bg-border text-xs font-medium text-muted-foreground">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
              <div key={d} className="bg-muted/50 px-2 py-1.5 text-center">
                {d}
              </div>
            ))}
            {days.map((day) => {
              const key = format(day, "yyyy-MM-dd");
              const dayCampaigns = campaignsByDay.get(key) ?? [];
              return (
                <div
                  key={key}
                  className={cn(
                    "min-h-24 bg-background p-1.5",
                    !isSameMonth(day, monthStart) && "bg-muted/20 text-muted-foreground",
                    isSameDay(day, new Date()) && "ring-2 ring-inset ring-primary"
                  )}
                >
                  <div className="mb-1 text-right text-xs">{format(day, "d")}</div>
                  <div className="flex flex-col gap-1">
                    {dayCampaigns.slice(0, 3).map((c) => (
                      <Link
                        key={c.id}
                        href={`/campaigns/${c.id}`}
                        className={cn(
                          "truncate rounded px-1.5 py-0.5 text-[10px] font-medium",
                          c.posted
                            ? "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300"
                            : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                        )}
                        title={`${c.campaignTitle} — ${c.company.name}`}
                      >
                        {c.campaignTitle}
                      </Link>
                    ))}
                    {dayCampaigns.length > 3 && (
                      <span className="text-[10px] text-muted-foreground">
                        +{dayCampaigns.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
