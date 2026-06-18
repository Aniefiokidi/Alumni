import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

/**
 * User interface extending MongoDB Document
 */
export interface IUser extends Document {
  name: string;
  slug: string;
  email: string;
  password: string;
  role: 'admin' | 'alumni';
  graduationYear: number;
  department: string;
  employmentStatus: 'employed' | 'unemployed' | 'self-employed' | 'student' | 'seeking-opportunities';
  jobTitle?: string;
  company?: string;
  companyWebsite?: string;
  companyDomain?: string;
  companyLogoUrl?: string;
  location?: string;
  phone?: string;
  profilePicture?: string;
  linkedIn?: string;
  bio?: string;
  openToMentorship: boolean;
  mentorshipTopics: string[];
  skills: string[];
  mentorshipAvailability: 'not-available' | 'weekdays-evenings' | 'weekends' | 'flexible';
  mentorshipCapacity: number;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

/**
 * User Schema for MongoDB
 */
const UserSchema: Schema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
      trim: true
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email']
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false
    },
    role: {
      type: String,
      enum: ['admin', 'alumni'],
      default: 'alumni'
    },
    graduationYear: {
      type: Number,
      required: [true, 'Graduation year is required'],
      min: [1900, 'Invalid graduation year'],
      max: [new Date().getFullYear() + 10, 'Invalid graduation year']
    },
    department: {
      type: String,
      required: [true, 'Department is required'],
      trim: true
    },
    employmentStatus: {
      type: String,
      enum: ['employed', 'unemployed', 'self-employed', 'student', 'seeking-opportunities'],
      default: 'unemployed'
    },
    jobTitle: {
      type: String,
      trim: true
    },
    company: {
      type: String,
      trim: true
    },
    companyWebsite: {
      type: String,
      trim: true
    },
    companyDomain: {
      type: String,
      trim: true
    },
    companyLogoUrl: {
      type: String,
      trim: true
    },
    location: {
      type: String,
      trim: true
    },
    phone: {
      type: String,
      trim: true
    },
    profilePicture: {
      type: String,
      default: ''
    },
    linkedIn: {
      type: String,
      trim: true
    },
    bio: {
      type: String,
      trim: true,
      maxlength: [500, 'Bio cannot exceed 500 characters']
    },
    openToMentorship: {
      type: Boolean,
      default: false
    },
    mentorshipTopics: {
      type: [String],
      default: []
    },
    skills: {
      type: [String],
      default: []
    },
    mentorshipAvailability: {
      type: String,
      enum: ['not-available', 'weekdays-evenings', 'weekends', 'flexible'],
      default: 'not-available'
    },
    mentorshipCapacity: {
      type: Number,
      min: [1, 'Mentorship capacity must be at least 1'],
      max: [10, 'Mentorship capacity cannot exceed 10'],
      default: 1
    }
  },
  {
    timestamps: true
  }
);

const slugify = (value: string): string => {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
};

UserSchema.pre('validate', async function (next) {
  const user = this as any;
  if (!user.isModified('name') && user.slug) {
    return next();
  }

  const base = slugify(user.name || 'alumni') || 'alumni';
  let candidate = base;
  let counter = 1;

  const UserModel = mongoose.model('User');
  while (true) {
    const existing = await UserModel.findOne({ slug: candidate, _id: { $ne: user._id } });
    if (!existing) {
      user.slug = candidate;
      break;
    }
    counter += 1;
    candidate = `${base}-${counter}`;
  }

  next();
});

/**
 * Hash password before saving
 */
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(10);
    const password = this.get('password') as string;
    this.password = await bcrypt.hash(password, salt);
    next();
  } catch (error: any) {
    next(error);
  }
});

/**
 * Compare password method
 */
UserSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  return await bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.model<IUser>('User', UserSchema);
