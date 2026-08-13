import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireOwner } from "@/lib/session";
import { getBusinessProfile } from "@/actions/business";
import { BusinessForm } from "./business-form";

export default async function BusinessSettingsPage() {
  await requireOwner();
  const profile = await getBusinessProfile();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Business settings</h1>
        <p className="text-muted-foreground">Details used on invoices and across the dashboard.</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>These details appear on printed invoices.</CardDescription>
        </CardHeader>
        <CardContent>
          <BusinessForm
            defaultValues={{
              businessName: profile.businessName,
              address: profile.address ?? "",
              taxNumber: profile.taxNumber ?? "",
              currencyCode: profile.currencyCode,
              timezone: profile.timezone,
              invoicePrefix: profile.invoicePrefix,
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
