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
    sendResetPassword: async ({ user, url }) => {
      console.log(`[password reset] ${user.email}: ${url}`);
    },
  },
  user: {
    additionalFields: {
      phone: {
        type: "string",
        required: false,
      },
      approvalStatus: {
        type: "string",
        required: false,
      },
      allowedSections: {
        type: "string[]",
        required: false,
      },
    },
  },
  databaseHooks: {
    user: {
      create: {
        before: async (user, context) => {
          if (context?.path === "/sign-up/email") {
            return { data: { ...user, role: "STAFF", approvalStatus: "PENDING" } };
          }
        },
      },
    },
  },
  plugins: [
    admin({
      ac: defaultAc as never,
      roles: {
        ADMIN: adminAc,
        DEVELOPER: adminAc,
        STAFF: defaultAc.newRole({ user: [], session: [] }),
      },
      defaultRole: "STAFF",
      adminRoles: ["ADMIN", "DEVELOPER"],
    }),
    nextCookies(),
  ],
});

export type Session = typeof auth.$Infer.Session;
