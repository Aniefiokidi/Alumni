import mongoose, { Document, Schema } from 'mongoose';

/**
 * Announcement interface extending MongoDB Document
 */
export interface IAnnouncement extends Document {
  title: string;
  content: string;
  author: mongoose.Types.ObjectId;
  category: string;
  isPinned: boolean;
  views: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Announcement Schema for MongoDB
 */
const AnnouncementSchema: Schema = new Schema(
  {
    title: {
      type: String,
      required: [true, 'Announcement title is required'],
      trim: true
    },
    content: {
      type: String,
      required: [true, 'Announcement content is required'],
      trim: true
    },
    author: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    category: {
      type: String,
      enum: ['general', 'event', 'achievement', 'opportunity', 'urgent'],
      default: 'general'
    },
    isPinned: {
      type: Boolean,
      default: false
    },
    views: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true
  }
);

export default mongoose.model<IAnnouncement>('Announcement', AnnouncementSchema);
