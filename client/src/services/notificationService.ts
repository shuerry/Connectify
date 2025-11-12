import api from './config';

const NOTIF_API_URL = `/api/notification`;

export type UINotification = {
  _id: string;
  recipient: string;
  kind: 'answer' | 'chat' | 'system';
  title?: string;
  preview?: string;
  link?: string;
  actorUsername?: string;
  isRead: boolean;
  createdAt: string;
  readAt?: string;
  meta?: Record<string, unknown>;
};

export const getNotifications = async (username: string, limit = 20, cursor?: string) => {
  const params = new URLSearchParams({ limit: String(limit) });
  if (cursor) params.set('cursor', cursor);
  const res = await api.get(`${NOTIF_API_URL}/${username}?${params.toString()}`);
  if (res.status !== 200) throw new Error('Error when fetching notifications');
  return res.data as { items: UINotification[]; nextCursor?: string };
};

export const markNotificationRead = async (id: string) => {
  const res = await api.post(`${NOTIF_API_URL}/markRead`, { id });
  if (res.status !== 200) throw new Error('Error when marking notification read');
  return res.data as UINotification;
};

export const markAllNotificationsRead = async (username: string) => {
  const res = await api.post(`${NOTIF_API_URL}/markAllRead`, { username });
  if (res.status !== 200) throw new Error('Error when marking all read');
  return res.data as { ok: true };
};

export const deleteNotification = async (id: string) => {
  const res = await api.delete(`${NOTIF_API_URL}/${id}`);
  if (res.status !== 200) throw new Error('Error when deleting notification');
  return res.data as { ok: true };
};
