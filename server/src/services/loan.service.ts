export interface LoanCalculation {
  principal: number;
  tenureDays: number;
  interestRate: number;
  interestAmount: number;
  totalRepayment: number;
}

const INTEREST_RATE = 12; // Fixed 12% per annum per assignment

/**
 * Simple Interest formula from assignment:
 *   SI = (P × R × T) / (365 × 100)
 *   Total Repayment = P + SI
 */
export const calculateLoan = (principal: number, tenureDays: number): LoanCalculation => {
  const interestAmount = (principal * INTEREST_RATE * tenureDays) / (365 * 100);
  const totalRepayment = principal + interestAmount;

  return {
    principal,
    tenureDays,
    interestRate: INTEREST_RATE,
    interestAmount: Math.round(interestAmount * 100) / 100,
    totalRepayment: Math.round(totalRepayment * 100) / 100,
  };
};
