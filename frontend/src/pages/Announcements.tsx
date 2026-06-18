import React, { useEffect, useState } from 'react';
import { announcementsAPI } from '../services/apiService';
import { Announcement } from '../types';
import { useAuth } from '../context/AuthContext';
import Card from '../components/Card';
import Button from '../components/Button';
import Loading from '../components/Loading';
import { FaBullhorn, FaPlus, FaEye } from 'react-icons/fa';
import { format } from 'date-fns';
import { toast } from 'react-toastify';

const Announcements: React.FC = () => {
  const { isAdmin } = useAuth();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newAnnouncement, setNewAnnouncement] = useState({
    title: '',
    content: '',
    category: 'general',
    isPinned: false
  });

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      const response = await announcementsAPI.getAll();
      setAnnouncements(response.data?.announcements || []);
    } catch (error) {
      console.error('Error fetching announcements:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await announcementsAPI.create(newAnnouncement);
      toast.success('Announcement created successfully!');
      setShowCreateModal(false);
      setNewAnnouncement({
        title: '',
        content: '',
        category: 'general',
        isPinned: false
      });
      fetchAnnouncements();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create announcement');
    }
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      general: 'bg-blue-100 text-blue-800',
      event: 'bg-purple-100 text-purple-800',
      achievement: 'bg-green-100 text-green-800',
      opportunity: 'bg-yellow-100 text-yellow-800',
      urgent: 'bg-red-100 text-red-800'
    };
    return colors[category] || colors.general;
  };

  if (loading) {
    return <Loading />;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Announcements</h1>
        {isAdmin && (
          <Button onClick={() => setShowCreateModal(true)}>
            <FaPlus className="inline mr-2" />
            Create Announcement
          </Button>
        )}
      </div>

      {/* Announcements List */}
      <div className="space-y-6">
        {announcements.map((announcement) => (
          <Card key={announcement._id} className={announcement.isPinned ? 'border-2 border-primary-500' : ''}>
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center space-x-3">
                <FaBullhorn className="text-2xl text-primary-600" />
                <div>
                  <h3 className="text-2xl font-bold text-gray-800">
                    {announcement.title}
                    {announcement.isPinned && (
                      <span className="ml-2 text-sm bg-primary-100 text-primary-700 px-2 py-1 rounded-full">
                        Pinned
                      </span>
                    )}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {format(new Date(announcement.createdAt), 'PPP')}
                  </p>
                </div>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getCategoryColor(announcement.category)}`}>
                {announcement.category}
              </span>
            </div>

            <p className="text-gray-700 mb-4 whitespace-pre-wrap">{announcement.content}</p>

            <div className="flex items-center justify-between text-sm text-gray-500 border-t pt-3">
              <span className="flex items-center space-x-1">
                <FaEye />
                <span>{announcement.views} views</span>
              </span>
              <span>By {(announcement.author as any)?.name || 'Admin'}</span>
            </div>
          </Card>
        ))}
      </div>

      {announcements.length === 0 && (
        <Card>
          <p className="text-center text-gray-500 py-8">No announcements yet.</p>
        </Card>
      )}

      {/* Create Announcement Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="max-w-2xl w-full">
            <h2 className="text-2xl font-bold mb-4">Create New Announcement</h2>
            <form onSubmit={handleCreateAnnouncement}>
              <div className="mb-4">
                <label className="block text-gray-700 font-medium mb-2">Title</label>
                <input
                  type="text"
                  className="w-full px-4 py-2 border rounded-lg"
                  value={newAnnouncement.title}
                  onChange={(e) => setNewAnnouncement({ ...newAnnouncement, title: e.target.value })}
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 font-medium mb-2">Content</label>
                <textarea
                  className="w-full px-4 py-2 border rounded-lg"
                  rows={6}
                  value={newAnnouncement.content}
                  onChange={(e) => setNewAnnouncement({ ...newAnnouncement, content: e.target.value })}
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 font-medium mb-2">Category</label>
                <select
                  className="w-full px-4 py-2 border rounded-lg"
                  value={newAnnouncement.category}
                  onChange={(e) => setNewAnnouncement({ ...newAnnouncement, category: e.target.value })}
                >
                  <option value="general">General</option>
                  <option value="event">Event</option>
                  <option value="achievement">Achievement</option>
                  <option value="opportunity">Opportunity</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
              <div className="mb-4">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={newAnnouncement.isPinned}
                    onChange={(e) => setNewAnnouncement({ ...newAnnouncement, isPinned: e.target.checked })}
                  />
                  <span className="text-gray-700">Pin this announcement</span>
                </label>
              </div>
              <div className="flex space-x-4">
                <Button type="submit" className="flex-1">
                  Create Announcement
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Announcements;
