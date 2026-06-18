import mongoose, { Document, Schema } from 'mongoose';

export type NotificationType =
  | 'message:new'
  | 'mentorship:request'
  | 'mentorship:status'
  | 'mentorship:session'
  | 'event:rsvp';

export interface INotification extends Document {
  user: mongoose.Types.ObjectId;
  type: NotificationType;
  title: string;
  body: string;
  metadata?: Record<string, unknown>;
  isRead: boolean;
  readAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema: Schema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    type: {
      type: String,
      enum: ['message:new', 'mentorship:request', 'mentorship:status', 'mentorship:session', 'event:rsvp'],
      required: true
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: [120, 'Notification title cannot exceed 120 characters']
    },
    body: {
      type: String,
      required: true,
      trim: true,
      maxlength: [500, 'Notification body cannot exceed 500 characters']
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: undefined
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true
    },
    readAt: {
      type: Date
    }
  },
  {
    timestamps: true
  }
);

NotificationSchema.index({ user: 1, createdAt: -1 });
NotificationSchema.index({ user: 1, isRead: 1, createdAt: -1 });

export default mongoose.model<INotification>('Notification', NotificationSchema);
