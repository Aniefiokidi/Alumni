import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import {
  FaBell,
  FaHome,
  FaUsers,
  FaCalendar,
  FaDonate,
  FaBullhorn,
  FaEnvelope,
  FaUserFriends,
  FaChartBar,
  FaUser,
  FaBars,
  FaTimes,
  FaSignOutAlt
} from 'react-icons/fa';
import { COVENANT_LOGO_URL } from '../constants/branding';

const Navbar: React.FC = () => {
  const { user, logout, isAdmin } = useAuth();
  const { unreadMessages, pendingMentorshipRequests, unreadNotifications } = useNotifications();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: <FaHome /> },
    { path: '/eagles', label: 'Eagles Directory', icon: <FaUsers /> },
    { path: '/events', label: 'Events', icon: <FaCalendar /> },
    { path: '/donations', label: 'Donations', icon: <FaDonate /> },
    { path: '/announcements', label: 'Announcements', icon: <FaBullhorn /> },
    { path: '/messages', label: 'Messages', icon: <FaEnvelope />, badge: unreadMessages },
    { path: '/mentorship', label: 'Mentorship', icon: <FaUserFriends />, badge: pendingMentorshipRequests },
    { path: '/notifications', label: 'Notifications', icon: <FaBell />, badge: unreadNotifications }
  ];

  if (isAdmin) {
    navItems.push({ path: '/admin/dashboard', label: 'Admin Dashboard', icon: <FaChartBar /> });
  }

  return (
    <nav className="bg-primary-600 text-white shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center py-4">
          <Link to="/dashboard" className="flex items-center space-x-3">
            <img
              src={COVENANT_LOGO_URL}
              alt="Covenant University Logo"
              className="h-12 w-12"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
            <span className="text-2xl font-bold">Eagles Platform</span>
          </Link>

          <div className="hidden md:flex items-center space-x-6">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className="flex items-center space-x-2 hover:text-primary-200 transition"
              >
                {item.icon}
                <span>{item.label}</span>
                {'badge' in item && item.badge ? (
                  <span className="bg-white text-primary-700 text-xs font-bold px-2 py-0.5 rounded-full">
                    {item.badge}
                  </span>
                ) : null}
              </Link>
            ))}

            <div className="flex items-center space-x-4 ml-4 pl-4 border-l border-primary-500">
              <Link
                to="/profile"
                className="flex items-center space-x-2 hover:text-primary-200"
              >
                <FaUser />
                <span>{user?.name}</span>
              </Link>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 hover:text-primary-200"
              >
                <FaSignOutAlt />
                <span>Logout</span>
              </button>
            </div>
          </div>

          <button
            className="md:hidden text-2xl"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <FaTimes /> : <FaBars />}
          </button>
        </div>

        {isOpen && (
          <div className="md:hidden pb-4">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className="flex items-center space-x-2 py-2 hover:text-primary-200"
                onClick={() => setIsOpen(false)}
              >
                {item.icon}
                <span>{item.label}</span>
                {'badge' in item && item.badge ? (
                  <span className="bg-white text-primary-700 text-xs font-bold px-2 py-0.5 rounded-full">
                    {item.badge}
                  </span>
                ) : null}
              </Link>
            ))}
            <Link
              to="/profile"
              className="flex items-center space-x-2 py-2 hover:text-primary-200"
              onClick={() => setIsOpen(false)}
            >
              <FaUser />
              <span>Profile</span>
            </Link>
            <button
              onClick={() => {
                handleLogout();
                setIsOpen(false);
              }}
              className="flex items-center space-x-2 py-2 hover:text-primary-200 w-full text-left"
            >
              <FaSignOutAlt />
              <span>Logout</span>
            </button>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
