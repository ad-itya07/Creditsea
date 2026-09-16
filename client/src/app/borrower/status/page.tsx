"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/format";
import { StatusBadge } from "@/components/StatusBadge";
import type { Loan } from "@/types";

export default function StatusPage() {
  const [loan, setLoan] = useState<Loan | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchLoan = async () => {
      try {
        const response = await api.myLoan();
        setLoan(response.data);
      } catch {
        setLoan(null);
      } finally {
        setIsLoading(false);
      }
    };
    fetchLoan();
  }, []);

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-slate-500">
        Loading status...
      </div>
    );
  }

  if (!loan || (loan.status === "NO_LOAN" || loan.status === "BRE_REJECTED")) {
    return (
      <div className="rounded-xl border border-border bg-white p-8 text-center shadow-sm">
        <h2 className="text-xl font-semibold text-slate-900">No Active Application</h2>
        <p className="mt-2 text-slate-500">
          You don't have an active loan application yet. Head over to the Apply section to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="rounded-xl border border-border bg-white shadow-sm overflow-hidden">
        <div className="border-b border-border bg-slate-50 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Application Status</h2>
              <p className="text-sm text-slate-500 mt-1">Here's the latest update on your loan.</p>
            </div>
            <StatusBadge status={loan.status} />
          </div>
        </div>

        <div className="p-6">
          <dl className="grid gap-4 text-sm">
            <Info label="Principal Amount" value={formatCurrency(loan.principal)} />
            <Info label="Tenure" value={loan.tenureDays ? `${loan.tenureDays} days` : "-"} />
            <Info label="Interest Rate" value={loan.interestRate ? `${loan.interestRate}% p.a.` : "-"} />
            <Info label="Total Repayment" value={formatCurrency(loan.totalRepayment)} />
            
            <div className="my-2 border-b border-slate-100"></div>
            
            <Info label="Amount Paid" value={formatCurrency(loan.totalPaid)} />
            <Info label="Outstanding Balance" value={formatCurrency(loan.outstandingAmount)} />
            
            <div className="my-2 border-b border-slate-100"></div>

            <Info label="Application Created" value={formatDate(loan.createdAt)} />
          </dl>

          {loan.rejectionReason && (
            <div className="mt-6 rounded-md border border-red-200 bg-red-50 p-4">
              <h4 className="text-sm font-semibold text-red-900">Rejection Reason</h4>
              <p className="mt-1 text-sm text-red-800">{loan.rejectionReason}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-slate-500">{label}</dt>
      <dd className="font-medium text-slate-900">{value}</dd>
    </div>
  );
}
