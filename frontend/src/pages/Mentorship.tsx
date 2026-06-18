import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { mentorshipAPI } from '../services/apiService';
import {
  MentorMatch,
  MentorshipRequest,
  MentorshipSession,
  User
} from '../types';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import Card from '../components/Card';
import Button from '../components/Button';
import Loading from '../components/Loading';
import { toast } from 'react-toastify';
import {
  FaCalendarAlt,
  FaCheckCircle,
  FaClock,
  FaPlus,
  FaSearch,
  FaTimesCircle,
  FaUserFriends
} from 'react-icons/fa';
import { format } from 'date-fns';

const Mentorship: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  const { refreshSummary } = useNotifications();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [savingMentorSettings, setSavingMentorSettings] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [scheduling, setScheduling] = useState(false);
  const [updatingSessionId, setUpdatingSessionId] = useState<string | null>(null);

  const [matches, setMatches] = useState<MentorMatch[]>([]);
  const [sentRequests, setSentRequests] = useState<MentorshipRequest[]>([]);
  const [receivedRequests, setReceivedRequests] = useState<MentorshipRequest[]>([]);
  const [activeConnections, setActiveConnections] = useState<MentorshipRequest[]>([]);
  const [sessions, setSessions] = useState<MentorshipSession[]>([]);
  const [highlightedRequestId, setHighlightedRequestId] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<'matches' | 'received' | 'sent' | 'connections' | 'sessions'>('matches');
  const [search, setSearch] = useState('');

  const [showRequestModal, setShowRequestModal] = useState(false);
  const [showMentorSettingsModal, setShowMentorSettingsModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [selectedMentor, setSelectedMentor] = useState<MentorMatch | null>(null);
  const [selectedConnection, setSelectedConnection] = useState<MentorshipRequest | null>(null);
  const [requestForm, setRequestForm] = useState({
    goals: '',
    message: ''
  });
  const [scheduleForm, setScheduleForm] = useState({
    scheduledFor: '',
    durationMinutes: '60',
    agenda: '',
    meetingLink: ''
  });
  const [mentorSettingsForm, setMentorSettingsForm] = useState({
    openToMentorship: user?.openToMentorship || false,
    mentorshipTopics: (user?.mentorshipTopics || []).join(', '),
    skills: (user?.skills || []).join(', '),
    mentorshipAvailability: user?.mentorshipAvailability || 'not-available',
    mentorshipCapacity: String(user?.mentorshipCapacity || 1)
  });

  const availabilityOptions = ['not-available', 'weekdays-evenings', 'weekends', 'flexible'] as const;
  type MentorshipAvailability = (typeof availabilityOptions)[number];

  useEffect(() => {
    setMentorSettingsForm({
      openToMentorship: user?.openToMentorship || false,
      mentorshipTopics: (user?.mentorshipTopics || []).join(', '),
      skills: (user?.skills || []).join(', '),
      mentorshipAvailability: user?.mentorshipAvailability || 'not-available',
      mentorshipCapacity: String(user?.mentorshipCapacity || 1)
    });
  }, [user]);

  const fetchMentorshipData = async () => {
    try {
      const [matchesResponse, requestsResponse, sessionsResponse] = await Promise.all([
        mentorshipAPI.getMatches(),
        mentorshipAPI.getMyRequests(),
        mentorshipAPI.getMySessions()
      ]);

      setMatches(matchesResponse.data?.matches || []);
      setSentRequests(requestsResponse.data?.sentRequests || []);
      setReceivedRequests(requestsResponse.data?.receivedRequests || []);
      setActiveConnections(requestsResponse.data?.activeConnections || []);
      setSessions(sessionsResponse.data?.sessions || []);
    } catch (error) {
      toast.error('Failed to load mentorship data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMentorshipData();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    const requestId = params.get('requestId');

    if (tab === 'matches' || tab === 'received' || tab === 'sent' || tab === 'connections' || tab === 'sessions') {
      setActiveTab(tab);
    }

    if (requestId) {
      setHighlightedRequestId(requestId);
      window.setTimeout(() => {
        const element = document.getElementById(`mentorship-request-${requestId}`) || document.getElementById(`mentorship-session-${requestId}`);
        element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 150);
      navigate('/mentorship', { replace: true });
    }
  }, [location.search, navigate, receivedRequests.length, sentRequests.length, activeConnections.length, sessions.length]);

  const filteredMatches = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) {
      return matches;
    }

    return matches.filter((mentor) => {
      return [mentor.name, mentor.department, mentor.jobTitle, mentor.company, mentor.location]
        .filter(Boolean)
        .concat(mentor.mentorshipTopics || [])
        .concat(mentor.skills || [])
        .some((value) => String(value).toLowerCase().includes(keyword));
    });
  }, [matches, search]);

  const openRequestModal = (mentor: MentorMatch) => {
    setSelectedMentor(mentor);
    setRequestForm({ goals: '', message: '' });
    setShowRequestModal(true);
  };

  const openScheduleModal = (request: MentorshipRequest) => {
    setSelectedConnection(request);
    setScheduleForm({
      scheduledFor: '',
      durationMinutes: '60',
      agenda: '',
      meetingLink: ''
    });
    setShowScheduleModal(true);
  };

  const parseCommaSeparated = (raw: string, maxItems: number): string[] => {
    return raw
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)
      .slice(0, maxItems);
  };

  const handleSaveMentorSettings = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setSavingMentorSettings(true);
      await updateUser({
        openToMentorship: mentorSettingsForm.openToMentorship,
        mentorshipTopics: mentorSettingsForm.openToMentorship
          ? parseCommaSeparated(mentorSettingsForm.mentorshipTopics, 15)
          : [],
        skills: parseCommaSeparated(mentorSettingsForm.skills, 20),
        mentorshipAvailability: mentorSettingsForm.openToMentorship
          ? (mentorSettingsForm.mentorshipAvailability as MentorshipAvailability)
          : 'not-available',
        mentorshipCapacity: mentorSettingsForm.openToMentorship
          ? Number(mentorSettingsForm.mentorshipCapacity || 1)
          : 1
      });
      setShowMentorSettingsModal(false);
      await fetchMentorshipData();
    } catch {
      // Toast handled in updateUser.
    } finally {
      setSavingMentorSettings(false);
    }
  };

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMentor) {
      return;
    }

    try {
      setSubmitting(true);
      await mentorshipAPI.createRequest({
        mentorId: selectedMentor._id,
        goals: requestForm.goals,
        message: requestForm.message
      });
      toast.success('Mentorship request sent successfully');
      setShowRequestModal(false);
      await refreshSummary();
      await fetchMentorshipData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Unable to send mentorship request');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedConnection) {
      return;
    }

    try {
      setScheduling(true);
      await mentorshipAPI.createSession({
        requestId: selectedConnection._id,
        scheduledFor: scheduleForm.scheduledFor,
        durationMinutes: Number(scheduleForm.durationMinutes),
        agenda: scheduleForm.agenda,
        meetingLink: scheduleForm.meetingLink || undefined
      });
      toast.success('Mentorship session scheduled');
      setShowScheduleModal(false);
      await refreshSummary();
      await fetchMentorshipData();
      setActiveTab('sessions');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Unable to schedule session');
    } finally {
      setScheduling(false);
    }
  };

  const handleUpdateStatus = async (
    requestId: string,
    status: 'accepted' | 'rejected' | 'cancelled'
  ) => {
    try {
      setUpdatingId(requestId);
      await mentorshipAPI.updateRequestStatus(requestId, status);
      toast.success(`Request ${status} successfully`);
      await refreshSummary();
      await fetchMentorshipData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Unable to update request');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleUpdateSessionStatus = async (sessionId: string, status: 'completed' | 'cancelled') => {
    try {
      setUpdatingSessionId(sessionId);
      const notes = window.prompt(
        status === 'completed' ? 'Add optional completion notes:' : 'Add optional cancellation reason:'
      ) || undefined;
      await mentorshipAPI.updateSessionStatus(sessionId, status, notes);
      toast.success(`Session ${status}`);
      await refreshSummary();
      await fetchMentorshipData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Unable to update session');
    } finally {
      setUpdatingSessionId(null);
    }
  };

  const getMentor = (request: MentorshipRequest): User => request.mentor as User;
  const getMentee = (request: MentorshipRequest): User => request.mentee as User;
  const getOtherPerson = (request: MentorshipRequest): User => {
    const mentor = getMentor(request);
    const mentee = getMentee(request);
    return mentor._id === user?._id ? mentee : mentor;
  };
  const getSessionRequestId = (session: MentorshipSession) =>
    typeof session.mentorshipRequest === 'string'
      ? session.mentorshipRequest
      : session.mentorshipRequest._id;
  const getSessionOtherPerson = (session: MentorshipSession): User => {
    const mentor = session.mentor as User;
    const mentee = session.mentee as User;
    return mentor._id === user?._id ? mentee : mentor;
  };

  const openMessageComposer = (person: User) => {
    const params = new URLSearchParams({
      receiver: person._id,
      subject: `Mentorship connection with ${person.name}`
    });
    navigate(`/messages?${params.toString()}`);
  };

  if (loading) {
    return <Loading />;
  }

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Mentorship Matching</h1>
          <p className="text-gray-600">Find mentors, send requests, schedule sessions, and build long-term connections.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
        <Card>
          <p className="text-sm text-gray-500">Open mentor matches</p>
          <p className="text-3xl font-bold text-gray-800 mt-2">{matches.length}</p>
        </Card>
        <Card>
          <p className="text-sm text-gray-500">Active connections</p>
          <p className="text-3xl font-bold text-gray-800 mt-2">{activeConnections.length}</p>
        </Card>
        <Card>
          <p className="text-sm text-gray-500">Scheduled sessions</p>
          <p className="text-3xl font-bold text-gray-800 mt-2">{sessions.filter((session) => session.status === 'scheduled').length}</p>
        </Card>
      </div>

      <Card className="mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-gray-800">Mentor Mode</h2>
            <p className="text-sm text-gray-600">
              Turn this on to appear in mentor matches and receive mentorship requests.
            </p>
            <div className="mt-2">
              {user?.openToMentorship ? (
                <span className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full font-semibold">
                  You are currently a mentor
                </span>
              ) : (
                <span className="text-xs bg-gray-100 text-gray-700 px-3 py-1 rounded-full font-semibold">
                  Mentor mode is off
                </span>
              )}
            </div>
          </div>
          <Button onClick={() => setShowMentorSettingsModal(true)}>
            {user?.openToMentorship ? 'Update Mentor Settings' : 'Become a Mentor'}
          </Button>
        </div>
      </Card>

      <div className="flex flex-wrap gap-3 border-b mb-6">
        {[
          ['matches', `Mentor Matches (${matches.length})`],
          ['received', `Received Requests (${receivedRequests.filter((request) => request.status === 'pending').length})`],
          ['sent', `Sent Requests (${sentRequests.length})`],
          ['connections', `Active Connections (${activeConnections.length})`],
          ['sessions', `Sessions (${sessions.length})`]
        ].map(([tab, label]) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as typeof activeTab)}
            className={`pb-2 px-4 font-semibold ${activeTab === tab ? 'text-primary-600 border-b-2 border-primary-600' : 'text-gray-500'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {activeTab === 'matches' && (
        <div>
          <Card className="mb-5">
            <div className="relative">
              <FaSearch className="absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Search mentors by name, department, company, or location"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg"
              />
            </div>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {filteredMatches.map((mentor) => (
              <Card key={mentor._id}>
                <div className="flex items-start justify-between mb-3 gap-3">
                  <div>
                    <h3 className="text-xl font-bold text-gray-800">{mentor.name}</h3>
                    <p className="text-sm text-gray-600">{mentor.department} • Class of {mentor.graduationYear}</p>
                    <p className="text-sm text-gray-600">
                      {mentor.jobTitle || 'Professional'}
                      {mentor.company ? ` at ${mentor.company}` : ''}
                    </p>
                  </div>
                  <span className="bg-emerald-100 text-emerald-700 text-sm font-semibold px-3 py-1 rounded-full">
                    {mentor.compatibilityScore}% match
                  </span>
                </div>

                {mentor.bio && <p className="text-sm text-gray-700 mb-4">{mentor.bio}</p>}

                {(mentor.mentorshipTopics || []).length > 0 && (
                  <div className="mb-3">
                    <p className="text-xs text-gray-500 mb-1">Mentorship Topics</p>
                    <div className="flex flex-wrap gap-2">
                      {(mentor.mentorshipTopics || []).slice(0, 6).map((topic) => (
                        <span key={topic} className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                          {topic}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {(mentor.skills || []).length > 0 && (
                  <div className="mb-3">
                    <p className="text-xs text-gray-500 mb-1">Skills</p>
                    <div className="flex flex-wrap gap-2">
                      {(mentor.skills || []).slice(0, 6).map((skill) => (
                        <span key={skill} className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="text-xs text-gray-500 mb-4">
                  {mentor.location ? `Location: ${mentor.location}` : 'Location not specified'}
                  {mentor.mentorshipAvailability && mentor.mentorshipAvailability !== 'not-available'
                    ? ` • Availability: ${mentor.mentorshipAvailability.replace('-', ' ')}`
                    : ''}
                </div>

                <div className="text-xs text-gray-500 mb-4">
                  Capacity: {mentor.acceptedCount || 0}/{mentor.mentorshipCapacity || 1}
                  {mentor.isAtCapacity ? ' • Full' : ` • ${mentor.availableSlots || 0} slot(s) left`}
                </div>

                <Button
                  onClick={() => openRequestModal(mentor)}
                  disabled={mentor.alreadyRequested || mentor.isAtCapacity}
                  className="w-full"
                >
                  {mentor.alreadyRequested
                    ? 'Request Pending'
                    : mentor.isAtCapacity
                      ? 'Mentor Full'
                      : 'Request Mentorship'}
                </Button>
              </Card>
            ))}
          </div>

          {filteredMatches.length === 0 && (
            <Card>
              <p className="text-center text-gray-500 py-6">No mentors found for this filter.</p>
            </Card>
          )}
        </div>
      )}

      {activeTab === 'received' && (
        <div className="space-y-4">
          {receivedRequests.map((request) => {
            const mentee = getMentee(request);
            const isPending = request.status === 'pending';

            return (
              <Card
                key={request._id}
                className={highlightedRequestId === request._id ? 'ring-2 ring-primary-500' : ''}
              >
                <div id={`mentorship-request-${request._id}`} />
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-bold text-gray-800">{mentee.name}</h3>
                    <p className="text-sm text-gray-600">{mentee.department} • Class of {mentee.graduationYear}</p>
                    <p className="text-sm text-gray-800 mt-2"><strong>Goals:</strong> {request.goals}</p>
                    {request.message && <p className="text-sm text-gray-700 mt-1"><strong>Message:</strong> {request.message}</p>}
                    <p className="text-xs text-gray-500 mt-2">
                      Submitted {format(new Date(request.createdAt), 'PPP p')}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {isPending ? (
                      <>
                        <Button
                          variant="success"
                          isLoading={updatingId === request._id}
                          onClick={() => handleUpdateStatus(request._id, 'accepted')}
                        >
                          Accept
                        </Button>
                        <Button
                          variant="danger"
                          isLoading={updatingId === request._id}
                          onClick={() => handleUpdateStatus(request._id, 'rejected')}
                        >
                          Reject
                        </Button>
                      </>
                    ) : (
                      <span className="text-sm font-semibold text-gray-600 capitalize">{request.status}</span>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}

          {receivedRequests.length === 0 && (
            <Card>
              <p className="text-center text-gray-500 py-6">No mentorship requests received yet.</p>
            </Card>
          )}
        </div>
      )}

      {activeTab === 'sent' && (
        <div className="space-y-4">
          {sentRequests.map((request) => {
            const mentor = getMentor(request);

            return (
              <Card
                key={request._id}
                className={highlightedRequestId === request._id ? 'ring-2 ring-primary-500' : ''}
              >
                <div id={`mentorship-request-${request._id}`} />
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-bold text-gray-800">{mentor.name}</h3>
                    <p className="text-sm text-gray-600">{mentor.department} • {mentor.jobTitle || 'Professional'}</p>
                    <p className="text-sm text-gray-800 mt-2"><strong>Goals:</strong> {request.goals}</p>
                    <p className="text-xs text-gray-500 mt-2">
                      Submitted {format(new Date(request.createdAt), 'PPP p')}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {request.status === 'pending' ? (
                      <>
                        <FaClock className="text-amber-500" />
                        <span className="text-amber-600 font-semibold">Pending</span>
                        <Button
                          size="sm"
                          variant="secondary"
                          isLoading={updatingId === request._id}
                          onClick={() => handleUpdateStatus(request._id, 'cancelled')}
                        >
                          Cancel
                        </Button>
                      </>
                    ) : request.status === 'accepted' ? (
                      <>
                        <FaCheckCircle className="text-green-600" />
                        <span className="text-green-700 font-semibold">Accepted</span>
                        <Button size="sm" onClick={() => openMessageComposer(mentor)}>
                          Message Mentor
                        </Button>
                      </>
                    ) : request.status === 'rejected' ? (
                      <>
                        <FaTimesCircle className="text-red-600" />
                        <span className="text-red-700 font-semibold">Rejected</span>
                      </>
                    ) : (
                      <span className="text-gray-600 font-semibold capitalize">{request.status}</span>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}

          {sentRequests.length === 0 && (
            <Card>
              <p className="text-center text-gray-500 py-6">No mentorship requests sent yet.</p>
            </Card>
          )}
        </div>
      )}

      {activeTab === 'connections' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {activeConnections.map((request) => {
            const otherPerson = getOtherPerson(request);

            return (
              <Card
                key={request._id}
                className={highlightedRequestId === request._id ? 'ring-2 ring-primary-500' : ''}
              >
                <div id={`mentorship-request-${request._id}`} />
                <div className="flex items-center gap-3 mb-3">
                  <FaUserFriends className="text-primary-600 text-xl" />
                  <div>
                    <h3 className="text-lg font-bold text-gray-800">{otherPerson.name}</h3>
                    <p className="text-sm text-gray-600">{otherPerson.department} • {otherPerson.jobTitle || 'Alumni Member'}</p>
                  </div>
                </div>

                <p className="text-sm text-gray-700 mb-2"><strong>Mentorship Goals:</strong> {request.goals}</p>
                <p className="text-xs text-gray-500">Connected since {format(new Date(request.updatedAt), 'PPP')}</p>
                <div className="mt-4 flex flex-wrap gap-3">
                  <Button size="sm" onClick={() => openMessageComposer(otherPerson)}>
                    Message {getMentor(request)._id === user?._id ? 'Mentee' : 'Mentor'}
                  </Button>
                  <Button size="sm" variant="secondary" onClick={() => openScheduleModal(request)}>
                    <FaCalendarAlt className="inline mr-2" />
                    Schedule Session
                  </Button>
                </div>
              </Card>
            );
          })}

          {activeConnections.length === 0 && (
            <Card>
              <p className="text-center text-gray-500 py-6">No active mentorship connections yet.</p>
            </Card>
          )}
        </div>
      )}

      {activeTab === 'sessions' && (
        <div className="space-y-4">
          {sessions.map((session) => {
            const otherPerson = getSessionOtherPerson(session);
            const requestId = getSessionRequestId(session);
            return (
              <Card
                key={session._id}
                className={highlightedRequestId === requestId ? 'ring-2 ring-primary-500' : ''}
              >
                <div id={`mentorship-session-${requestId}`} />
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <FaCalendarAlt className="text-primary-600" />
                      <h3 className="text-lg font-bold text-gray-800">Session with {otherPerson.name}</h3>
                    </div>
                    <p className="text-sm text-gray-600">{format(new Date(session.scheduledFor), 'PPP p')} • {session.durationMinutes} minutes</p>
                    <p className="text-sm text-gray-800 mt-2"><strong>Agenda:</strong> {session.agenda}</p>
                    {session.meetingLink && (
                      <a href={session.meetingLink} target="_blank" rel="noreferrer" className="text-sm text-primary-700 underline mt-2 inline-block">
                        Open meeting link
                      </a>
                    )}
                    {session.notes && (
                      <p className="text-sm text-gray-600 mt-2"><strong>Notes:</strong> {session.notes}</p>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`text-sm font-semibold px-3 py-1 rounded-full ${session.status === 'scheduled' ? 'bg-amber-100 text-amber-700' : session.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {session.status}
                    </span>
                    {session.status === 'scheduled' && (
                      <>
                        <Button
                          size="sm"
                          onClick={() => handleUpdateSessionStatus(session._id, 'completed')}
                          isLoading={updatingSessionId === session._id}
                        >
                          Complete
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => handleUpdateSessionStatus(session._id, 'cancelled')}
                          isLoading={updatingSessionId === session._id}
                        >
                          Cancel
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}

          {sessions.length === 0 && (
            <Card>
              <p className="text-center text-gray-500 py-6">No mentorship sessions scheduled yet.</p>
            </Card>
          )}
        </div>
      )}

      {showRequestModal && selectedMentor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="max-w-lg w-full">
            <h2 className="text-2xl font-bold mb-2">Request Mentorship</h2>
            <p className="text-sm text-gray-600 mb-4">
              Send a mentorship request to <strong>{selectedMentor.name}</strong>.
            </p>

            <form onSubmit={handleCreateRequest}>
              <div className="mb-4">
                <label className="block text-gray-700 font-medium mb-2">Your mentorship goals</label>
                <textarea
                  className="w-full px-4 py-2 border rounded-lg"
                  rows={4}
                  value={requestForm.goals}
                  onChange={(e) => setRequestForm({ ...requestForm, goals: e.target.value })}
                  placeholder="Example: I want guidance on moving from student projects into an entry-level software engineering role."
                  required
                  minLength={10}
                  maxLength={300}
                />
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 font-medium mb-2">Optional intro message</label>
                <textarea
                  className="w-full px-4 py-2 border rounded-lg"
                  rows={3}
                  value={requestForm.message}
                  onChange={(e) => setRequestForm({ ...requestForm, message: e.target.value })}
                  placeholder="Share context so the mentor can better help you."
                  maxLength={500}
                />
              </div>

              <div className="flex gap-3">
                <Button type="submit" className="flex-1" isLoading={submitting}>Send Request</Button>
                <Button
                  type="button"
                  variant="secondary"
                  className="flex-1"
                  onClick={() => setShowRequestModal(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {showScheduleModal && selectedConnection && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="max-w-xl w-full">
            <h2 className="text-2xl font-bold mb-2">Schedule Mentorship Session</h2>
            <p className="text-sm text-gray-600 mb-4">
              Book a session with <strong>{getOtherPerson(selectedConnection).name}</strong>.
            </p>

            <form onSubmit={handleCreateSession}>
              <div className="mb-4">
                <label className="block text-gray-700 font-medium mb-2">Session date and time</label>
                <input
                  type="datetime-local"
                  className="w-full px-4 py-2 border rounded-lg"
                  value={scheduleForm.scheduledFor}
                  onChange={(e) => setScheduleForm((prev) => ({ ...prev, scheduledFor: e.target.value }))}
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 font-medium mb-2">Duration (minutes)</label>
                <input
                  type="number"
                  min={15}
                  max={240}
                  className="w-full px-4 py-2 border rounded-lg"
                  value={scheduleForm.durationMinutes}
                  onChange={(e) => setScheduleForm((prev) => ({ ...prev, durationMinutes: e.target.value }))}
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 font-medium mb-2">Agenda</label>
                <textarea
                  className="w-full px-4 py-2 border rounded-lg"
                  rows={4}
                  value={scheduleForm.agenda}
                  onChange={(e) => setScheduleForm((prev) => ({ ...prev, agenda: e.target.value }))}
                  placeholder="Example: Review portfolio, discuss internships, and plan next steps."
                  minLength={10}
                  maxLength={500}
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 font-medium mb-2">Meeting link (optional)</label>
                <input
                  type="url"
                  className="w-full px-4 py-2 border rounded-lg"
                  value={scheduleForm.meetingLink}
                  onChange={(e) => setScheduleForm((prev) => ({ ...prev, meetingLink: e.target.value }))}
                  placeholder="https://meet.google.com/..."
                />
              </div>

              <div className="flex gap-3">
                <Button type="submit" className="flex-1" isLoading={scheduling}>
                  <FaPlus className="inline mr-2" />
                  Schedule Session
                </Button>
                <Button type="button" variant="secondary" className="flex-1" onClick={() => setShowScheduleModal(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {showMentorSettingsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="max-w-xl w-full">
            <h2 className="text-2xl font-bold mb-2">Mentor Settings</h2>
            <p className="text-sm text-gray-600 mb-4">Choose if you want to be discoverable as a mentor and what you can help with.</p>

            <form onSubmit={handleSaveMentorSettings}>
              <label className="flex items-center space-x-2 mb-4">
                <input
                  type="checkbox"
                  checked={mentorSettingsForm.openToMentorship}
                  onChange={(e) =>
                    setMentorSettingsForm((prev) => ({
                      ...prev,
                      openToMentorship: e.target.checked
                    }))
                  }
                />
                <span className="text-gray-700">I want to become a mentor</span>
              </label>

              <div className="mb-4">
                <label className="block text-gray-700 font-medium mb-2">Skills (comma-separated)</label>
                <input
                  type="text"
                  value={mentorSettingsForm.skills}
                  onChange={(e) =>
                    setMentorSettingsForm((prev) => ({
                      ...prev,
                      skills: e.target.value
                    }))
                  }
                  placeholder="React, Node.js, Leadership"
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 font-medium mb-2">Mentorship Topics (comma-separated)</label>
                <input
                  type="text"
                  value={mentorSettingsForm.mentorshipTopics}
                  onChange={(e) =>
                    setMentorSettingsForm((prev) => ({
                      ...prev,
                      mentorshipTopics: e.target.value
                    }))
                  }
                  disabled={!mentorSettingsForm.openToMentorship}
                  placeholder="Interview prep, Career planning, Freelancing"
                  className="w-full px-4 py-2 border rounded-lg disabled:bg-gray-100"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
                <div>
                  <label className="block text-gray-700 font-medium mb-2">Availability</label>
                  <select
                    value={mentorSettingsForm.mentorshipAvailability}
                    onChange={(e) =>
                      setMentorSettingsForm((prev) => ({
                        ...prev,
                        mentorshipAvailability: e.target.value as MentorshipAvailability
                      }))
                    }
                    disabled={!mentorSettingsForm.openToMentorship}
                    className="w-full px-4 py-2 border rounded-lg disabled:bg-gray-100"
                  >
                    <option value="not-available">Not available</option>
                    <option value="weekdays-evenings">Weekdays evenings</option>
                    <option value="weekends">Weekends</option>
                    <option value="flexible">Flexible</option>
                  </select>
                </div>

                <div>
                  <label className="block text-gray-700 font-medium mb-2">Capacity</label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={mentorSettingsForm.mentorshipCapacity}
                    onChange={(e) =>
                      setMentorSettingsForm((prev) => ({
                        ...prev,
                        mentorshipCapacity: e.target.value
                      }))
                    }
                    disabled={!mentorSettingsForm.openToMentorship}
                    className="w-full px-4 py-2 border rounded-lg disabled:bg-gray-100"
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <Button type="submit" className="flex-1" isLoading={savingMentorSettings}>
                  Save Settings
                </Button>
                <Button type="button" variant="secondary" className="flex-1" onClick={() => setShowMentorSettingsModal(false)}>
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

export default Mentorship;
