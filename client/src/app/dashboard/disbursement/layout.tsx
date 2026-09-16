"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { Protected } from "@/components/Protected";

export default function DisbursementLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const isQueue = pathname.includes("/dashboard/disbursement");

  return (
    <Protected allowedRoles={["DISBURSEMENT", "ADMIN"]}>
      <AppShell title="Disbursement Dashboard" subtitle="Process sanctioned loans for final disbursal.">
        <div className="flex flex-col gap-6 lg:flex-row">
          {/* Sidebar */}
          <aside className="lg:w-64 flex-shrink-0">
            <nav className="flex flex-col gap-2">
              <Link
                href="/dashboard/disbursement"
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
