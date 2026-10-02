import { z } from "zod";

export const PhMobile = z
  .string()
  .trim()
  .regex(/^(09\d{9}|\+639\d{9})$/, "Use a PH mobile number like 09171234567");

export const AddressFields = z.object({
  name: z.string().trim().min(2).max(100),
  contact: PhMobile,
  address: z.string().trim().min(5).max(300),
  barangay: z.string().trim().min(2).max(100),
  city: z.string().trim().min(2).max(100),
  region: z.enum(["METRO_MANILA", "LUZON", "VISAYAS", "MINDANAO"]),
});

export const FragranticaUrl = z
  .string()
  .trim()
  .url()
  .refine((u) => /^https:\/\/(www\.)?fragrantica\.(com|es|fr|it|de|ru|pl|nl|cn|gr|ro|asia)\//i.test(u), {
    message: "Paste a link from fragrantica.com",
  });

/** "vanilla, Oud ,  rose" → "vanilla, oud, rose" */
export const csv = (max = 300) =>
  z
    .string()
    .max(max)
    .transform((s) =>
      Array.from(new Set(s.split(",").map((x) => x.trim().toLowerCase()).filter(Boolean))).join(", "),
    );
