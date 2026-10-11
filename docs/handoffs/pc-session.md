# Continue on K's PC (Claude in Chrome)

Read CLAUDE.md first. Then `git pull origin main`. Check each item yourself in K's Chrome:

1. **Brevo key.** Check whether Vercel env `BREVO_API_KEY` exists (regal-spritz-os, Production, Sensitive): https://vercel.com/kristuvwxyz/regal-spritz-os/settings/environment-variables
   - If it doesn't, make a key at https://app.brevo.com/settings/keys/api (name "RS OS"), add it in Vercel, then redeploy and wait until it shows Ready.
   - Don't put the key anywhere else.
   - Then open https://regal-spritz-os.vercel.app and tap Refresh. Check that the Home "📣 New website email" card shows "Sending with Brevo · X of 12 sent".
2. **Brevo campaigns.** Check that the "New Website Launch - Oct 2026" campaigns #1–#12 are set for 7:00 PM Manila every day: https://app.brevo.com/campaigns/listing/email
   - Only look. Don't send, edit or reschedule anything without K's OK.
3. **Shopee file.** In the RS App, open Listings and tap 🛍 Shopee file.
   - Watch the console for errors. Check that the photos land in the Supabase bucket `listing-photos` and the memo `webmeta/_shopee`.
   - Then help K with Shopee Seller Centre → Mass Upload. Ask K before publishing.
4. **Already scheduled.** The Oct 23 reminder (move order emails to Brevo transactional) is set. Nothing to do now.
