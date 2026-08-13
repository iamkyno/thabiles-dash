import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { prisma } from "@/lib/prisma";
import { requireOwner } from "@/lib/session";
import { formatDate } from "@/lib/tz";
import { StaffFormDialog } from "./staff-form-dialog";
import { UserRowActions } from "./user-row-actions";

export default async function UsersSettingsPage() {
  const session = await requireOwner();
  const users = await prisma.user.findMany({ orderBy: { createdAt: "asc" } });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Team</h1>
          <p className="text-muted-foreground">Manage who can access the studio dashboard.</p>
        </div>
        <StaffFormDialog />
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Team members</CardTitle>
          <CardDescription>{users.length} accounts</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell className="text-muted-foreground">{user.email}</TableCell>
                  <TableCell>
                    <Badge variant={user.role === "OWNER" ? "default" : "secondary"}>
                      {user.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {user.banned ? (
                      <Badge variant="destructive">Deactivated</Badge>
                    ) : (
                      <Badge variant="success">Active</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{formatDate(user.createdAt)}</TableCell>
                  <TableCell>
                    <UserRowActions
                      userId={user.id}
                      role={user.role ?? "STAFF"}
                      banned={Boolean(user.banned)}
                      isSelf={user.id === session.user.id}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
