import { ContactForm } from "@/components/ContactForm";
import { getSession } from "@/lib/auth";
import { SHOP_CONTACT } from "@/lib/config";

export default async function ContactPage() {
  const session = await getSession();
  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_300px]">
      <div className="card space-y-4 p-6">
        <h1 className="text-2xl font-extrabold">Contact Us</h1>
        <ContactForm defaults={{ name: session?.user.name ?? "", email: session?.user.email ?? "" }} />
      </div>
      <aside className="card h-fit space-y-3 p-6 text-sm">
        <h2 className="font-bold">Other ways to reach us</h2>
        <p>
          <span className="label">Email</span>
          {SHOP_CONTACT.email}
        </p>
        <p>
          <span className="label">Mobile</span>
          {SHOP_CONTACT.phone}
        </p>
        <p>
          <span className="label">Hours</span>
          {SHOP_CONTACT.hours}
        </p>
        <p className="flex gap-3">
          <a href={SHOP_CONTACT.facebook} target="_blank" rel="noreferrer" className="text-blue-600 underline">
            Facebook
          </a>
          <a href={SHOP_CONTACT.instagram} target="_blank" rel="noreferrer" className="text-blue-600 underline">
            Instagram
          </a>
        </p>
      </aside>
    </div>
  );
}
