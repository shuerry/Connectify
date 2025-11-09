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
      : ['http://localhost:4530', 'http://127.0.0.1:4530']
) as string[];

const socket: FakeSOSocket = new Server(server, {
  path: '/socket.io',
  cors: {
    origin: ALLOWED_CLIENT_ORIGINS,
    credentials: true,
  },
  // Production-friendly Socket.IO configuration for Render.com
  transports: ['polling', 'websocket'], // Start with polling, then upgrade
  pingTimeout: 60000,
  pingInterval: 25000,
  upgradeTimeout: 30000,
  allowEIO3: true,
  allowUpgrades: true,
  // Allow all origins in production if CLIENT_URLS not properly set
  ...(process.env.NODE_ENV === 'production' &&
    !process.env.CLIENT_URLS && {
      cors: {
        origin: true,
        credentials: true,
      },
    }),
});

function connectDatabase() {
  return mongoose.connect(MONGO_URL).catch(err => console.log('MongoDB connection error: ', err));
}

function startServer() {
  connectDatabase();
  server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

socket.on('connection', clientSocket => {
  const totalClients = socket.sockets.sockets.size;
  const clientIP = clientSocket.handshake.address;
  const userAgent = clientSocket.handshake.headers['user-agent'];
  console.log(`A user connected -> ${clientSocket.id} (Total clients: ${totalClients})`);
  console.log(`  IP: ${clientIP}, User-Agent: ${userAgent?.substring(0, 50)}...`);

  // Allow users to join their personal notification room
  clientSocket.on('joinUserRoom', (username: string) => {
    clientSocket.join(`user:${username}`);
    console.log(`User ${username} joined personal room (Socket: ${clientSocket.id})`);
    console.log(
      `  Users in room user:${username}: ${socket.sockets.adapter.rooms.get(`user:${username}`)?.size || 0}`,
    );
  });

  clientSocket.on('disconnect', () => {
    const remainingClients = socket.sockets.sockets.size;
    console.log(`User disconnected -> ${clientSocket.id} (Remaining clients: ${remainingClients})`);
  });
});

process.on('SIGINT', async () => {
  await mongoose.disconnect();
  socket.close();

  server.close(() => {
    console.log('Server closed.');
    process.exit(0);
  });
});

app.use(express.json());

// Minimal CORS for REST API (avoids adding a dependency). Uses same allowed origins as Socket.IO
app.use((req: Request, res: Response, next: NextFunction) => {
  const requestOrigin = req.headers.origin;
  const isAllowed = requestOrigin && ALLOWED_CLIENT_ORIGINS.includes(requestOrigin);
  if (isAllowed) {
    res.header('Access-Control-Allow-Origin', requestOrigin);
    res.header('Vary', 'Origin');
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

  // Custom Error Handler for express-openapi-validator errors
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    // Format error response for validation errors
    if (err.status && err.errors) {
      res.status(err.status).json({
        message: 'Request Validation Failed',
        errors: err.errors,
      });
    } else {
      next(err); // Pass through other errors
    }
  });
} catch (e) {
  console.error('Failed to load or initialize OpenAPI Validator:', e);
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

const openApiDocument = yaml.parse(fs.readFileSync('./openapi.yaml', 'utf8'));
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(openApiDocument));
console.log('Swagger UI is available at /api/docs');

// Export the app instance
export { app, server, startServer };
