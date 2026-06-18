import React, { useEffect, useMemo, useState } from 'react';
import { format } from 'date-fns';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  FaCalendar,
  FaClipboardCheck,
  FaMapMarkerAlt,
  FaPlus,
  FaMagic,
  FaCheckCircle,
  FaTimesCircle,
  FaSyncAlt,
  FaUsers
} from 'react-icons/fa';
import { eventsAPI } from '../services/apiService';
import { Event, EventRsvp, User } from '../types';
import { useAuth } from '../context/AuthContext';
import Card from '../components/Card';
import Button from '../components/Button';
import Loading from '../components/Loading';

const Events: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [myRsvps, setMyRsvps] = useState<EventRsvp[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [regeneratingEventId, setRegeneratingEventId] = useState<string | null>(null);
  const [attendanceEvent, setAttendanceEvent] = useState<Event | null>(null);
  const [attendanceRecords, setAttendanceRecords] = useState<EventRsvp[]>([]);
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [checkingInId, setCheckingInId] = useState<string | null>(null);
  const [highlightedEventId, setHighlightedEventId] = useState<string | null>(null);
  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    date: '',
    location: '',
    organizer: user?.name || '',
    maxAttendees: '100'
  });

  const fetchEventsData = async () => {
    try {
      const [eventsResponse, rsvpResponse] = await Promise.all([
        eventsAPI.getAll({ upcoming: 'true' }),
        eventsAPI.getMyRsvps()
      ]);
      setEvents(eventsResponse.data?.events || []);
      setMyRsvps(rsvpResponse.data?.rsvps || []);
    } catch (error) {
      console.error('Error fetching events:', error);
      toast.error('Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEventsData();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const eventId = params.get('eventId');

    if (eventId) {
      setHighlightedEventId(eventId);
      window.setTimeout(() => {
        const element = document.getElementById(`event-card-${eventId}`);
        element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 150);
      navigate('/events', { replace: true });
    }
  }, [location.search, navigate, events.length]);

  const myRsvpMap = useMemo(() => {
    return new Map(myRsvps.map((rsvp) => [rsvp.event._id, rsvp]));
  }, [myRsvps]);

  const handleRSVP = async (eventId: string) => {
    try {
      await eventsAPI.rsvp(eventId);
      toast.success('RSVP successful!');
      await fetchEventsData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'RSVP failed');
    }
  };

  const handleCancelRSVP = async (eventId: string) => {
    try {
      await eventsAPI.cancelRsvp(eventId);
      toast.success('RSVP cancelled');
      await fetchEventsData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to cancel RSVP');
    }
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await eventsAPI.create({
        ...newEvent,
        maxAttendees: Number(newEvent.maxAttendees)
      });

      toast.success('Event created with an AI-generated banner!');
      setShowCreateModal(false);
      setNewEvent({
        title: '',
        description: '',
        date: '',
        location: '',
        organizer: user?.name || '',
        maxAttendees: '100'
      });
      await fetchEventsData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create event');
    }
  };

  const canRegenerate = (event: Event) => {
    if (!user) {
      return false;
    }

    if (user.role === 'admin') {
      return true;
    }

    const createdById = typeof event.createdBy === 'string' ? event.createdBy : event.createdBy._id;
    return createdById === user._id;
  };

  const canManageAttendance = (event: Event) => canRegenerate(event);

  const handleRegenerateBanner = async (eventId: string) => {
    try {
      setRegeneratingEventId(eventId);
      const response = await eventsAPI.regenerateBanner(eventId);
      const source = response.data?.event?.imageSource;

      if (source === 'fallback') {
        toast.warning(response.message || 'Local AI unavailable, fallback banner used');
      } else {
        toast.success(response.message || 'Event banner regenerated');
      }

      await fetchEventsData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to regenerate banner');
    } finally {
      setRegeneratingEventId(null);
    }
  };

  const openAttendanceModal = async (event: Event) => {
    try {
      setAttendanceLoading(true);
      setAttendanceEvent(event);
      const response = await eventsAPI.getAttendance(event._id);
      setAttendanceRecords(response.data?.attendance || []);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to load attendance');
    } finally {
      setAttendanceLoading(false);
    }
  };

  const handleCheckIn = async (eventId: string, attendeeId: string) => {
    try {
      setCheckingInId(attendeeId);
      await eventsAPI.checkIn(eventId, attendeeId);
      toast.success('Attendee checked in');
      await openAttendanceModal(attendanceEvent || events.find((item) => item._id === eventId)!);
      await fetchEventsData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to check in attendee');
    } finally {
      setCheckingInId(null);
    }
  };

  const getAttendeeCount = (event: Event) => event.attendeeCount ?? event.attendees.length;
  const getCheckedInCount = (event: Event) => event.checkedInCount ?? 0;

  const isUserRegistered = (event: Event) => {
    if (typeof event.isRegistered === 'boolean') {
      return event.isRegistered;
    }

    if (!Array.isArray(event.attendees) || !user?._id) {
      return false;
    }

    return event.attendees.some((attendee) =>
      typeof attendee === 'string' ? attendee === user._id : attendee._id === user._id
    );
  };

  const isFull = (event: Event) => getAttendeeCount(event) >= event.maxAttendees;

  const capacityPercent = (event: Event) => {
    if (!event.maxAttendees) {
      return 0;
    }
    return Math.min(100, Math.round((getAttendeeCount(event) / event.maxAttendees) * 100));
  };

  if (loading) {
    return <Loading />;
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl p-6 bg-gradient-to-r from-indigo-700 via-violet-700 to-blue-700 text-white shadow-lg">
        <div className="flex justify-between items-center gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl font-bold">Upcoming Events</h1>
            <p className="text-indigo-100 mt-2">
              Discover, RSVP, track your event attendance, and manage check-ins when you host.
            </p>
          </div>
          <Button onClick={() => setShowCreateModal(true)} className="!bg-white !text-indigo-700 hover:!bg-indigo-50">
            <FaPlus className="inline mr-2" />
            Create Event
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <Card>
          <p className="text-sm text-gray-500">My RSVPs</p>
          <p className="text-3xl font-bold text-gray-800 mt-2">{myRsvps.length}</p>
        </Card>
        <Card>
          <p className="text-sm text-gray-500">My Check-ins</p>
          <p className="text-3xl font-bold text-gray-800 mt-2">{myRsvps.filter((rsvp) => rsvp.checkedInAt).length}</p>
        </Card>
        <Card>
          <p className="text-sm text-gray-500">Hosting Access</p>
          <p className="text-lg font-semibold text-gray-800 mt-2">
            {user?.role === 'admin' ? 'Admin attendance controls enabled' : 'Attendance controls on events you created'}
          </p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {events.map((event) => {
          const myRsvp = myRsvpMap.get(event._id);

          return (
            <Card
              key={event._id}
              className={`p-0 overflow-hidden border ${highlightedEventId === event._id ? 'border-primary-500 ring-2 ring-primary-500' : 'border-gray-100'}`}
            >
              <div id={`event-card-${event._id}`} className="h-44 w-full bg-gradient-to-r from-slate-100 to-slate-200">
                {event.bannerImage ? (
                  <img
                    src={event.bannerImage}
                    alt={`${event.title} banner`}
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                ) : null}
              </div>

              <div className="p-6">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <h3 className="text-2xl font-bold text-gray-800 leading-tight">{event.title}</h3>
                  <span className="text-xs font-semibold px-2 py-1 rounded-full bg-indigo-100 text-indigo-700 whitespace-nowrap">
                    {event.imageSource === 'ai'
                      ? 'AI banner'
                      : event.imageSource === 'local'
                        ? 'Local AI banner'
                        : 'Fallback banner'}
                  </span>
                </div>

                <p className="text-gray-600 mb-4">{event.description}</p>

                <div className="space-y-2 text-sm mb-4">
                  <div className="flex items-center space-x-2">
                    <FaCalendar className="text-gray-500" />
                    <span>{format(new Date(event.date), 'PPP p')}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <FaMapMarkerAlt className="text-gray-500" />
                    <span>{event.location}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <FaUsers className="text-gray-500" />
                    <span>{getAttendeeCount(event)} / {event.maxAttendees} attendees</span>
                  </div>
                  <div className="flex items-center space-x-2 text-gray-500">
                    <FaClipboardCheck />
                    <span>{getCheckedInCount(event)} attendee(s) checked in</span>
                  </div>
                </div>

                <div className="mb-4">
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                    <span>Capacity</span>
                    <span>{capacityPercent(event)}%</span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${isFull(event) ? 'bg-red-500' : 'bg-green-500'}`}
                      style={{ width: `${capacityPercent(event)}%` }}
                    />
                  </div>
                </div>

                <p className="text-sm text-gray-500 mb-2">Organized by: {event.organizer}</p>

                {myRsvp && (
                  <div className="mb-4 rounded-lg bg-emerald-50 border border-emerald-100 p-3 text-sm text-emerald-800">
                    RSVP confirmed
                    {myRsvp.checkedInAt ? ` • Checked in on ${format(new Date(myRsvp.checkedInAt), 'PPP p')}` : ' • Awaiting check-in'}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                  {canRegenerate(event) && (
                    <Button
                      variant="secondary"
                      onClick={() => handleRegenerateBanner(event._id)}
                      isLoading={regeneratingEventId === event._id}
                    >
                      <FaSyncAlt className="inline mr-2" />
                      Regenerate Banner
                    </Button>
                  )}
                  {canManageAttendance(event) && (
                    <Button variant="secondary" onClick={() => openAttendanceModal(event)}>
                      <FaClipboardCheck className="inline mr-2" />
                      Manage Attendance
                    </Button>
                  )}
                </div>

                {isUserRegistered(event) ? (
                  <Button
                    variant="danger"
                    onClick={() => handleCancelRSVP(event._id)}
                    className="w-full"
                  >
                    <FaTimesCircle className="inline mr-2" />
                    Cancel RSVP
                  </Button>
                ) : (
                  <Button
                    variant="success"
                    onClick={() => handleRSVP(event._id)}
                    className="w-full"
                    disabled={isFull(event)}
                  >
                    {isFull(event) ? (
                      'Event Full'
                    ) : (
                      <>
                        <FaCheckCircle className="inline mr-2" />
                        RSVP
                      </>
                    )}
                  </Button>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      {events.length === 0 && (
        <Card>
          <p className="text-center text-gray-500 py-8">No upcoming events at the moment.</p>
        </Card>
      )}

      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-2">Create New Event</h2>
            <p className="text-sm text-gray-600 mb-4 flex items-center">
              <FaMagic className="mr-2 text-indigo-600" />
              A banner image will be generated automatically from title, description, and attendee capacity.
            </p>
            <form onSubmit={handleCreateEvent}>
              <input
                type="text"
                placeholder="Event Title"
                className="w-full px-4 py-2 border rounded-lg mb-4"
                value={newEvent.title}
                onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                required
              />
              <textarea
                placeholder="Event Description"
                className="w-full px-4 py-2 border rounded-lg mb-4"
                rows={4}
                value={newEvent.description}
                onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                required
              />
              <input
                type="datetime-local"
                className="w-full px-4 py-2 border rounded-lg mb-4"
                value={newEvent.date}
                onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
                required
              />
              <input
                type="text"
                placeholder="Location"
                className="w-full px-4 py-2 border rounded-lg mb-4"
                value={newEvent.location}
                onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })}
                required
              />
              <input
                type="text"
                placeholder="Organizer Name"
                className="w-full px-4 py-2 border rounded-lg mb-4"
                value={newEvent.organizer}
                onChange={(e) => setNewEvent({ ...newEvent, organizer: e.target.value })}
                required
              />
              <input
                type="number"
                min={1}
                placeholder="Attendee Capacity"
                className="w-full px-4 py-2 border rounded-lg mb-4"
                value={newEvent.maxAttendees}
                onChange={(e) => setNewEvent({ ...newEvent, maxAttendees: e.target.value })}
                required
              />
              <div className="flex space-x-4">
                <Button type="submit" className="flex-1">
                  Create Event
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

      {attendanceEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between gap-4 mb-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">Attendance Manager</h2>
                <p className="text-sm text-gray-600">{attendanceEvent.title}</p>
              </div>
              <Button variant="secondary" onClick={() => setAttendanceEvent(null)}>
                Close
              </Button>
            </div>

            {attendanceLoading ? (
              <Loading />
            ) : attendanceRecords.length === 0 ? (
              <p className="text-gray-500 py-8 text-center">No attendees have RSVP'd yet.</p>
            ) : (
              <div className="space-y-3">
                {attendanceRecords.map((record) => {
                  const attendee = record.user as User;
                  return (
                    <div key={record._id} className="border rounded-lg p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div>
                        <p className="font-semibold text-gray-800">{attendee.name}</p>
                        <p className="text-sm text-gray-600">{attendee.email}</p>
                        <p className="text-xs text-gray-400 mt-1">RSVP'd {format(new Date(record.createdAt), 'PPP p')}</p>
                        {record.checkedInAt && (
                          <p className="text-xs text-emerald-700 mt-1">
                            Checked in {format(new Date(record.checkedInAt), 'PPP p')}
                          </p>
                        )}
                      </div>

                      {record.checkedInAt ? (
                        <span className="text-sm font-semibold px-3 py-2 rounded-full bg-emerald-100 text-emerald-700">
                          Checked in
                        </span>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => handleCheckIn(attendanceEvent._id, attendee._id)}
                          isLoading={checkingInId === attendee._id}
                        >
                          Check In
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
};

export default Events;
