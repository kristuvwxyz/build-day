import { statusColor, statusLabel } from "@/lib/orderStatus";

export function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusColor(status)}`}>
      {statusLabel(status)}
    </span>
  );
}
