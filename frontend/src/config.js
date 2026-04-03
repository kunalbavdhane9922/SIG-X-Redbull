/**
 * Central configuration for API and WebSocket endpoints.
 * In development, defaults to localhost:8080.
 * In production (Render), uses the VITE_BACKEND_URL environment variable.
 */

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8080';

// Remove trailing slash if present
const cleanURL = BACKEND_URL.replace(/\/$/, '');

// If it starts with http, it's an absolute URL. Otherwise, assume it's a relative path.
// On Render, we'll provide the full https://... URL.
const API_BASE = cleanURL.startsWith('http') ? cleanURL : '';

export const API_URL = `${API_BASE}/api`;
export const WS_URL = `${API_BASE}/ws-game`;

export default {
    API_URL,
    WS_URL,
    BACKEND_URL: cleanURL
};
