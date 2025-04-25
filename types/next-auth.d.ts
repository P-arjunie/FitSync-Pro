/* eslint-disable @typescript-eslint/no-unused-vars */
// types/next-auth.d.ts or wherever you like
import NextAuth from "next-auth";

declare module "next-auth" {
  interface Session {
    accessToken?: string;
  }

  interface JWT {
    accessToken?: string;
  }
}
