import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from '../../components/layout/Sidebar.jsx';
import { useSocket } from '../../hooks/useSocket.js';
import { useDispatch, useSelector } from 'react-redux';
import { useEffect } from 'react';
import { addNotification } from '../../store/slices/notificationSlice.js';
import { fetchChats } from '../../store/slices/chatSlice.js';
import { selectAuth } from '../../store/slices/authSlice.js';
import { getIdString } from '../../utils/helpers.js';
import toast from 'react-hot-toast';

function Layout() {
  const socket = useSocket();
  const dispatch = useDispatch();
  const { user } = useSelector(selectAuth);
  const location = useLocation();

  useEffect(() => {
    if (socket && user) {
      const handleNotification = (notification) => {
        dispatch(addNotification(notification));
        if (notification.type !== 'message') {
          toast(notification.message, { icon: '🔔' });
        }
      };

      const handleNewMessage = (message) => {
        dispatch(fetchChats()); 
        
        const senderId = getIdString(message.sender?._id || message.sender);
        if (senderId !== getIdString(user?._id)) {
          if (location.pathname !== `/chat/${message.chat}`) {
            toast.success(`New message in ${message.chatType === 'group' ? 'group' : 'chat'}`);
          }
        }
      };

      const handleMessageUpdated = (message) => {
        dispatch(fetchChats());
      };

      socket.on('notification', handleNotification);
      socket.on('new-message', handleNewMessage);
      socket.on('message-updated', handleMessageUpdated);

      return () => {
        socket.off('notification', handleNotification);
        socket.off('new-message', handleNewMessage);
        socket.off('message-updated', handleMessageUpdated);
      };
    }
  }, [socket, dispatch, user]);

  return (
    <div className="flex h-screen overflow-hidden app-bg">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Outlet />
      </div>
    </div>
  );
}

export default Layout;
