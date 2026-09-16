import { Request, Response } from 'express';
import { z } from 'zod';
import User from '../models/User';
import Loan from '../models/Loan';
import Payment from '../models/Payment';
import { Role } from '../constants/roles';
import { LoanStatus } from '../constants/loanStatus';
import {
  ValidationError,
  AuthenticationError,
  NotFoundError,
  ConflictError,
} from '../errors';
import asyncHandler from '../utils/asyncHandler';

// Zod Schemas 

const rejectSchema = z.object({
  rejectionReason: z.string().min(5, 'Rejection reason must be at least 5 characters').trim(),
});

const paymentSchema = z.object({
  utrNumber: z.string().min(1, 'UTR number is required').trim().toUpperCase(),
  amount: z.number({ invalid_type_error: 'Amount must be a number' }).positive('Amount must be greater than 0'),
  paymentDate: z.string().optional(),
});

// Helper: stages that mean "already in pipeline" 
const IN_PIPELINE_STATUSES = [
  LoanStatus.APPLIED,
  LoanStatus.SANCTIONED,
  LoanStatus.REJECTED,
  LoanStatus.DISBURSED,
  LoanStatus.CLOSED,
];

// Sales 

/**
 * GET /api/dashboard/sales
 * Borrowers who have not yet submitted a loan application (no loan, LEAD, or BRE_REJECTED)
 */
export const getSalesLeads = asyncHandler(async (_req: Request, res: Response) => {
  // Fetch all users with BORROWER role
  const leads = await User.find({ role: Role.BORROWER })
    .select('name email profile createdAt')
    .lean();

  const leadIds = leads.map((u) => u._id);

  // Fetch loans for all borrowers
  const loans = await Loan.find({ borrower: { $in: leadIds } })
    .select('borrower status')
    .lean();

  const loanByBorrower = new Map(loans.map((l) => [l.borrower.toString(), l.status]));

  const data = leads.map((user) => ({
    ...user,
    loanStatus: loanByBorrower.get(user._id.toString()) ?? 'NOT_APPLIED',
  }));

  res.status(200).json({ success: true, count: data.length, data });
});

// Sanction 

/**
 * GET /api/dashboard/sanction
 * Loans in APPLIED status awaiting sanction review
 */
export const getSanctionQueue = asyncHandler(async (_req: Request, res: Response) => {
  const loans = await Loan.find({ status: { $in: IN_PIPELINE_STATUSES } })
    .populate('borrower', 'name email profile')
    .sort({ updatedAt: -1 }) // most recently updated first
    .lean();

  res.status(200).json({ success: true, count: loans.length, data: loans });
});

/**
 * PATCH /api/dashboard/sanction/:loanId/approve
 * Approve a loan → SANCTIONED
 */
export const approveLoan = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new AuthenticationError();

  const loan = await Loan.findById(req.params.loanId);
  if (!loan) throw new NotFoundError('Loan not found');
  if (loan.status !== LoanStatus.APPLIED) {
    throw new ValidationError(`Cannot approve a loan in '${loan.status}' status`);
  }

  loan.status = LoanStatus.SANCTIONED;
  loan.sanctionedBy = req.user.id as unknown as typeof loan.sanctionedBy;
  loan.sanctionedAt = new Date();
  await loan.save();

  res.status(200).json({
    success: true,
    message: 'Loan approved and sanctioned',
    data: { loanId: loan._id, status: loan.status },
  });
});

/**
 * PATCH /api/dashboard/sanction/:loanId/reject
 * Reject a loan → REJECTED (requires reason)
 */
export const rejectLoan = asyncHandler(async (req: Request, res: Response) => {
  const parsed = rejectSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.errors[0].message);
  }

  const loan = await Loan.findById(req.params.loanId);
  if (!loan) throw new NotFoundError('Loan not found');
  if (loan.status !== LoanStatus.APPLIED) {
    throw new ValidationError(`Cannot reject a loan in '${loan.status}' status`);
  }

  loan.status = LoanStatus.REJECTED;
  loan.rejectionReason = parsed.data.rejectionReason;
  await loan.save();

  res.status(200).json({
    success: true,
    message: 'Loan rejected',
    data: { loanId: loan._id, status: loan.status, rejectionReason: loan.rejectionReason },
  });
});

// ── Disbursement ──────────────────────────────────────────────────────────────

/**
 * GET /api/dashboard/disbursement
 * Loans in SANCTIONED status ready for disbursement
 */
export const getDisbursementQueue = asyncHandler(async (_req: Request, res: Response) => {
  const loans = await Loan.find({ 
    status: { $in: [LoanStatus.SANCTIONED, LoanStatus.DISBURSED, LoanStatus.CLOSED] } 
  })
    .populate('borrower', 'name email profile')
    .populate('sanctionedBy', 'name')
    .sort({ updatedAt: -1 })
    .lean();

  res.status(200).json({ success: true, count: loans.length, data: loans });
});

/**
 * PATCH /api/dashboard/disbursement/:loanId/disburse
 * Mark a loan as disbursed
 */
export const disburseLoan = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new AuthenticationError();

  const loan = await Loan.findById(req.params.loanId);
  if (!loan) throw new NotFoundError('Loan not found');
  if (loan.status !== LoanStatus.SANCTIONED) {
    throw new ValidationError(`Cannot disburse a loan in '${loan.status}' status`);
  }

  loan.status = LoanStatus.DISBURSED;
  loan.disbursedBy = req.user.id as unknown as typeof loan.disbursedBy;
  loan.disbursedAt = new Date();
  await loan.save();

  res.status(200).json({
    success: true,
    message: 'Loan disbursed successfully',
    data: { loanId: loan._id, status: loan.status, disbursedAt: loan.disbursedAt },
  });
});

// ── Collection ────────────────────────────────────────────────────────────────

/**
 * GET /api/dashboard/collection
 * Loans in DISBURSED status with outstanding balance
 */
export const getCollectionQueue = asyncHandler(async (_req: Request, res: Response) => {
  const loans = await Loan.find({ 
    status: { $in: [LoanStatus.DISBURSED, LoanStatus.CLOSED] } 
  })
    .populate('borrower', 'name email profile')
    .sort({ updatedAt: -1 })
    .lean();

  res.status(200).json({ success: true, count: loans.length, data: loans });
});

/**
 * POST /api/dashboard/collection/:loanId/payment
 * Record a payment — validates UTR uniqueness, prevents overpayment, auto-closes on full repayment
 */
export const recordPayment = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new AuthenticationError();

  const parsed = paymentSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.errors[0].message);
  }

  const { utrNumber, amount, paymentDate } = parsed.data;

  const loan = await Loan.findById(req.params.loanId);
  if (!loan) throw new NotFoundError('Loan not found');
  if (loan.status !== LoanStatus.DISBURSED) {
    throw new ValidationError(`Cannot record payment for a loan in '${loan.status}' status`);
  }

  // Prevent overpayment
  if (amount > loan.outstandingAmount) {
    throw new ValidationError(
      `Payment amount (₹${amount.toLocaleString('en-IN')}) exceeds outstanding balance (₹${loan.outstandingAmount.toLocaleString('en-IN')})`
    );
  }

  // Create payment — UTR uniqueness enforced at DB level, catch duplicate key error
  let payment;
  try {
    payment = await Payment.create({
      loan: loan._id,
      borrower: loan.borrower,
      utrNumber,
      amount,
      paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
      recordedBy: req.user.id,
    });
  } catch (err: unknown) {
    const mongoErr = err as { code?: number };
    if (mongoErr.code === 11000) {
      throw new ConflictError(`UTR number '${utrNumber}' has already been used`);
    }
    throw err;
  }

  // Update cached totals on the loan
  loan.totalPaid = Math.round((loan.totalPaid + amount) * 100) / 100;
  loan.outstandingAmount = Math.round((loan.totalRepayment - loan.totalPaid) * 100) / 100;

  // Auto-close when fully repaid
  if (loan.outstandingAmount <= 0) {
    loan.status = LoanStatus.CLOSED;
    loan.outstandingAmount = 0;
  }

  await loan.save();

  res.status(201).json({
    success: true,
    message: loan.status === LoanStatus.CLOSED
      ? 'Payment recorded. Loan fully repaid and closed.'
      : 'Payment recorded successfully',
    data: {
      payment,
      loan: {
        loanId: loan._id,
        status: loan.status,
        totalPaid: loan.totalPaid,
        outstandingAmount: loan.outstandingAmount,
        totalRepayment: loan.totalRepayment,
      },
    },
  });
});

/**
 * GET /api/dashboard/collection/:loanId/payments
 * List all payments for a specific loan
 */
export const getLoanPayments = asyncHandler(async (req: Request, res: Response) => {
  const loan = await Loan.findById(req.params.loanId);
  if (!loan) throw new NotFoundError('Loan not found');

  const payments = await Payment.find({ loan: req.params.loanId })
    .populate('recordedBy', 'name')
    .sort({ paymentDate: -1 })
    .lean();

  res.status(200).json({ success: true, count: payments.length, data: payments });
});
