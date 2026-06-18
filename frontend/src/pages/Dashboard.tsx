import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { dashboardAPI } from '../services/apiService';
import { DashboardStats } from '../types';
import Card from '../components/Card';
import Loading from '../components/Loading';
import { FaUsers, FaDonate, FaCalendar, FaChartLine } from 'react-icons/fa';
import { formatNaira } from '../utils/currency';

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

  if (loading && isAdmin) {
    return <Loading />;
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 mb-6">
        Welcome, {user?.name}!
      </h1>

      {isAdmin && stats ? (
        <>
          {/* Stats Cards */}
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

          {/* Recent Registrations */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card title="Recent Registrations">
              {stats.recentRegistrations.length > 0 ? (
                <div className="space-y-3">
                  {stats.recentRegistrations.map((alumni) => (
                    <div
                      key={alumni._id}
                      className="flex items-center justify-between border-b pb-2"
                    >
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
                    <div
                      key={donation._id}
                      className="flex items-center justify-between border-b pb-2"
                    >
                      <div>
                        <p className="font-semibold">
                          {donation.isAnonymous ? 'Anonymous' : (donation.alumniId as any)?.name || 'Unknown'}
                        </p>
                        <p className="text-sm text-gray-600">{donation.purpose || 'General Fund'}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-green-600">{formatNaira(donation.amount)}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(donation.createdAt).toLocaleDateString()}
                        </p>
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
        <Card>
          <div className="text-center py-8">
            <h2 className="text-2xl font-semibold text-gray-700 mb-4">
              Welcome to the Alumni Management Platform
            </h2>
            <p className="text-gray-600">
              Use the navigation menu above to explore events, connect with fellow alumni,
              make donations, and stay updated with announcements.
            </p>
          </div>
        </Card>
      )}
    </div>
  );
};

export default Dashboard;
