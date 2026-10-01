"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Copy, ExternalLink, Link2Off, Loader2, Mail, MessageCircle, Share2 } from "lucide-react";

import { shareInvoice, stopSharingInvoice } from "@/actions/invoices";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

// wa.me wants the full international number, digits only. Local SA numbers (082 123 4567) get 27 in front.
function whatsAppNumber(phone: string | null) {
  if (!phone) return null;
  let digits = phone.replace(/\D/g, "");
  if (digits.startsWith("00")) digits = digits.slice(2);
  else if (digits.startsWith("0")) digits = `27${digits.slice(1)}`;
  return digits.length >= 10 ? digits : null;
}

export function ShareInvoiceDialog({
  invoiceId,
  number,
  businessName,
  initialToken,
  customer,
  message,
}: {
  invoiceId: string;
  number: string;
  businessName: string;
  initialToken: string | null;
  customer: { name: string; contactName: string | null; phone: string | null; email: string | null };
  // e.g. "Amount due: R 450.00 by 15 Oct 2026." — worked out on the server so it matches the invoice.
  message: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [token, setToken] = useState(initialToken);
  const [creating, startCreating] = useTransition();
  const [stopping, startStopping] = useTransition();
  const [canNativeShare, setCanNativeShare] = useState(false);
  const linkInput = useRef<HTMLInputElement>(null);

  const link = token && typeof window !== "undefined" ? `${window.location.origin}/invoice/${token}` : "";
  const greeting = `Hi ${customer.contactName || customer.name}`;
  const text = `${greeting}, here is your invoice ${number} from ${businessName}. ${message}\n\nView, print or save it here: ${link}`;
  const whatsApp = whatsAppNumber(customer.phone);
  const subject = `Invoice ${number} from ${businessName}`;
  const email = customer.email?.trim() ?? "";

  function onOpenChange(next: boolean) {
    setOpen(next);
    if (!next) return;
    setCanNativeShare(typeof navigator.share === "function");
    if (token) return;
    startCreating(async () => {
      try {
        const result = await shareInvoice(invoiceId);
        if (!result.ok) {
          toast.error(result.error);
          setOpen(false);
          return;
        }
        setToken(result.data.token);
        router.refresh();
      } catch {
        toast.error("Couldn't create the link");
        setOpen(false);
      }
    });
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(link);
      toast.success("Link copied");
    } catch {
      // Older phones / non-https: select it so they can copy by hand.
      linkInput.current?.select();
      toast.info("Press and hold the link to copy it");
    }
  }

  async function nativeShare() {
    try {
      await navigator.share({ title: subject, text: `${greeting}, here is your invoice ${number} from ${businessName}. ${message}`, url: link });
    } catch {
      // Closing the share sheet throws too; nothing to do.
    }
  }

  function stopSharing() {
    if (!confirm("Turn off this link? Anyone who already has it won't be able to open the invoice any more.")) return;
    startStopping(async () => {
      try {
        const result = await stopSharingInvoice(invoiceId);
        if (!result.ok) {
          toast.error(result.error);
          return;
        }
        setToken(null);
        setOpen(false);
        toast.success("Link turned off");
        router.refresh();
      } catch {
        toast.error("Couldn't turn the link off");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <Share2 /> Share with client
        </Button>
      </DialogTrigger>
      <DialogContent keyboardAware={false}>
        <DialogHeader>
          <DialogTitle>Share {number}</DialogTitle>
          <DialogDescription>
            {customer.name} gets a link to view this invoice and print it or save it as a PDF. They don&apos;t need to log in.
          </DialogDescription>
        </DialogHeader>

        {!token || creating ? (
          <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" /> Creating link…
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex gap-2">
              <Input
                ref={linkInput}
                readOnly
                value={link}
                aria-label="Invoice link"
                onFocus={(e) => e.currentTarget.select()}
                className="min-w-0 flex-1 text-sm"
              />
              <Button variant="outline" onClick={copyLink}>
                <Copy /> Copy
              </Button>
            </div>

            <div className="grid gap-2">
              <Button asChild className="bg-[#25D366] text-white hover:bg-[#1ebe5b]">
                <a
                  href={`https://wa.me/${whatsApp ?? ""}?text=${encodeURIComponent(text)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <MessageCircle /> {whatsApp ? `WhatsApp ${customer.phone}` : "Send on WhatsApp"}
                </a>
              </Button>
              <Button variant="outline" asChild>
                <a href={`mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(text)}`}>
                  <Mail /> <span className="truncate">{email ? `Email ${email}` : "Send by email"}</span>
                </a>
              </Button>
              {canNativeShare && (
                <Button variant="outline" onClick={nativeShare}>
                  <Share2 /> More ways to share…
                </Button>
              )}
              <Button variant="ghost" asChild>
                <a href={link} target="_blank" rel="noopener noreferrer">
                  <ExternalLink /> See what the client sees
                </a>
              </Button>
            </div>

            {!customer.phone && !email && (
              <p className="text-xs text-muted-foreground">
                Add a phone number or email to this customer to send it to them directly.
              </p>
            )}

            <div className="border-t pt-3">
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-destructive hover:text-destructive sm:w-auto"
                disabled={stopping}
                onClick={stopSharing}
              >
                {stopping ? <Loader2 className="animate-spin" /> : <Link2Off />}
                Turn off link
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
