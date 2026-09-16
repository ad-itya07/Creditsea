import { Request, Response } from 'express';
import { z } from 'zod';
import User from '../models/User';
import Loan from '../models/Loan';
import { LoanStatus } from '../constants/loanStatus';
import { runBRE } from '../services/bre.service';
import { calculateLoan } from '../services/loan.service';
import { uploadToCloudinary } from '../utils/cloudinaryUpload';
import {
  ValidationError,
  AuthenticationError,
  NotFoundError,
  BREError,
} from '../errors';
import asyncHandler from '../utils/asyncHandler';

// Zod Schemas 

const detailsSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters').trim(),
  pan: z.string().min(1, 'PAN is required').toUpperCase(),
  dateOfBirth: z.string().refine((v) => !isNaN(Date.parse(v)), 'Invalid date of birth'),
  monthlySalary: z.number({ invalid_type_error: 'Monthly salary must be a number' }).positive(),
  employmentMode: z.enum(['Salaried', 'Self-Employed', 'Unemployed'], {
    errorMap: () => ({ message: 'Employment mode must be Salaried, Self-Employed, or Unemployed' }),
  }),
});

const applySchema = z.object({
  principal: z
    .number({ invalid_type_error: 'Principal must be a number' })
    .min(50000, 'Loan amount must be at least ₹50,000')
    .max(500000, 'Loan amount cannot exceed ₹5,00,000'),
  tenureDays: z
    .number({ invalid_type_error: 'Tenure must be a number' })
    .int('Tenure must be a whole number')
    .min(30, 'Tenure must be at least 30 days')
    .max(365, 'Tenure cannot exceed 365 days'),
});

// Statuses that block re-submission of personal details 
const LOCKED_STATUSES: LoanStatus[] = [
  LoanStatus.APPLIED,
  LoanStatus.SANCTIONED,
  LoanStatus.DISBURSED,
  LoanStatus.CLOSED,
];

// 

/**
 * POST /api/borrower/details
 * Submit personal details → run BRE → create/update Loan as LEAD or BRE_REJECTED
 */
export const submitDetails = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new AuthenticationError();

  const parsed = detailsSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.errors[0].message);
  }

  const { fullName, pan, dateOfBirth, monthlySalary, employmentMode } = parsed.data;
  const dob = new Date(dateOfBirth);

  // Check if borrower already has a loan in a locked status
  const existingLoan = await Loan.findOne({ borrower: req.user.id });
  if (existingLoan && LOCKED_STATUSES.includes(existingLoan.status)) {
    throw new ValidationError(
      `Cannot update details. Loan is already in '${existingLoan.status}' status`
    );
  }

  // Run BRE (server-side, always)
  const breResult = runBRE({ dateOfBirth: dob, monthlySalary, pan, employmentMode });

  const newStatus = breResult.passed ? LoanStatus.LEAD : LoanStatus.BRE_REJECTED;

  // Update user profile
  await User.findByIdAndUpdate(req.user.id, {
    $set: {
      'profile.fullName': fullName,
      'profile.pan': pan,
      'profile.dateOfBirth': dob,
      'profile.monthlySalary': monthlySalary,
      'profile.employmentMode': employmentMode,
    },
  });

  // Create or reset the loan record
  if (existingLoan) {
    existingLoan.status = newStatus;
    // Clear previous financial data if re-applying after BRE_REJECTED
    existingLoan.principal = undefined as unknown as number;
    existingLoan.tenureDays = undefined as unknown as number;
    await existingLoan.save();
  } else {
    await Loan.create({ borrower: req.user.id, status: newStatus });
  }

  if (!breResult.passed) {
    throw new BREError(breResult.rejectionReasons);
  }

  res.status(200).json({
    success: true,
    message: 'Eligibility check passed. Please upload your salary slip.',
    data: { status: LoanStatus.LEAD },
  });
});

/**
 * POST /api/borrower/upload-salary-slip
 * Upload salary slip to Cloudinary — only allowed in LEAD status
 */
export const uploadSalarySlip = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new AuthenticationError();

  const loan = await Loan.findOne({ borrower: req.user.id });
  if (!loan || loan.status !== LoanStatus.LEAD) {
    throw new ValidationError('You must pass the eligibility check before uploading a salary slip');
  }

  if (!req.file) {
    throw new ValidationError('No file uploaded');
  }

  const secureUrl = await uploadToCloudinary(req.file.buffer);

  await User.findByIdAndUpdate(req.user.id, {
    $set: { 'profile.salarySlipUrl': secureUrl },
  });

  res.status(200).json({
    success: true,
    message: 'Salary slip uploaded successfully',
    data: { salarySlipUrl: secureUrl },
  });
});

/**
 * POST /api/borrower/apply
 * Set loan amount + tenure → calculate SI → change status to APPLIED
 */
export const applyForLoan = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new AuthenticationError();

  const parsed = applySchema.safeParse(req.body);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.errors[0].message);
  }

  const { principal, tenureDays } = parsed.data;

  const loan = await Loan.findOne({ borrower: req.user.id });
  if (!loan || loan.status !== LoanStatus.LEAD) {
    throw new ValidationError('You must complete the eligibility check before applying');
  }

  // Ensure salary slip is uploaded
  const user = await User.findById(req.user.id);
  if (!user?.profile?.salarySlipUrl) {
    throw new ValidationError('Please upload your salary slip before applying');
  }

  const calc = calculateLoan(principal, tenureDays);

  loan.principal = calc.principal;
  loan.tenureDays = calc.tenureDays;
  loan.interestRate = calc.interestRate;
  loan.interestAmount = calc.interestAmount;
  loan.totalRepayment = calc.totalRepayment;
  loan.outstandingAmount = calc.totalRepayment;
  loan.status = LoanStatus.APPLIED;

  await loan.save();

  res.status(200).json({
    success: true,
    message: 'Loan application submitted successfully',
    data: {
      loanId: loan._id,
      status: loan.status,
      principal: loan.principal,
      tenureDays: loan.tenureDays,
      interestRate: loan.interestRate,
      interestAmount: loan.interestAmount,
      totalRepayment: loan.totalRepayment,
    },
  });
});

/**
 * GET /api/borrower/my-loan
 * Returns the borrower's current loan details
 */
export const getMyLoan = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new AuthenticationError();

  const loan = await Loan.findOne({ borrower: req.user.id }).lean();
  if (!loan) {
    throw new NotFoundError('No loan application found');
  }

  res.status(200).json({
    success: true,
    data: loan,
  });
});
