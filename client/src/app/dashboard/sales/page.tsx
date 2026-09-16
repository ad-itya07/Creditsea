"use client";

import { useEffect, useState } from "react";
import { formatDate } from "@/lib/format";
import { api } from "@/lib/api";
import { StatusBadge } from "@/components/StatusBadge";
import { Notice } from "@/components/Notice";
import type { User } from "@/types";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";

const USERS_PER_PAGE = 10;

export default function SalesPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("NOT_APPLIED");
  const [page, setPage] = useState(1);

  const load = async () => {
    setIsLoading(true);
    try {
      const response = await api.sales();
      setUsers(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load users list");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  // Filtering
  const filteredUsers = users.filter((user) => {
    const borrowerName = (user.profile?.fullName || user.name || "").toLowerCase();
    const matchesSearch = borrowerName.includes(search.toLowerCase());
    const matchesStatus = statusFilter === "ALL" || user.loanStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Pagination
  const totalPages = Math.ceil(filteredUsers.length / USERS_PER_PAGE) || 1;
  const paginatedUsers = filteredUsers.slice((page - 1) * USERS_PER_PAGE, page * USERS_PER_PAGE);

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
            <option value="ALL">All Users</option>
            <option value="NOT_APPLIED">Not Applied</option>
            <option value="LEAD">Lead (Applied)</option>
            <option value="BRE_REJECTED">BRE Rejected</option>
            <option value="APPLIED">Awaiting Sanction</option>
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
                <th className="px-6 py-4 font-medium">Borrower Name</th>
                <th className="px-6 py-4 font-medium">Email</th>
                <th className="px-6 py-4 font-medium">Joined Date</th>
                <th className="px-6 py-4 font-medium">Loan Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-slate-500">
                    Loading users...
                  </td>
                </tr>
              ) : paginatedUsers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-slate-500">
                    No users found matching the criteria.
                  </td>
                </tr>
              ) : (
                paginatedUsers.map((user) => {
                  const name = user.profile?.fullName || user.name || "Unknown Borrower";
                  const status = user.loanStatus || "NOT_APPLIED";

                  return (
                    <tr key={user._id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 font-medium text-slate-900">{name}</td>
                      <td className="px-6 py-4 text-slate-600">{user.email}</td>
                      <td className="px-6 py-4 text-slate-600">{formatDate(user.createdAt)}</td>
                      <td className="px-6 py-4">
                        <StatusBadge status={status} />
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
              Showing <span className="font-medium text-slate-900">{(page - 1) * USERS_PER_PAGE + 1}</span> to{" "}
              <span className="font-medium text-slate-900">{Math.min(page * USERS_PER_PAGE, filteredUsers.length)}</span> of{" "}
              <span className="font-medium text-slate-900">{filteredUsers.length}</span> results
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
