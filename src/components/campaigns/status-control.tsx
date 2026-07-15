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
import { changeCampaignStatus } from "@/app/(app)/campaigns/actions";
import { CAMPAIGN_STATUSES, STATUS_LABELS, STATUS_COLORS, type CampaignStatus } from "@/lib/constants";
import { cn } from "@/lib/utils";

const MARKETING_ALLOWED: Record<string, CampaignStatus[]> = {
  ASSIGNED: ["POSTED"],
  POSTED: ["WAITING_FOR_RESULTS"],
  WAITING_FOR_RESULTS: ["COMPLETED"],
};

export function StatusControl({
  campaignId,
  currentStatus,
  role,
  isAssignedToMe,
}: {
  campaignId: string;
  currentStatus: CampaignStatus;
  role: "ADMIN" | "FINANCE" | "MARKETING";
  isAssignedToMe: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [next, setNext] = useState<string>("");

  const options =
    role === "MARKETING"
      ? isAssignedToMe
        ? MARKETING_ALLOWED[currentStatus] ?? []
        : []
      : CAMPAIGN_STATUSES.filter((s) => s !== currentStatus);

  function submit() {
    if (!next) return;
    startTransition(async () => {
      try {
        await changeCampaignStatus(campaignId, next as CampaignStatus);
        toast.success("Status updated");
        setNext("");
        router.refresh();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Could not update status");
      }
    });
  }

  return (
    <div className="flex flex-col gap-3">
      <Badge className={cn("w-fit border-0 text-sm", STATUS_COLORS[currentStatus])}>
        {STATUS_LABELS[currentStatus]}
      </Badge>
      {options.length > 0 && (
        <div className="flex gap-2">
          <Select value={next} onValueChange={(v) => setNext(v ?? "")}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Change status..." />
            </SelectTrigger>
            <SelectContent>
              {options.map((s) => (
                <SelectItem key={s} value={s}>
                  {STATUS_LABELS[s]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={submit} disabled={!next || pending} size="sm">
            Update
          </Button>
        </div>
      )}
    </div>
  );
}
