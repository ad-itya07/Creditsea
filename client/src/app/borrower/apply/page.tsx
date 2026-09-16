"use client";

import { useEffect, useState } from "react";
import { LoanWizard } from "./LoanWizard";
import { api } from "@/lib/api";
import type { Loan } from "@/types";

export default function ApplyPage() {
  const [loan, setLoan] = useState<Loan | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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

  useEffect(() => {
    fetchLoan();
  }, []);

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-slate-500">
        Loading loan data...
      </div>
    );
  }

  return <LoanWizard loan={loan} onRefresh={fetchLoan} />;
}
