"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { assignCampaign } from "@/app/(app)/campaigns/actions";

export function AssignControl({
  campaignId,
  assignedUserId,
  marketingUsers,
}: {
  campaignId: string;
  assignedUserId: string | null;
  marketingUsers: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function onChange(value: string | null) {
    if (!value) return;
    startTransition(async () => {
      try {
        await assignCampaign(campaignId, value);
        toast.success("Campaign assigned");
        router.refresh();
      } catch {
        toast.error("Could not assign campaign");
      }
    });
  }

  return (
    <Select value={assignedUserId ?? undefined} onValueChange={onChange} disabled={pending}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Unassigned" />
      </SelectTrigger>
      <SelectContent>
        {marketingUsers.map((u) => (
          <SelectItem key={u.id} value={u.id}>
            {u.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
