import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { getServerSession, type NextAuthOptions } from "next-auth";
import { cookies } from "next/headers";
import AppleProvider from "next-auth/providers/apple";
import FacebookProvider from "next-auth/providers/facebook";
import GoogleProvider from "next-auth/providers/google";
import type { Provider } from "next-auth/providers/index";
import { prisma } from "./prisma";

// Each login button only appears once its keys are set in .env
const providers: Provider[] = [];
if (process.env.FACEBOOK_CLIENT_ID && process.env.FACEBOOK_CLIENT_SECRET) {
  providers.push(
    FacebookProvider({
      clientId: process.env.FACEBOOK_CLIENT_ID,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
    }),
  );
}
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  );
}
if (process.env.APPLE_ID && process.env.APPLE_CLIENT_SECRET) {
  providers.push(
    AppleProvider({
      clientId: process.env.APPLE_ID,
      // A signed JWT generated from your Apple .p8 key (valid up to 6 months).
      clientSecret: process.env.APPLE_CLIENT_SECRET,
    }),
  );
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers,
  session: { strategy: "database" },
  pages: { signIn: "/login" },
  callbacks: {
    session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
        session.user.isAdmin = isAdminEmail(user.email);
      }
      return session;
    },
  },
};

export const enabledLoginProviders = providers.map((p) => ({ id: p.id, name: p.name }));

export function isAdminEmail(email?: string | null) {
  if (!email) return false;
  const admins = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return admins.includes(email.toLowerCase());
}

/** Logged in, but maybe not through 2FA yet. Only for the login / 2FA pages. */
export function getRawSession() {
  return getServerSession(authOptions);
}

/** The current login session token (from NextAuth's cookie). */
export async function currentSessionToken() {
  const jar = await cookies();
  return jar.get("__Secure-next-auth.session-token")?.value ?? jar.get("next-auth.session-token")?.value ?? null;
}

export async function isTwoFactorVerified() {
  const token = await currentSessionToken();
  if (!token) return false;
  const row = await prisma.session.findUnique({ where: { sessionToken: token } });
  return Boolean(row?.twoFactorVerifiedAt);
}

/**
 * The logged-in buyer, only after they entered their 2FA email code.
 * Everything that shows or changes a buyer's data must use this.
 */
export async function getSession() {
  const session = await getRawSession();
  if (!session) return null;
  return (await isTwoFactorVerified()) ? session : null;
}
