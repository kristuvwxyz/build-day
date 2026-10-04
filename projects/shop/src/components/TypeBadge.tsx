export function TypeBadge({ type }: { type: string }) {
  return type === "PREORDER" ? (
    <span className="bg-accent px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.18em] text-white">Pre-order</span>
  ) : (
    <span className="bg-brand px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.18em] text-white">On-hand</span>
  );
}
