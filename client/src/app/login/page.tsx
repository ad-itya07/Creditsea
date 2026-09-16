"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { Button } from "@/components/Button";
import { Field } from "@/components/Field";
import { Notice } from "@/components/Notice";
import { useAuth } from "@/context/AuthContext";
import { isDashboardRole } from "@/lib/auth";

const demoUsers = [
  ["Admin", "admin@lms.com", "Admin@123"],
  ["Sales", "sales@lms.com", "Sales@123"],
  ["Sanction", "sanction@lms.com", "Sanction@123"],
  ["Disbursement", "disbursement@lms.com", "Disburse@123"],
  ["Collection", "collection@lms.com", "Collect@123"],
  ["Borrower", "borrower@lms.com", "Borrow@123"],
];

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState("borrower@lms.com");
  const [password, setPassword] = useState("Borrow@123");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);
    try {
      const user = await login(email, password);
      let redirectPath = "/borrower";
      if (user.role === "SANCTION") redirectPath = "/dashboard/sanction";
      else if (user.role === "DISBURSEMENT") redirectPath = "/dashboard/disbursement";
      else if (user.role === "COLLECTION") redirectPath = "/dashboard/collection";
      else if (user.role === "SALES") redirectPath = "/dashboard/sales";
      else if (isDashboardRole(user.role)) redirectPath = "/dashboard";
      
      router.replace(redirectPath);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-panel px-4 py-8">
      <div className="grid w-full max-w-5xl gap-6 md:grid-cols-[1fr_1.1fr]">
        <section className="rounded-md border border-border bg-white p-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-brand">CreditSea LMS</p>
          <h1 className="mt-2 text-2xl font-semibold text-ink">Sign in</h1>
          <p className="mt-2 text-sm text-muted">
            Use seeded credentials for staff review, or register a new borrower account.
          </p>

          <form className="mt-6 space-y-4" onSubmit={onSubmit}>
            {error ? <Notice type="error">{error}</Notice> : null}
            <Field label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            <Field
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <Button className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Signing in..." : "Sign in"}
            </Button>
          </form>

          <p className="mt-4 text-sm text-muted">
            New borrower?{" "}
            <Link className="font-medium text-brand" href="/register">
              Create an account
            </Link>
          </p>
        </section>

        <section className="rounded-md border border-border bg-white p-6">
          <h2 className="text-base font-semibold">Seeded accounts</h2>
          <div className="mt-4 overflow-hidden rounded-md border border-border">
            <table className="w-full text-left text-sm">
              <thead className="bg-panel text-xs uppercase text-muted">
                <tr>
                  <th className="px-3 py-2">Role</th>
                  <th className="px-3 py-2">Email</th>
                  <th className="px-3 py-2">Password</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {demoUsers.map(([role, userEmail, userPassword]) => (
                  <tr
                    key={userEmail}
                    className="cursor-pointer hover:bg-panel"
                    onClick={() => {
                      setEmail(userEmail);
                      setPassword(userPassword);
                    }}
                  >
                    <td className="px-3 py-2 font-medium">{role}</td>
                    <td className="px-3 py-2">{userEmail}</td>
                    <td className="px-3 py-2">{userPassword}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}
