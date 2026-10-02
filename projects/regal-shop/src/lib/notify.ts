// Best-effort emails to the shop owner and buyers. Failures are logged, never block the action.
import { SHOP_NAME } from "./config";
import { sendEmail } from "./email";

export function ownerInbox() {
  return process.env.SHOP_INBOX_EMAIL || (process.env.ADMIN_EMAILS ?? "").split(",")[0]?.trim() || null;
}

export async function notify(to: string | null | undefined, subject: string, text: string, replyTo?: string) {
  if (!to) return;
  try {
    await sendEmail({ to, subject: `[${SHOP_NAME}] ${subject}`, text, replyTo });
  } catch (err) {
    console.error("Email notification failed", err);
  }
}
