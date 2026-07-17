"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth-helpers";
import { writeAuditLog } from "@/lib/audit";
import { userSchema, type UserInput } from "@/lib/validation";
import { ALLOWED_EMAIL_DOMAIN } from "@/lib/constants";

function assertCompanyDomain(email: string) {
  if (!email.toLowerCase().endsWith(`@${ALLOWED_EMAIL_DOMAIN.toLowerCase()}`)) {
    throw new Error(`Email must be a @${ALLOWED_EMAIL_DOMAIN} address`);
  }
}

export async function createUser(input: UserInput) {
  const admin = await requireRole(["ADMIN"]);
  const data = userSchema.parse(input);
  assertCompanyDomain(data.email);
  if (!data.password) throw new Error("Password is required for new users");

  const passwordHash = await bcrypt.hash(data.password, 10);
  const user = await prisma.user.create({
    data: {
      name: data.name,
      nameAr: data.nameAr || null,
      email: data.email.toLowerCase(),
      role: data.role,
      isManager: data.role === "MARKETING" ? data.isManager ?? false : false,
      // Only a non-manager marketing member reports to a manager.
      managerId:
        data.role === "MARKETING" && !data.isManager && data.managerId ? data.managerId : null,
      passwordHash,
    },
  });

  await writeAuditLog({
    userId: admin.id,
    action: "CREATE",
    entityType: "User",
    entityId: user.id,
    newValue: { email: user.email, role: user.role },
  });

  revalidatePath("/users");
}

export async function updateUser(id: string, input: UserInput) {
  const admin = await requireRole(["ADMIN"]);
  const data = userSchema.parse(input);
  assertCompanyDomain(data.email);

  const before = await prisma.user.findUniqueOrThrow({ where: { id } });
  const passwordHash = data.password ? await bcrypt.hash(data.password, 10) : undefined;

  const user = await prisma.user.update({
    where: { id },
    data: {
      name: data.name,
      nameAr: data.nameAr || null,
      email: data.email.toLowerCase(),
      role: data.role,
      isManager: data.role === "MARKETING" ? data.isManager ?? false : false,
      // Only a non-manager marketing member reports to a manager.
      managerId:
        data.role === "MARKETING" && !data.isManager && data.managerId ? data.managerId : null,
      ...(passwordHash ? { passwordHash } : {}),
    },
  });

  await writeAuditLog({
    userId: admin.id,
    action: "UPDATE",
    entityType: "User",
    entityId: user.id,
    oldValue: { email: before.email, role: before.role },
    newValue: { email: user.email, role: user.role },
  });

  revalidatePath("/users");
}

export async function toggleUserActive(id: string, isActive: boolean) {
  const admin = await requireRole(["ADMIN"]);
  if (id === admin.id) throw new Error("You can't deactivate your own account.");

  const user = await prisma.user.update({ where: { id }, data: { isActive } });

  await writeAuditLog({
    userId: admin.id,
    action: "UPDATE",
    entityType: "User",
    entityId: user.id,
    newValue: { isActive },
  });

  revalidatePath("/users");
}
