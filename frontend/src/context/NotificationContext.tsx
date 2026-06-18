import React, { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { notificationsAPI } from '../services/apiService';
import { NotificationType } from '../types';
import { buildNotificationRoute } from '../utils/notificationRoutes';
import { useAuth } from './AuthContext';

interface NotificationContextValue {
  unreadMessages: number;
  pendingMentorshipRequests: number;
  unreadNotifications: number;
  refreshSummary: () => Promise<void>;
}

type NotificationEvent = {
  type: NotificationType;
  title: string;
  body: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
};

const NotificationContext = createContext<NotificationContextValue | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [pendingMentorshipRequests, setPendingMentorshipRequests] = useState(0);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  const refreshSummary = async () => {
    if (!token) {
      setUnreadMessages(0);
      setPendingMentorshipRequests(0);
      setUnreadNotifications(0);
      return;
    }

    try {
      const response = await notificationsAPI.getSummary();
      setUnreadMessages(response.data?.unreadMessages || 0);
      setPendingMentorshipRequests(response.data?.pendingMentorshipRequests || 0);
      setUnreadNotifications(response.data?.unreadNotifications || 0);
    } catch {
      setUnreadMessages(0);
      setPendingMentorshipRequests(0);
      setUnreadNotifications(0);
    }
  };

  useEffect(() => {
    refreshSummary();
  }, [token]);

  useEffect(() => {
    if (!token || !user) {
      return;
    }

    const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    const streamUrl = `${apiBaseUrl.replace(/\/api$/, '')}/api/notifications/stream?token=${encodeURIComponent(token)}`;
    const eventSource = new EventSource(streamUrl);

    const handleNotification = (event: MessageEvent<string>) => {
      try {
        const payload = JSON.parse(event.data) as NotificationEvent;
        const route = buildNotificationRoute(payload);
        toast.info(payload.body, {
          toastId: `${payload.type}-${payload.createdAt}`,
          onClick: route
            ? () => {
                navigate(route);
                refreshSummary();
              }
            : undefined
        });

        setUnreadNotifications((current) => current + 1);

        if (payload.type === 'message:new') {
          setUnreadMessages((current) => current + 1);
        }

        if (payload.type === 'mentorship:request') {
          setPendingMentorshipRequests((current) => current + 1);
        }

        if (payload.type === 'mentorship:status') {
          refreshSummary();
        }
      } catch {
        refreshSummary();
      }
    };

    eventSource.addEventListener('notification', handleNotification);
    eventSource.onerror = () => {
      refreshSummary();
    };

    return () => {
      eventSource.removeEventListener('notification', handleNotification);
      eventSource.close();
    };
  }, [token, user, navigate]);

  const value = useMemo(
    () => ({
      unreadMessages,
      pendingMentorshipRequests,
      unreadNotifications,
      refreshSummary
    }),
    [unreadMessages, pendingMentorshipRequests, unreadNotifications]
  );

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
