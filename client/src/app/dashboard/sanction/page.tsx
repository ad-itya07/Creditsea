"use client";

import { useEffect, useState } from "react";
import { formatCurrency, formatDate } from "@/lib/format";
import { api } from "@/lib/api";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/Button";
import { Field, TextareaField } from "@/components/Field";
import { Notice } from "@/components/Notice";
import type { Loan } from "@/types";
import { Check, ChevronLeft, ChevronRight, Eye, Search, X } from "lucide-react";

const LOANS_PER_PAGE = 10;

export default function SanctionPage() {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("APPLIED");
  const [page, setPage] = useState(1);

  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null);

  const load = async () => {
    setIsLoading(true);
    try {
      const response = await api.sanction();
      setLoans(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load sanction queue");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleApprove = async (loanId: string) => {
    try {
      await api.approveLoan(loanId);
      await load();
      setSelectedLoan(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Action failed");
    }
  };

  const handleReject = async (loanId: string, reason: string) => {
    try {
      await api.rejectLoan(loanId, reason);
      await load();
      setSelectedLoan(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Action failed");
    }
  };

  if (selectedLoan) {
    return (
      <SanctionDetail
        loan={selectedLoan}
        onBack={() => setSelectedLoan(null)}
        onApprove={() => handleApprove(selectedLoan._id)}
        onReject={(reason) => handleReject(selectedLoan._id, reason)}
      />
    );
  }

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
            <option value="ALL">All Applications</option>
            <option value="APPLIED">Applied</option>
            <option value="SANCTIONED">Sanctioned</option>
            <option value="REJECTED">Rejected</option>
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
                <th className="px-6 py-4 font-medium">Loan Amount</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium">Date Applied</th>
                <th className="px-6 py-4 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                    Loading applications...
                  </td>
                </tr>
              ) : paginatedLoans.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
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
                      <td className="px-6 py-4">
                        <StatusBadge status={loan.status} />
                      </td>
                      <td className="px-6 py-4 text-slate-600">{formatDate(loan.updatedAt || loan.createdAt)}</td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => setSelectedLoan(loan)}
                          className="text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline"
                        >
                          View Details
                        </button>
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

function SanctionDetail({
  loan,
  onBack,
  onApprove,
  onReject,
}: {
  loan: Loan;
  onBack: () => void;
  onApprove: () => void;
  onReject: (reason: string) => void;
}) {
  const borrower = typeof loan.borrower === "string" ? null : loan.borrower;
  const name = borrower?.profile?.fullName || borrower?.name || "Unknown Borrower";
  const salarySlipUrl = borrower?.profile?.salarySlipUrl;

  const [showModal, setShowModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [isRejecting, setIsRejecting] = useState(false);
  const [isMediaLoading, setIsMediaLoading] = useState(true);

  const loanIdTrimmed = loan._id.substring(0, 6);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
        >
          <ChevronLeft size={16} />
          Back
        </button>
        <div className="text-sm font-mono text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md">
          loan/{loanIdTrimmed}
        </div>
      </div>

      {/* Card */}
      <div className="rounded-xl border border-border bg-white shadow-sm overflow-hidden">
        <div className="border-b border-border bg-slate-50 p-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">{name}</h2>
            <p className="text-sm text-slate-500 mt-1">{borrower?.email}</p>
          </div>
          <StatusBadge status={loan.status} />
        </div>

        <div className="p-6">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <Metric label="Principal Amount" value={formatCurrency(loan.principal)} />
            <Metric label="Tenure" value={loan.tenureDays ? `${loan.tenureDays} days` : "-"} />
            <Metric label="Interest Rate" value={loan.interestRate ? `${loan.interestRate}% p.a.` : "-"} />
            <Metric label="Total Repayment" value={formatCurrency(loan.totalRepayment)} />
            
            <Metric label="Monthly Salary" value={formatCurrency(borrower?.profile?.monthlySalary)} />
            <Metric label="PAN" value={borrower?.profile?.pan || "-"} />
            <Metric label="Employment" value={borrower?.profile?.employmentMode || "-"} />
            <Metric label="Date Applied" value={formatDate(loan.createdAt)} />
          </div>

          <div className="mt-8 border-t border-border pt-6">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500 mb-4">Documents</h3>
            {salarySlipUrl ? (
              <button
                onClick={() => {
                  setIsMediaLoading(true);
                  setShowModal(true);
                }}
                className="flex items-center gap-2 rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <Eye size={16} />
                View Salary Slip
              </button>
            ) : (
              <p className="text-sm text-slate-500">No documents uploaded.</p>
            )}
          </div>

          {loan.status === "APPLIED" && (
            <div className="mt-8 border-t border-border pt-6">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500 mb-4">Sanction Action</h3>
              
              {!isRejecting ? (
                <div className="flex items-center gap-3">
                  <Button onClick={onApprove}>
                    <Check size={16} />
                    Approve Application
                  </Button>
                  <Button variant="danger" onClick={() => setIsRejecting(true)}>
                    <X size={16} />
                    Reject
                  </Button>
                </div>
              ) : (
                <div className="max-w-xl rounded-md border border-red-200 bg-red-50 p-4">
                  <TextareaField
                    label="Rejection Reason"
                    placeholder="Please provide a detailed reason for rejection..."
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                  />
                  <div className="mt-4 flex items-center gap-3">
                    <Button
                      variant="danger"
                      disabled={rejectReason.trim().length < 5}
                      onClick={() => onReject(rejectReason)}
                    >
                      Confirm Rejection
                    </Button>
                    <button
                      onClick={() => setIsRejecting(false)}
                      className="text-sm font-medium text-slate-600 hover:text-slate-900"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Salary Slip Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="flex flex-col w-full max-w-4xl max-h-[90vh] bg-white rounded-xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between border-b border-border p-4 bg-slate-50">
              <h3 className="text-lg font-semibold text-slate-900">Salary Slip - {name}</h3>
              <button
                onClick={() => setShowModal(false)}
                className="rounded-md p-1 hover:bg-slate-200 transition-colors"
              >
                <X size={20} className="text-slate-500" />
              </button>
            </div>
            <div className="flex-1 overflow-auto bg-slate-100 p-4 relative min-h-[300px]">
              {isMediaLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-slate-100 z-10">
                  <div className="flex flex-col items-center gap-3 text-slate-500">
                    <svg className="animate-spin h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span className="text-sm font-medium">Loading document...</span>
                  </div>
                </div>
              )}
              {salarySlipUrl?.toLowerCase().endsWith(".pdf") ? (
                <div className="flex flex-col items-center gap-4">
                  <img 
                    src={salarySlipUrl.replace(/\.pdf$/i, '.png')} 
                    alt="Salary Slip Preview" 
                    onLoad={() => setIsMediaLoading(false)}
                    onError={() => setIsMediaLoading(false)}
                    className="mx-auto max-w-full rounded border border-slate-300 shadow-sm relative z-0" 
                  />
                  <a 
                    href={salarySlipUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-sm font-medium text-brand hover:underline"
                  >
                    Open original PDF document
                  </a>
                </div>
              ) : (
                <img 
                  src={salarySlipUrl} 
                  alt="Salary Slip" 
                  onLoad={() => setIsMediaLoading(false)}
                  onError={() => setIsMediaLoading(false)}
                  className="mx-auto max-w-full rounded border border-slate-300 shadow-sm relative z-0" 
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs uppercase text-slate-500">{label}</p>
      <p className="mt-1 font-medium text-slate-900">{value}</p>
    </div>
  );
}
