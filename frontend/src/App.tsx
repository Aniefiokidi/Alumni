import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Components
import Layout from './components/Layout';
import PrivateRoute from './components/PrivateRoute';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import EaglesDirectory from './pages/AlumniDirectory';
import Events from './pages/Events';
import Donations from './pages/Donations';
import Announcements from './pages/Announcements';
import Messages from './pages/Messages';
import Mentorship from './pages/Mentorship';
import Notifications from './pages/Notifications';
import AdminDashboard from './pages/AdminDashboard';
import AlumniProfile from './pages/AlumniProfile.tsx';

const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <NotificationProvider>
          <ToastContainer
            position="top-right"
            autoClose={3000}
            hideProgressBar={false}
            newestOnTop
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
          />
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            <Route
              path="/"
              element={
                <PrivateRoute>
                  <Layout />
                </PrivateRoute>
              }
            >
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="profile" element={<Profile />} />
              <Route path="eagles" element={<EaglesDirectory />} />
              <Route path="events" element={<Events />} />
              <Route path="donations" element={<Donations />} />
              <Route path="announcements" element={<Announcements />} />
              <Route path="messages" element={<Messages />} />
              <Route path="mentorship" element={<Mentorship />} />
              <Route path="notifications" element={<Notifications />} />
              <Route path="eagles/:slug" element={<AlumniProfile />} />

              <Route
                path="admin/dashboard"
                element={
                  <PrivateRoute adminOnly>
                    <AdminDashboard />
                  </PrivateRoute>
                }
              />
            </Route>

            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </NotificationProvider>
      </Router>
    </AuthProvider>
  );
};

export default App;
