import api from './api';
import {
  LoginCredentials,
  RegisterData,
  AuthResponse,
  User,
  Event,
  EventRsvp,
  CreateEventData,
  Donation,
  CreateDonationData,
  Announcement,
  CreateAnnouncementData,
  Message,
  CreateMessageData,
  MentorMatch,
  MentorshipRequest,
  MentorshipSession,
  CreateMentorshipRequestData,
  CreateMentorshipSessionData,
  AlumniProfileData,
  CompanySuggestion,
  DashboardStats,
  Notification,
  ApiResponse
} from '../types';

/**
 * Authentication API
 */
export const authAPI = {
  register: async (data: RegisterData): Promise<ApiResponse<AuthResponse>> => {
    const response = await api.post('/auth/register', data);
    return response.data;
  },

  login: async (credentials: LoginCredentials): Promise<ApiResponse<AuthResponse>> => {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  },

  getMe: async (): Promise<ApiResponse<{ user: User }>> => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  updateProfile: async (data: Partial<User>): Promise<ApiResponse<{ user: User }>> => {
    const response = await api.put('/auth/profile', data);
    return response.data;
  }
};

/**
 * Alumni API
 */
export const alumniAPI = {
  getAll: async (params?: any): Promise<ApiResponse> => {
    const response = await api.get('/alumni', { params });
    return response.data;
  },

  getById: async (id: string): Promise<ApiResponse<AlumniProfileData>> => {
    const response = await api.get(`/alumni/${id}`);
    return response.data;
  },

  getBySlug: async (slug: string): Promise<ApiResponse<AlumniProfileData>> => {
    const response = await api.get(`/alumni/profile/${slug}`);
    return response.data;
  },

  getStats: async (): Promise<ApiResponse> => {
    const response = await api.get('/alumni/stats');
    return response.data;
  },

  searchCompanies: async (query: string): Promise<ApiResponse<{ suggestions: CompanySuggestion[] }>> => {
    const response = await api.get('/alumni/companies/search', { params: { query } });
    return response.data;
  }
};

/**
 * Events API
 */
export const eventsAPI = {
  getAll: async (params?: any): Promise<ApiResponse<{ events: Event[] }>> => {
    const response = await api.get('/events', { params });
    return response.data;
  },

  getMyRsvps: async (): Promise<ApiResponse<{ rsvps: EventRsvp[] }>> => {
    const response = await api.get('/events/my-rsvps');
    return response.data;
  },

  getById: async (id: string): Promise<ApiResponse<{ event: Event }>> => {
    const response = await api.get(`/events/${id}`);
    return response.data;
  },

  getAttendance: async (id: string): Promise<ApiResponse<{ event: Event; attendance: EventRsvp[] }>> => {
    const response = await api.get(`/events/${id}/attendance`);
    return response.data;
  },

  create: async (data: CreateEventData): Promise<ApiResponse<{ event: Event }>> => {
    const response = await api.post('/events', data);
    return response.data;
  },

  update: async (id: string, data: Partial<Event>): Promise<ApiResponse<{ event: Event }>> => {
    const response = await api.put(`/events/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<ApiResponse> => {
    const response = await api.delete(`/events/${id}`);
    return response.data;
  },

  rsvp: async (id: string): Promise<ApiResponse<{ event: Event }>> => {
    const response = await api.post(`/events/${id}/rsvp`);
    return response.data;
  },

  cancelRsvp: async (id: string): Promise<ApiResponse<{ event: Event }>> => {
    const response = await api.delete(`/events/${id}/rsvp`);
    return response.data;
  },

  checkIn: async (eventId: string, userId: string): Promise<ApiResponse<{ attendance: EventRsvp }>> => {
    const response = await api.patch(`/events/${eventId}/attendance/${userId}/check-in`);
    return response.data;
  },

  regenerateBanner: async (id: string): Promise<ApiResponse<{ event: Event }>> => {
    const response = await api.post(`/events/${id}/regenerate-banner`);
    return response.data;
  }
};

/**
 * Donations API
 */
export const donationsAPI = {
  getAll: async (): Promise<ApiResponse<{ donations: Donation[] }>> => {
    const response = await api.get('/donations');
    return response.data;
  },

  getMyDonations: async (): Promise<ApiResponse<{ donations: Donation[] }>> => {
    const response = await api.get('/donations/my-donations');
    return response.data;
  },

  create: async (data: CreateDonationData): Promise<ApiResponse<{ donation: Donation }>> => {
    const response = await api.post('/donations', data);
    return response.data;
  },

  getStats: async (): Promise<ApiResponse> => {
    const response = await api.get('/donations/stats');
    return response.data;
  }
};

/**
 * Announcements API
 */
export const announcementsAPI = {
  getAll: async (params?: any): Promise<ApiResponse<{ announcements: Announcement[] }>> => {
    const response = await api.get('/announcements', { params });
    return response.data;
  },

  getById: async (id: string): Promise<ApiResponse<{ announcement: Announcement }>> => {
    const response = await api.get(`/announcements/${id}`);
    return response.data;
  },

  create: async (data: CreateAnnouncementData): Promise<ApiResponse<{ announcement: Announcement }>> => {
    const response = await api.post('/announcements', data);
    return response.data;
  },

  update: async (id: string, data: Partial<Announcement>): Promise<ApiResponse<{ announcement: Announcement }>> => {
    const response = await api.put(`/announcements/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<ApiResponse> => {
    const response = await api.delete(`/announcements/${id}`);
    return response.data;
  }
};

/**
 * Messages API
 */
export const messagesAPI = {
  send: async (data: CreateMessageData): Promise<ApiResponse<{ message: Message }>> => {
    const response = await api.post('/messages', data);
    return response.data;
  },

  getReceived: async (): Promise<ApiResponse<{ messages: Message[] }>> => {
    const response = await api.get('/messages/received');
    return response.data;
  },

  getSent: async (): Promise<ApiResponse<{ messages: Message[] }>> => {
    const response = await api.get('/messages/sent');
    return response.data;
  },

  getById: async (id: string): Promise<ApiResponse<{ message: Message }>> => {
    const response = await api.get(`/messages/${id}`);
    return response.data;
  },

  suggestReply: async (
    id: string,
    options?: { tone?: 'professional' | 'friendly' | 'concise'; maxWords?: number }
  ): Promise<ApiResponse<{
    draft: string;
    appliedTone: 'professional' | 'friendly' | 'concise';
    detectedIntent: 'greeting' | 'question' | 'request' | 'follow-up' | 'complaint' | 'general';
    detectedTone: 'casual' | 'neutral' | 'formal' | 'urgent';
    conversationTone: 'casual' | 'neutral' | 'formal' | 'urgent';
    classificationSource: 'local' | 'rules';
    styleExampleCount: number;
    source: 'openai' | 'fallback';
  }>> => {
    const response = await api.post(`/messages/${id}/suggest-reply`, options || {});
    return response.data;
  },

  delete: async (id: string): Promise<ApiResponse> => {
    const response = await api.delete(`/messages/${id}`);
    return response.data;
  },

  getUnreadCount: async (): Promise<ApiResponse<{ count: number }>> => {
    const response = await api.get('/messages/unread/count');
    return response.data;
  }
};

/**
 * Dashboard API
 */
export const dashboardAPI = {
  getStats: async (): Promise<ApiResponse<DashboardStats>> => {
    const response = await api.get('/dashboard/stats');
    return response.data;
  }
};

/**
 * Mentorship API
 */
export const mentorshipAPI = {
  getMatches: async (params?: {
    search?: string;
    department?: string;
    graduationYear?: number;
  }): Promise<ApiResponse<{ matches: MentorMatch[] }>> => {
    const response = await api.get('/mentorship/matches', { params });
    return response.data;
  },

  getMyRequests: async (): Promise<ApiResponse<{
    sentRequests: MentorshipRequest[];
    receivedRequests: MentorshipRequest[];
    activeConnections: MentorshipRequest[];
  }>> => {
    const response = await api.get('/mentorship/requests/my');
    return response.data;
  },

  getMySessions: async (): Promise<ApiResponse<{ sessions: MentorshipSession[] }>> => {
    const response = await api.get('/mentorship/sessions/my');
    return response.data;
  },

  createRequest: async (data: CreateMentorshipRequestData): Promise<ApiResponse<{ mentorshipRequest: MentorshipRequest }>> => {
    const response = await api.post('/mentorship/requests', data);
    return response.data;
  },

  createSession: async (data: CreateMentorshipSessionData): Promise<ApiResponse<{ session: MentorshipSession }>> => {
    const response = await api.post('/mentorship/sessions', data);
    return response.data;
  },

  updateRequestStatus: async (
    id: string,
    status: 'accepted' | 'rejected' | 'cancelled'
  ): Promise<ApiResponse<{ mentorshipRequest: MentorshipRequest }>> => {
    const response = await api.patch(`/mentorship/requests/${id}/status`, { status });
    return response.data;
  },

  updateSessionStatus: async (
    id: string,
    status: 'completed' | 'cancelled',
    notes?: string
  ): Promise<ApiResponse<{ session: MentorshipSession }>> => {
    const response = await api.patch(`/mentorship/sessions/${id}/status`, { status, notes });
    return response.data;
  }
};

export const notificationsAPI = {
  getSummary: async (): Promise<ApiResponse<{
    unreadMessages: number;
    pendingMentorshipRequests: number;
    unreadNotifications: number;
  }>> => {
    const response = await api.get('/notifications/summary');
    return response.data;
  },

  getAll: async (params?: { unread?: boolean }): Promise<ApiResponse<{ notifications: Notification[] }>> => {
    const response = await api.get('/notifications', { params });
    return response.data;
  },

  markRead: async (id: string): Promise<ApiResponse<{ notification: Notification }>> => {
    const response = await api.patch(`/notifications/${id}/read`);
    return response.data;
  },

  markAllRead: async (): Promise<ApiResponse> => {
    const response = await api.patch('/notifications/read-all');
    return response.data;
  }
};
