import mongoose, { Document, Schema, Types } from 'mongoose';

export type MentorshipStatus = 'pending' | 'accepted' | 'rejected' | 'cancelled';

export interface IMentorshipRequest extends Document {
  mentor: Types.ObjectId;
  mentee: Types.ObjectId;
  goals: string;
  message?: string;
  status: MentorshipStatus;
  respondedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const MentorshipRequestSchema: Schema = new Schema(
  {
    mentor: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    mentee: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    goals: {
      type: String,
      required: [true, 'Goals are required'],
      trim: true,
      minlength: [10, 'Goals should be at least 10 characters'],
      maxlength: [300, 'Goals cannot exceed 300 characters']
    },
    message: {
      type: String,
      trim: true,
      maxlength: [500, 'Message cannot exceed 500 characters']
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected', 'cancelled'],
      default: 'pending'
    },
    respondedAt: {
      type: Date
    }
  },
  {
    timestamps: true
  }
);

MentorshipRequestSchema.index({ mentor: 1, mentee: 1, status: 1 });
MentorshipRequestSchema.index({ mentor: 1, createdAt: -1 });
MentorshipRequestSchema.index({ mentee: 1, createdAt: -1 });

export default mongoose.model<IMentorshipRequest>('MentorshipRequest', MentorshipRequestSchema);
