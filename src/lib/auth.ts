import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { admin } from "better-auth/plugins";
import { defaultAc, adminAc } from "better-auth/plugins/admin/access";
import { nextCookies } from "better-auth/next-js";

import { prisma } from "@/lib/prisma";

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL,
  emailAndPassword: {
    enabled: true,
  },
  user: {
    additionalFields: {
      phone: {
        type: "string",
        required: false,
      },
    },
  },
  plugins: [
    admin({
      ac: defaultAc as never,
      roles: {
        OWNER: adminAc,
        STAFF: defaultAc.newRole({ user: [], session: [] }),
      },
      defaultRole: "STAFF",
      adminRoles: ["OWNER"],
    }),
    nextCookies(),
  ],
});

export type Session = typeof auth.$Infer.Session;
