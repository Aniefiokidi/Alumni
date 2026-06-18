import mongoose, { Document, Schema } from 'mongoose';

/**
 * Donation interface extending MongoDB Document
 */
export interface IDonation extends Document {
  alumniId: mongoose.Types.ObjectId;
  amount: number;
  currency: string;
  paymentMethod: string;
  paymentStatus: 'pending' | 'completed' | 'failed' | 'refunded';
  transactionId?: string;
  purpose?: string;
  message?: string;
  isAnonymous: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Donation Schema for MongoDB
 */
const DonationSchema: Schema = new Schema(
  {
    alumniId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Alumni ID is required']
    },
    amount: {
      type: Number,
      required: [true, 'Donation amount is required'],
      min: [1, 'Donation amount must be at least 1']
    },
    currency: {
      type: String,
      default: 'NGN',
      uppercase: true
    },
    paymentMethod: {
      type: String,
      required: [true, 'Payment method is required'],
      enum: ['credit_card', 'debit_card', 'bank_transfer', 'paypal', 'other']
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'refunded'],
      default: 'pending'
    },
    transactionId: {
      type: String,
      trim: true
    },
    purpose: {
      type: String,
      trim: true,
      default: 'General Fund'
    },
    message: {
      type: String,
      trim: true,
      maxlength: [500, 'Message cannot exceed 500 characters']
    },
    isAnonymous: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

export default mongoose.model<IDonation>('Donation', DonationSchema);
