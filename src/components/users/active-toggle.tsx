"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { toggleUserActive } from "@/app/(app)/users/actions";

export function ActiveToggle({ userId, isActive }: { userId: string; isActive: boolean }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function onChange(checked: boolean) {
    startTransition(async () => {
      try {
        await toggleUserActive(userId, checked);
        router.refresh();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Could not update user");
      }
    });
  }

  return <Switch checked={isActive} onCheckedChange={onChange} disabled={pending} />;
}
