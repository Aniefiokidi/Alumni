import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { dashboardAPI } from '../services/apiService';
import { DashboardStats } from '../types';
import Card from '../components/Card';
import Loading from '../components/Loading';
import {
  FaUsers,
  FaDonate,
  FaCalendar,
  FaChartLine,
  FaEnvelope,
  FaUserFriends,
  FaBullhorn,
  FaArrowRight,
} from 'react-icons/fa';
import { Sun, Sunset, Moon } from 'lucide-react';
import { formatNaira } from '../utils/currency';

const quickActions = [
  {
    path: '/events',
    icon: <FaCalendar size={22} />,
    label: 'Events',
    desc: 'Browse & RSVP to upcoming events',
    color: 'from-violet-500 to-purple-600',
    bg: 'bg-purple-50',
    text: 'text-purple-600',
  },
  {
    path: '/eagles',
    icon: <FaUsers size={22} />,
    label: 'Directory',
    desc: 'Connect with fellow alumni',
    color: 'from-blue-500 to-indigo-600',
    bg: 'bg-blue-50',
    text: 'text-blue-600',
  },
  {
    path: '/mentorship',
    icon: <FaUserFriends size={22} />,
    label: 'Mentorship',
    desc: 'Find a mentor or become one',
    color: 'from-emerald-500 to-teal-600',
    bg: 'bg-emerald-50',
    text: 'text-emerald-600',
  },
  {
    path: '/donations',
    icon: <FaDonate size={22} />,
    label: 'Donate',
    desc: 'Support the university community',
    color: 'from-orange-400 to-red-500',
    bg: 'bg-orange-50',
    text: 'text-orange-600',
  },
  {
    path: '/announcements',
    icon: <FaBullhorn size={22} />,
    label: 'Announcements',
    desc: 'Latest news and updates',
    color: 'from-pink-500 to-rose-500',
    bg: 'bg-pink-50',
    text: 'text-pink-600',
  },
  {
    path: '/messages',
    icon: <FaEnvelope size={22} />,
    label: 'Messages',
    desc: 'Your inbox and conversations',
    color: 'from-sky-500 to-cyan-500',
    bg: 'bg-sky-50',
    text: 'text-sky-600',
  },
];

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return { text: 'Good morning', Icon: Sun };
  if (h < 17) return { text: 'Good afternoon', Icon: Sunset };
  return { text: 'Good evening', Icon: Moon };
};

const Dashboard: React.FC = () => {
  const { user, isAdmin } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      if (isAdmin) {
        try {
          const response = await dashboardAPI.getStats();
          setStats(response.data || null);
        } catch (error) {
          console.error('Error fetching dashboard stats:', error);
        }
      }
      setLoading(false);
    };
    fetchStats();
  }, [isAdmin]);

  if (loading && isAdmin) return <Loading />;

  return (
    <div>
      {isAdmin && stats ? (
        <>
          <h1 className="text-3xl font-bold text-gray-800 mb-6">Welcome, {user?.name}!</h1>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90">Total Eagles</p>
                  <p className="text-3xl font-bold">{stats.totalAlumni}</p>
                </div>
                <FaUsers className="text-4xl opacity-80" />
              </div>
            </Card>
            <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90">Total Donations</p>
                  <p className="text-3xl font-bold">{formatNaira(stats.totalDonations)}</p>
                </div>
                <FaDonate className="text-4xl opacity-80" />
              </div>
            </Card>
            <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90">Upcoming Events</p>
                  <p className="text-3xl font-bold">{stats.upcomingEvents}</p>
                </div>
                <FaCalendar className="text-4xl opacity-80" />
              </div>
            </Card>
            <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90">Total Events</p>
                  <p className="text-3xl font-bold">{stats.totalEvents}</p>
                </div>
                <FaChartLine className="text-4xl opacity-80" />
              </div>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card title="Recent Registrations">
              {stats.recentRegistrations.length > 0 ? (
                <div className="space-y-3">
                  {stats.recentRegistrations.map((alumni) => (
                    <div key={alumni._id} className="flex items-center justify-between border-b pb-2">
                      <div>
                        <p className="font-semibold">{alumni.name}</p>
                        <p className="text-sm text-gray-600">{alumni.email}</p>
                      </div>
                      <div className="text-right text-sm text-gray-600">
                        <p>{alumni.department}</p>
                        <p>{alumni.graduationYear}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No recent registrations</p>
              )}
            </Card>
            <Card title="Recent Donations">
              {stats.recentDonations.length > 0 ? (
                <div className="space-y-3">
                  {stats.recentDonations.map((donation) => (
                    <div key={donation._id} className="flex items-center justify-between border-b pb-2">
                      <div>
                        <p className="font-semibold">
                          {donation.isAnonymous ? 'Anonymous' : (donation.alumniId as any)?.name || 'Unknown'}
                        </p>
                        <p className="text-sm text-gray-600">{donation.purpose || 'General Fund'}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-green-600">{formatNaira(donation.amount)}</p>
                        <p className="text-xs text-gray-500">{new Date(donation.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No recent donations</p>
              )}
            </Card>
          </div>
        </>
      ) : (
        <div className="-mt-8 -mx-4">
          {/* Hero banner */}
          <div className="relative overflow-hidden bg-gradient-to-br from-primary-700 via-primary-600 to-indigo-700 px-6 py-16 sm:py-20">
            {/* Decorative circles */}
            <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full bg-white/5" />
            <div className="absolute -bottom-32 -left-16 w-96 h-96 rounded-full bg-white/5" />
            <div className="absolute top-10 right-1/3 w-32 h-32 rounded-full bg-white/5" />

            <div className="relative max-w-screen-xl mx-auto">
              {(() => { const { text, Icon } = getGreeting(); return (
                <p className="flex items-center gap-2 text-primary-200 text-sm font-semibold uppercase tracking-widest mb-2">
                  <Icon size={15} />
                  {text}
                </p>
              ); })()}
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-3">
                {user?.name?.split(' ')[0]}
              </h1>
              <p className="text-primary-100 text-base sm:text-lg max-w-xl leading-relaxed">
                Welcome back to the <span className="font-semibold text-white">Eagles Alumni Platform</span>.
                Stay connected, grow together, and give back.
              </p>

              <div className="flex flex-wrap gap-3 mt-8">
                <Link
                  to="/events"
                  className="inline-flex items-center gap-2 bg-white text-primary-700 text-sm font-semibold px-5 py-2.5 rounded-full hover:bg-primary-50 transition-colors shadow"
                >
                  <FaCalendar size={13} /> Explore Events
                </Link>
                <Link
                  to="/eagles"
                  className="inline-flex items-center gap-2 bg-white/10 text-white text-sm font-semibold px-5 py-2.5 rounded-full hover:bg-white/20 transition-colors border border-white/20"
                >
                  <FaUsers size={13} /> Find Alumni
                </Link>
              </div>
            </div>
          </div>

          {/* Quick actions grid */}
          <div className="max-w-screen-xl mx-auto px-4 sm:px-6 py-10">
            <h2 className="text-lg font-bold text-gray-800 mb-5">Quick Access</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {quickActions.map((action) => (
                <Link
                  key={action.path}
                  to={action.path}
                  className="group flex items-center gap-4 bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
                >
                  <div className={`${action.bg} ${action.text} w-12 h-12 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform`}>
                    {action.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-800 text-sm">{action.label}</p>
                    <p className="text-xs text-gray-500 mt-0.5 leading-snug">{action.desc}</p>
                  </div>
                  <FaArrowRight size={12} className="text-gray-300 group-hover:text-gray-500 group-hover:translate-x-1 transition-all shrink-0" />
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
