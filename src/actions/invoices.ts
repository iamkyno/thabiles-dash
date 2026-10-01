"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { requireSession, requireSection } from "@/lib/session";
import { runAction, UserError } from "@/lib/action-result";
import { formatMoney } from "@/lib/money";
import { Prisma } from "@/generated/prisma/client";

export async function generateInvoice(orderId: string) {
  const session = await requireSession();
  await requireSection(session, "invoices");

  return runAction(async () => {
    const invoice = await prisma.$transaction(async (tx) => {
      // Lock the order row so an edit in progress finishes first and the invoice copies its final totals.
      await tx.order.updateMany({ where: { id: orderId }, data: { updatedAt: new Date() } });
      const order = await tx.order.findUnique({ where: { id: orderId }, include: { invoice: true } });
      if (!order) throw new UserError("This order has been deleted");
      if (order.invoice) return order.invoice;
      if (order.status === "CANCELLED") throw new UserError("This order was cancelled, so it can't be invoiced");

      const issuedAt = new Date();
      const dueAt = new Date(issuedAt.getTime() + 14 * 24 * 60 * 60 * 1000);

      return tx.invoice.create({
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
    });

    revalidatePath(`/dashboard/orders/${orderId}`);
    revalidatePath("/dashboard/invoices");
    return { id: invoice.id };
  });
}

const paymentSchema = z.object({
  amount: z.number().positive("Amount must be greater than 0"),
  method: z.enum(["CASH", "CARD", "EFT", "MOBILE_MONEY", "OTHER"]),
  reference: z.string().optional(),
});

export type PaymentInput = z.infer<typeof paymentSchema>;

export async function recordPayment(invoiceId: string, input: PaymentInput) {
  const session = await requireSession();
  await requireSection(session, "invoices");

  return runAction(async () => {
    const parsed = paymentSchema.safeParse(input);
    if (!parsed.success) throw new UserError(parsed.error.issues[0]?.message ?? "Check the payment details");
    const data = parsed.data;
    const amount = new Prisma.Decimal(data.amount).toDecimalPlaces(2);
    if (amount.lte(0)) throw new UserError("Amount must be at least R 0.01");

    await prisma.$transaction(async (tx) => {
      const found = await tx.invoice.findUnique({ where: { id: invoiceId }, select: { orderId: true } });
      if (!found) throw new UserError("This invoice has been deleted");
      // Lock the order row (the same lock deleting the order takes), so two payments recorded at
      // once, or a payment and a delete, run one after the other and the balance check below holds.
      await tx.order.updateMany({ where: { id: found.orderId }, data: { updatedAt: new Date() } });
      const invoice = await tx.invoice.findUnique({ where: { id: invoiceId } });
      if (!invoice) throw new UserError("This invoice has been deleted");
      if (invoice.status === "VOID") throw new UserError("This invoice is void, so it can't take payments");

      const balance = invoice.total.minus(invoice.amountPaid);
      if (balance.lte(0)) throw new UserError("This invoice is already paid in full");
      if (amount.gt(balance)) {
        throw new UserError(`That's more than the ${formatMoney(balance)} still owed on this invoice`);
      }

      const newAmountPaid = invoice.amountPaid.plus(amount);
      await tx.payment.create({
        data: {
          invoiceId,
          amount,
          method: data.method,
          reference: data.reference?.trim() || null,
          recordedById: session.user.id,
        },
      });
      await tx.invoice.update({
        where: { id: invoiceId },
        data: { amountPaid: newAmountPaid, status: newAmountPaid.gte(invoice.total) ? "PAID" : "PARTIALLY_PAID" },
      });
    });

    revalidatePath(`/dashboard/invoices/${invoiceId}`);
    revalidatePath("/dashboard/invoices");
    return null;
  });
}

// Turns on the client's view-only link. Calling it again returns the same link.
export async function shareInvoice(invoiceId: string) {
  const session = await requireSession();
  await requireSection(session, "invoices");

  return runAction(async () => {
    // Only fills in a token when there isn't one, so two people sharing at once get the same link.
    await prisma.invoice.updateMany({
      where: { id: invoiceId, shareToken: null },
      data: { shareToken: randomBytes(24).toString("base64url") },
    });
    const invoice = await prisma.invoice.findUnique({ where: { id: invoiceId }, select: { shareToken: true } });
    if (!invoice?.shareToken) throw new UserError("This invoice has been deleted");

    revalidatePath(`/dashboard/invoices/${invoiceId}`);
    return { token: invoice.shareToken };
  });
}

// Turns the link off: anyone who has it gets "not found" from then on.
export async function stopSharingInvoice(invoiceId: string) {
  const session = await requireSession();
  await requireSection(session, "invoices");

  return runAction(async () => {
    await prisma.invoice.updateMany({ where: { id: invoiceId }, data: { shareToken: null } });
    revalidatePath(`/dashboard/invoices/${invoiceId}`);
    return null;
  });
}

export async function voidInvoice(invoiceId: string) {
  const session = await requireSession();
  await requireSection(session, "invoices");
  await prisma.invoice.update({ where: { id: invoiceId }, data: { status: "VOID" } });
  revalidatePath(`/dashboard/invoices/${invoiceId}`);
  revalidatePath("/dashboard/invoices");
}
