import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";

type CampaignItem = {
  id: string;
  campaignTitle: string;
  campaignCode: string;
  adDate: Date | null;
  posted: boolean;
  company: { name: string };
};

export function CampaignMiniList({ campaigns, emptyText }: { campaigns: CampaignItem[]; emptyText: string }) {
  if (campaigns.length === 0) {
    return <p className="text-sm text-muted-foreground">{emptyText}</p>;
  }

  return (
    <div className="flex flex-col gap-2">
      {campaigns.map((c) => (
        <Link
          key={c.id}
          href={`/campaigns/${c.id}`}
          className="flex items-center justify-between rounded-lg border p-2.5 text-sm hover:bg-accent"
        >
          <div className="min-w-0">
            <p className="truncate font-medium">{c.campaignTitle}</p>
            <p className="truncate text-xs text-muted-foreground">
              {c.company.name} · {formatDate(c.adDate)}
            </p>
          </div>
          <Badge
            className={cn(
              "shrink-0 border-0 text-[11px]",
              c.posted
                ? "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300"
                : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
            )}
          >
            {c.posted ? "Posted" : "Not Posted"}
          </Badge>
        </Link>
      ))}
    </div>
  );
}
