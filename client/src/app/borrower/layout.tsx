"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { Protected } from "@/components/Protected";

export default function BorrowerLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const isApply = pathname.includes("/apply");
  const isStatus = pathname.includes("/status");

  return (
    <Protected allowedRoles={["BORROWER"]}>
      <AppShell title="Borrower Portal" subtitle="Manage your loan application and track its status.">
        <div className="flex flex-col gap-6 lg:flex-row">
          {/* Sidebar */}
          <aside className="lg:w-64 flex-shrink-0">
            <nav className="flex flex-col gap-2">
              <Link
                href="/borrower/apply"
                className={`rounded-md px-4 py-2.5 text-sm font-medium transition-colors ${
                  isApply
                    ? "bg-slate-900 text-white"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                Apply for Loan
              </Link>
              <Link
                href="/borrower/status"
                className={`rounded-md px-4 py-2.5 text-sm font-medium transition-colors ${
                  isStatus
                    ? "bg-slate-900 text-white"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                Loan Status
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
