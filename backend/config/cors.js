/**
 * CORS Configuration
 */

const cors = require('cors');

const corsMiddleware = cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:3000',
    'https://sig-x-redbull.vercel.app',
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
});

module.exports = corsMiddleware;
