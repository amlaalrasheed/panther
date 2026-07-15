"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { userSchema, type UserInput } from "@/lib/validation";
import { createUser, updateUser } from "@/app/(app)/users/actions";
import { ROLE_LABELS, ALLOWED_EMAIL_DOMAIN } from "@/lib/constants";

export function UserFormDialog({
  mode,
  user,
  trigger,
}: {
  mode: "create" | "edit";
  user?: UserInput & { id: string };
  trigger?: React.ReactElement;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<UserInput>({
    resolver: zodResolver(userSchema),
    defaultValues: user ?? { name: "", nameAr: "", email: "", role: "MARKETING", password: "" },
  });

  async function onSubmit(data: UserInput) {
    try {
      if (mode === "create") {
        await createUser(data);
        toast.success("User created");
      } else if (user) {
        await updateUser(user.id, data);
        toast.success("User updated");
      }
      setOpen(false);
      reset();
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Something went wrong");
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          trigger ?? (
            <Button>
              <Plus className="size-4" />
              New User
            </Button>
          )
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "New User" : "Edit User"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="u-name">Name</Label>
              <Input id="u-name" {...register("name")} />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="u-nameAr">Name (Arabic)</Label>
              <Input id="u-nameAr" dir="rtl" {...register("nameAr")} />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="u-email">Email</Label>
            <Input id="u-email" type="email" placeholder={`name@${ALLOWED_EMAIL_DOMAIN}`} {...register("email")} />
            {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
          </div>
          <div className="flex flex-col gap-2">
            <Label>Role</Label>
            <Select value={watch("role")} onValueChange={(v) => setValue("role", v as UserInput["role"])}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(ROLE_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="u-password">
              {mode === "create" ? "Password" : "New Password (leave blank to keep current)"}
            </Label>
            <Input id="u-password" type="password" {...register("password")} />
            {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="size-4 animate-spin" />}
              {mode === "create" ? "Create User" : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
