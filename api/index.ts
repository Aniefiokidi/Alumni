import type { VercelRequest, VercelResponse } from "@vercel/node";
import express, { Express } from "express";
import cors from "cors";
import dotenv from "dotenv";

// Load environment variables
dotenv.config({ path: ".env" });

// Import routes
import authRoutes from "../backend/src/routes/authRoutes";
import alumniRoutes from "../backend/src/routes/alumniRoutes";
import announcementRoutes from "../backend/src/routes/announcementRoutes";
import dashboardRoutes from "../backend/src/routes/dashboardRoutes";
import donationRoutes from "../backend/src/routes/donationRoutes";
import eventRoutes from "../backend/src/routes/eventRoutes";
import mentorshipRoutes from "../backend/src/routes/mentorshipRoutes";
import messageRoutes from "../backend/src/routes/messageRoutes";
import notificationRoutes from "../backend/src/routes/notificationRoutes";

const app: Express = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/alumni", alumniRoutes);
app.use("/api/announcements", announcementRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/donations", donationRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/mentorship", mentorshipRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/notifications", notificationRoutes);

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

export default (req: VercelRequest, res: VercelResponse) => {
  return app(req, res);
};
