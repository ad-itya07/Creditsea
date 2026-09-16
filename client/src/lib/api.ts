import type { ApiResponse, Loan, Payment, User } from "@/types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:5000/api";
const TOKEN_KEY = "creditsea_token";

export function getStoredToken() {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function storeToken(token: string) {
  window.localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  window.localStorage.removeItem(TOKEN_KEY);
}

export class ApiError extends Error {
  rejectionReasons?: string[];

  constructor(message: string, rejectionReasons?: string[]) {
    super(message);
    this.name = "ApiError";
    this.rejectionReasons = rejectionReasons;
  }
}

async function request<T>(path: string, options: RequestInit = {}) {
  const token = getStoredToken();
  const headers = new Headers(options.headers);

  if (!(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });
  const payload = (await response.json().catch(() => null)) as ApiResponse<T> | null;

  if (!response.ok) {
    throw new ApiError(payload?.message ?? "Request failed", payload?.rejectionReasons);
  }

  return payload as ApiResponse<T>;
}

export const api = {
  login: (body: { email: string; password: string }) =>
    request<{ token: string; user: User }>("/auth/login", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  register: (body: { name: string; email: string; password: string }) =>
    request<{ token: string; user: User }>("/auth/register", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  me: () => request<User>("/auth/me"),
  submitDetails: (body: {
    fullName: string;
    pan: string;
    dateOfBirth: string;
    monthlySalary: number;
    employmentMode: string;
  }) =>
    request<{ status: string }>("/borrower/details", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  uploadSalarySlip: (file: File) => {
    const formData = new FormData();
    formData.append("salarySlip", file);
    return request<{ salarySlipUrl: string }>("/borrower/upload-salary-slip", {
      method: "POST",
      body: formData,
    });
  },
  applyForLoan: (body: { principal: number; tenureDays: number }) =>
    request<Loan>("/borrower/apply", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  myLoan: () => request<Loan>("/borrower/my-loan"),
  sales: () => request<User[]>("/dashboard/sales"),
  sanction: () => request<Loan[]>("/dashboard/sanction"),
  approveLoan: (loanId: string) =>
    request<{ loanId: string; status: string }>(`/dashboard/sanction/${loanId}/approve`, {
      method: "PATCH",
    }),
  rejectLoan: (loanId: string, rejectionReason: string) =>
    request<{ loanId: string; status: string; rejectionReason: string }>(
      `/dashboard/sanction/${loanId}/reject`,
      {
        method: "PATCH",
        body: JSON.stringify({ rejectionReason }),
      },
    ),
  disbursement: () => request<Loan[]>("/dashboard/disbursement"),
  disburseLoan: (loanId: string) =>
    request<{ loanId: string; status: string }>(`/dashboard/disbursement/${loanId}/disburse`, {
      method: "PATCH",
    }),
  collection: () => request<Loan[]>("/dashboard/collection"),
  recordPayment: (
    loanId: string,
    body: { utrNumber: string; amount: number; paymentDate?: string },
  ) =>
    request<{ payment: Payment; loan: Loan }>(`/dashboard/collection/${loanId}/payment`, {
      method: "POST",
      body: JSON.stringify(body),
    }),
  loanPayments: (loanId: string) => request<Payment[]>(`/dashboard/collection/${loanId}/payments`),
};
