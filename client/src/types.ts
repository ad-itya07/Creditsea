export type Role =
  | "ADMIN"
  | "SALES"
  | "SANCTION"
  | "DISBURSEMENT"
  | "COLLECTION"
  | "BORROWER";

export type LoanStatus =
  | "NO_LOAN"
  | "LEAD"
  | "BRE_REJECTED"
  | "APPLIED"
  | "SANCTIONED"
  | "REJECTED"
  | "DISBURSED"
  | "CLOSED";

export type EmploymentMode = "Salaried" | "Self-Employed" | "Unemployed";

export type UserProfile = {
  fullName?: string;
  pan?: string;
  dateOfBirth?: string;
  monthlySalary?: number;
  employmentMode?: EmploymentMode;
  salarySlipUrl?: string;
};

export type User = {
  id: string;
  _id?: string;
  name: string;
  email: string;
  role: Role;
  profile?: UserProfile;
  createdAt?: string;
  loanStatus?: LoanStatus;
};

export type Loan = {
  _id: string;
  borrower: User | string;
  status: LoanStatus;
  principal?: number;
  tenureDays?: number;
  interestRate?: number;
  interestAmount?: number;
  totalRepayment?: number;
  outstandingAmount?: number;
  totalPaid?: number;
  rejectionReason?: string;
  sanctionedAt?: string;
  disbursedAt?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type Payment = {
  _id: string;
  loan: string;
  borrower: string;
  utrNumber: string;
  amount: number;
  paymentDate: string;
  recordedBy?: { name: string } | string;
  createdAt?: string;
};

export type ApiResponse<T> = {
  success: boolean;
  message?: string;
  data: T;
  count?: number;
  rejectionReasons?: string[];
};
