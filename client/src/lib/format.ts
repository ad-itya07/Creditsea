export function formatCurrency(value?: number) {
  if (typeof value !== "number") return "-";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatDate(value?: string) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export function calculateLoanPreview(principal: number, tenureDays: number) {
  const interestRate = 12;
  const interestAmount = Math.round(((principal * interestRate * tenureDays) / (365 * 100)) * 100) / 100;
  return {
    principal,
    tenureDays,
    interestRate,
    interestAmount,
    totalRepayment: Math.round((principal + interestAmount) * 100) / 100,
  };
}
