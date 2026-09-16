"use client";

import { LogOut } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/Button";
import { useAuth } from "@/context/AuthContext";

export function AppShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  const { user, logout } = useAuth();
  const pathname = usePathname();

  const isAdmin = user?.role === "ADMIN";
  const displayTitle = isAdmin ? "Admin Dashboard" : title;
  const displaySubtitle = isAdmin ? "Monitor and manage all loan lifecycle operations." : subtitle;

  const adminTabs = [
    { name: "Sales", href: "/dashboard/sales" },
    { name: "Sanction", href: "/dashboard/sanction" },
    { name: "Disbursement", href: "/dashboard/disbursement" },
    { name: "Collection", href: "/dashboard/collection" },
  ];

  return (
    <main className="min-h-screen bg-slate-50 font-sans">
      <header className="border-b border-border bg-white shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-brand">CreditSea LMS</p>
            <h1 className="text-xl font-semibold text-ink">{displayTitle}</h1>
            {displaySubtitle ? <p className="mt-1 text-sm text-muted">{displaySubtitle}</p> : null}
          </div>
          {user ? (
            <div className="flex items-center gap-3">
              <div className="hidden text-right sm:block">
                <p className="text-sm font-medium">{user.name}</p>
                <p className="text-xs text-muted">{user.role}</p>
              </div>
              <Button variant="secondary" onClick={logout} aria-label="Logout" className="ml-2">
                <LogOut size={16} className="mr-1.5" />
                Logout
              </Button>
            </div>
          ) : null}
        </div>
        
        {/* Admin Navigation Layer */}
        {isAdmin && pathname.startsWith("/dashboard") && (
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <nav className="flex gap-6 mt-4">
              {adminTabs.map((tab) => {
                const isActive = pathname.startsWith(tab.href);
                return (
                  <Link
                    key={tab.name}
                    href={tab.href}
                    className={`pb-3 text-sm font-medium transition-colors relative ${
                      isActive ? "text-brand" : "text-slate-500 hover:text-slate-700"
                    }`}
                  >
                    {tab.name}
                    {isActive && (
                      <span className="absolute bottom-0 left-0 w-full h-0.5 bg-brand rounded-t-full" />
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>
        )}
      </header>
      
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">{children}</div>
    </main>
  );
}
