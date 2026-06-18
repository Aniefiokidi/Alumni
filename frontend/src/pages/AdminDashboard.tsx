import React, { useEffect, useState } from 'react';
import { format } from 'date-fns';
import {
  FaBell,
  FaCalendarAlt,
  FaCheckCircle,
  FaDonate,
  FaGraduationCap,
  FaHandshake,
  FaUsers
} from 'react-icons/fa';
import Card from '../components/Card';
import Loading from '../components/Loading';
import AdminSidebar from '../components/AdminSidebar';
import { dashboardAPI } from '../services/apiService';
import { DashboardStats, MentorshipRequest, Notification } from '../types';
import { formatNaira } from '../utils/currency';

const getPersonName = (value: any) => value?.name || 'Unknown';

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await dashboardAPI.getStats();
        setStats(response.data || null);
      } catch (error) {
        console.error('Failed to load admin dashboard', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return <Loading />;
  }

  if (!stats) {
    return (
      <Card>
        <p className="text-gray-500">Admin statistics are unavailable right now.</p>
      </Card>
    );
  }

  const summaryCards = [
    {
      label: 'Total Eagles',
      value: stats.totalAlumni,
      icon: <FaUsers className="text-3xl" />,
      className: 'from-sky-600 to-blue-700'
    },
    {
      label: 'Donation Volume',
      value: formatNaira(stats.totalDonations),
      icon: <FaDonate className="text-3xl" />,
      className: 'from-emerald-600 to-green-700'
    },
    {
      label: 'Upcoming Events',
      value: stats.upcomingEvents,
      icon: <FaCalendarAlt className="text-3xl" />,
      className: 'from-amber-500 to-orange-600'
    },
    {
      label: 'Unread Notifications',
      value: stats.unreadNotifications,
      icon: <FaBell className="text-3xl" />,
      className: 'from-slate-700 to-slate-900'
    }
  ];

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[280px_1fr] gap-6">
      <AdminSidebar />

      <div className="space-y-6">
        <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-sky-900 text-white p-6 shadow-lg">
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-slate-200 mt-2">
            Monitor alumni activity, event engagement, mentorship demand, and notification load from one place.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
          {summaryCards.map((card) => (
            <Card key={card.label} className={`bg-gradient-to-br ${card.className} text-white`}>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm opacity-80">{card.label}</p>
                  <p className="text-3xl font-bold mt-2">{card.value}</p>
                </div>
                <div className="opacity-80">{card.icon}</div>
              </div>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <Card>
            <h2 className="text-xl font-bold text-gray-800 mb-4">Platform Health</h2>
            <div className="space-y-3 text-sm text-gray-700">
              <div className="flex justify-between"><span>Pending mentorship requests</span><span className="font-semibold">{stats.pendingMentorshipRequests}</span></div>
              <div className="flex justify-between"><span>Active mentorships</span><span className="font-semibold">{stats.activeMentorshipConnections}</span></div>
              <div className="flex justify-between"><span>Scheduled sessions</span><span className="font-semibold">{stats.scheduledSessions}</span></div>
              <div className="flex justify-between"><span>Live RSVPs</span><span className="font-semibold">{stats.totalRsvps}</span></div>
              <div className="flex justify-between"><span>Checked-in attendees</span><span className="font-semibold">{stats.checkedInAttendees}</span></div>
              <div className="flex justify-between"><span>Total events</span><span className="font-semibold">{stats.totalEvents}</span></div>
            </div>
          </Card>

          <Card>
            <h2 className="text-xl font-bold text-gray-800 mb-4">Recent Registrations</h2>
            <div className="space-y-3">
              {stats.recentRegistrations.slice(0, 6).map((alumni) => (
                <div key={alumni._id} className="border-b border-gray-100 pb-3 last:border-b-0">
                  <p className="font-semibold text-gray-800">{alumni.name}</p>
                  <p className="text-sm text-gray-600">{alumni.department} • Class of {alumni.graduationYear}</p>
                  <p className="text-xs text-gray-400 mt-1">Joined {format(new Date(alumni.createdAt), 'PPP')}</p>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <h2 className="text-xl font-bold text-gray-800 mb-4">Year Distribution</h2>
            <div className="space-y-3">
              {stats.alumniByYear.map((entry) => (
                <div key={String(entry._id)}>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Class of {entry._id || 'Unknown'}</span>
                    <span>{entry.count}</span>
                  </div>
                  <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                    <div
                      className="h-full bg-primary-600"
                      style={{ width: `${Math.min(100, entry.count * 10)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <Card>
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <FaHandshake className="text-primary-600" />
              Recent Mentorship Activity
            </h2>
            <div className="space-y-3">
              {stats.recentMentorshipRequests.map((request: MentorshipRequest) => (
                <div key={request._id} className="border-b border-gray-100 pb-3 last:border-b-0">
                  <div className="flex justify-between gap-3">
                    <div>
                      <p className="font-semibold text-gray-800">
                        {getPersonName(request.mentee)} to {getPersonName(request.mentor)}
                      </p>
                      <p className="text-sm text-gray-600 line-clamp-2">{request.goals}</p>
                    </div>
                    <span className="text-xs font-semibold px-2 py-1 rounded-full bg-gray-100 text-gray-700 capitalize h-fit">
                      {request.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <FaGraduationCap className="text-primary-600" />
              Most Active Events
            </h2>
            <div className="space-y-3">
              {stats.eventParticipation.map((event) => (
                <div key={event.eventId} className="border-b border-gray-100 pb-3 last:border-b-0">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-gray-800">{event.title}</p>
                      <p className="text-sm text-gray-600">{format(new Date(event.date), 'PPP p')}</p>
                    </div>
                    <div className="text-right text-sm text-gray-700">
                      <p>{event.attendeeCount} RSVPs</p>
                      <p>{event.checkedInCount} checked in</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <Card>
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <FaCheckCircle className="text-primary-600" />
            Recent Notification Feed
          </h2>
          <div className="space-y-3">
            {stats.recentNotifications.map((notification: Notification) => (
              <div key={notification._id} className="border-b border-gray-100 pb-3 last:border-b-0">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-gray-800">{notification.title}</p>
                    <p className="text-sm text-gray-600">{notification.body}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      Recipient: {getPersonName(notification.user)} • {format(new Date(notification.createdAt), 'PPP p')}
                    </p>
                  </div>
                  <span className={`text-xs font-semibold px-2 py-1 rounded-full ${notification.isRead ? 'bg-gray-100 text-gray-600' : 'bg-sky-100 text-sky-700'}`}>
                    {notification.isRead ? 'Read' : 'Unread'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;
