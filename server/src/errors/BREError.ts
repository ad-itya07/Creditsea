import { AppError } from './AppError';

export class BREError extends AppError {
  public readonly rejectionReasons: string[];

  constructor(rejectionReasons: string[]) {
    super('Loan application rejected by eligibility check', 422);
    this.rejectionReasons = rejectionReasons;
  }
}
