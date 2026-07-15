import type { NextAuthConfig } from "next-auth";

// Split out so middleware (Edge runtime) can use the route-protection
// logic without pulling in the Credentials provider / bcrypt / Prisma,
// none of which are Edge-compatible.
export const authConfig = {
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  providers: [],
  callbacks: {
    authorized({ auth, request }) {
      const isLoggedIn = !!auth?.user;
      const isOnLogin = request.nextUrl.pathname === "/login";

      if (isOnLogin) {
        if (isLoggedIn) return Response.redirect(new URL("/dashboard", request.nextUrl));
        return true;
      }

      return isLoggedIn;
    },
    jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.nameAr = user.nameAr ?? null;
      }
      // Triggered by the client calling useSession().update(...) after a
      // profile self-edit — the JWT otherwise only gets name/nameAr from
      // `user` at initial sign-in and is never re-read from the DB.
      if (trigger === "update" && session) {
        if (typeof session.name === "string") token.name = session.name;
        if ("nameAr" in session) token.nameAr = session.nameAr ?? null;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as "ADMIN" | "FINANCE" | "MARKETING";
        session.user.nameAr = (token.nameAr as string | null) ?? null;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
