import Credentials from "next-auth/providers/credentials";
import GitHub from "next-auth/providers/github";
import type { NextAuthConfig } from "next-auth";

export default {
  providers: [
    GitHub,
    Credentials({
      credentials: {
        email: {},
        password: {},
      },
      authorize: async () => null,
    }),
  ],
} satisfies NextAuthConfig;
