import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { messagesAPI, alumniAPI } from '../services/apiService';
import { Message, User } from '../types';
import { useNotifications } from '../context/NotificationContext';
import Card from '../components/Card';
import Button from '../components/Button';
import Loading from '../components/Loading';
import { FaEnvelope, FaEnvelopeOpen, FaPlus, FaPaperPlane, FaInbox, FaReply } from 'react-icons/fa';
import { format } from 'date-fns';
import { toast } from 'react-toastify';

const Messages: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { refreshSummary } = useNotifications();
  const [messages, setMessages] = useState<Message[]>([]);
  const [sentMessages, setSentMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'received' | 'sent'>('received');
  const [showComposeModal, setShowComposeModal] = useState(false);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [loadingMessage, setLoadingMessage] = useState(false);
  const [suggestingReply, setSuggestingReply] = useState(false);
  const [replyToMessageId, setReplyToMessageId] = useState<string | null>(null);
  const [alumni, setAlumni] = useState<User[]>([]);
  const [newMessage, setNewMessage] = useState({
    receiver: '',
    subject: '',
    message: ''
  });

  useEffect(() => {
    fetchMessages();
    fetchAlumni();
  }, []);

  useEffect(() => {
    if (alumni.length === 0) {
      return;
    }

    const params = new URLSearchParams(location.search);
    const receiver = params.get('receiver');
    if (!receiver) {
      return;
    }

    const recipient = alumni.find((member) => member._id === receiver);
    if (!recipient) {
      return;
    }

    setNewMessage({
      receiver,
      subject: params.get('subject') || `Mentorship connection with ${recipient.name}`,
      message: params.get('body') || ''
    });
    setReplyToMessageId(null);
    setShowComposeModal(true);
    navigate('/messages', { replace: true });
  }, [alumni, location.search, navigate]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    const messageId = params.get('messageId');

    if (tab === 'received' || tab === 'sent') {
      setActiveTab(tab);
    }

    if (!messageId || loading) {
      return;
    }

    handleOpenMessage(messageId);
    navigate('/messages', { replace: true });
  }, [loading, location.search, navigate]);

  const fetchMessages = async () => {
    try {
      const [receivedResponse, sentResponse] = await Promise.all([
        messagesAPI.getReceived(),
        messagesAPI.getSent()
      ]);
      setMessages(receivedResponse.data?.messages || []);
      setSentMessages(sentResponse.data?.messages || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAlumni = async () => {
    try {
      const response = await alumniAPI.getAll();
      setAlumni(response.data?.alumni || []);
    } catch (error) {
      console.error('Error fetching alumni:', error);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await messagesAPI.send(newMessage);
      toast.success('Message sent successfully!');
      setShowComposeModal(false);
      setReplyToMessageId(null);
      setNewMessage({
        receiver: '',
        subject: '',
        message: ''
      });
      fetchMessages();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to send message');
    }
  };

  const handleOpenMessage = async (messageId: string) => {
    try {
      setLoadingMessage(true);
      const response = await messagesAPI.getById(messageId);
      const fullMessage = response.data?.message;

      if (!fullMessage) {
        toast.error('Unable to open message');
        return;
      }

      setSelectedMessage(fullMessage);
      setShowMessageModal(true);

      // Keep inbox badge and styling in sync after opening a received message.
      setMessages((prevMessages) =>
        prevMessages.map((msg) =>
          msg._id === fullMessage._id ? { ...msg, isRead: fullMessage.isRead } : msg
        )
      );
      refreshSummary();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to open message');
    } finally {
      setLoadingMessage(false);
    }
  };

  const handleReply = () => {
    if (!selectedMessage) {
      return;
    }

    const sender = selectedMessage.sender as User;
    const subjectPrefix = 'Re: ';
    const subject = selectedMessage.subject.startsWith(subjectPrefix)
      ? selectedMessage.subject
      : `${subjectPrefix}${selectedMessage.subject}`;

    setNewMessage({
      receiver: sender?._id || '',
      subject,
      message: ''
    });
    setReplyToMessageId(selectedMessage._id);
    setShowMessageModal(false);
    setSelectedMessage(null);
    setShowComposeModal(true);
  };

  const handleSuggestReply = async () => {
    if (!replyToMessageId) {
      toast.info('Open a received message and click Reply first to use AI suggestions.');
      return;
    }

    try {
      setSuggestingReply(true);
      const response = await messagesAPI.suggestReply(replyToMessageId, {
        maxWords: 120
      });

      const draft = response.data?.draft;
      const appliedTone = response.data?.appliedTone;
      const detectedIntent = response.data?.detectedIntent;
      const classificationSource = response.data?.classificationSource;
      const styleExampleCount = response.data?.styleExampleCount;
      if (!draft) {
        toast.error('No draft returned');
        return;
      }

      setNewMessage((prev) => ({
        ...prev,
        message: draft
      }));

      toast.success(
        `Draft generated: ${detectedIntent || 'general'} intent, ${appliedTone || 'matched'} tone, ${styleExampleCount || 0} style examples (${classificationSource || 'rules'})`
      );
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to generate reply draft');
    } finally {
      setSuggestingReply(false);
    }
  };

  const displayMessages = activeTab === 'received' ? messages : sentMessages;

  if (loading) {
    return <Loading />;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Messages</h1>
        <Button
          onClick={() => {
            setReplyToMessageId(null);
            setShowComposeModal(true);
          }}
        >
          <FaPlus className="inline mr-2" />
          Compose Message
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex space-x-4 mb-6 border-b">
        <button
          className={`pb-2 px-4 font-semibold transition ${
            activeTab === 'received'
              ? 'text-primary-600 border-b-2 border-primary-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('received')}
        >
          <FaInbox className="inline mr-2" />
          Received ({messages.length})
        </button>
        <button
          className={`pb-2 px-4 font-semibold transition ${
            activeTab === 'sent'
              ? 'text-primary-600 border-b-2 border-primary-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('sent')}
        >
          <FaPaperPlane className="inline mr-2" />
          Sent ({sentMessages.length})
        </button>
      </div>

      {/* Messages List */}
      <div className="space-y-4">
        {displayMessages.map((message) => (
          <Card
            key={message._id}
            className={`${!message.isRead && activeTab === 'received' ? 'bg-blue-50' : ''} cursor-pointer hover:shadow-lg transition-shadow`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3 flex-1">
                <div className="text-2xl text-gray-400">
                  {message.isRead ? <FaEnvelopeOpen /> : <FaEnvelope />}
                </div>
                <div className="flex-1" onClick={() => handleOpenMessage(message._id)}>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-bold text-gray-800">{message.subject}</h3>
                    {!message.isRead && activeTab === 'received' && (
                      <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full">New</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mb-2">
                    {activeTab === 'received' ? (
                      <>
                        <strong>From:</strong> {(message.sender as any)?.name || 'Unknown'}
                      </>
                    ) : (
                      <>
                        <strong>To:</strong> {(message.receiver as any)?.name || 'Unknown'}
                      </>
                    )}
                  </p>
                  <p className="text-gray-700 mb-3 line-clamp-2">{message.message}</p>
                  <p className="text-xs text-gray-500">
                    {format(new Date(message.createdAt), 'PPP p')}
                  </p>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {displayMessages.length === 0 && (
        <Card>
          <p className="text-center text-gray-500 py-8">
            {activeTab === 'received' ? 'No messages received' : 'No messages sent'}
          </p>
        </Card>
      )}

      {/* Compose Message Modal */}
      {showComposeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="max-w-2xl w-full">
            <h2 className="text-2xl font-bold mb-4">Compose Message</h2>
            <form onSubmit={handleSendMessage}>
              <div className="mb-4">
                <label className="block text-gray-700 font-medium mb-2">To</label>
                <select
                  className="w-full px-4 py-2 border rounded-lg"
                  value={newMessage.receiver}
                  onChange={(e) => setNewMessage({ ...newMessage, receiver: e.target.value })}
                  required
                >
                  <option value="">Select recipient...</option>
                  {alumni.map((member) => (
                    <option key={member._id} value={member._id}>
                      {member.name} ({member.email})
                    </option>
                  ))}
                </select>
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 font-medium mb-2">Subject</label>
                <input
                  type="text"
                  className="w-full px-4 py-2 border rounded-lg"
                  value={newMessage.subject}
                  onChange={(e) => setNewMessage({ ...newMessage, subject: e.target.value })}
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 font-medium mb-2">Message</label>
                {replyToMessageId && (
                  <div className="mb-2 flex justify-end">
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      isLoading={suggestingReply}
                      onClick={handleSuggestReply}
                    >
                      Suggest Reply
                    </Button>
                  </div>
                )}
                <textarea
                  className="w-full px-4 py-2 border rounded-lg"
                  rows={6}
                  value={newMessage.message}
                  onChange={(e) => setNewMessage({ ...newMessage, message: e.target.value })}
                  required
                />
              </div>
              <div className="flex space-x-4">
                <Button type="submit" className="flex-1">
                  <FaPaperPlane className="inline mr-2" />
                  Send Message
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setShowComposeModal(false);
                    setReplyToMessageId(null);
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Message Detail Modal */}
      {showMessageModal && selectedMessage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="max-w-2xl w-full">
            <div className="flex items-start justify-between mb-4 gap-4">
              <h2 className="text-2xl font-bold">{selectedMessage.subject}</h2>
              <div className="flex items-center gap-2">
                {activeTab === 'received' && (
                  <Button size="sm" onClick={handleReply}>
                    <FaReply className="inline mr-2" />
                    Reply
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    setShowMessageModal(false);
                    setSelectedMessage(null);
                  }}
                >
                  Close
                </Button>
              </div>
            </div>

            <div className="text-sm text-gray-700 mb-4 space-y-1">
              <p>
                <strong>From:</strong> {(selectedMessage.sender as User)?.name || 'Unknown'}
              </p>
              <p>
                <strong>To:</strong> {(selectedMessage.receiver as User)?.name || 'Unknown'}
              </p>
              <p className="text-xs text-gray-500">
                {format(new Date(selectedMessage.createdAt), 'PPP p')}
              </p>
            </div>

            <div className="border-t pt-4 whitespace-pre-wrap text-gray-800">
              {selectedMessage.message}
            </div>
          </Card>
        </div>
      )}

      {loadingMessage && (
        <div className="fixed bottom-4 right-4 bg-white shadow-lg rounded-lg px-4 py-2 text-sm text-gray-700">
          Opening message...
        </div>
      )}
    </div>
  );
};

export default Messages;
