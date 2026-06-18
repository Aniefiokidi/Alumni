import mongoose, { Document, Schema, Types } from 'mongoose';

export type EventRsvpStatus = 'going' | 'cancelled';

export interface IEventRsvp extends Document {
  event: Types.ObjectId;
  user: Types.ObjectId;
  status: EventRsvpStatus;
  checkedInAt?: Date;
  checkedInBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const EventRsvpSchema: Schema = new Schema(
  {
    event: {
      type: Schema.Types.ObjectId,
      ref: 'Event',
      required: true,
      index: true
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    status: {
      type: String,
      enum: ['going', 'cancelled'],
      default: 'going'
    },
    checkedInAt: {
      type: Date
    },
    checkedInBy: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  {
    timestamps: true
  }
);

EventRsvpSchema.index({ event: 1, user: 1 }, { unique: true });
EventRsvpSchema.index({ event: 1, status: 1, createdAt: -1 });

export default mongoose.model<IEventRsvp>('EventRsvp', EventRsvpSchema);
