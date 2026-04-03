/**
 * Central configuration for API and WebSocket endpoints.
 * In development, defaults to localhost:8080.
 * In production (Render), uses the VITE_BACKEND_URL environment variable.
 */

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8080';

// Remove trailing slash if present
const cleanURL = BACKEND_URL.replace(/\/$/, '');

// If it starts with http, it's an absolute URL. Otherwise, assume it's a relative path.
const API_BASE = cleanURL.startsWith('http') ? cleanURL : '';

export const API_URL = `${API_BASE}/api`;

// WebSocket URL: convert http(s) to ws(s)
// stomp-broker-js uses native WebSocket (not SockJS)
const wsBase = API_BASE.replace(/^http/, 'ws');
export const WS_URL = `${wsBase}/ws-game`;

export default {
    API_URL,
    WS_URL,
    BACKEND_URL: cleanURL
};
