/**
 * CORS Configuration
 */

const cors = require('cors');

const corsMiddleware = cors({
  origin: [
    'https://gracia-organographical-jeanmarie.ngrok-free.dev',
    /\.ngrok-free\.dev$/, // Allow all subdomains of ngrok-free.dev for flexibility
    'http://localhost:5173', // Keep local for internal testing if needed
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
});

module.exports = corsMiddleware;
