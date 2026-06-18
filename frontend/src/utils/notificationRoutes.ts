type NotificationLike = {
  type: 'message:new' | 'mentorship:request' | 'mentorship:status' | 'mentorship:session' | 'event:rsvp';
  metadata?: Record<string, unknown>;
};

export const buildNotificationRoute = (payload: NotificationLike): string | null => {
  const metadata = payload.metadata || {};

  if (payload.type === 'message:new' && typeof metadata.messageId === 'string') {
    return `/messages?tab=received&messageId=${encodeURIComponent(metadata.messageId)}`;
  }

  if (payload.type === 'mentorship:request' && typeof metadata.requestId === 'string') {
    return `/mentorship?tab=received&requestId=${encodeURIComponent(metadata.requestId)}`;
  }

  if (payload.type === 'mentorship:status' && typeof metadata.requestId === 'string') {
    const status = typeof metadata.status === 'string' ? metadata.status : '';
    const tab = status === 'accepted' ? 'connections' : 'sent';
    return `/mentorship?tab=${tab}&requestId=${encodeURIComponent(metadata.requestId)}`;
  }

  if (payload.type === 'mentorship:session') {
    if (typeof metadata.requestId === 'string') {
      return `/mentorship?tab=sessions&requestId=${encodeURIComponent(metadata.requestId)}`;
    }
    return '/mentorship?tab=sessions';
  }

  if (payload.type === 'event:rsvp' && typeof metadata.eventId === 'string') {
    return `/events?eventId=${encodeURIComponent(metadata.eventId)}`;
  }

  return null;
};
