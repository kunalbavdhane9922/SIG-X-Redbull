/**
 * Central configuration for API and Socket.IO endpoints.
 * 
 * Using ngrok for the backend:
 * https://gracia-organographical-jeanmarie.ngrok-free.dev
 */

const BACKEND_URL = 'https://gracia-organographical-jeanmarie.ngrok-free.dev';

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
