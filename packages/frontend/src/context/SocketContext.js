import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SERVER_URL } from '../config/apiconfig';

const SocketContext = createContext(null);

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);
  const listenersRef = useRef(new Map());

  const connect = useCallback(async () => {
    if (socketRef.current?.connected) return;

    const token = await AsyncStorage.getItem('token');
    if (!token) return;

    const socket = io(SERVER_URL, {
      auth: { token },
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 2000,
      reconnectionDelayMax: 10000,
    });

    socket.on('connect', () => {
      console.log('[Socket] Connected:', socket.id);
      setConnected(true);
    });

    socket.on('disconnect', (reason) => {
      console.log('[Socket] Disconnected:', reason);
      setConnected(false);
    });

    socket.on('connect_error', (err) => {
      console.log('[Socket] Connection error:', err.message);
    });

    socketRef.current = socket;
  }, []);

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
      setConnected(false);
    }
  }, []);

  // Subscribe to an event. Returns unsubscribe function.
  const on = useCallback((event, handler) => {
    const socket = socketRef.current;
    if (!socket) return () => {};

    socket.on(event, handler);
    return () => socket.off(event, handler);
  }, []);

  // Emit an event
  const emit = useCallback((event, data) => {
    socketRef.current?.emit(event, data);
  }, []);

  // Join a room
  const joinRoom = useCallback((type, id) => {
    socketRef.current?.emit(`join:${type}`, id);
  }, []);

  // Leave a room
  const leaveRoom = useCallback((type, id) => {
    socketRef.current?.emit(`leave:${type}`, id);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  return (
    <SocketContext.Provider value={{ connected, connect, disconnect, on, emit, joinRoom, leaveRoom }}>
      {children}
    </SocketContext.Provider>
  );
};
