import Link from "next/link";
import { StudioSignOutButton } from "./StudioSignOutButton";

const NAV = [
  { href: "/studio", label: "Dashboard" },
  { href: "/studio/products", label: "Products" },
  { href: "/studio/pricing", label: "Pricing" },
  { href: "/studio/orders", label: "Orders" },
  { href: "/studio/customers", label: "Customers" },
  { href: "/studio/newsletter", label: "Newsletter" },
];

export function AdminShell({
  children,
  adminName,
  adminEmail,
  draftCount = 0,
}: {
  children: React.ReactNode;
  adminName?: string | null;
  adminEmail?: string | null;
  /** Products waiting in "Not live yet" (e.g. new ingest uploads) */
  draftCount?: number;
}) {
  return (
    <div className="flex min-h-full flex-col">
      <a
        href="#main-content"
        className="border border-action bg-action text-on-action hover:border-action-hover-border hover:bg-action-hover hover:text-on-action-hover backdrop-blur-lg transition-colors focus:top-4 focus:left-4 fixed -top-20 left-4 z-50 rounded-full px-4 py-2 text-sm font-semibold focus:outline-none"
      >
        Skip to content
      </a>
      <header className="border-line bg-paper sticky top-0 z-40 border-b shadow-xl backdrop-blur-lg">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-3 px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="font-display text-lg font-bold">
                3DPIY Studio
              </span>
              <span className="bg-white text-night rounded-full px-2.5 py-0.5 text-xs font-bold tracking-wide uppercase">
                Admin
              </span>
            </div>
            <div className="flex items-center gap-3">
              {/* Plain <a>: the customer site lives in a different root
                  layout ([locale]), so this is a full navigation. "/" lands
                  on the last-picked track, or the chooser. */}
              <a
                href="/"
                className="border-line bg-mist hover:bg-paper rounded-full border px-4 py-1.5 text-sm font-medium transition-colors"
              >
                ← View site
              </a>
              <span className="text-ink/60 hidden text-sm sm:inline">
                Signed in as {adminName || adminEmail}
              </span>
              <StudioSignOutButton />
            </div>
          </div>
          <nav className="flex flex-wrap items-center gap-5">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-ink/70 hover:text-ink flex items-center gap-1.5 text-sm font-medium"
              >
                {item.label}
                {item.href === "/studio/products" && draftCount > 0 && (
                  <span
                    className="bg-action text-on-action rounded-full px-2 py-0.5 text-xs font-bold"
                    title={`${draftCount} not live yet`}
                  >
                    {draftCount} new
                  </span>
                )}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      <main
        id="main-content"
        className="mx-auto w-full max-w-7xl flex-1 px-4 py-10 sm:px-6 lg:px-8"
      >
        {children}
      </main>
    </div>
  );
}
