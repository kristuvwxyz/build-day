import { redirect } from "next/navigation";
import { LoginButtons } from "@/components/LoginButtons";
import { enabledLoginProviders, getRawSession, isTwoFactorVerified } from "@/lib/auth";
import { SHOP_NAME } from "@/lib/config";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string; error?: string }>;
}) {
  const { callbackUrl, error } = await searchParams;
  // Only allow redirects back into this site.
  const safeCallback = callbackUrl?.startsWith("/") && !callbackUrl.startsWith("//") ? callbackUrl : "/profile";
  const session = await getRawSession();
  if (session) {
    if (await isTwoFactorVerified()) redirect(safeCallback);
    redirect(`/verify?callbackUrl=${encodeURIComponent(safeCallback)}`);
  }

  return (
    <div className="card mx-auto max-w-sm space-y-6 p-8">
      <div className="text-center">
        <h1 className="text-2xl font-medium text-brand">Log in to {SHOP_NAME}</h1>
        <p className="mt-1 text-sm text-gray-500">Track your orders, pay balances, and save your wishlist.</p>
      </div>
      {error && (
        <p className="rounded-theme bg-red-50 p-3 text-sm text-red-700">
          {error === "OAuthAccountNotLinked"
            ? "This email is already linked to another login method. Please use the one you used before."
            : "Login failed. Please try again."}
        </p>
      )}
      <LoginButtons providers={enabledLoginProviders} callbackUrl={safeCallback} />
      <p className="text-center text-xs text-gray-400">We never post anything on your behalf.</p>
    </div>
  );
}
