import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  FaBullhorn,
  FaCalendarAlt,
  FaChartBar,
  FaDonate,
  FaEnvelope,
  FaHandshake,
  FaUserShield,
  FaUsers,
  FaBell
} from 'react-icons/fa';

const adminLinks = [
  {
    label: 'Overview',
    description: 'Platform metrics and health',
    to: '/admin/dashboard',
    icon: <FaChartBar />
  },
  {
    label: 'Alumni Directory',
    description: 'Browse and monitor user base',
    to: '/eagles',
    icon: <FaUsers />
  },
  {
    label: 'Events Control',
    description: 'Create and manage events',
    to: '/events',
    icon: <FaCalendarAlt />
  },
  {
    label: 'Donations',
    description: 'Track donation activity',
    to: '/donations',
    icon: <FaDonate />
  },
  {
    label: 'Announcements',
    description: 'Publish campus-wide updates',
    to: '/announcements',
    icon: <FaBullhorn />
  },
  {
    label: 'Messages',
    description: 'View community conversations',
    to: '/messages',
    icon: <FaEnvelope />
  },
  {
    label: 'Mentorship',
    description: 'Oversee mentorship operations',
    to: '/mentorship',
    icon: <FaHandshake />
  },
  {
    label: 'Notifications',
    description: 'Track read and unread alerts',
    to: '/notifications',
    icon: <FaBell />
  }
];

const AdminSidebar: React.FC = () => {
  const location = useLocation();

  return (
    <aside className="rounded-2xl bg-slate-900 text-slate-100 p-5 shadow-lg h-fit">
      <div className="flex items-center gap-2 mb-5">
        <FaUserShield className="text-cyan-300" />
        <h2 className="text-lg font-bold">Admin Control</h2>
      </div>

      <nav className="space-y-2">
        {adminLinks.map((link) => {
          const isActive = location.pathname === link.to;
          return (
            <Link
              key={link.to}
              to={link.to}
              className={`block rounded-xl p-3 transition ${isActive ? 'bg-cyan-400 text-slate-900' : 'hover:bg-slate-800 text-slate-100'}`}
            >
              <div className="flex items-center gap-2 font-semibold">
                {link.icon}
                <span>{link.label}</span>
              </div>
              <p className={`text-xs mt-1 ${isActive ? 'text-slate-800' : 'text-slate-400'}`}>
                {link.description}
              </p>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
};

export default AdminSidebar;
