-- CreateEnum
CREATE TYPE "StockOrderStatus" AS ENUM ('ORDERED', 'RECEIVED', 'CANCELLED');

-- DropForeignKey
ALTER TABLE "BatchMaterialUsage" DROP CONSTRAINT "BatchMaterialUsage_batchId_fkey";

-- DropForeignKey
ALTER TABLE "BatchMaterialUsage" DROP CONSTRAINT "BatchMaterialUsage_materialId_fkey";

-- DropForeignKey
ALTER TABLE "Material" DROP CONSTRAINT "Material_primarySupplierId_fkey";

-- DropForeignKey
ALTER TABLE "ProductionBatch" DROP CONSTRAINT "ProductionBatch_producedById_fkey";

-- DropForeignKey
ALTER TABLE "ProductionBatch" DROP CONSTRAINT "ProductionBatch_productId_fkey";

-- DropForeignKey
ALTER TABLE "ProductionBatch" DROP CONSTRAINT "ProductionBatch_recipeId_fkey";

-- DropForeignKey
ALTER TABLE "PurchaseOrder" DROP CONSTRAINT "PurchaseOrder_createdById_fkey";

-- DropForeignKey
ALTER TABLE "PurchaseOrder" DROP CONSTRAINT "PurchaseOrder_supplierId_fkey";

-- DropForeignKey
ALTER TABLE "PurchaseOrderItem" DROP CONSTRAINT "PurchaseOrderItem_materialId_fkey";

-- DropForeignKey
ALTER TABLE "PurchaseOrderItem" DROP CONSTRAINT "PurchaseOrderItem_purchaseOrderId_fkey";

-- DropForeignKey
ALTER TABLE "Recipe" DROP CONSTRAINT "Recipe_productId_fkey";

-- DropForeignKey
ALTER TABLE "RecipeItem" DROP CONSTRAINT "RecipeItem_materialId_fkey";

-- DropForeignKey
ALTER TABLE "RecipeItem" DROP CONSTRAINT "RecipeItem_recipeId_fkey";

-- DropTable
DROP TABLE "BatchMaterialUsage";

-- DropTable
DROP TABLE "Material";

-- DropTable
DROP TABLE "ProductionBatch";

-- DropTable
DROP TABLE "PurchaseOrder";

-- DropTable
DROP TABLE "PurchaseOrderItem";

-- DropTable
DROP TABLE "Recipe";

-- DropTable
DROP TABLE "RecipeItem";

-- DropTable
DROP TABLE "Supplier";

-- DropEnum
DROP TYPE "MaterialType";

-- DropEnum
DROP TYPE "ProductionBatchStatus";

-- DropEnum
DROP TYPE "PurchaseOrderStatus";

-- DropEnum
DROP TYPE "Unit";

-- CreateTable
CREATE TABLE "StockOrder" (
    "stockOrderSeq" SERIAL NOT NULL,
    "id" TEXT NOT NULL,
    "status" "StockOrderStatus" NOT NULL DEFAULT 'ORDERED',
    "receivedAt" TIMESTAMPTZ(3),
    "total" DECIMAL(12,2) NOT NULL,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StockOrder_pkey" PRIMARY KEY ("stockOrderSeq")
);

-- CreateTable
CREATE TABLE "StockOrderItem" (
    "id" TEXT NOT NULL,
    "stockOrderId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitCost" DECIMAL(12,2) NOT NULL,
    "lineTotal" DECIMAL(12,2) NOT NULL,

    CONSTRAINT "StockOrderItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "StockOrder_id_key" ON "StockOrder"("id");

-- AddForeignKey
ALTER TABLE "StockOrder" ADD CONSTRAINT "StockOrder_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockOrderItem" ADD CONSTRAINT "StockOrderItem_stockOrderId_fkey" FOREIGN KEY ("stockOrderId") REFERENCES "StockOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockOrderItem" ADD CONSTRAINT "StockOrderItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "FinishedProduct"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Carry staff permissions forward: purchase orders became stock orders; the other sections no longer exist
UPDATE "User"
SET "allowedSections" = array_replace(
  array_remove(array_remove(array_remove(array_remove("allowedSections", 'suppliers'), 'materials'), 'recipes'), 'production'),
  'purchase-orders',
  'stock-orders'
);
