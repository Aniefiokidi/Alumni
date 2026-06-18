import React, { useEffect, useMemo, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FaBell, FaCheckCircle, FaEnvelope, FaFilter, FaRegCircle } from 'react-icons/fa';
import Card from '../components/Card';
import Button from '../components/Button';
import Loading from '../components/Loading';
import { notificationsAPI } from '../services/apiService';
import { Notification } from '../types';
import { useNotifications } from '../context/NotificationContext';
import { buildNotificationRoute } from '../utils/notificationRoutes';

const Notifications: React.FC = () => {
  const navigate = useNavigate();
  const { refreshSummary } = useNotifications();
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [markingId, setMarkingId] = useState<string | null>(null);
  const [markingAll, setMarkingAll] = useState(false);

  const fetchNotifications = async (nextFilter: 'all' | 'unread' = filter) => {
    try {
      setLoading(true);
      const response = await notificationsAPI.getAll({ unread: nextFilter === 'unread' });
      setNotifications(response.data?.notifications || []);
    } catch (error) {
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [filter]);

  const unreadCount = useMemo(
    () => notifications.filter((notification) => !notification.isRead).length,
    [notifications]
  );

  const handleMarkRead = async (notificationId: string) => {
    try {
      setMarkingId(notificationId);
      await notificationsAPI.markRead(notificationId);
      await refreshSummary();
      await fetchNotifications();
    } catch (error) {
      toast.error('Failed to mark notification as read');
    } finally {
      setMarkingId(null);
    }
  };

  const handleOpenNotification = async (notification: Notification) => {
    try {
      if (!notification.isRead) {
        await handleMarkRead(notification._id);
      }

      const route = buildNotificationRoute(notification);
      if (route) {
        navigate(route);
      }
    } catch (error) {
      toast.error('Failed to open notification');
    }
  };

  const handleMarkAllRead = async () => {
    try {
      setMarkingAll(true);
      await notificationsAPI.markAllRead();
      await refreshSummary();
      await fetchNotifications();
      toast.success('All notifications marked as read');
    } catch (error) {
      toast.error('Failed to mark notifications as read');
    } finally {
      setMarkingAll(false);
    }
  };

  if (loading) {
    return <Loading />;
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-gradient-to-r from-slate-800 via-sky-800 to-cyan-700 text-white p-6 shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <FaBell />
              Notification Center
            </h1>
            <p className="text-sky-100 mt-2">
              Review alerts, jump into the exact page they belong to, and clear out unread items.
            </p>
          </div>
          <Button onClick={handleMarkAllRead} isLoading={markingAll} className="!bg-white !text-slate-900 hover:!bg-slate-100">
            Mark All Read
          </Button>
        </div>
      </div>

      <Card>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3 text-sm text-gray-600">
            <FaFilter className="text-primary-600" />
            <span>{unreadCount} unread in current view</span>
          </div>
          <div className="flex gap-2">
            <Button
              variant={filter === 'all' ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setFilter('all')}
            >
              All
            </Button>
            <Button
              variant={filter === 'unread' ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setFilter('unread')}
            >
              Unread
            </Button>
          </div>
        </div>
      </Card>

      {notifications.length === 0 ? (
        <Card>
          <div className="text-center py-10 text-gray-500">
            <FaBell className="mx-auto text-3xl mb-3 text-gray-300" />
            <p>No notifications in this view.</p>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {notifications.map((notification) => {
            const route = buildNotificationRoute(notification);

            return (
              <Card
                key={notification._id}
                className={`border transition ${notification.isRead ? 'border-gray-200' : 'border-sky-300 shadow-sky-100/50'}`}
              >
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className={`mt-1 ${notification.isRead ? 'text-gray-300' : 'text-sky-600'}`}>
                      {notification.type === 'message:new' ? <FaEnvelope /> : notification.isRead ? <FaRegCircle /> : <FaCheckCircle />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="text-lg font-semibold text-gray-800">{notification.title}</h2>
                        {!notification.isRead && (
                          <span className="text-xs font-semibold px-2 py-1 rounded-full bg-sky-100 text-sky-700">
                            Unread
                          </span>
                        )}
                      </div>
                      <p className="text-gray-600 mt-1">{notification.body}</p>
                      <p className="text-xs text-gray-400 mt-3">
                        {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {route && (
                      <Button
                        size="sm"
                        onClick={() => handleOpenNotification(notification)}
                        isLoading={markingId === notification._id}
                      >
                        Open
                      </Button>
                    )}
                    {!notification.isRead && (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleMarkRead(notification._id)}
                        isLoading={markingId === notification._id}
                      >
                        Mark Read
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Notifications;
