import express, { Application, Request, Response } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import connectDB from './config/database';
import { errorHandler, notFound } from './middleware/errorHandler';
import { ensureAdminAccount } from './services/adminBootstrapService';

// Import routes
import authRoutes from './routes/authRoutes';
import alumniRoutes from './routes/alumniRoutes';
import eventRoutes from './routes/eventRoutes';
import donationRoutes from './routes/donationRoutes';
import announcementRoutes from './routes/announcementRoutes';
import messageRoutes from './routes/messageRoutes';
import dashboardRoutes from './routes/dashboardRoutes';
import mentorshipRoutes from './routes/mentorshipRoutes';
import notificationRoutes from './routes/notificationRoutes';

// Load environment variables
dotenv.config();

// Initialize Express app
const app: Application = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/alumni', alumniRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/donations', donationRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/mentorship', mentorshipRoutes);
app.use('/api/notifications', notificationRoutes);

// Health check route
app.get('/health', (req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'Alumni Platform API is running',
    timestamp: new Date().toISOString()
  });
});

// Root route
app.get('/', (req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'Welcome to Digital Alumni Relationship Management Platform API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      alumni: '/api/alumni',
      events: '/api/events',
      donations: '/api/donations',
      announcements: '/api/announcements',
      messages: '/api/messages',
      dashboard: '/api/dashboard',
      mentorship: '/api/mentorship',
      notifications: '/api/notifications'
    }
  });
});

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 5000;

const startServer = async (): Promise<void> => {
  try {
    await connectDB();
    await ensureAdminAccount();

    app.listen(PORT, () => {
      console.log(`🚀 Server is running on port ${PORT}`);
      console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🌐 API Base URL: http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

export default app;
