import type { VercelRequest, VercelResponse } from "@vercel/node";
import express, { Express } from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";

dotenv.config();

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
import { errorHandler, notFound } from "../backend/src/middleware/errorHandler";

// Reuse mongoose connection across invocations (serverless warm-start optimisation)
let isConnected = false;

const connectDB = async (): Promise<void> => {
  if (isConnected && mongoose.connection.readyState === 1) return;
  const mongoURI = process.env.MONGODB_URI;
  if (!mongoURI) throw new Error("MONGODB_URI environment variable is not set");
  await mongoose.connect(mongoURI);
  isConnected = true;
};

const app: Express = express();

app.use(
  cors({
    origin: process.env.CLIENT_URL || true,
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/auth", authRoutes);
app.use("/api/alumni", alumniRoutes);
app.use("/api/announcements", announcementRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/donations", donationRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/mentorship", mentorshipRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/notifications", notificationRoutes);

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.use(notFound);
app.use(errorHandler);

export default async (req: VercelRequest, res: VercelResponse) => {
  await connectDB();
  return app(req as any, res as any);
};
