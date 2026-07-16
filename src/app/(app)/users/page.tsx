import { requireRole } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pencil } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { UserFormDialog } from "@/components/users/user-form-dialog";
import { ActiveToggle } from "@/components/users/active-toggle";
import { ROLE_LABELS } from "@/lib/constants";
import { formatDate } from "@/lib/format";

export default async function UsersPage() {
  await requireRole(["ADMIN"]);

  const users = await prisma.user.findMany({
    where: { deletedAt: null },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Users</h1>
          <p className="text-sm text-muted-foreground">Manage employee accounts and permissions</p>
        </div>
        <UserFormDialog mode="create" />
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead>Active</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell>
                      <div className="font-medium">{u.name}</div>
                      {u.nameAr && (
                        <div dir="rtl" className="text-xs text-muted-foreground">
                          {u.nameAr}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>{u.email}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <Badge variant="secondary">{ROLE_LABELS[u.role]}</Badge>
                        {u.isManager && u.role === "MARKETING" && (
                          <Badge className="border-0 bg-primary/10 text-primary">Manager</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{formatDate(u.createdAt)}</TableCell>
                    <TableCell>
                      <ActiveToggle userId={u.id} isActive={u.isActive} />
                    </TableCell>
                    <TableCell>
                      <UserFormDialog
                        mode="edit"
                        user={{
                          id: u.id,
                          name: u.name,
                          nameAr: u.nameAr ?? "",
                          email: u.email,
                          role: u.role,
                          isManager: u.isManager,
                          password: "",
                        }}
                        trigger={
                          <Button variant="ghost" size="icon" className="size-7">
                            <Pencil className="size-3.5" />
                          </Button>
                        }
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
