# Regal Spritz Business OS

Live app: https://claude.ai/artifact/RbUQpD5J8M2dKELDEEKoyp (private to you until shared)

Back office for the whole team, plus orders and stock across Shopify, Shopee, TikTok Shop and FB/IG.

## Open to everyone
- **Home:** rotating carousel with a greeting (Manila time), RS Mission, Vision and Goals, plus my tasks, team task summary and department shortcuts
- **Tasks:** calendar (month) and list views; status (To do / In progress / Done / Cancelled), progress %, priority, start and due dates, assigned person and department. Views: whole team, per person, per department. Summary at the top, e.g. `4/10 In progress | 5/10 Done | 1/10 Cancelled`
- **Attendance:** time in / time out (Manila time), automatic Late after the shift start + grace period, leave / sick / day off / holiday, auto Absent for missed work days. Daily board with summary (e.g. `7/10 Present | 2/10 Late | 1/10 On leave`), monthly sheet per person with totals and hours, CSV export for payroll. Admin sets shift times, grace and work days.
- **My account:** link your login to your team-member name, see your tasks, time in/out, choose Light / Dark / System appearance, lock departments

## Departments (each has its own password; the owner gets in without one)
| Department | Pages |
|---|---|
| CEO | Overview (sales, profit, to fulfill) + tasks by department |
| Admin | Directory (ID, nickname, full name, phone, email, address, department, date started, Active/Inactive), department passwords, Home page content |
| Finance | Profit dashboard, **Payroll** (semi-monthly or monthly; days worked, lates and leave pulled from Attendance; daily rates by position; additions/deductions; payslip copy or download), **Investors** (ongoing with payout schedule and mark-paid, finished by year, loans), expenses |
| Sales | Orders (Shopify-style table, import from Shopify), customers |
| Marketing | Sales by channel, top customers, repeat rate, customers |
| Packing | Packing queue (mark fulfilled / on hold), inventory |

Every department also has a **Tasks** tab filtered to that department.

## Security note
Department passwords hide pages from staff who don't need them. They are not strong security: anyone the app is shared with can technically reach its data. Only the owner and Editors can change the team, the passwords or the Home page (enforced by the database rules).

## Branding
The brand colors and fonts are at the top of `index.html` under `BRAND TOKENS`.
