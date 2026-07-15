"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { updateOwnProfile } from "@/app/(app)/settings/actions";

export function ProfileForm({ name, nameAr }: { name: string; nameAr: string }) {
  const router = useRouter();
  const { update } = useSession();
  const [form, setForm] = useState({
    name,
    nameAr,
    currentPassword: "",
    newPassword: "",
  });
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const updated = await updateOwnProfile(form);
      // The session JWT caches name/nameAr from sign-in time — push the
      // fresh values in so the header/sidebar reflect the change immediately
      // instead of only after the next login.
      await update({ name: updated.name, nameAr: updated.nameAr });
      router.refresh();
      toast.success("Profile updated");
      setForm((f) => ({ ...f, currentPassword: "", newPassword: "" }));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="p-name">Name</Label>
          <Input id="p-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="p-nameAr">Name (Arabic)</Label>
          <Input
            id="p-nameAr"
            dir="rtl"
            value={form.nameAr}
            onChange={(e) => setForm({ ...form, nameAr: e.target.value })}
          />
        </div>
      </div>

      <Separator className="my-2" />
      <p className="text-sm font-medium">Change Password</p>
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="p-current">Current Password</Label>
          <Input
            id="p-current"
            type="password"
            value={form.currentPassword}
            onChange={(e) => setForm({ ...form, currentPassword: e.target.value })}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="p-new">New Password</Label>
          <Input
            id="p-new"
            type="password"
            value={form.newPassword}
            onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
          />
        </div>
      </div>

      <div className="flex justify-end pt-2">
        <Button type="submit" disabled={submitting}>
          {submitting && <Loader2 className="size-4 animate-spin" />}
          Save Changes
        </Button>
      </div>
    </form>
  );
}
