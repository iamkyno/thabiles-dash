"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";

export async function generateInvoice(orderId: string) {
  await requireSession();
  const order = await prisma.order.findUniqueOrThrow({ where: { id: orderId }, include: { invoice: true } });
  if (order.invoice) return { id: order.invoice.id };

  const issuedAt = new Date();
  const dueAt = new Date(issuedAt.getTime() + 14 * 24 * 60 * 60 * 1000);

  const invoice = await prisma.invoice.create({
    data: {
      orderId: order.id,
      customerId: order.customerId,
      status: "SENT",
      issuedAt,
      dueAt,
      subtotal: order.subtotal,
      discountTotal: order.discountTotal,
      taxTotal: order.taxTotal,
      total: order.total,
    },
  });

  revalidatePath(`/dashboard/orders/${orderId}`);
  revalidatePath("/dashboard/invoices");
  return { id: invoice.id };
}

const paymentSchema = z.object({
  amount: z.number().positive("Amount must be greater than 0"),
  method: z.enum(["CASH", "CARD", "EFT", "MOBILE_MONEY", "OTHER"]),
  reference: z.string().optional(),
});

export type PaymentInput = z.infer<typeof paymentSchema>;

export async function recordPayment(invoiceId: string, input: PaymentInput) {
  const session = await requireSession();
  const data = paymentSchema.parse(input);

  await prisma.$transaction(async (tx) => {
    const invoice = await tx.invoice.findUniqueOrThrow({ where: { id: invoiceId } });
    const newAmountPaid = invoice.amountPaid.plus(data.amount);
    const status = newAmountPaid.gte(invoice.total) ? "PAID" : "PARTIALLY_PAID";

    await tx.payment.create({
      data: {
        invoiceId,
        amount: data.amount,
        method: data.method,
        reference: data.reference,
        recordedById: session.user.id,
      },
    });

    await tx.invoice.update({
      where: { id: invoiceId },
      data: { amountPaid: newAmountPaid, status },
    });
  });

  revalidatePath(`/dashboard/invoices/${invoiceId}`);
  revalidatePath("/dashboard/invoices");
}

export async function voidInvoice(invoiceId: string) {
  await requireSession();
  await prisma.invoice.update({ where: { id: invoiceId }, data: { status: "VOID" } });
  revalidatePath(`/dashboard/invoices/${invoiceId}`);
  revalidatePath("/dashboard/invoices");
}
