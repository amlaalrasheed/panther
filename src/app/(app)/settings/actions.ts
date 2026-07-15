"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth-helpers";
import { writeAuditLog } from "@/lib/audit";
import { z } from "zod";

const profileSchema = z.object({
  name: z.string().min(1),
  nameAr: z.string().optional().or(z.literal("")),
  currentPassword: z.string().optional().or(z.literal("")),
  newPassword: z.string().min(8).optional().or(z.literal("")),
});

export async function updateOwnProfile(input: z.infer<typeof profileSchema>) {
  const user = await requireUser();
  const data = profileSchema.parse(input);

  const dbUser = await prisma.user.findUniqueOrThrow({ where: { id: user.id } });

  if (data.newPassword) {
    if (!data.currentPassword) throw new Error("Enter your current password to set a new one.");
    const valid = await bcrypt.compare(data.currentPassword, dbUser.passwordHash);
    if (!valid) throw new Error("Current password is incorrect.");
  }

  const passwordHash = data.newPassword ? await bcrypt.hash(data.newPassword, 10) : undefined;

  await prisma.user.update({
    where: { id: user.id },
    data: {
      name: data.name,
      nameAr: data.nameAr || null,
      ...(passwordHash ? { passwordHash } : {}),
    },
  });

  await writeAuditLog({
    userId: user.id,
    action: "UPDATE",
    entityType: "User",
    entityId: user.id,
    newValue: { name: data.name, passwordChanged: !!passwordHash },
  });

  revalidatePath("/settings");

  // The session JWT only gets name/nameAr at sign-in and is never
  // re-read from the DB afterward, so the caller needs these to push
  // an update into the client session (see ProfileForm).
  return { name: data.name, nameAr: data.nameAr || null };
}
