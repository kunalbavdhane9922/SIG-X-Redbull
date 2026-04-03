/**
 * CORS Configuration — equivalent to CorsConfig.java + WebConfig.java
 */

const cors = require('cors');

const corsMiddleware = cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['*'],
  credentials: true,
});

module.exports = corsMiddleware;
