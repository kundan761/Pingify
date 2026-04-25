import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiSearch, FiMoreVertical, FiMessageCircle, FiPlus, FiBell, FiUser, FiSettings, FiLogOut, FiMoon, FiSun, FiMonitor } from 'react-icons/fi';
import { useSelector, useDispatch } from 'react-redux';
import { fetchChats, setCurrentChat, updateUserOnlineStatus } from '../../store/slices/chatSlice.js';
import { updateUserOnlineStatus as updateUserStatus } from '../../store/slices/userSlice.js';
import { useSocket } from '../../hooks/useSocket.js';
import { selectAuth, logout } from '../../store/slices/authSlice.js';
import { selectTheme, setTheme } from '../../store/slices/themeSlice.js';
import { getInitials, truncate, getIdString, getOtherParticipantFromChat, formatMessageTime } from '../../utils/helpers.js';
import { isEncryptedPayload, decryptMessage } from '../../utils/crypto.js';
import NotificationsDropdown from '../notifications/NotificationsDropdown.jsx';

const LastMessage = ({ message, currentUserId }) => {
  const [decrypted, setDecrypted] = useState(
    isEncryptedPayload(message.content) ? '🔒 Decrypting...' : message.content
  );
  const [isDecrypting, setIsDecrypting] = useState(isEncryptedPayload(message.content));

  useEffect(() => {
    const process = async () => {
      if (message.deleted) {
        setDecrypted('Message deleted');
        return;
      }
      if (isEncryptedPayload(message.content)) {
        setIsDecrypting(true);
        const privateKey = localStorage.getItem('privateKey');
        if (privateKey) {
          const result = await decryptMessage(message.content, privateKey, currentUserId);
          setDecrypted(result);
        } else {
          setDecrypted('🔒 Encrypted message');
        }
        setIsDecrypting(false);
      } else {
        setDecrypted(message.content);
      }
    };
    process();
  }, [message.content, message.deleted, currentUserId]);

  return (
    <p className={`text-secondary text-sm truncate flex-1 ${message.deleted ? 'italic' : ''}`}>
      {isDecrypting ? 'Decrypting...' : truncate(decrypted, 40)}
    </p>
  );
};

function Sidebar() {
  const { chatId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { chats, loading } = useSelector((state) => state.chat);
  const { user } = useSelector(selectAuth);
  const { unreadCount } = useSelector((state) => state.notification);
  const themeMode = useSelector(selectTheme);
  const socket = useSocket();
  const [searchQuery, setSearchQuery] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const notificationButtonRef = useRef(null);
  const profileMenuRef = useRef(null);

  useEffect(() => {
    if (user) {
      dispatch(fetchChats());
    }
  }, [dispatch, user]);

  useEffect(() => {
    if (socket) {
      const handleOnline = (data) => {
        dispatch(updateUserOnlineStatus({ userId: data.userId, isOnline: true }));
        dispatch(updateUserStatus({ userId: data.userId, isOnline: true }));
      };

      const handleOffline = (data) => {
        dispatch(updateUserOnlineStatus({ userId: data.userId, isOnline: false }));
        dispatch(updateUserStatus({ userId: data.userId, isOnline: false }));
      };

      socket.on('user-online', handleOnline);
      socket.on('user-offline', handleOffline);

      return () => {
        socket.off('user-online', handleOnline);
        socket.off('user-offline', handleOffline);
      };
    }
  }, [socket, dispatch]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleChatClick = (chat) => {
    dispatch(setCurrentChat(chat));
    navigate(`/chat/${chat._id}`);
  };

  const toggleTheme = () => {
    if (themeMode === 'light') dispatch(setTheme('dark'));
    else if (themeMode === 'dark') dispatch(setTheme('system'));
    else dispatch(setTheme('light'));
  };

  const ThemeIcon = themeMode === 'light' ? FiSun : themeMode === 'dark' ? FiMoon : FiMonitor;

  const filteredChats = chats.filter((chat) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    if (chat.chatType === 'group') {
      return (chat.name || '').toLowerCase().includes(query);
    }
    const other = getOtherParticipantFromChat(chat, user?._id);
    return (other.username || '').toLowerCase().includes(query);
  });

  return (
    <div className="w-[380px] sidebar-bg flex flex-col h-full">
      <div className="px-4 py-3 bg-secondary transition-colors duration-200">
        <div className="flex items-center gap-3 mb-3">
          <div className="avatar-md">
            {user?.avatar ? (
              <img
                src={user.avatar}
                alt={user.username}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              getInitials(user?.username || 'U')
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-primary font-medium text-sm truncate">{user?.username || 'User'}</h2>
            <p className="text-secondary text-xs truncate">{user?.email || ''}</p>
          </div>
          <div className="flex items-center gap-1">
            <div className="relative" ref={notificationButtonRef}>
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2 rounded-full hover:bg-tertiary transition-colors relative"
                title="Notifications"
              >
                <FiBell className="w-5 h-5 text-secondary" />
                {unreadCount > 0 && (
                  <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>
              <AnimatePresence>
                {showNotifications && (
                  <NotificationsDropdown onClose={() => setShowNotifications(false)} />
                )}
              </AnimatePresence>
            </div>
            <div className="relative" ref={profileMenuRef}>
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="p-2 rounded-full hover:bg-tertiary transition-colors"
              >
                <FiMoreVertical className="w-5 h-5 text-secondary" />
              </button>
              <AnimatePresence>
                {showProfileMenu && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="absolute top-full right-0 mt-2 card shadow-xl z-50 min-w-[220px] overflow-hidden"
                  >
                    <button
                      onClick={() => {
                        navigate('/profile');
                        setShowProfileMenu(false);
                      }}
                      className="w-full px-4 py-3 text-left text-sm text-primary hover:bg-tertiary flex items-center gap-3 transition-colors"
                    >
                      <FiUser className="w-4 h-4" />
                      Profile
                    </button>
                    <button
                      onClick={() => {
                        navigate('/settings');
                        setShowProfileMenu(false);
                      }}
                      className="w-full px-4 py-3 text-left text-sm text-primary hover:bg-tertiary flex items-center gap-3 transition-colors"
                    >
                      <FiSettings className="w-4 h-4" />
                      Settings
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleTheme();
                      }}
                      className="w-full px-4 py-3 text-left text-sm text-primary hover:bg-tertiary flex items-center justify-between transition-colors"
                    >
                      <span className="flex items-center gap-3">
                        <ThemeIcon className="w-4 h-4" />
                        Theme
                      </span>
                      <span className="text-xs text-secondary capitalize">{themeMode}</span>
                    </button>
                    <div className="border-t border-border my-1"></div>
                    <button
                      onClick={async () => {
                        try {
                          await dispatch(logout()).unwrap();
                          navigate('/auth/login');
                          setShowProfileMenu(false);
                        } catch (error) {
                          navigate('/auth/login');
                          setShowProfileMenu(false);
                        }
                      }}
                      className="w-full px-4 py-3 text-left text-sm text-red-500 hover:bg-tertiary flex items-center gap-3 transition-colors rounded-b-lg"
                    >
                      <FiLogOut className="w-4 h-4" />
                      Logout
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        <div className="relative">
          <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-secondary" />
          <input
            type="text"
            placeholder="Search chats or users"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input pl-10 pr-4 py-2 text-sm"
          />
        </div>
      </div>

      <div className="px-4 py-2 bg-secondary">
        <button
          onClick={() => navigate('/')}
          className="w-full btn-primary flex items-center justify-center gap-2 py-2.5"
        >
          <FiPlus className="w-4 h-4" />
          <span>New Chat</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto bg-secondary">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="spinner mb-4"></div>
            <p className="text-secondary text-sm">Loading chats...</p>
          </div>
        ) : filteredChats.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4">
            <p className="text-secondary text-sm text-center">
              {searchQuery ? 'No chats found' : 'No chats yet'}
            </p>
          </div>
        ) : (
          filteredChats.map((chat) => {
            const other = getOtherParticipantFromChat(chat, user?._id);
            const isActive = chat._id === chatId;
            const isGroup = chat.chatType === 'group';

            return (
              <motion.div
                key={chat._id}
                whileHover={{ backgroundColor: 'var(--bg-tertiary)' }}
                whileTap={{ backgroundColor: 'var(--bg-tertiary)' }}
                onClick={() => handleChatClick(chat)}
                className={`px-4 py-3 cursor-pointer transition-colors ${
                  isActive ? 'bg-tertiary' : 'bg-secondary'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="relative flex-shrink-0">
                    <div className="avatar-md">
                      {isGroup ? (
                        <div className="w-full h-full rounded-full bg-accent flex items-center justify-center">
                          <FiMessageCircle className="w-5 h-5 text-white" />
                        </div>
                      ) : other?.avatar ? (
                        <img
                          src={other.avatar}
                          alt={other.username}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        getInitials(other?.username || 'U')
                      )}
                    </div>
                    {!isGroup && other?.isOnline && (
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-accent rounded-full border-2 border-secondary"></div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="text-primary font-medium text-sm truncate">
                        {isGroup ? chat.name : other?.username || 'Unknown'}
                      </h3>
                      {chat.lastMessage && (
                        <span className="text-secondary text-xs whitespace-nowrap ml-2">
                          {formatMessageTime(new Date(chat.lastMessage.createdAt))}
                        </span>
                      )}
                    </div>
                    {chat.lastMessage ? (
                      <div className="flex items-center gap-2">
                        <LastMessage message={chat.lastMessage} currentUserId={user?._id} />
                      </div>
                    ) : (
                      <p className="text-secondary text-sm italic">No messages yet</p>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default Sidebar;
