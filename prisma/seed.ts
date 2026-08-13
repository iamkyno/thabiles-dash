import "dotenv/config";

import { prisma } from "../src/lib/prisma";
import { auth } from "../src/lib/auth";

const DEV_PASSWORD = "ChangeMe123!";

async function upsertAuthUser(params: {
  name: string;
  email: string;
  role: "OWNER" | "STAFF";
  phone?: string;
}) {
  const existing = await prisma.user.findUnique({ where: { email: params.email } });
  if (existing) {
    return prisma.user.update({
      where: { id: existing.id },
      data: { role: params.role, phone: params.phone },
    });
  }

  const result = await auth.api.signUpEmail({
    body: { name: params.name, email: params.email, password: DEV_PASSWORD },
  });

  return prisma.user.update({
    where: { id: result.user.id },
    data: { role: params.role, phone: params.phone, emailVerified: true },
  });
}

async function main() {
  await prisma.businessProfile.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      businessName: "Thabile's Naturals",
      currencyCode: "ZAR",
      timezone: "Africa/Johannesburg",
      invoicePrefix: "INV",
    },
  });

  const owner = await upsertAuthUser({
    name: "Thabile",
    email: "owner@thabilesnaturals.test",
    role: "OWNER",
    phone: "+27 71 500 0001",
  });

  await upsertAuthUser({
    name: "Sipho",
    email: "sipho@thabilesnaturals.test",
    role: "STAFF",
    phone: "+27 71 500 0002",
  });

  await upsertAuthUser({
    name: "Nomvula",
    email: "nomvula@thabilesnaturals.test",
    role: "STAFF",
    phone: "+27 71 500 0003",
  });

  const suppliers = await Promise.all(
    [
      { name: "Cape Botanicals", contactName: "Riaan", phone: "+27 21 555 0101", email: "sales@capebotanicals.test" },
      { name: "PureGlass Packaging", contactName: "Aisha", phone: "+27 11 555 0202", email: "orders@pureglass.test" },
    ].map((s) =>
      prisma.supplier.findFirst({ where: { name: s.name } }).then((existing) =>
        existing ? existing : prisma.supplier.create({ data: s })
      )
    )
  );

  const materials = await Promise.all(
    [
      {
        sku: "ING-SHEA-BUTTER",
        name: "Raw Shea Butter",
        type: "RAW_INGREDIENT" as const,
        unit: "KG" as const,
        costPerUnit: "180.0000",
        stockQty: "12.500",
        reorderLevel: "3.000",
        primarySupplierId: suppliers[0].id,
      },
      {
        sku: "ING-COCONUT-OIL",
        name: "Cold-Pressed Coconut Oil",
        type: "RAW_INGREDIENT" as const,
        unit: "L" as const,
        costPerUnit: "95.0000",
        stockQty: "8.000",
        reorderLevel: "2.000",
        primarySupplierId: suppliers[0].id,
      },
      {
        sku: "ING-LAVENDER-EO",
        name: "Lavender Essential Oil",
        type: "RAW_INGREDIENT" as const,
        unit: "ML" as const,
        costPerUnit: "1.8000",
        stockQty: "500.000",
        reorderLevel: "100.000",
        primarySupplierId: suppliers[0].id,
      },
      {
        sku: "PKG-JAR-200ML",
        name: "200ml Glass Jar",
        type: "PACKAGING" as const,
        unit: "PIECE" as const,
        costPerUnit: "8.5000",
        stockQty: "150.000",
        reorderLevel: "50.000",
        primarySupplierId: suppliers[1].id,
      },
      {
        sku: "PKG-LABEL-STD",
        name: "Standard Product Label",
        type: "PACKAGING" as const,
        unit: "PIECE" as const,
        costPerUnit: "1.2000",
        stockQty: "300.000",
        reorderLevel: "100.000",
        primarySupplierId: suppliers[1].id,
      },
    ].map((m) =>
      prisma.material.upsert({ where: { sku: m.sku }, update: {}, create: m })
    )
  );

  const product = await prisma.finishedProduct.upsert({
    where: { sku: "PROD-WHIP-BUTTER-200" },
    update: {},
    create: {
      sku: "PROD-WHIP-BUTTER-200",
      name: "Whipped Shea Body Butter (200ml)",
      unitSize: "200ml",
      sellPrice: "180.00",
      stockQty: 24,
      reorderLevel: 10,
    },
  });

  const existingRecipe = await prisma.recipe.findUnique({ where: { productId: product.id } });
  const recipe =
    existingRecipe ??
    (await prisma.recipe.create({
      data: {
        productId: product.id,
        yieldQuantity: 10,
        instructions: "Whip shea butter and coconut oil until fluffy, blend in lavender oil, jar and label.",
        items: {
          create: [
            { materialId: materials[0].id, quantityPerBatch: "2.000" },
            { materialId: materials[1].id, quantityPerBatch: "0.500" },
            { materialId: materials[2].id, quantityPerBatch: "30.000" },
            { materialId: materials[3].id, quantityPerBatch: "10.000" },
            { materialId: materials[4].id, quantityPerBatch: "10.000" },
          ],
        },
      },
    }));

  const customers = await Promise.all(
    [
      { name: "Green Leaf Spa", contactName: "Buhle", phone: "+27 82 444 1111", email: "buhle@greenleafspa.test" },
      { name: "Nomsa Retail Store", contactName: "Nomsa", phone: "+27 82 444 2222", email: "nomsa@retail.test" },
    ].map((c) =>
      prisma.customer.findFirst({ where: { name: c.name } }).then((existing) =>
        existing ? existing : prisma.customer.create({ data: c })
      )
    )
  );

  console.log("Seed complete.");
  console.log(`Owner login: owner@thabilesnaturals.test / ${DEV_PASSWORD}`);
  console.log(`Staff login: sipho@thabilesnaturals.test / ${DEV_PASSWORD}`);
  void owner;
  void recipe;
  void customers;
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
