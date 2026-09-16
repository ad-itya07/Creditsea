import type { LoanStatus } from "@/types";

const tone: Record<LoanStatus, string> = {
  NO_LOAN: "bg-gray-100 text-gray-700",
  LEAD: "bg-blue-100 text-blue-700",
  BRE_REJECTED: "bg-red-100 text-red-700",
  APPLIED: "bg-amber-100 text-amber-800",
  SANCTIONED: "bg-indigo-100 text-indigo-700",
  REJECTED: "bg-red-100 text-red-700",
  DISBURSED: "bg-purple-100 text-purple-700",
  CLOSED: "bg-green-100 text-green-700",
};

export function StatusBadge({ status }: { status?: LoanStatus | string }) {
  const key = (status ?? "NO_LOAN") as LoanStatus;
  return (
    <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${tone[key] ?? tone.NO_LOAN}`}>
      {(status ?? "NO_LOAN").replaceAll("_", " ")}
    </span>
  );
}
