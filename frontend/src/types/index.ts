// User types
export interface User {
  _id: string;
  slug?: string;
  name: string;
  email: string;
  role: 'admin' | 'alumni';
  graduationYear?: number;
  department?: string;
  employmentStatus?: 'employed' | 'unemployed' | 'self-employed' | 'student' | 'seeking-opportunities';
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
  openToMentorship?: boolean;
  mentorshipTopics?: string[];
  skills?: string[];
  mentorshipAvailability?: 'not-available' | 'weekdays-evenings' | 'weekends' | 'flexible';
  mentorshipCapacity?: number;
  createdAt: string;
  updatedAt: string;
}

export interface AlumniActivityStats {
  attendedEvents: number;
  sentMessages: number;
  receivedMessages: number;
}

export interface AlumniTimelineItem {
  type: string;
  label: string;
  date: string;
}

export interface AlumniProfileData {
  alumni: User;
  activity: {
    stats: AlumniActivityStats;
    timeline: AlumniTimelineItem[];
  };
}

export interface CompanySuggestion {
  name: string;
  domain?: string;
  website?: string;
  logoUrl?: string;
}

// Auth types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  graduationYear: number;
  department: string;
}

export interface AuthResponse {
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: 'admin' | 'alumni';
  };
}

// Event types
export interface Event {
  _id: string;
  title: string;
  description: string;
  bannerImage?: string;
  imageSource?: 'ai' | 'local' | 'fallback';
  imagePrompt?: string;
  date: string;
  location: string;
  organizer: string;
  attendees: string[] | User[];
  maxAttendees: number;
  attendeeCount?: number;
  checkedInCount?: number;
  availableSpots?: number;
  isRegistered?: boolean;
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
  createdBy: string | User;
  createdAt: string;
  updatedAt: string;
}

export interface EventRsvp {
  _id: string;
  event: Event;
  user: string | User;
  status: 'going' | 'cancelled';
  checkedInAt?: string;
  checkedInBy?: string | User;
  createdAt: string;
  updatedAt: string;
}

export interface CreateEventData {
  title: string;
  description: string;
  date: string;
  location: string;
  organizer: string;
  maxAttendees: number;
}

// Donation types
export interface Donation {
  _id: string;
  alumniId: string | User;
  amount: number;
  currency: string;
  paymentMethod: string;
  paymentStatus: 'pending' | 'completed' | 'failed' | 'refunded';
  transactionId?: string;
  purpose?: string;
  message?: string;
  isAnonymous: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDonationData {
  amount: number;
  paymentMethod: string;
  purpose?: string;
  message?: string;
  isAnonymous?: boolean;
}

// Announcement types
export interface Announcement {
  _id: string;
  title: string;
  content: string;
  author: string | User;
  category: 'general' | 'event' | 'achievement' | 'opportunity' | 'urgent';
  isPinned: boolean;
  views: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAnnouncementData {
  title: string;
  content: string;
  category?: string;
  isPinned?: boolean;
}

// Message types
export interface Message {
  _id: string;
  sender: string | User;
  receiver: string | User;
  subject: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateMessageData {
  receiver: string;
  subject: string;
  message: string;
}

// Mentorship types
export type MentorshipRequestStatus = 'pending' | 'accepted' | 'rejected' | 'cancelled';
export type MentorshipSessionStatus = 'scheduled' | 'completed' | 'cancelled';

export interface MentorMatch extends User {
  compatibilityScore: number;
  alreadyRequested: boolean;
  acceptedCount?: number;
  availableSlots?: number;
  isAtCapacity?: boolean;
}

export interface MentorshipRequest {
  _id: string;
  mentor: string | User;
  mentee: string | User;
  goals: string;
  message?: string;
  status: MentorshipRequestStatus;
  respondedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MentorshipSession {
  _id: string;
  mentorshipRequest: string | MentorshipRequest;
  mentor: string | User;
  mentee: string | User;
  scheduledFor: string;
  durationMinutes: number;
  agenda: string;
  meetingLink?: string;
  notes?: string;
  status: MentorshipSessionStatus;
  scheduledBy: string | User;
  completedAt?: string;
  cancelledAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateMentorshipRequestData {
  mentorId: string;
  goals: string;
  message?: string;
}

export interface CreateMentorshipSessionData {
  requestId: string;
  scheduledFor: string;
  durationMinutes: number;
  agenda: string;
  meetingLink?: string;
}

// Notification types
export type NotificationType = 'message:new' | 'mentorship:request' | 'mentorship:status' | 'mentorship:session' | 'event:rsvp';

export interface Notification {
  _id: string;
  user: string | User;
  type: NotificationType;
  title: string;
  body: string;
  metadata?: Record<string, unknown>;
  isRead: boolean;
  readAt?: string;
  createdAt: string;
  updatedAt: string;
}

// Dashboard stats types
export interface DashboardStats {
  totalAlumni: number;
  totalDonations: number;
  donationCount: number;
  upcomingEvents: number;
  totalEvents: number;
  pendingMentorshipRequests: number;
  activeMentorshipConnections: number;
  scheduledSessions: number;
  totalRsvps: number;
  checkedInAttendees: number;
  unreadNotifications: number;
  recentRegistrations: User[];
  recentDonations: Donation[];
  alumniByYear: { _id: number; count: number }[];
  recentMentorshipRequests: MentorshipRequest[];
  recentNotifications: Notification[];
  eventParticipation: {
    eventId: string;
    title: string;
    date: string;
    attendeeCount: number;
    checkedInCount: number;
  }[];
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

// Pagination types
export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    pages: number;
  };
}
