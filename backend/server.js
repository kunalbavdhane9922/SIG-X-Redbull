/**
 * Server Entry Point — equivalent to BackendApplication.java + WebSocketConfig.java
 * 
 * Sets up:
 *   1. Express HTTP server with JSON parsing and CORS
 *   2. REST API routes at /api/*
 *   3. STOMP over SockJS WebSocket at /ws-game (same as Spring config)
 *   4. Simple STOMP broker with /topic prefix (same as Spring config)
 *   5. Application destination prefix /app (same as Spring config)
 */

const http = require('http');
const express = require('express');
const StompServer = require('stomp-broker-js');
const sockjs = require('sockjs');

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

// ─── STOMP over SockJS (mirrors WebSocketConfig.java) ───────────────────────
// Spring config:
//   enableSimpleBroker("/topic")
//   setApplicationDestinationPrefixes("/app")
//   addEndpoint("/ws-game").setAllowedOriginPatterns("*").withSockJS()

const stompServer = new StompServer({
  server: server,
  path: '/ws-game',
  heartBeatDelay: 10000,
  debug: (msg) => {
    // Suppress noisy STOMP debug logs (mirrors Spring logging config)
  },
});

// Initialize game WebSocket handlers
gameHandler.init(stompServer);

// ─── Start ──────────────────────────────────────────────────────────────────

server.listen(PORT, () => {
  console.log(`⚡ SIG Backend running on port ${PORT}`);
  console.log(`   REST API:   http://localhost:${PORT}/api`);
  console.log(`   WebSocket:  ws://localhost:${PORT}/ws-game`);
});
