/**
 * Central configuration for API and Socket.IO endpoints.
 * 
 * In development (Vite dev server), defaults to localhost:8080.
 * In production, uses the VITE_BACKEND_URL environment variable.
 */

// Detect if running on localhost dev server
const isDev = typeof window !== 'undefined' && 
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL 
  || (isDev ? 'http://localhost:8080' : 'https://sig-x-redbull.onrender.com');

// Remove trailing slash if present
const cleanURL = BACKEND_URL.replace(/\/$/, '');

// If it starts with http, it's an absolute URL. Otherwise, assume it's a relative path.
const API_BASE = cleanURL.startsWith('http') ? cleanURL : '';

export const API_URL = `${API_BASE}/api`;

// Socket.IO connects to the backend HTTP URL directly
// (Socket.IO handles ws/wss upgrade automatically)
export const SOCKET_URL = API_BASE;

export default {
    API_URL,
    SOCKET_URL,
    BACKEND_URL: cleanURL
};
