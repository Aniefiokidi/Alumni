import mongoose, { Document, Schema } from 'mongoose';

/**
 * Message interface extending MongoDB Document
 */
export interface IMessage extends Document {
  sender: mongoose.Types.ObjectId;
  receiver: mongoose.Types.ObjectId;
  subject: string;
  message: string;
  isRead: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Message Schema for MongoDB
 */
const MessageSchema: Schema = new Schema(
  {
    sender: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Sender is required']
    },
    receiver: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Receiver is required']
    },
    subject: {
      type: String,
      required: [true, 'Subject is required'],
      trim: true
    },
    message: {
      type: String,
      required: [true, 'Message content is required'],
      trim: true
    },
    isRead: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

export default mongoose.model<IMessage>('Message', MessageSchema);
