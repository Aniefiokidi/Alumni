import mongoose, { Document, Schema, Types } from 'mongoose';

export type MentorshipSessionStatus = 'scheduled' | 'completed' | 'cancelled';

export interface IMentorshipSession extends Document {
  mentorshipRequest: Types.ObjectId;
  mentor: Types.ObjectId;
  mentee: Types.ObjectId;
  scheduledFor: Date;
  durationMinutes: number;
  agenda: string;
  meetingLink?: string;
  notes?: string;
  status: MentorshipSessionStatus;
  scheduledBy: Types.ObjectId;
  completedAt?: Date;
  cancelledAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const MentorshipSessionSchema: Schema = new Schema(
  {
    mentorshipRequest: {
      type: Schema.Types.ObjectId,
      ref: 'MentorshipRequest',
      required: true,
      index: true
    },
    mentor: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    mentee: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    scheduledFor: {
      type: Date,
      required: [true, 'Session date is required']
    },
    durationMinutes: {
      type: Number,
      required: [true, 'Session duration is required'],
      min: [15, 'Session duration must be at least 15 minutes'],
      max: [240, 'Session duration cannot exceed 240 minutes']
    },
    agenda: {
      type: String,
      required: [true, 'Session agenda is required'],
      trim: true,
      minlength: [10, 'Agenda should be at least 10 characters'],
      maxlength: [500, 'Agenda cannot exceed 500 characters']
    },
    meetingLink: {
      type: String,
      trim: true,
      maxlength: [300, 'Meeting link cannot exceed 300 characters']
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [1000, 'Session notes cannot exceed 1000 characters']
    },
    status: {
      type: String,
      enum: ['scheduled', 'completed', 'cancelled'],
      default: 'scheduled'
    },
    scheduledBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    completedAt: {
      type: Date
    },
    cancelledAt: {
      type: Date
    }
  },
  {
    timestamps: true
  }
);

MentorshipSessionSchema.index({ mentor: 1, scheduledFor: 1 });
MentorshipSessionSchema.index({ mentee: 1, scheduledFor: 1 });

export default mongoose.model<IMentorshipSession>('MentorshipSession', MentorshipSessionSchema);
