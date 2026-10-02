import { redirect } from "next/navigation";
import { CheckoutForm } from "@/components/CheckoutForm";
import { getSession } from "@/lib/auth";
import { enabledPaymentProviders } from "@/lib/payments";
import { prisma } from "@/lib/prisma";

export default async function CheckoutPage() {
  const session = await getSession();
  if (!session) redirect("/login?callbackUrl=/checkout");

  // Pre-fill with the buyer's last shipping details.
  const last = await prisma.order.findFirst({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <CheckoutForm
      providers={enabledPaymentProviders()}
      defaults={{
        name: last?.shipName ?? session.user.name ?? "",
        contact: last?.shipContact ?? "",
        address: last?.shipAddress ?? "",
        barangay: last?.shipBarangay ?? "",
        city: last?.shipCity ?? "",
        region: last?.shipRegion ?? "",
      }}
    />
  );
}
