# Website: "Track my order" under To Receive

Paste the part below the line into the website chat.

---

Please add a **Track my order** box to every order in My Account → **To Receive** that has a tracking number (opsOrders / Orders sheet `tracking`, saved by RS OS):

- Show the courier + tracking number big and easy to copy: the number in a monospace box with a **Copy** button (navigator.clipboard.writeText, then "Copied ✓" for 2 seconds; fallback: select the text).
- A **Track on J&T** button (J&T red #E60012, white text) that copies the number first, then opens https://www.jtexpress.ph/ in a new tab, with a small line: "Your tracking number is copied. Paste it in J&T's tracking box."
- If there's no tracking number yet: "Your tracking number will show here once your parcel is with J&T."
- Also show the same box in the order details view, and keep it in Completed for 7 days after shipping.
- RS OS also emails the buyer the tracking number (with the same J&T button) once the waybill is saved.
