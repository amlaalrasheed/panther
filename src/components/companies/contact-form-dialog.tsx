"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Plus, Loader2 } from "lucide-react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { contactSchema, type ContactInput } from "@/lib/validation";
import { createContact, updateContact } from "@/app/(app)/companies/actions";

export function ContactFormDialog({
  companyId,
  mode,
  contact,
  trigger,
}: {
  companyId: string;
  mode: "create" | "edit";
  contact?: ContactInput & { id: string };
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
  } = useForm<ContactInput>({
    resolver: zodResolver(contactSchema),
    defaultValues:
      contact ?? {
        companyId,
        name: "",
        nameAr: "",
        title: "",
        phone: "",
        whatsapp: "",
        email: "",
        isPrimary: false,
      },
  });

  async function onSubmit(data: ContactInput) {
    try {
      if (mode === "create") {
        await createContact({ ...data, companyId });
        toast.success("Contact added");
      } else if (contact) {
        await updateContact(contact.id, { ...data, companyId });
        toast.success("Contact updated");
      }
      setOpen(false);
      reset();
      router.refresh();
    } catch {
      toast.error("Something went wrong. Please try again.");
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          trigger ?? (
            <Button variant="outline" size="sm">
              <Plus className="size-4" />
              Add Contact
            </Button>
          )
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "Add Contact" : "Edit Contact"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="c-name">Name</Label>
              <Input id="c-name" {...register("name")} />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="c-nameAr">Name (Arabic)</Label>
              <Input id="c-nameAr" dir="rtl" {...register("nameAr")} />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="c-title">Title</Label>
            <Input id="c-title" {...register("title")} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="c-phone">Phone</Label>
              <Input id="c-phone" {...register("phone")} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="c-whatsapp">WhatsApp</Label>
              <Input id="c-whatsapp" {...register("whatsapp")} />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="c-email">Email</Label>
            <Input id="c-email" type="email" {...register("email")} />
            {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="c-primary"
              checked={watch("isPrimary")}
              onCheckedChange={(v) => setValue("isPrimary", v === true)}
            />
            <Label htmlFor="c-primary" className="font-normal">
              Primary contact
            </Label>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="size-4 animate-spin" />}
              {mode === "create" ? "Add Contact" : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
