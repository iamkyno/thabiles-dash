-- AlterTable
ALTER TABLE "FinishedProduct" ADD COLUMN     "isCombo" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "ComboItem" (
    "id" TEXT NOT NULL,
    "comboId" TEXT NOT NULL,
    "productId" TEXT,
    "description" TEXT,
    "quantity" INTEGER NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ComboItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderStockDeduction" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,

    CONSTRAINT "OrderStockDeduction_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ComboItem" ADD CONSTRAINT "ComboItem_comboId_fkey" FOREIGN KEY ("comboId") REFERENCES "FinishedProduct"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComboItem" ADD CONSTRAINT "ComboItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "FinishedProduct"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderStockDeduction" ADD CONSTRAINT "OrderStockDeduction_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderStockDeduction" ADD CONSTRAINT "OrderStockDeduction_productId_fkey" FOREIGN KEY ("productId") REFERENCES "FinishedProduct"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Orders placed before combos existed only sold plain products, so what each took from stock
-- is exactly its line items. Cancelled orders already had their stock put back.
INSERT INTO "OrderStockDeduction" ("id", "orderId", "productId", "quantity")
SELECT gen_random_uuid()::text, oi."orderId", oi."productId", SUM(oi."quantity")
FROM "OrderItem" oi
JOIN "Order" o ON o."id" = oi."orderId"
WHERE o."status" <> 'CANCELLED'
GROUP BY oi."orderId", oi."productId";
