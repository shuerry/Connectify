/* eslint no-console: "off" */

// The server should run on localhost port 8000.
// This is where you should start writing server-side code for this application.
// startServer() is a function that starts the server
import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { Server } from 'socket.io';
import * as http from 'http';
import * as OpenApiValidator from 'express-openapi-validator';
import swaggerUi from 'swagger-ui-express';
import yaml from 'yaml';
import * as fs from 'fs';

import answerController from './controllers/answer.controller';
import questionController from './controllers/question.controller';
import tagController from './controllers/tag.controller';
import commentController from './controllers/comment.controller';
import { FakeSOSocket } from './types/types';
import userController from './controllers/user.controller';
import messageController from './controllers/message.controller';
import chatController from './controllers/chat.controller';
import gameController from './controllers/game.controller';
import collectionController from './controllers/collection.controller';
import communityController from './controllers/community.controller';
import reportController from './controllers/report.controller';
import notificationController from './controllers/notification.controller';
import { info, warn, error } from './utils/logger';
import { updateOnlineStatus, getRelations } from './services/user.service';

const MONGO_URL = `${process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017'}/fake_so`;
const PORT = parseInt(process.env.PORT || '8000');

const app = express();
const server = http.createServer(app);
// allow requests from the local dev client or the production client only
// Build allowed client origins from env (comma-separated) with sensible defaults
const ALLOWED_CLIENT_ORIGINS: string[] = (
  process.env.CLIENT_URLS
    ? process.env.CLIENT_URLS.split(',')
        .map(o => o.trim())
        .filter(o => o.length > 0)
    : process.env.CLIENT_URL
      ? [process.env.CLIENT_URL]
      : [
          'http://localhost:4530',
          'http://127.0.0.1:4530',
          // Add common Render deployment patterns
          'https://cs4530-f25-509-6v2m.onrender.com',
          // Allow any onrender.com subdomain in production
          ...(process.env.NODE_ENV === 'production' ? [] : []),
        ]
) as string[];

const socket: FakeSOSocket = new Server(server, {
  path: '/socket.io',
  cors: {
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);

      // Check if origin is in allowed list
      if (ALLOWED_CLIENT_ORIGINS.includes(origin)) {
        return callback(null, true);
      }

      // Allow any https onrender.com subdomain (deployed clients)
      if (origin.startsWith('https://') && origin.endsWith('.onrender.com')) {
        return callback(null, true);
      }

      callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
  },
});

function connectDatabase() {
  return mongoose.connect(MONGO_URL).catch(err => {
    error('MongoDB connection error: ', err);
  });
}

function startServer() {
  connectDatabase();
  server.listen(PORT, () => {
    info(`Server is running on port ${PORT}`);
  });
}

// Track socket to username mapping and username to socket count
const socketToUsername = new Map<string, string>();
const usernameToSocketCount = new Map<string, number>();

socket.on('connection', clientSocket => {
  info('A user connected ->', clientSocket.id);

  clientSocket.on('joinUserRoom', async (username: string) => {
    if (!username) return;
    clientSocket.join(`user:${username}`);
    socketToUsername.set(clientSocket.id, username);
    
    // Increment socket count for this username
    const currentCount = usernameToSocketCount.get(username) || 0;
    usernameToSocketCount.set(username, currentCount + 1);
    
    // If this is the first socket for this user, set them as online
    if (currentCount === 0) {
      try {
        const result = await updateOnlineStatus(username, true);
        if (!('error' in result)) {
          // Notify friends about status change
          const relations = await getRelations(username);
          if (!('error' in relations) && relations.friends && relations.friends.length > 0) {
            relations.friends.forEach(friendUsername => {
              socket.to(`user:${friendUsername}`).emit('userStatusUpdate', {
                username: result.username,
                isOnline: true,
                showOnlineStatus: result.showOnlineStatus ?? true,
              });
            });
          }
        }
      } catch (err) {
        error('Error updating online status on join:', err);
      }
    }
    
    info(`Socket ${clientSocket.id} joined user room user:${username}`);
  });

  clientSocket.on('leaveUserRoom', async (username: string) => {
    if (!username) return;
    clientSocket.leave(`user:${username}`);
    
    const socketUsername = socketToUsername.get(clientSocket.id);
    if (socketUsername === username) {
      socketToUsername.delete(clientSocket.id);
      
      // Decrement socket count for this username
      const currentCount = usernameToSocketCount.get(username) || 0;
      const newCount = Math.max(0, currentCount - 1);
      usernameToSocketCount.set(username, newCount);
      
      // If this was the last socket for this user, set them as offline
      if (newCount === 0) {
        try {
          const result = await updateOnlineStatus(username, false);
          if (!('error' in result)) {
            // Notify friends about status change
            const relations = await getRelations(username);
            if (!('error' in relations) && relations.friends && relations.friends.length > 0) {
              relations.friends.forEach(friendUsername => {
                socket.to(`user:${friendUsername}`).emit('userStatusUpdate', {
                  username: result.username,
                  isOnline: false,
                  showOnlineStatus: result.showOnlineStatus ?? true,
                });
              });
            }
          }
        } catch (err) {
          error('Error updating online status on leave:', err);
        }
      }
    }
    
    info(`Socket ${clientSocket.id} left user room user:${username}`);
  });

  clientSocket.on('disconnect', async () => {
    const username = socketToUsername.get(clientSocket.id);
    info(`User disconnected -> socket: ${clientSocket.id}, username: ${username || 'unknown'}`);
    
    if (username) {
      socketToUsername.delete(clientSocket.id);
      
      // Decrement socket count for this username
      const currentCount = usernameToSocketCount.get(username) || 0;
      const newCount = Math.max(0, currentCount - 1);
      usernameToSocketCount.set(username, newCount);
      
      // If this was the last socket for this user, set them as offline
      if (newCount === 0) {
        try {
          const result = await updateOnlineStatus(username, false);
          if (!('error' in result)) {
            // Notify friends about status change
            const relations = await getRelations(username);
            if (!('error' in relations) && relations.friends && relations.friends.length > 0) {
              relations.friends.forEach(friendUsername => {
                socket.to(`user:${friendUsername}`).emit('userStatusUpdate', {
                  username: result.username,
                  isOnline: false,
                  showOnlineStatus: result.showOnlineStatus ?? true,
                });
              });
            }
          }
        } catch (err) {
          error('Error updating online status on disconnect:', err);
        }
      }
    }
  });
});

process.on('SIGINT', async () => {
  await mongoose.disconnect();
  socket.close();

  server.close(() => {
    info('Server closed.');
    process.exit(0);
  });
});

app.use(express.json());

// Log allowed origins for debugging
info('Allowed CORS origins:', ALLOWED_CLIENT_ORIGINS);

// Minimal CORS for REST API (avoids adding a dependency). Uses same allowed origins as Socket.IO
app.use((req: Request, res: Response, next: NextFunction) => {
  const requestOrigin = req.headers.origin as string | undefined;

  // Helper to check allowed origins more flexibly (handles exact matches and common patterns)
  const originIsAllowed = (origin?: string) => {
    if (!origin) return false;
    // Exact match
    if (ALLOWED_CLIENT_ORIGINS.includes(origin)) return true;
    // Allow onrender.com subdomains (deployed clients)
    if (origin.startsWith('https://') && origin.endsWith('.onrender.com')) return true;
    // Allow when an allowed origin is a prefix of the request origin (helps with trailing slashes/ports)
    for (const allowed of ALLOWED_CLIENT_ORIGINS) {
      if (origin === allowed) return true;
      if (origin.startsWith(allowed)) return true;
    }
    return false;
  };

  const isAllowed = originIsAllowed(requestOrigin);

  // Debug logging when origin present but not allowed
  if (requestOrigin && !isAllowed) {
    warn(`CORS: request origin not allowed: ${requestOrigin}`);
  }

  if (isAllowed && requestOrigin) {
    res.header('Access-Control-Allow-Origin', requestOrigin);
    res.header('Vary', 'Origin');
  }

  // As a fallback for development, allow all origins when not in production
  if (!process.env.NODE_ENV || process.env.NODE_ENV !== 'production') {
    res.header('Access-Control-Allow-Origin', '*');
  }

  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  res.header(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept, Authorization',
  );

  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
    return;
  }

  next();
});

try {
  app.use(
    OpenApiValidator.middleware({
      apiSpec: './openapi.yaml',
      validateRequests: true,
      validateResponses: true,
      ignoreUndocumented: true, // Only validate paths defined in the spec
      formats: {
        'object-id': (v: string) => /^[0-9a-fA-F]{24}$/.test(v),
      },
    }),
  );
  // Error Handler for express-openapi-validator errors
  app.use((err: unknown, req: Request, res: Response, next: NextFunction) => {
    // Format error response for validation errors
    if (typeof err === 'object' && err !== null && 'status' in err && 'errors' in err) {
      const errorObj = err as { status: number; errors: unknown };
      res.status(errorObj.status).json({
        message: 'Request Validation Failed',
        errors: errorObj.errors,
      });
    } else {
      next(err); // Pass through other errors
    }
  });
} catch (e) {
  error('Failed to load or initialize OpenAPI Validator:', e);
}

app.use('/api/question', questionController(socket));
app.use('/api/tags', tagController());
app.use('/api/answer', answerController(socket));
app.use('/api/comment', commentController(socket));
app.use('/api/message', messageController(socket));
app.use('/api/user', userController(socket));
app.use('/api/chat', chatController(socket));
app.use('/api/games', gameController(socket));
app.use('/api/collection', collectionController(socket));
app.use('/api/community', communityController(socket));
app.use('/api/report', reportController());
app.use('/api/notification', notificationController(socket));

const openApiDocument = yaml.parse(fs.readFileSync('./openapi.yaml', 'utf8'));
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(openApiDocument));
info('Swagger UI is available at /api/docs');

// Export the app instance
export { app, server, startServer };
