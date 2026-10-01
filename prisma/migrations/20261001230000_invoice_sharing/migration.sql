-- AlterTable
ALTER TABLE "BusinessProfile" ADD COLUMN     "email" TEXT,
ADD COLUMN     "paymentDetails" TEXT,
ADD COLUMN     "phone" TEXT;

-- AlterTable
ALTER TABLE "Invoice" ADD COLUMN     "shareToken" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_shareToken_key" ON "Invoice"("shareToken");
