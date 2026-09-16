"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import type { Role } from "@/types";

export function Protected({
  allowedRoles,
  children,
}: {
  allowedRoles: Role[];
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (!allowedRoles.includes(user.role)) {
      router.replace(user.role === "BORROWER" ? "/borrower" : "/dashboard");
    }
  }, [allowedRoles, isLoading, router, user]);

  if (isLoading || !user || !allowedRoles.includes(user.role)) {
    return (
      <main className="flex min-h-screen items-center justify-center px-4">
        <p className="text-sm text-muted">Checking access...</p>
      </main>
    );
  }

  return children;
}
