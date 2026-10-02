import { notFound } from "next/navigation";
import { AdminNav } from "@/components/AdminNav";
import { getSession } from "@/lib/auth";
import { peso } from "@/lib/money";
import { prisma } from "@/lib/prisma";
import { describeVoucher } from "@/lib/vouchers";
import { createVoucher, toggleVoucher } from "../actions";

export const dynamic = "force-dynamic";

export default async function VouchersPage() {
  const session = await getSession();
  if (!session?.user.isAdmin) notFound();
  const vouchers = await prisma.voucher.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { redemptions: true } } },
  });

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-extrabold">Admin</h1>
      <AdminNav current="vouchers" />

      <form action={createVoucher} className="card grid gap-3 p-4 text-sm sm:grid-cols-3">
        <h2 className="font-bold sm:col-span-3">New voucher</h2>
        <label>
          <span className="label">Code</span>
          <input name="code" required className="input uppercase" placeholder="WELCOME100" />
        </label>
        <label>
          <span className="label">Type</span>
          <select name="type" className="input">
            <option value="FIXED">Fixed amount (₱)</option>
            <option value="PERCENT">Percent (%)</option>
          </select>
        </label>
        <label>
          <span className="label">Value (₱ or %)</span>
          <input name="value" type="number" step="0.01" min="0.01" required className="input" />
        </label>
        <label>
          <span className="label">Minimum spend (₱)</span>
          <input name="minSpend" type="number" step="0.01" min="0" className="input" placeholder="0" />
        </label>
        <label>
          <span className="label">Max discount (₱, for %)</span>
          <input name="maxDiscount" type="number" step="0.01" min="0" className="input" placeholder="no cap" />
        </label>
        <label>
          <span className="label">Expires on</span>
          <input name="expiresAt" type="date" className="input" />
        </label>
        <label>
          <span className="label">Total uses allowed</span>
          <input name="usageLimit" type="number" min="1" className="input" placeholder="unlimited" />
        </label>
        <label>
          <span className="label">Uses per buyer</span>
          <input name="perUserLimit" type="number" min="1" className="input" defaultValue={1} />
        </label>
        <label>
          <span className="label">Description (internal)</span>
          <input name="description" className="input" placeholder="Payday promo" />
        </label>
        <div className="sm:col-span-3">
          <button className="btn-primary">Create voucher</button>
        </div>
      </form>

      <div className="space-y-2">
        {vouchers.length === 0 && <p className="text-gray-500">No vouchers yet.</p>}
        {vouchers.map((v) => (
          <div key={v.id} className="card flex flex-wrap items-center justify-between gap-3 p-4 text-sm">
            <div>
              <p>
                <b className="font-mono">{v.code}</b> · {describeVoucher(v)}
                {v.minSpend > 0 && ` · min ${peso(v.minSpend)}`}
              </p>
              <p className="text-xs text-gray-500">
                Used {v._count.redemptions}
                {v.usageLimit != null ? ` / ${v.usageLimit}` : ""} · {v.perUserLimit} per buyer
                {v.expiresAt ? ` · expires ${v.expiresAt.toLocaleDateString("en-PH", { dateStyle: "medium" })}` : ""}
                {v.description ? ` · ${v.description}` : ""}
              </p>
            </div>
            <form action={toggleVoucher}>
              <input type="hidden" name="id" value={v.id} />
              <button className={v.isActive ? "btn-outline" : "btn-primary"}>{v.isActive ? "Turn off" : "Turn on"}</button>
            </form>
          </div>
        ))}
      </div>
    </div>
  );
}
