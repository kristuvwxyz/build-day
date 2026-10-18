# RS OS review — Oct 18, 2026

These came from a read-only review of `projects/business-os/index.html`. Each item needs to be double-checked before it's fixed. Effort: S = small, M = medium, L = large.

## A. Stock accuracy (risk of overselling)
1. Saving a listing (or its variations) writes back the stock from when the editor was opened, which can undo a sale (M) — L6640, L6576 varsSave
2. Two sales at the same moment can lose a stock change, because adjustStock saves this device's total (M) — L1441
3. Restoring a cancelled order doesn't take the stock off again (S) — L4446
4. After Edit items or Merge, cancelling puts back the wrong amounts (S) — L6191, L4489, L1582
5. Website orders marked Refunded never give the stock back and stay in Committed (S) — L3187, L3015
6. Unpaid Manual Processing and BDO orders hold stock forever (only Maya auto-cancels) (S) — L3278

## B. Money and payroll
7. Sales can "Mark paid" their own budget request without Finance approving it (S) — L7781, L7908
8. Profit counts unpaid orders, leaves out website orders, payroll and fixed costs (M) — L3711
9. A paid payslip changes if attendance is edited later (S) — L8321
10. The "Whole month" payroll can be paid twice alongside the two half-months (S) — L8311
11. Last month's unpaid due dates disappear on the 1st (S) — L7959
12. Sales report, Profit and BIR count sales three different ways (M) — L8176
13. Late deductions ignore the grace period (S) — L8321

## C. Attendance and staff
14. New hires show as absent before their start date (S) — L7384
15. Editing a split-shift day breaks it (S) — L7559
16. Employee of the Month marks tasks late if they're edited after the due date (S) — L2052
17. Days with no time-out still count as a full day; staff can edit their own time (S) — L7440

## D. Suppliers and customers
18. Mark as ordered can include orders that weren't on the list you sent (S) — L4256
19. Items added to an order after it was ordered never show up in To order again (M) — L4220
20. Customers list leaves out website (regalspritz.com) buyers (M) — L4777
21. Website sync can mark an edit as synced before it's sent (S) — L6832
22. Edit items allows a discount over 100% (negative total) (S) — L6188

## E. Safety and speed
23. Every staff browser downloads all data (salaries, investors, logins); hiding is screen-only (L) — L9731
24. Two people editing the same order: one edit is lost (M) — L1397
25. Backups are manual only; importing a backup overwrites with no preview (S–M) — L4316, L4330
26. Failed saves are often silent; no offline warning (M) — L9741
27. Passwords vault never locks itself (S) — L8856
28. The whole screen redraws on every change; it will slow down on phones (L) — L2275
29. Phone layout is thin for the wide tables (M)
30. Timers run on every open device (possible duplicate emails or pushes) (M) — L9682

## New ideas
- Monthly profit and cash report: sales − cost − expenses − payroll − fixed − investor interest.
- Auto-cancel or a reminder for unpaid orders older than 24 hours.
- Automatic daily backup.

---
## Status after fixing (Oct 18)
**Fixed:** 1, 2 (partly: reads newest stock before changing it), 3, 4, 7, 9, 10, 11, 14, 16, 18, 21, 22, 25 (warning before import), 26 (offline banner), 27 (vault locks after 5 min). Also a reminder when the last backup is over 7 days old.

**Not fixed — needs your decision:**
- 5 Refunded website orders: should the bottle go back to stock? (depends on whether it was returned)
- 6 Unpaid Manual Processing / BDO orders: auto-cancel after 24 h like Maya?
- 8 / 12 Profit and Sales report rules: which sales count (paid only? website too?)
- 13 Late deduction: should the grace period (15 min) count?
- 17 Time-in and edit permissions for Attendance

**Not fixed — bigger jobs:** 15 split-shift edit, 19 items added after "Mark as ordered", 20 website buyers in Customers, 23 staff browsers load all data (needs database access rules), 24 two people editing one order, 28 faster redraw, 29 phone layout, 30 timers, automatic daily backup.
