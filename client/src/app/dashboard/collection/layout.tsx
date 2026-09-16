"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { Protected } from "@/components/Protected";

export default function CollectionLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const isQueue = pathname.includes("/dashboard/collection");

  return (
    <Protected allowedRoles={["COLLECTION", "ADMIN"]}>
      <AppShell title="Collection Dashboard" subtitle="Manage and record repayments for disbursed loans.">
        <div className="flex flex-col gap-6 lg:flex-row">
          {/* Sidebar */}
          <aside className="lg:w-64 flex-shrink-0">
            <nav className="flex flex-col gap-2">
              <Link
                href="/dashboard/collection"
                className={`rounded-md px-4 py-2.5 text-sm font-medium transition-colors ${
                  isQueue
                    ? "bg-slate-900 text-white"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                Queue
              </Link>
            </nav>
          </aside>

          {/* Main Content */}
          <main className="flex-1 min-w-0">
            {children}
          </main>
        </div>
      </AppShell>
    </Protected>
  );
}
