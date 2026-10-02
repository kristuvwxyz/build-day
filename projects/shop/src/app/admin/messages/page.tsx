import { notFound } from "next/navigation";
import { AdminNav } from "@/components/AdminNav";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { markMessageRead } from "../actions";

export const dynamic = "force-dynamic";

export default async function MessagesPage() {
  const session = await getSession();
  if (!session?.user.isAdmin) notFound();
  const messages = await prisma.contactMessage.findMany({ orderBy: { createdAt: "desc" }, take: 200 });

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-extrabold">Admin</h1>
      <AdminNav current="messages" />
      {messages.length === 0 && <p className="text-gray-500">No messages yet.</p>}
      {messages.map((m) => (
        <div key={m.id} className={`card space-y-1 p-4 text-sm ${m.isRead ? "opacity-60" : ""}`}>
          <div className="flex flex-wrap justify-between gap-2">
            <b>{m.subject}</b>
            <span className="text-xs text-gray-500">{m.createdAt.toLocaleString("en-PH")}</span>
          </div>
          <p className="text-gray-600">
            {m.name} · {m.email}
            {m.phone && ` · ${m.phone}`}
            {m.orderNumber && ` · Order ${m.orderNumber}`}
          </p>
          <p className="whitespace-pre-line">{m.message}</p>
          {!m.isRead && (
            <form action={markMessageRead}>
              <input type="hidden" name="id" value={m.id} />
              <button className="text-xs underline">Mark as read</button>
            </form>
          )}
        </div>
      ))}
    </div>
  );
}
