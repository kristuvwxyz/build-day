# Website backend: "Completed" replaces Shipped / Delivered for customers

Paste this into the website (Apps Script backend) chat.

---

Please change the customer order statuses on regalspritz.com:

1. Add a new final status **Completed**. The full list is now: **Placed, Confirmed, Packed, Completed, Cancelled**. Remove **Shipped** and **Delivered**.
2. `opsUpdate` and `opsStatuses` (from RS OS) must accept `status: "Completed"`.
3. Treat Completed like the old Shipped/Delivered: final. No cancel request, and tracking still shows if there is one.
4. Customer's My Account shows **Completed** (green). Any order still saved as Shipped or Delivered also shows as **Completed**. Please convert those rows in the sheet to "Completed" once.
5. In the website admin/status dropdowns, replace Shipped and Delivered with Completed.

RS OS sends "Completed" for every shipped order (about 6,870). The next time an admin opens RS OS, it sends them in batches of 2,000 through `opsStatuses`.

Deploy as a new version (same web app URL).
