import type { z } from "zod";
import { prisma } from "./prisma";
import type { AddressFields } from "./validation";

/** Saves an address; the first one (or one marked default) becomes the default. */
export async function saveAddress(
  userId: string,
  data: z.infer<typeof AddressFields> & { label?: string; isDefault?: boolean },
) {
  const count = await prisma.address.count({ where: { userId } });
  const makeDefault = data.isDefault || count === 0;
  return prisma.$transaction(async (tx) => {
    if (makeDefault) await tx.address.updateMany({ where: { userId }, data: { isDefault: false } });
    return tx.address.create({ data: { ...data, label: data.label || "Home", userId, isDefault: makeDefault } });
  });
}
