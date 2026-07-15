import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";

const { auth } = NextAuth(authConfig);

export default auth;

export const config = {
  // Run on everything except static assets, images, and the auth API itself.
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico).*)"],
};
