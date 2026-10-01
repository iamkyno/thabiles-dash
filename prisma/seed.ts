import "dotenv/config";

import { prisma } from "../src/lib/prisma";
import { auth } from "../src/lib/auth";
import { APP_SECTIONS } from "../src/lib/sections";

const DEV_PASSWORD = "ChangeMe123!";
const ALL_SECTIONS = APP_SECTIONS.map((s) => s.key);

async function createAuthUserIfMissing(params: {
  name: string;
  email: string;
  role: "ADMIN" | "DEVELOPER" | "STAFF";
  phone?: string;
  allowedSections?: string[];
}) {
  const allowedSections = params.allowedSections ?? [];
  // Runs on every deploy: never modify an account that already exists (an admin may have changed it).
  const existing = await prisma.user.findUnique({ where: { email: params.email } });
  if (existing) return existing;

  const result = await auth.api.signUpEmail({
    body: { name: params.name, email: params.email, password: DEV_PASSWORD },
  });

  return prisma.user.update({
    where: { id: result.user.id },
    data: {
      role: params.role,
      phone: params.phone,
      emailVerified: true,
      approvalStatus: "APPROVED",
      allowedSections,
    },
  });
}

async function main() {
  await prisma.businessProfile.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      businessName: "TSC-Thabiles Skin Care",
      currencyCode: "ZAR",
      timezone: "Africa/Johannesburg",
      invoicePrefix: "INV",
    },
  });

  const owner = await createAuthUserIfMissing({
    name: "Thabile",
    email: "owner@thabilesnaturals.test",
    role: "ADMIN",
    phone: "+27 71 500 0001",
  });

  await createAuthUserIfMissing({
    name: "Developer",
    email: "developer@thabilesnaturals.test",
    role: "DEVELOPER",
    phone: "+27 71 500 0000",
  });

  await createAuthUserIfMissing({
    name: "Sipho",
    email: "sipho@thabilesnaturals.test",
    role: "STAFF",
    phone: "+27 71 500 0002",
    allowedSections: ALL_SECTIONS,
  });

  await createAuthUserIfMissing({
    name: "Nomvula",
    email: "nomvula@thabilesnaturals.test",
    role: "STAFF",
    phone: "+27 71 500 0003",
    allowedSections: ALL_SECTIONS,
  });

  await prisma.finishedProduct.upsert({
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
  console.log(`Admin login: owner@thabilesnaturals.test / ${DEV_PASSWORD}`);
  console.log(`Developer login: developer@thabilesnaturals.test / ${DEV_PASSWORD}`);
  console.log(`Staff login: sipho@thabilesnaturals.test / ${DEV_PASSWORD}`);
  void owner;
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
