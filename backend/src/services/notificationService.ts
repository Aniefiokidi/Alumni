import { Response } from 'express';
import Notification, { NotificationType } from '../models/Notification';

export interface NotificationPayload {
  type: NotificationType;
  title: string;
  body: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

type ClientConnection = {
  id: string;
  response: Response;
  heartbeat: NodeJS.Timeout;
};

const clients = new Map<string, Map<string, ClientConnection>>();

const sendEvent = (response: Response, event: string, payload: unknown) => {
  response.write(`event: ${event}\n`);
  response.write(`data: ${JSON.stringify(payload)}\n\n`);
};

export const addNotificationClient = (userId: string, response: Response): string => {
  const clientId = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  const heartbeat = setInterval(() => {
    response.write(': keep-alive\n\n');
  }, 25000);

  if (!clients.has(userId)) {
    clients.set(userId, new Map());
  }

  clients.get(userId)?.set(clientId, {
    id: clientId,
    response,
    heartbeat
  });

  sendEvent(response, 'connected', { clientId, createdAt: new Date().toISOString() });
  return clientId;
};

export const removeNotificationClient = (userId: string, clientId: string) => {
  const userClients = clients.get(userId);
  if (!userClients) {
    return;
  }

  const client = userClients.get(clientId);
  if (client) {
    clearInterval(client.heartbeat);
    userClients.delete(clientId);
  }

  if (userClients.size === 0) {
    clients.delete(userId);
  }
};

export const publishNotification = (userId: string, payload: Omit<NotificationPayload, 'createdAt'>) => {
  const message: NotificationPayload = {
    ...payload,
    createdAt: new Date().toISOString()
  };

  void Notification.create({
    user: userId,
    type: message.type,
    title: message.title,
    body: message.body,
    metadata: message.metadata
  }).catch((error) => {
    console.error('Failed to persist notification', error);
  });

  const userClients = clients.get(userId);
  if (!userClients || userClients.size === 0) {
    return;
  }

  for (const client of userClients.values()) {
    sendEvent(client.response, 'notification', message);
  }
};
