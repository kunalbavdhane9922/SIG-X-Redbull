/**
 * Server Entry Point
 * 
 * Sets up:
 *   1. Express HTTP server with JSON parsing and CORS
 *   2. REST API routes at /api/*
 *   3. Socket.IO for real-time WebSocket communication
 */

const http = require('http');
const express = require('express');
const { Server: SocketIOServer } = require('socket.io');

const corsMiddleware = require('./config/cors');
const apiRoutes = require('./routes/api');
const gameHandler = require('./websocket/gameHandler');

const app = express();
const PORT = process.env.PORT || 8080;

// ─── Middleware ──────────────────────────────────────────────────────────────

app.use(corsMiddleware);
app.use(express.json());

// ─── REST API Routes (mirrors @RequestMapping("/api")) ──────────────────────

app.use('/api', apiRoutes);

// ─── Health check ───────────────────────────────────────────────────────────

app.get('/', (req, res) => {
  res.json({ status: 'ok', service: 'SIG Backend (Node.js)' });
});

// ─── HTTP Server ────────────────────────────────────────────────────────────

const server = http.createServer(app);

// ─── Socket.IO Server ──────────────────────────────────────────────────────

const io = new SocketIOServer(server, {
  cors: {
    origin: [
      'http://localhost:5173',
      'http://localhost:3000',
      'https://sig-x-redbull.vercel.app',
    ],
    methods: ['GET', 'POST'],
    credentials: true,
  },
  // Ping timeout and interval for connection health
  pingTimeout: 60000,
  pingInterval: 25000,
});

// Initialize game WebSocket handlers
gameHandler.init(io);

// ─── Start ──────────────────────────────────────────────────────────────────

server.listen(PORT, () => {
  console.log(`⚡ SIG Backend running on port ${PORT}`);
  console.log(`   REST API:      http://localhost:${PORT}/api`);
  console.log(`   Socket.IO:     http://localhost:${PORT} (auto-managed)`);
});
