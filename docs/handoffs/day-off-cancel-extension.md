# Day-off extension for unpaid-order auto-cancel (K, Oct 2026)

**Rule (K):** BDO Checkout and Manual Processing orders get until **Tuesday 11:59 PM (Manila time)** to pay when their 24-hour window touches the shop's days off (Sunday and Monday). Maya Checkout is NOT extended.

**Exact rule:** the pay window starts when the order is placed (BDO Checkout) or when the first Royal Receipt is sent (Manual Processing) and lasts 24 hours. If the start or the end falls on a Sunday or Monday (Manila time), the deadline becomes the Tuesday 23:59:59 after it (never earlier than start + 24 h).

**RS OS (done):** `payDeadline()` in `projects/business-os/index.html` is used by the Manual Processing tab ("h left to pay · day-off extension") and the To Pay panel. RS OS itself only auto-cancels Maya, so nothing there cancels early.

**Website backend (NOT done, needs the website session):** the backend cancels unpaid Manual Processing orders 24 h after `receiptSent`. It must use the same rule above, or it will still cancel orders on Sunday / Monday. Check BDO Checkout too: if the backend cancels those, apply the same rule.
Test dates: receipt Sat Oct 17 8 PM → Tue Oct 20 11:59 PM; Sun Oct 18 10 AM → Tue Oct 20 11:59 PM; Tue Oct 20 9 AM → Wed Oct 21 9 AM.
