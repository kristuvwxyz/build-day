import { redirect } from "next/navigation";
import { CheckoutForm } from "@/components/CheckoutForm";
import { getSession } from "@/lib/auth";
import { enabledPaymentProviders } from "@/lib/payments";
import { prisma } from "@/lib/prisma";
import { liveSameDayEnabled } from "@/lib/sameday";

export default async function CheckoutPage() {
  const session = await getSession();
  if (!session) redirect("/login?callbackUrl=/checkout");

  // Pre-fill with the default saved address, else the last order's details.
  const [addresses, last, user] = await Promise.all([
    prisma.address.findMany({ where: { userId: session.user.id }, orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }] }),
    prisma.order.findFirst({ where: { userId: session.user.id }, orderBy: { createdAt: "desc" } }),
    prisma.user.findUnique({ where: { id: session.user.id } }),
  ]);
  const def = addresses[0];

  return (
    <CheckoutForm
      providers={enabledPaymentProviders()}
      liveSameDayQuote={liveSameDayEnabled()}
      savedAddresses={addresses}
      defaults={{
        name: def?.name ?? last?.shipName ?? user?.name ?? "",
        contact: def?.contact ?? last?.shipContact ?? user?.phone ?? "",
        address: def?.address ?? last?.shipAddress ?? "",
        barangay: def?.barangay ?? last?.shipBarangay ?? "",
        city: def?.city ?? last?.shipCity ?? "",
        region: def?.region ?? last?.shipRegion ?? "",
      }}
    />
  );
}
