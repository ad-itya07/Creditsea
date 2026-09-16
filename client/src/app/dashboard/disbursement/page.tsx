"use client";

import { useEffect, useState } from "react";
import { formatCurrency, formatDate } from "@/lib/format";
import { api } from "@/lib/api";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/Button";
import { Notice } from "@/components/Notice";
import type { Loan } from "@/types";
import { ChevronLeft, ChevronRight, Search, Send } from "lucide-react";

const LOANS_PER_PAGE = 10;

export default function DisbursementPage() {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("SANCTIONED");
  const [page, setPage] = useState(1);

  const [isProcessing, setIsProcessing] = useState<string | null>(null);

  const load = async () => {
    setIsLoading(true);
    try {
      const response = await api.disbursement();
      setLoans(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load disbursement queue");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleDisburse = async (loanId: string) => {
    setError("");
    setMessage("");
    setIsProcessing(loanId);
    try {
      await api.disburseLoan(loanId);
      setMessage("Loan successfully marked as disbursed!");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Disbursement failed");
    } finally {
      setIsProcessing(null);
    }
  };

  // Filtering
  const filteredLoans = loans.filter((loan) => {
    const borrowerName = (typeof loan.borrower !== "string" ? loan.borrower.profile?.fullName || loan.borrower.name : "").toLowerCase();
    const matchesSearch = borrowerName.includes(search.toLowerCase());
    const matchesStatus = statusFilter === "ALL" || loan.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Pagination
  const totalPages = Math.ceil(filteredLoans.length / LOANS_PER_PAGE) || 1;
  const paginatedLoans = filteredLoans.slice((page - 1) * LOANS_PER_PAGE, page * LOANS_PER_PAGE);

  return (
    <div className="space-y-6">
      {message && <Notice type="success">{message}</Notice>}
      {error && <Notice type="error">{error}</Notice>}

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-xl border border-border bg-white p-4 shadow-sm">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name..."
            className="w-full rounded-md border border-slate-300 py-2 pl-9 pr-4 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-slate-700">Status:</span>
          <select
            className="rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="ALL">All Post-Sanction</option>
            <option value="SANCTIONED">Sanctioned</option>
            <option value="DISBURSED">Disbursed</option>
            <option value="CLOSED">Closed</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500 border-b border-border">
              <tr>
                <th className="px-6 py-4 font-medium">Applicant Name</th>
                <th className="px-6 py-4 font-medium">Principal</th>
                <th className="px-6 py-4 font-medium">Total Repayment</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium">Last Updated</th>
                <th className="px-6 py-4 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                    Loading applications...
                  </td>
                </tr>
              ) : paginatedLoans.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                    No applications found matching the criteria.
                  </td>
                </tr>
              ) : (
                paginatedLoans.map((loan) => {
                  const borrower = typeof loan.borrower === "string" ? null : loan.borrower;
                  const name = borrower?.profile?.fullName || borrower?.name || "Unknown Borrower";

                  return (
                    <tr key={loan._id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 font-medium text-slate-900">{name}</td>
                      <td className="px-6 py-4 text-slate-600">{formatCurrency(loan.principal)}</td>
                      <td className="px-6 py-4 text-slate-600">{formatCurrency(loan.totalRepayment)}</td>
                      <td className="px-6 py-4">
                        <StatusBadge status={loan.status} />
                      </td>
                      <td className="px-6 py-4 text-slate-600">{formatDate(loan.updatedAt || loan.createdAt)}</td>
                      <td className="px-6 py-4 text-right">
                        {loan.status === "SANCTIONED" ? (
                          <Button
                            onClick={() => handleDisburse(loan._id)}
                            disabled={isProcessing === loan._id}
                            className="inline-flex py-1.5 px-3 text-xs"
                          >
                            <Send size={14} className="mr-1.5" />
                            {isProcessing === loan._id ? "Processing..." : "Mark disbursed"}
                          </Button>
                        ) : (
                          <span className="text-slate-400 text-xs">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-border bg-slate-50 px-6 py-3">
            <span className="text-sm text-slate-500">
              Showing <span className="font-medium text-slate-900">{(page - 1) * LOANS_PER_PAGE + 1}</span> to{" "}
              <span className="font-medium text-slate-900">{Math.min(page * LOANS_PER_PAGE, filteredLoans.length)}</span> of{" "}
              <span className="font-medium text-slate-900">{filteredLoans.length}</span> results
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
                className="p-1.5 rounded-md border border-slate-300 text-slate-500 hover:bg-slate-100 disabled:opacity-50"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                disabled={page === totalPages}
                onClick={() => setPage(page + 1)}
                className="p-1.5 rounded-md border border-slate-300 text-slate-500 hover:bg-slate-100 disabled:opacity-50"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
