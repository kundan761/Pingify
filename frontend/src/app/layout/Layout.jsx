import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from '../../components/layout/Sidebar.jsx';
import { useSocket } from '../../hooks/useSocket.js';
import { useDispatch, useSelector } from 'react-redux';
import { useEffect } from 'react';
import { addNotification } from '../../store/slices/notificationSlice.js';
import { updateChat, fetchChats } from '../../store/slices/chatSlice.js';
import { addMessage, updateMessage } from '../../store/slices/messageSlice.js';
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
        // Show toast if it's not a message (already handled below)
        if (notification.type !== 'message') {
          toast(notification.message, { icon: '🔔' });
        }
      };

      const handleNewMessage = (message) => {
        // Update the last message in the chat list
        dispatch(fetchChats()); 
        
        const senderId = getIdString(message.sender?._id || message.sender);
        if (senderId !== getIdString(user?._id)) {
          // If not currently in this chat, show a toast
          if (location.pathname !== `/chat/${message.chat}`) {
            toast.success(`New message in ${message.chatType === 'group' ? 'group' : 'chat'}`);
          }
        }
      };

      const handleMessageUpdated = (message) => {
        // Update in chat list if it was the last message
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
