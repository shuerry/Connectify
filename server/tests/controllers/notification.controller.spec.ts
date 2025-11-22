// tests/controllers/notification.controller.spec.ts
import express from 'express';
import request from 'supertest';

import notificationController from '../../controllers/notification.controller';
import {
  listNotifications,
  markRead,
  markAllRead,
  deleteNotification,
  setNotificationSocket,
} from '../../services/notification.service';

jest.mock('../../services/notification.service', () => ({
  listNotifications: jest.fn(),
  markRead: jest.fn(),
  markAllRead: jest.fn(),
  deleteNotification: jest.fn(),
  setNotificationSocket: jest.fn(),
}));

// Helper to create an app instance with a mocked socket
const createApp = () => {
  const emitMock = jest.fn();
  const toMock = jest.fn().mockReturnValue({ emit: emitMock });

  const fakeSocket = {
    to: toMock,
  } as any;

  const app = express();
  app.use(express.json());
  app.use('/api/notification', notificationController(fakeSocket));

  return { app, fakeSocket, toMock, emitMock };
};

describe('notificationController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('calls setNotificationSocket with the provided socket', () => {
    createApp();

    expect(setNotificationSocket).toHaveBeenCalledTimes(1);
    expect(setNotificationSocket).toHaveBeenCalledWith(
      expect.objectContaining({ to: expect.any(Function) }),
    );
  });

  describe('GET /:username', () => {
    it('returns notifications and nextCursor when list has items', async () => {
      (listNotifications as jest.Mock).mockResolvedValue([
        { id: '1', createdAt: '2023-01-01T00:00:00.000Z' },
        { id: '2', createdAt: '2023-01-02T00:00:00.000Z' },
      ]);

      const { app } = createApp();

      const res = await request(app)
        .get('/api/notification/alice')
        .query({ limit: '5', cursor: 'CURSOR' })
        .expect(200);

      expect(listNotifications).toHaveBeenCalledWith('alice', 5, 'CURSOR');

      // Proper type: items is an array of notifications
      expect(Array.isArray(res.body.items)).toBe(true);
      expect(res.body.items).toHaveLength(2);
      expect(res.body.items[0]).toHaveProperty('id', '1');
      expect(res.body.items[0]).toHaveProperty('createdAt');
      expect(res.body.items[1]).toHaveProperty('id', '2');
      expect(res.body.items[1]).toHaveProperty('createdAt');

      // nextCursor should be the createdAt of the last item
      expect(res.body.nextCursor).toBe('2023-01-02T00:00:00.000Z');
    });

    it('uses default limit and handles empty notification list', async () => {
      (listNotifications as jest.Mock).mockResolvedValue([]);

      const { app } = createApp();

      const res = await request(app).get('/api/notification/bob').expect(200);

      expect(listNotifications).toHaveBeenCalledWith('bob', 20, undefined);
      expect(res.body.items).toEqual([]);

      // Because Express strips undefined fields from JSON, nextCursor will not exist at all
      expect(res.body.nextCursor).toBeUndefined();
      expect(res.body).not.toHaveProperty('nextCursor');
    });

    it('returns 500 when listNotifications throws', async () => {
      (listNotifications as jest.Mock).mockRejectedValue(new Error('boom'));

      const { app } = createApp();

      const res = await request(app).get('/api/notification/error-user').expect(500);

      expect(res.text).toBe('Error when fetching notifications');
    });
  });

  describe('POST /markRead', () => {
    it('marks a notification as read and emits update', async () => {
      // markRead returns the updated notification document
      (markRead as jest.Mock).mockResolvedValue({
        _id: 'n1',
        isRead: true,
        readAt: '2023-01-01T00:00:00.000Z',
      });

      const { app, toMock, emitMock } = createApp();

      const res = await request(app)
        .post('/api/notification/markRead')
        .send({ id: 'n1', username: 'carol' })
        .expect(200);

      expect(markRead).toHaveBeenCalledWith('n1');

      // Proper type: a notification-like object
      expect(res.body).toMatchObject({
        _id: 'n1',
        isRead: true,
      });
      expect(res.body).toHaveProperty('readAt');

      expect(toMock).toHaveBeenCalledWith('user:carol');
      expect(emitMock).toHaveBeenCalledWith('notificationUpdate');
    });

    it('returns 500 when markRead throws and does not emit', async () => {
      (markRead as jest.Mock).mockRejectedValue(new Error('boom'));

      const { app, emitMock } = createApp();

      const res = await request(app)
        .post('/api/notification/markRead')
        .send({ id: 'n1', username: 'carol' })
        .expect(500);

      expect(res.text).toBe('Error when marking notification read');
      expect(emitMock).not.toHaveBeenCalled();
    });
  });

  describe('POST /markAllRead', () => {
    it('marks all notifications as read and emits update', async () => {
      // Service returns { ok: true }
      (markAllRead as jest.Mock).mockResolvedValue({ ok: true });

      const { app, toMock, emitMock } = createApp();

      const res = await request(app)
        .post('/api/notification/markAllRead')
        .send({ username: 'dave' })
        .expect(200);

      expect(markAllRead).toHaveBeenCalledWith('dave');

      // Proper type: { ok: true }
      expect(res.body).toEqual({ ok: true });

      expect(toMock).toHaveBeenCalledWith('user:dave');
      expect(emitMock).toHaveBeenCalledWith('notificationUpdate');
    });

    it('returns 500 when markAllRead throws and does not emit', async () => {
      (markAllRead as jest.Mock).mockRejectedValue(new Error('boom'));

      const { app, emitMock } = createApp();

      const res = await request(app)
        .post('/api/notification/markAllRead')
        .send({ username: 'dave' })
        .expect(500);

      expect(res.text).toBe('Error when marking all read');
      expect(emitMock).not.toHaveBeenCalled();
    });
  });

  describe('DELETE /:id', () => {
    it('deletes a notification and emits update', async () => {
      // Service returns { ok: true }
      (deleteNotification as jest.Mock).mockResolvedValue({ ok: true });

      const { app, toMock, emitMock } = createApp();

      const res = await request(app)
        .delete('/api/notification/123')
        .send({ username: 'erin' })
        .expect(200);

      expect(deleteNotification).toHaveBeenCalledWith('123');

      // Proper type: { ok: true }
      expect(res.body).toEqual({ ok: true });

      expect(toMock).toHaveBeenCalledWith('user:erin');
      expect(emitMock).toHaveBeenCalledWith('notificationUpdate');
    });

    it('returns 500 when deleteNotification throws and does not emit', async () => {
      (deleteNotification as jest.Mock).mockRejectedValue(new Error('boom'));

      const { app, emitMock } = createApp();

      const res = await request(app)
        .delete('/api/notification/123')
        .send({ username: 'erin' })
        .expect(500);

      expect(res.text).toBe('Error when deleting notification');
      expect(emitMock).not.toHaveBeenCalled();
    });
  });
});
