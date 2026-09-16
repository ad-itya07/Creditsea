import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IPayment extends Document {
  loan: Types.ObjectId;
  borrower: Types.ObjectId;
  utrNumber: string;
  amount: number;
  paymentDate: Date;
  recordedBy: Types.ObjectId;  // COLLECTION executive
  createdAt: Date;
}

const paymentSchema = new Schema<IPayment>(
  {
    loan: {
      type: Schema.Types.ObjectId,
      ref: 'Loan',
      required: true,
    },
    borrower: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    utrNumber: {
      type: String,
      required: [true, 'UTR number is required'],
      unique: true,   // no duplicate UTRs across all payments
      trim: true,
      uppercase: true,
    },
    amount: {
      type: Number,
      required: [true, 'Payment amount is required'],
      min: [0.01, 'Payment amount must be greater than 0'],
    },
    paymentDate: {
      type: Date,
      required: [true, 'Payment date is required'],
      default: Date.now,
    },
    recordedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for looking up payments per loan
paymentSchema.index({ loan: 1, createdAt: -1 });

const Payment = mongoose.model<IPayment>('Payment', paymentSchema);
export default Payment;
