import { useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { connectSocket, getSocket } from '../services/socketService.js';
import { selectAuth } from '../store/slices/authSlice.js';

export function useSocket() {
  const { accessToken } = useSelector(selectAuth);
  const socketInitialized = useRef(false);
  const [socketInstance, setSocketInstance] = useState(null);

  useEffect(() => {
    if (accessToken && !socketInitialized.current) {
      const socket = connectSocket(accessToken);
      socketInitialized.current = true;
      setSocketInstance(socket);

      const handleConnect = () => {
        setSocketInstance(socket);
      };

      const handleDisconnect = () => {
        setSocketInstance(null);
      };

      socket.on('connect', handleConnect);
      socket.on('disconnect', handleDisconnect);

      // If already connected, set immediately
      if (socket.connected) {
        setSocketInstance(socket);
      }

      return () => {
        socket.off('connect', handleConnect);
        socket.off('disconnect', handleDisconnect);
        socket.disconnect();
        setSocketInstance(null);
      };
    }
  }, [accessToken]);

  return socketInstance || getSocket();
}

