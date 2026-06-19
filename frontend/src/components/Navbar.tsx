import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
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
  FaBars,
  FaTimes,
  FaSignOutAlt,
  FaChevronDown
} from 'react-icons/fa';
import { COVENANT_LOGO_URL } from '../constants/branding';

const Navbar: React.FC = () => {
  const { user, logout, isAdmin } = useAuth();
  const { unreadMessages, pendingMentorshipRequests, unreadNotifications } = useNotifications();
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setIsOpen(false);
    setProfileOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path: string) => location.pathname === path;

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: <FaHome size={14} /> },
    { path: '/eagles', label: 'Directory', icon: <FaUsers size={14} /> },
    { path: '/events', label: 'Events', icon: <FaCalendar size={14} /> },
    { path: '/donations', label: 'Donations', icon: <FaDonate size={14} /> },
    { path: '/announcements', label: 'Announcements', icon: <FaBullhorn size={14} /> },
    { path: '/messages', label: 'Messages', icon: <FaEnvelope size={14} />, badge: unreadMessages },
    { path: '/mentorship', label: 'Mentorship', icon: <FaUserFriends size={14} />, badge: pendingMentorshipRequests },
    { path: '/notifications', label: 'Alerts', icon: <FaBell size={14} />, badge: unreadNotifications },
  ];

  if (isAdmin) {
    navItems.push({ path: '/admin/dashboard', label: 'Admin', icon: <FaChartBar size={14} /> });
  }

  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U';

  return (
    <nav
      className={`sticky top-0 z-50 bg-white border-b transition-shadow duration-200 ${
        scrolled ? 'shadow-md' : 'shadow-sm'
      }`}
    >
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link to="/dashboard" className="flex items-center gap-2.5 shrink-0">
            <img
              src={COVENANT_LOGO_URL}
              alt="Logo"
              className="h-9 w-9 rounded-full object-cover ring-2 ring-primary-100"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
            <div className="leading-tight">
              <p className="text-sm font-bold text-primary-700 tracking-tight">Eagles</p>
              <p className="text-xs text-gray-400 font-medium -mt-0.5">Alumni Platform</p>
            </div>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`relative flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive(item.path)
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <span className={isActive(item.path) ? 'text-primary-600' : ''}>{item.icon}</span>
                {item.label}
                {'badge' in item && item.badge ? (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full">
                    {item.badge > 9 ? '9+' : item.badge}
                  </span>
                ) : null}
              </Link>
            ))}
          </div>

          {/* Profile Dropdown */}
          <div className="hidden lg:block relative">
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              className="flex items-center gap-2 pl-3 pr-2 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-primary-600 text-white flex items-center justify-center text-xs font-bold">
                {initials}
              </div>
              <span className="text-sm font-medium text-gray-700 max-w-[100px] truncate">
                {user?.name?.split(' ')[0]}
              </span>
              <FaChevronDown size={10} className={`text-gray-400 transition-transform ${profileOpen ? 'rotate-180' : ''}`} />
            </button>

            {profileOpen && (
              <div className="absolute right-0 mt-2 w-44 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-50">
                <div className="px-3 py-2 border-b border-gray-100 mb-1">
                  <p className="text-xs font-semibold text-gray-800 truncate">{user?.name}</p>
                  <p className="text-[11px] text-gray-400 truncate">{user?.email}</p>
                </div>
                <Link
                  to="/profile"
                  className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
                >
                  My Profile
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-500 hover:bg-red-50 transition-colors"
                >
                  <FaSignOutAlt size={12} />
                  Sign out
                </button>
              </div>
            )}
          </div>

          {/* Mobile toggle */}
          <button
            className="lg:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Toggle menu"
          >
            {isOpen ? <FaTimes size={18} /> : <FaBars size={18} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {isOpen && (
        <div className="lg:hidden border-t border-gray-100 bg-white">
          <div className="max-w-screen-xl mx-auto px-4 py-3 space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive(item.path)
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  {item.icon}
                  {item.label}
                </div>
                {'badge' in item && item.badge ? (
                  <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                    {item.badge}
                  </span>
                ) : null}
              </Link>
            ))}

            <div className="border-t border-gray-100 pt-3 mt-2">
              <div className="flex items-center gap-3 px-3 py-2 mb-2">
                <div className="w-9 h-9 rounded-full bg-primary-600 text-white flex items-center justify-center text-xs font-bold">
                  {initials}
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-800">{user?.name}</p>
                  <p className="text-xs text-gray-400">{user?.email}</p>
                </div>
              </div>
              <Link
                to="/profile"
                className="flex items-center gap-2 px-3 py-2.5 text-sm text-gray-600 hover:bg-gray-50 rounded-lg"
              >
                My Profile
              </Link>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 w-full px-3 py-2.5 text-sm text-red-500 hover:bg-red-50 rounded-lg text-left"
              >
                <FaSignOutAlt size={12} />
                Sign out
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
