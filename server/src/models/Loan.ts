import mongoose, { Document, Schema, Types } from 'mongoose';
import { LoanStatus } from '../constants/loanStatus';

export interface ILoan extends Document {
  borrower: Types.ObjectId;

  principal: number;
  tenureDays: number;
  interestRate: number;   // fixed: 12 (given) 
  interestAmount: number;
  totalRepayment: number;

  // Lifecycle
  status: LoanStatus;

  // Sanction stage
  rejectionReason?: string;
  sanctionedBy?: Types.ObjectId;
  sanctionedAt?: Date;

  // Disbursement stage
  disbursedBy?: Types.ObjectId;
  disbursedAt?: Date;

  // Payment tracking (cached, updated per payment)
  totalPaid: number;
  outstandingAmount: number;

  createdAt: Date;
  updatedAt: Date;
}

const loanSchema = new Schema<ILoan>(
  {
    borrower: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    // Financial
    principal: { type: Number, min: 50000, max: 500000 },
    tenureDays: { type: Number, min: 30, max: 365 },
    interestRate: { type: Number, default: 12 },
    interestAmount: { type: Number },
    totalRepayment: { type: Number },

    // Status
    status: {
      type: String,
      enum: Object.values(LoanStatus),
      required: true,
      default: LoanStatus.LEAD,
    },

    // Sanction
    rejectionReason: { type: String },
    sanctionedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    sanctionedAt: { type: Date },

    // Disbursement
    disbursedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    disbursedAt: { type: Date },

    // Payment tracking
    totalPaid: { type: Number, default: 0 },
    outstandingAmount: { type: Number, default: 0 },
  },
  {
    timestamps: true,
  }
);

// Index for common dashboard queries
loanSchema.index({ status: 1 });
loanSchema.index({ borrower: 1 });

const Loan = mongoose.model<ILoan>('Loan', loanSchema);
export default Loan;
