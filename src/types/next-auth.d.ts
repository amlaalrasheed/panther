import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface User {
    role: "ADMIN" | "FINANCE" | "MARKETING";
    nameAr?: string | null;
  }

  interface Session {
    user: {
      id: string;
      role: "ADMIN" | "FINANCE" | "MARKETING";
      nameAr?: string | null;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: "ADMIN" | "FINANCE" | "MARKETING";
    nameAr?: string | null;
  }
}
