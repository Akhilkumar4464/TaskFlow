import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import useAuthStore from '../store/useAuthStore';
import useBoardStore from '../store/useBoardStore';

const SocketContext = createContext(null);

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [presenceUsers, setPresenceUsers] = useState([]);
  const { user, isAuthenticated } = useAuthStore();
  const { activeBoard, fetchBoardById } = useBoardStore();

  useEffect(() => {
    // Only connect if authenticated
    if (!isAuthenticated || !user) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
      setPresenceUsers([]);
      return;
    }

    const socketUrl = 'http://localhost:5000'; // Target backend
    const newSocket = io(socketUrl, {
      withCredentials: true,
      transports: ['websocket', 'polling'],
    });

    newSocket.on('connect', () => {
      console.log('Socket.io connected on client');
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [isAuthenticated, user]);

  // Manage joining and leaving board rooms
  useEffect(() => {
    if (!socket || !activeBoard || !user) {
      setPresenceUsers([]);
      return;
    }

    const boardId = activeBoard._id;

    // Join room
    socket.emit('board:join', { boardId, user });

    // Listen for room updates
    socket.on('board:updated', ({ action, data }) => {
      console.log(`Board event '${action}' received:`, data);
      // Auto refetch to ensure fresh database state is loaded
      fetchBoardById(boardId);
    });

    // Listen for presence indicators
    socket.on('user:presence', (users) => {
      console.log('Active users presence updated:', users);
      setPresenceUsers(users);
    });

    return () => {
      socket.emit('board:leave', { boardId });
      socket.off('board:updated');
      socket.off('user:presence');
    };
  }, [socket, activeBoard?._id, user]);

  // Helper to trigger socket updates to others when we modify columns/tasks
  const emitBoardUpdate = (action, data) => {
    if (socket && activeBoard) {
      socket.emit('board:update', {
        boardId: activeBoard._id,
        action,
        data,
      });
    }
  };

  return (
    <SocketContext.Provider value={{ socket, presenceUsers, emitBoardUpdate }}>
      {children}
    </SocketContext.Provider>
  );
};
export default SocketContext;
