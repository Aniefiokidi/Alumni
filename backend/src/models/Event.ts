import mongoose, { Document, Schema } from 'mongoose';

/**
 * Event interface extending MongoDB Document
 */
export interface IEvent extends Document {
  title: string;
  description: string;
  bannerImage?: string;
  imageSource?: 'ai' | 'local' | 'fallback';
  imagePrompt?: string;
  date: Date;
  location: string;
  organizer: string;
  attendees: mongoose.Types.ObjectId[];
  maxAttendees: number;
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Event Schema for MongoDB
 */
const EventSchema: Schema = new Schema(
  {
    title: {
      type: String,
      required: [true, 'Event title is required'],
      trim: true
    },
    description: {
      type: String,
      required: [true, 'Event description is required'],
      trim: true
    },
    bannerImage: {
      type: String,
      trim: true
    },
    imageSource: {
      type: String,
      enum: ['ai', 'local', 'fallback']
    },
    imagePrompt: {
      type: String,
      trim: true
    },
    date: {
      type: Date,
      required: [true, 'Event date is required']
    },
    location: {
      type: String,
      required: [true, 'Event location is required'],
      trim: true
    },
    organizer: {
      type: String,
      required: [true, 'Organizer name is required'],
      trim: true
    },
    attendees: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User'
      }
    ],
    maxAttendees: {
      type: Number,
      required: [true, 'Maximum attendees is required'],
      min: [1, 'Maximum attendees must be at least 1']
    },
    status: {
      type: String,
      enum: ['upcoming', 'ongoing', 'completed', 'cancelled'],
      default: 'upcoming'
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }
  },
  {
    timestamps: true
  }
);

export default mongoose.model<IEvent>('Event', EventSchema);
