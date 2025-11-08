import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { motion } from 'framer-motion';
import { fetchMessages, sendMessage, setTyping, addMessage } from '../../store/slices/messageSlice.js';
import { getChat } from '../../store/slices/chatSlice.js';
import { setSocket } from '../../store/slices/chatSlice.js';
import { connectSocket, getSocket } from '../../services/socketService.js';
import { selectAuth } from '../../store/slices/authSlice.js';
import { formatMessageTime, getInitials, compareIds, getIdString, getOtherParticipantFromChat } from '../../utils/helpers.js';
import toast from 'react-hot-toast';

function ChatPage() {
  const { chatId } = useParams();
  const dispatch = useDispatch();
  const { currentChat, loading: chatLoading } = useSelector((state) => state.chat);
  const { messages, typingUsers, loading: messagesLoading } = useSelector((state) => state.message);
  const { user, accessToken } = useSelector(selectAuth);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const socketInitialized = useRef(false);

  // Initialize socket once when accessToken is available
  useEffect(() => {
    if (accessToken && !socketInitialized.current) {
      const socket = connectSocket(accessToken);
      dispatch(setSocket(socket));
      socketInitialized.current = true;

      socket.on('new-message', (message) => {
        dispatch(addMessage(message));
      });

      socket.on('typing', (data) => {
        dispatch(setTyping({ chatId: data.chatId, userId: data.userId, isTyping: data.isTyping }));
      });

      return () => {
        socket.off('new-message');
        socket.off('typing');
      };
    }
  }, [accessToken, dispatch]);

  useEffect(() => {
    if (chatId) {
      dispatch(getChat(chatId));
      dispatch(fetchMessages(chatId));
    }
  }, [chatId, dispatch]);

  useEffect(() => {
    const socket = getSocket();
    if (socket && chatId) {
      socket.emit('join-chat', chatId);
      return () => {
        socket.emit('leave-chat', chatId);
      };
    }
  }, [chatId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages[chatId]]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || !chatId) return;

    const content = input.trim();
    setInput('');
    setIsTyping(false);

    // Clear typing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    const socket = getSocket();
    if (socket) {
      socket.emit('stop-typing', { chatId });
    }

    // Only send via API - socket will receive and broadcast to others
    try {
      await dispatch(sendMessage({ chatId, content, messageType: 'text' })).unwrap();
    } catch (error) {
      toast.error(error || 'Failed to send message');
      setInput(content); // Restore input on error
    }
  };

  const handleTyping = () => {
    const socket = getSocket();
    if (socket && chatId) {
      if (!isTyping) {
        setIsTyping(true);
        socket.emit('typing', { chatId });
      }

      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        setIsTyping(false);
        socket.emit('stop-typing', { chatId });
      }, 3000);
    }
  };

  const chatMessages = messages[chatId] || [];
  const other = getOtherParticipantFromChat(currentChat, user?._id);
  const typingUserIds = typingUsers[chatId] || [];

  if (!chatId) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-white/60 text-center">
          <p className="text-xl mb-2">Select a chat to start messaging</p>
        </div>
      </div>
    );
  }

  if (chatLoading || messagesLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-white/60 text-center">
          <p className="text-xl mb-2">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {currentChat && (
        <div className="glass-dark p-4 flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-semibold">
            {other?.avatar ? (
              <img src={other.avatar} alt={other.username} className="w-full h-full rounded-full object-cover" />
            ) : (
              getInitials(other?.username || 'U')
            )}
          </div>
          <div>
            <h3 className="text-white font-semibold">{other?.username}</h3>
            {other?.isOnline && <p className="text-green-400 text-xs">Online</p>}
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
        {chatMessages.map((message) => {
          const senderId = getIdString(message.sender?._id || message.sender);
          const userId = getIdString(user?._id);
          const isSent = compareIds(senderId, userId);
          
          return (
            <motion.div
              key={message._id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${isSent ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`chat-bubble ${isSent ? 'chat-bubble-sent' : 'chat-bubble-received'}`}>
                {!isSent && (
                  <p className="text-white/60 text-xs mb-1">
                    {typeof message.sender === 'object' ? message.sender.username : 'Unknown'}
                  </p>
                )}
                <p className="text-white">{message.content}</p>
                <p className="text-white/50 text-xs mt-1">
                  {formatMessageTime(new Date(message.createdAt))}
                </p>
              </div>
            </motion.div>
          );
        })}
        {typingUserIds.length > 0 && (
          <div className="flex justify-start">
            <div className="chat-bubble chat-bubble-received">
              <p className="text-white/60 italic">Typing...</p>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSend} className="glass-dark p-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              handleTyping();
            }}
            placeholder="Type a message..."
            className="flex-1 glass-input"
          />
          <button type="submit" className="glass-button">
            Send
          </button>
        </div>
      </form>
    </div>
  );
}

export default ChatPage;

