"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { setCampaignPosted } from "@/app/(app)/campaigns/actions";
import { cn } from "@/lib/utils";

const POSTED_OPTIONS = { not_posted: "Not Posted", posted: "Posted" } as const;

export function StatusControl({
  campaignId,
  posted,
  role,
  isAssignedToMe,
}: {
  campaignId: string;
  posted: boolean;
  role: "ADMIN" | "FINANCE" | "MARKETING";
  isAssignedToMe: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [next, setNext] = useState<string>(posted ? "posted" : "not_posted");

  const canEdit = role === "ADMIN" || role === "FINANCE" || (role === "MARKETING" && isAssignedToMe);
  const changed = (next === "posted") !== posted;

  function submit() {
    startTransition(async () => {
      try {
        await setCampaignPosted(campaignId, next === "posted");
        toast.success("Status updated");
        router.refresh();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Could not update status");
      }
    });
  }

  return (
    <div className="flex flex-col gap-3">
      <Badge
        className={cn(
          "w-fit border-0 text-sm",
          posted
            ? "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300"
            : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
        )}
      >
        {posted ? "Posted" : "Not Posted"}
      </Badge>
      {canEdit && (
        <div className="flex gap-2">
          <Select value={next} onValueChange={(v) => setNext(v ?? next)} items={POSTED_OPTIONS}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="not_posted">Not Posted</SelectItem>
              <SelectItem value="posted">Posted</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={submit} disabled={!changed || pending} size="sm">
            Update
          </Button>
        </div>
      )}
    </div>
  );
}
