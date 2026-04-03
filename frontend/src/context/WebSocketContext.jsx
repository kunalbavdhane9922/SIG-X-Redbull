import React, { createContext, useContext, useRef, useState, useCallback, useEffect } from 'react';
import { io } from 'socket.io-client';
import { SOCKET_URL } from '../config';

const WebSocketContext = createContext(null);

export function WebSocketProvider({ children }) {
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);

  /**
   * Connect to the Socket.IO server.
   * If already connected, does nothing.
   * Returns the socket instance.
   */
  const connect = useCallback(() => {
    if (socketRef.current?.connected) {
      return socketRef.current;
    }

    // Disconnect any stale socket
    if (socketRef.current) {
      socketRef.current.disconnect();
    }

    const socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'], // prefer WebSocket, fallback to polling
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: Infinity,
      timeout: 20000,
    });

    socket.on('connect', () => {
      console.log('[Socket.IO] Connected:', socket.id);
      setConnected(true);
    });

    socket.on('disconnect', (reason) => {
      console.log('[Socket.IO] Disconnected:', reason);
      setConnected(false);
    });

    socket.on('connect_error', (err) => {
      console.error('[Socket.IO] Connection error:', err.message);
      setConnected(false);
    });

    socketRef.current = socket;
    return socket;
  }, []);

  /**
   * Join a game room. Both participants and organizers call this.
   */
  const joinRoom = useCallback((roomId, teamId, role) => {
    const socket = socketRef.current;
    if (!socket?.connected) {
      console.warn('[Socket.IO] Not connected — cannot join room');
      return;
    }
    socket.emit('join-room', { roomId, teamId, role });
  }, []);

  /**
   * Emit a custom event to the server.
   */
  const emit = useCallback((event, data) => {
    const socket = socketRef.current;
    if (!socket?.connected) {
      console.warn('[Socket.IO] Not connected — cannot emit', event);
      return;
    }
    socket.emit(event, data);
  }, []);

  /**
   * Listen for an event. Returns an unsubscribe function.
   */
  const on = useCallback((event, callback) => {
    const socket = socketRef.current;
    if (!socket) {
      console.warn('[Socket.IO] No socket — cannot listen for', event);
      return () => {};
    }
    socket.on(event, callback);
    return () => socket.off(event, callback);
  }, []);

  const disconnect = useCallback(() => {
    socketRef.current?.disconnect();
    socketRef.current = null;
    setConnected(false);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      socketRef.current?.disconnect();
    };
  }, []);

  return (
    <WebSocketContext.Provider value={{ connected, connect, disconnect, joinRoom, emit, on }}>
      {children}
    </WebSocketContext.Provider>
  );
}

export function useWebSocket() {
  return useContext(WebSocketContext);
}
