// 2FA by email: after logging in with Facebook / Google / Apple, the buyer must
// enter a 6-digit code sent to their email before they can use their account.
import crypto from "crypto";
import { sendEmail } from "./email";
import { SHOP_NAME } from "./config";
import { prisma } from "./prisma";

const CODE_MINUTES = 10;
const MAX_ATTEMPTS = 5;
const RESEND_SECONDS = 60;

const hash = (code: string) =>
  crypto.createHmac("sha256", process.env.NEXTAUTH_SECRET ?? "dev-secret").update(code).digest("hex");

export function maskEmail(email: string) {
  const [name, domain] = email.split("@");
  return `${name.slice(0, 2)}${"•".repeat(Math.max(1, name.length - 2))}@${domain}`;
}

export async function sendTwoFactorCode(userId: string, sessionToken: string, email: string) {
  const last = await prisma.twoFactorCode.findFirst({ where: { sessionToken }, orderBy: { createdAt: "desc" } });
  if (last && Date.now() - last.createdAt.getTime() < RESEND_SECONDS * 1000) {
    return { error: `Please wait a minute before asking for a new code.` };
  }
  const code = crypto.randomInt(0, 1_000_000).toString().padStart(6, "0");
  await prisma.twoFactorCode.deleteMany({ where: { sessionToken } });
  await prisma.twoFactorCode.create({
    data: { userId, sessionToken, email, codeHash: hash(code), expires: new Date(Date.now() + CODE_MINUTES * 60_000) },
  });
  await sendEmail({
    to: email,
    subject: `${code} is your ${SHOP_NAME} login code`,
    text: `Your ${SHOP_NAME} login code is ${code}.\n\nIt expires in ${CODE_MINUTES} minutes. If you didn't try to log in, you can ignore this email.`,
  });
  return { ok: true as const };
}

export async function verifyTwoFactorCode(userId: string, sessionToken: string, code: string) {
  const row = await prisma.twoFactorCode.findFirst({ where: { sessionToken, userId }, orderBy: { createdAt: "desc" } });
  if (!row || row.expires < new Date()) return { error: "This code has expired. Please request a new one." };
  if (row.attempts >= MAX_ATTEMPTS) return { error: "Too many wrong tries. Please request a new code." };

  await prisma.twoFactorCode.update({ where: { id: row.id }, data: { attempts: { increment: 1 } } });
  const a = Buffer.from(hash(code.trim()));
  const b = Buffer.from(row.codeHash);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return { error: "That code is incorrect." };

  // First time verifying an email for an account that had none (e.g. some Facebook logins).
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (user && !user.email) {
    const taken = await prisma.user.findUnique({ where: { email: row.email } });
    if (taken) return { error: "That email already belongs to another account. Log in with that account instead." };
    await prisma.user.update({ where: { id: userId }, data: { email: row.email } });
  }

  await prisma.session.update({ where: { sessionToken }, data: { twoFactorVerifiedAt: new Date() } });
  await prisma.twoFactorCode.deleteMany({ where: { sessionToken } });
  return { ok: true as const };
}
