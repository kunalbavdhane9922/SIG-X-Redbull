import React, { createContext, useContext, useRef, useState, useCallback } from 'react';
import { Client } from '@stomp/stompjs';
import { WS_URL } from '../config';

const WebSocketContext = createContext(null);

export function WebSocketProvider({ children }) {
  const clientRef = useRef(null);
  const [connected, setConnected] = useState(false);
  const pendingSubscriptions = useRef([]);
  const activeSubscriptions = useRef([]);

  /**
   * Connect to the STOMP WebSocket.
   * Uses native WebSocket (stomp-broker-js on the Node.js backend).
   * If already connected, immediately invokes onConnect.
   * If connecting, queues onConnect to run when connection is established.
   */
  const connect = useCallback((onConnect) => {
    const client = clientRef.current;

    // Already connected — run callback immediately
    if (client?.connected) {
      onConnect?.();
      return;
    }

    // Already activated (connecting) — queue the callback
    if (client?.active) {
      pendingSubscriptions.current.push(onConnect);
      return;
    }

    // Queue the callback for when we connect
    if (onConnect) pendingSubscriptions.current.push(onConnect);

    const newClient = new Client({
      brokerURL: WS_URL,
      reconnectDelay: 5000,
      onConnect: () => {
        setConnected(true);
        // Drain pending callbacks
        const pending = [...pendingSubscriptions.current];
        pendingSubscriptions.current = [];
        pending.forEach(cb => cb?.());
      },
      onDisconnect: () => {
        setConnected(false);
        // Clear active sub references (they are auto-unsubscribed)
        activeSubscriptions.current = [];
      },
      onStompError: (frame) => {
        console.error('STOMP error', frame);
      },
    });

    newClient.activate();
    clientRef.current = newClient;
  }, []);

  const disconnect = useCallback(() => {
    clientRef.current?.deactivate();
    clientRef.current = null;
    setConnected(false);
    activeSubscriptions.current = [];
    pendingSubscriptions.current = [];
  }, []);

  /**
   * Subscribe to a destination.
   * Returns the subscription object with an unsubscribe() method.
   */
  const subscribe = useCallback((destination, callback) => {
    const client = clientRef.current;
    if (!client?.connected) {
      console.warn('WebSocket not connected — cannot subscribe to', destination);
      return null;
    }
    const sub = client.subscribe(destination, (msg) => {
      try {
        const data = JSON.parse(msg.body);
        callback(data);
      } catch {
        callback(msg.body);
      }
    });
    activeSubscriptions.current.push(sub);
    return sub;
  }, []);

  const publish = useCallback((destination, body) => {
    const client = clientRef.current;
    if (!client?.connected) {
      console.warn('WebSocket not connected — cannot publish to', destination);
      return;
    }
    client.publish({
      destination,
      body: JSON.stringify(body),
    });
  }, []);

  return (
    <WebSocketContext.Provider value={{ connected, connect, disconnect, subscribe, publish }}>
      {children}
    </WebSocketContext.Provider>
  );
}

export function useWebSocket() {
  return useContext(WebSocketContext);
}
