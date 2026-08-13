import Link from "next/link";

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
import { requireSession } from "@/lib/session";
import { CustomerFormDialog } from "./customer-form-dialog";
import { DeleteCustomerButton } from "./delete-customer-button";

export default async function CustomersPage() {
  await requireSession();
  const customers = await prisma.customer.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { orders: true } } },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Customers</h1>
          <p className="text-muted-foreground">Retailers and buyers of your products.</p>
        </div>
        <CustomerFormDialog />
      </div>
      <Card>
        <CardHeader>
          <CardTitle>All customers</CardTitle>
          <CardDescription>{customers.length} customers</CardDescription>
        </CardHeader>
        <CardContent>
          {customers.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No customers yet. Add your first customer to get started.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Orders</TableHead>
                  <TableHead className="w-20" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {customers.map((customer) => (
                  <TableRow key={customer.id}>
                    <TableCell className="font-medium">
                      <Link href={`/dashboard/customers/${customer.id}`} className="hover:underline">
                        {customer.name}
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{customer.contactName || "—"}</TableCell>
                    <TableCell className="text-muted-foreground">{customer.phone || "—"}</TableCell>
                    <TableCell>{customer._count.orders}</TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <CustomerFormDialog
                          mode="edit"
                          customerId={customer.id}
                          defaultValues={{
                            name: customer.name,
                            contactName: customer.contactName ?? "",
                            phone: customer.phone ?? "",
                            email: customer.email ?? "",
                            address: customer.address ?? "",
                            notes: customer.notes ?? "",
                          }}
                        />
                        <DeleteCustomerButton customerId={customer.id} />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
