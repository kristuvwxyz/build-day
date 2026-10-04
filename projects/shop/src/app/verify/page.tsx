import { redirect } from "next/navigation";
import { SignOutButton } from "@/components/SignOutButton";
import { TwoFactorForm } from "@/components/TwoFactorForm";
import { getRawSession, isTwoFactorVerified } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { maskEmail } from "@/lib/twoFactor";

export default async function VerifyPage({ searchParams }: { searchParams: Promise<{ callbackUrl?: string }> }) {
  const { callbackUrl } = await searchParams;
  const safeCallback = callbackUrl?.startsWith("/") && !callbackUrl.startsWith("//") ? callbackUrl : "/profile";
  const session = await getRawSession();
  if (!session) redirect(`/login?callbackUrl=${encodeURIComponent(safeCallback)}`);
  if (await isTwoFactorVerified()) redirect(safeCallback);

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });

  return (
    <div className="card mx-auto max-w-sm space-y-5 p-8">
      <div className="text-center">
        <h1 className="text-2xl font-medium text-brand">Verify it's you</h1>
        <p className="mt-1 text-sm text-gray-500">
          For your protection, enter the code we email you each time you log in.
        </p>
      </div>
      <TwoFactorForm maskedEmail={user?.email ? maskEmail(user.email) : null} callbackUrl={safeCallback} />
      <div className="text-center">
        <SignOutButton />
      </div>
    </div>
  );
}
