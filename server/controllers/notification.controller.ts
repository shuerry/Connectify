import express, { Response } from 'express';
import { FakeSOSocket } from '../types/types';
import {
  listNotifications,
  markRead,
  markAllRead,
  deleteNotification,
  setNotificationSocket,
} from '../services/notification.service';

// TODO: Rewrite to match the structure of other controllers

const notificationController = (socket: FakeSOSocket) => {
  setNotificationSocket(socket);
  const router = express.Router();

  // GET /api/notification/:username?limit=20&cursor=ISO
  router.get('/:username', async (req, res: Response) => {
    const { username } = req.params;
    const limit = Number(req.query.limit ?? 20);
    const { cursor } = req.query as { cursor?: string };
    try {
      const items = await listNotifications(username, limit, cursor);
      res.json({ items, nextCursor: items.at(-1)?.createdAt });
    } catch (e) {
      res.status(500).send('Error when fetching notifications');
    }
  });

  // POST /api/notification/markRead
  router.post('/markRead', async (req, res: Response) => {
    const { id, username } = req.body as { id: string; username: string };
    try {
      const n = await markRead(id);
      res.json(n);
      socket.to(`user:${username}`).emit('notificationUpdate');
    } catch {
      res.status(500).send('Error when marking notification read');
    }
  });

  // POST /api/notification/markAllRead
  router.post('/markAllRead', async (req, res: Response) => {
    const { username } = req.body as { username: string };
    try {
      const r = await markAllRead(username);
      res.json(r);

      socket.to(`user:${username}`).emit('notificationUpdate');
    } catch {
      res.status(500).send('Error when marking all read');
    }
  });

  // DELETE /api/notification/:id
  router.delete('/:id', async (req, res: Response) => {
    const { username } = req.body as { username: string };

    try {
      const r = await deleteNotification(req.params.id);
      res.json(r);
      socket.to(`user:${username}`).emit('notificationUpdate');
    } catch {
      res.status(500).send('Error when deleting notification');
    }
  });

  return router;
};

export default notificationController;
