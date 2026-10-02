export function TypeBadge({ type }: { type: string }) {
  return type === "PREORDER" ? (
    <span className="rounded-md bg-amber-400 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-amber-950">
      Pre-order
    </span>
  ) : (
    <span className="rounded-md bg-emerald-500 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-white">
      On-hand
    </span>
  );
}
