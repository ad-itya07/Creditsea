export enum LoanStatus {
  LEAD = 'LEAD',               // BRE passed, not yet applied
  BRE_REJECTED = 'BRE_REJECTED', // BRE failed (can retry)
  APPLIED = 'APPLIED',         // Borrower submitted loan config
  SANCTIONED = 'SANCTIONED',   // Approved by SANCTION executive
  REJECTED = 'REJECTED',       // Rejected by SANCTION executive (terminal)
  DISBURSED = 'DISBURSED',     // Funds released by DISBURSEMENT executive
  CLOSED = 'CLOSED',           // Fully repaid (auto-closed by system)
}

// Which statuses are terminal (no further transitions allowed)
export const TERMINAL_STATUSES: LoanStatus[] = [
  LoanStatus.BRE_REJECTED,
  LoanStatus.REJECTED,
  LoanStatus.CLOSED,
];

// Valid status transitions: [from] → [allowed tos]
export const VALID_TRANSITIONS: Record<LoanStatus, LoanStatus[]> = {
  [LoanStatus.LEAD]: [LoanStatus.APPLIED],
  [LoanStatus.BRE_REJECTED]: [],
  [LoanStatus.APPLIED]: [LoanStatus.SANCTIONED, LoanStatus.REJECTED],
  [LoanStatus.SANCTIONED]: [LoanStatus.DISBURSED],
  [LoanStatus.REJECTED]: [],
  [LoanStatus.DISBURSED]: [LoanStatus.CLOSED],
  [LoanStatus.CLOSED]: [],
};
