export default function SharedInvoiceNotFound() {
  return (
    <div className="space-y-2 py-16 text-center">
      <h1 className="text-xl font-semibold">This invoice link isn&apos;t available</h1>
      <p className="text-sm text-gray-600">
        It may have been turned off or replaced. Please ask the business to send you a new link.
      </p>
    </div>
  );
}
