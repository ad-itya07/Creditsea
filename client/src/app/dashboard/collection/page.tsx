"use client";

import { useEffect, useState, FormEvent } from "react";
import { formatCurrency, formatDate } from "@/lib/format";
import { api } from "@/lib/api";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/Button";
import { Notice } from "@/components/Notice";
import { Field } from "@/components/Field";
import type { Loan, Payment } from "@/types";
import { ChevronLeft, ChevronRight, Eye, IndianRupee, Search, X, ListPlus } from "lucide-react";

const LOANS_PER_PAGE = 10;

export default function CollectionPage() {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("DISBURSED");
  const [page, setPage] = useState(1);

  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null);

  const load = async () => {
    setIsLoading(true);
    try {
      const response = await api.collection();
      setLoans(response.data);
      // Update selected loan if it's currently open
      if (selectedLoan) {
        const updated = response.data.find((l) => l._id === selectedLoan._id);
        if (updated) setSelectedLoan(updated);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load collection queue");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  if (selectedLoan) {
    return <CollectionDetail loan={selectedLoan} onBack={() => setSelectedLoan(null)} onRefresh={load} />;
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
            <option value="ALL">All Loans</option>
            <option value="DISBURSED">Active (Disbursed)</option>
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
                <th className="px-6 py-4 font-medium">Outstanding</th>
                <th className="px-6 py-4 font-medium">Status</th>
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
                      <td className="px-6 py-4 text-slate-900 font-medium">{formatCurrency(loan.outstandingAmount)}</td>
                      <td className="px-6 py-4">
                        <StatusBadge status={loan.status} />
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button
                          onClick={() => setSelectedLoan(loan)}
                          className="inline-flex py-1.5 px-3 text-xs"
                        >
                          <ListPlus size={14} className="mr-1.5" />
                          Record
                        </Button>
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

// ── Detail View ─────────────────────────────────────────────────────────────

function CollectionDetail({ loan, onBack, onRefresh }: { loan: Loan; onBack: () => void; onRefresh: () => Promise<void> }) {
  const borrower = typeof loan.borrower === "string" ? null : loan.borrower;
  const name = borrower?.profile?.fullName || borrower?.name || "Unknown Borrower";
  const loanIdTrimmed = loan._id.substring(0, 6);

  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoadingPayments, setIsLoadingPayments] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);

  const loadPayments = async () => {
    setIsLoadingPayments(true);
    try {
      const response = await api.loanPayments(loan._id);
      setPayments(response.data);
    } catch (err) {
      // Ignored for now, handled gracefully in UI
    } finally {
      setIsLoadingPayments(false);
    }
  };

  useEffect(() => {
    loadPayments();
  }, [loan._id]);

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

      {message && <Notice type="success">{message}</Notice>}
      {error && <Notice type="error">{error}</Notice>}

      {/* Main Container */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Left Column: Form & Details */}
        <div className="rounded-xl border border-border bg-white shadow-sm overflow-hidden flex flex-col">
          <div className="border-b border-border bg-slate-50 p-6 flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">{name}</h2>
              <p className="text-sm text-slate-500 mt-1">{borrower?.email}</p>
            </div>
            <StatusBadge status={loan.status} />
          </div>

          <div className="p-6">
            <div className="grid gap-6 sm:grid-cols-2">
              <Metric label="Principal" value={formatCurrency(loan.principal)} />
              <Metric label="Total Repayment" value={formatCurrency(loan.totalRepayment)} />
              <Metric label="Total Paid" value={formatCurrency(loan.totalPaid)} />
              <Metric label="Outstanding" value={formatCurrency(loan.outstandingAmount)} highlighted={loan.outstandingAmount > 0} />
            </div>

            <div className="mt-8 border-t border-border pt-6">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500 mb-4">Record Payment</h3>
              {loan.status === "CLOSED" ? (
                <div className="rounded-md bg-green-50 p-4 text-sm text-green-800 border border-green-200 text-center">
                  This loan is fully repaid and closed.
                </div>
              ) : (
                <PaymentForm
                  maxAmount={loan.outstandingAmount ?? 0}
                  onSubmit={async (body) => {
                    setError("");
                    setMessage("");
                    try {
                      const response = await api.recordPayment(loan._id, body);
                      setMessage(response.message ?? "Payment recorded successfully");
                      await onRefresh();
                      await loadPayments();
                    } catch (err) {
                      setError(err instanceof Error ? err.message : "Payment failed");
                    }
                  }}
                />
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Transaction Logs */}
        <div className="rounded-xl border border-border bg-white shadow-sm overflow-hidden flex flex-col h-full min-h-[400px]">
          <div className="border-b border-border bg-slate-50 p-6">
            <h2 className="text-lg font-semibold text-slate-900">Transaction History</h2>
            <p className="text-sm text-slate-500 mt-1">Previous payments recorded for this loan.</p>
          </div>
          <div className="p-0 overflow-x-auto flex-1 bg-white">
            <table className="w-full text-left text-sm">
              <thead className="bg-white border-b border-border sticky top-0 shadow-sm z-10">
                <tr>
                  <th className="px-4 py-3 font-medium text-slate-500 text-xs uppercase">Sr No.</th>
                  <th className="px-4 py-3 font-medium text-slate-500 text-xs uppercase">UTR Number</th>
                  <th className="px-4 py-3 font-medium text-slate-500 text-xs uppercase">Amount</th>
                  <th className="px-4 py-3 font-medium text-slate-500 text-xs uppercase text-right">View</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {isLoadingPayments ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-slate-500">
                      Loading transactions...
                    </td>
                  </tr>
                ) : payments.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-slate-500">
                      No transactions recorded yet.
                    </td>
                  </tr>
                ) : (
                  payments.map((payment, index) => (
                    <tr key={payment._id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 text-slate-600 font-medium">#{payments.length - index}</td>
                      <td className="px-4 py-3 font-mono text-slate-900 truncate max-w-[120px]" title={payment.utrNumber}>
                        {payment.utrNumber.length > 8 ? `${payment.utrNumber.substring(0, 8)}...` : payment.utrNumber}
                      </td>
                      <td className="px-4 py-3 text-slate-900 font-medium">{formatCurrency(payment.amount)}</td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => setSelectedPayment(payment)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition-colors inline-flex items-center"
                          title="View Details"
                        >
                          <Eye size={16} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Transaction Detail Modal */}
      {selectedPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="flex flex-col w-full max-w-md bg-white rounded-xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between border-b border-border p-4 bg-slate-50">
              <h3 className="text-lg font-semibold text-slate-900">Transaction Details</h3>
              <button
                onClick={() => setSelectedPayment(null)}
                className="rounded-md p-1 hover:bg-slate-200 transition-colors"
              >
                <X size={20} className="text-slate-500" />
              </button>
            </div>
            <div className="p-6 space-y-5 bg-white">
              <ModalMetric label="UTR Number" value={selectedPayment.utrNumber} copyable />
              <ModalMetric label="Amount Paid" value={formatCurrency(selectedPayment.amount)} />
              <ModalMetric label="Date of Payment" value={formatDate(selectedPayment.paymentDate)} />
              <ModalMetric label="Recorded By" value={typeof selectedPayment.recordedBy === 'string' ? selectedPayment.recordedBy : selectedPayment.recordedBy?.name || "System"} />
              <ModalMetric label="Date Recorded" value={formatDate(selectedPayment.createdAt)} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Metric({ label, value, highlighted = false }: { label: string; value: string; highlighted?: boolean }) {
  return (
    <div>
      <p className="text-xs uppercase text-slate-500">{label}</p>
      <p className={`mt-1 font-medium ${highlighted ? "text-red-600 text-lg" : "text-slate-900"}`}>{value}</p>
    </div>
  );
}

function ModalMetric({ label, value, copyable = false }: { label: string; value: string; copyable?: boolean }) {
  return (
    <div>
      <p className="text-xs uppercase text-slate-500 mb-1">{label}</p>
      <div className="flex items-center gap-2 text-slate-900 font-medium">
        <span className={copyable ? "font-mono" : ""}>{value}</span>
      </div>
    </div>
  );
}

function PaymentForm({
  maxAmount,
  onSubmit,
}: {
  maxAmount: number;
  onSubmit: (body: { utrNumber: string; amount: number; paymentDate?: string }) => Promise<void>;
}) {
  const [utrNumber, setUtrNumber] = useState("");
  const [amount, setAmount] = useState(maxAmount ? String(maxAmount) : "");
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().slice(0, 10));
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    try {
      await onSubmit({ utrNumber, amount: Number(amount), paymentDate });
      setUtrNumber("");
      setAmount("");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className="space-y-4" onSubmit={submit}>
      <Field label="UTR number" value={utrNumber} onChange={(e) => setUtrNumber(e.target.value.toUpperCase())} required />
      <div className="grid grid-cols-2 gap-4">
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="block text-sm font-medium text-ink">Amount</span>
            <button 
              type="button" 
              onClick={() => setAmount(String(maxAmount))}
              className="text-xs font-medium text-brand hover:underline"
            >
              Pay in full
            </button>
          </div>
          <input
            className="h-10 w-full rounded-md border border-border bg-white px-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-blue-100"
            type="number" 
            step="0.01" 
            min={0.01} 
            max={maxAmount} 
            value={amount} 
            onChange={(e) => setAmount(e.target.value)} 
            required 
          />
        </div>
        <Field label="Payment date" type="date" value={paymentDate} onChange={(e) => setPaymentDate(e.target.value)} />
      </div>
      <div className="pt-2">
        <Button disabled={isSubmitting} className="w-full justify-center py-2.5">
          <IndianRupee size={16} className="mr-2" />
          {isSubmitting ? "Processing..." : "Confirm Payment"}
        </Button>
      </div>
    </form>
  );
}
