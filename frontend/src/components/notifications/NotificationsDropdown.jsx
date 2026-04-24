import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiBell, FiX, FiCheck, FiTrash2, FiMessageCircle, FiUsers, FiUserPlus, FiAtSign } from 'react-icons/fi';
import { useSelector, useDispatch } from 'react-redux';
import { fetchNotifications, markAsRead, markAllAsRead, deleteNotification, addNotification } from '../../store/slices/notificationSlice.js';
import { formatMessageTime } from '../../utils/helpers.js';
import { getSocket } from '../../services/socketService.js';

function NotificationsDropdown({ onClose }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { notifications, unreadCount, loading } = useSelector((state) => state.notification);
  const [showAll, setShowAll] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    dispatch(fetchNotifications());
  }, [dispatch]);

  useEffect(() => {
    const socket = getSocket();
    if (socket) {
      socket.on('notification', (notification) => {
        dispatch(addNotification(notification));
      });

      return () => {
        socket.off('notification');
      };
    }
  }, [dispatch]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const handleNotificationClick = async (notification) => {
    if (!notification.read) {
      await dispatch(markAsRead(notification._id));
    }

    if (notification.link) {
      navigate(notification.link);
      onClose();
    }
  };

  const handleMarkAllAsRead = async () => {
    await dispatch(markAllAsRead());
  };

  const handleDelete = async (e, notificationId) => {
    e.stopPropagation();
    await dispatch(deleteNotification(notificationId));
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'message':
      case 'group_message':
        return <FiMessageCircle className="w-5 h-5" />;
      case 'group_invite':
        return <FiUsers className="w-5 h-5" />;
      case 'friend_request':
        return <FiUserPlus className="w-5 h-5" />;
      case 'mention':
        return <FiAtSign className="w-5 h-5" />;
      default:
        return <FiBell className="w-5 h-5" />;
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case 'message':
      case 'group_message':
        return 'text-blue-500';
      case 'group_invite':
        return 'text-green-500';
      case 'friend_request':
        return 'text-purple-500';
      case 'mention':
        return 'text-orange-500';
      default:
        return 'text-gray-500';
    }
  };

  const displayedNotifications = showAll ? notifications : notifications.slice(0, 5);
  const hasMore = notifications.length > 5;

  return (
    <motion.div
      ref={dropdownRef}
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="absolute top-full right-0 mt-2 w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-[600px] flex flex-col"
    >
      <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-primary">Notifications</h3>
          {unreadCount > 0 && (
            <span className="px-2 py-0.5 bg-[#00A884] text-white text-xs rounded-full">
              {unreadCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              className="p-1.5 rounded-full hover:bg-gray-100 transition-colors"
              title="Mark all as read"
            >
              <FiCheck className="w-4 h-4 text-secondary" />
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-gray-100 transition-colors"
          >
            <FiX className="w-4 h-4 text-secondary" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-8 text-center">
            <div className="spinner mx-auto"></div>
            <p className="text-secondary text-sm mt-2">Loading notifications...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-8 text-center">
            <FiBell className="w-12 h-12 text-gray-300 mx-auto mb-2" />
            <p className="text-secondary text-sm">No notifications</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {displayedNotifications.map((notification) => (
              <motion.div
                key={notification._id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                onClick={() => handleNotificationClick(notification)}
                className={`p-4 cursor-pointer transition-colors group ${
                  notification.read ? 'bg-white hover:bg-gray-50' : 'bg-blue-50 hover:bg-blue-100'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`flex-shrink-0 ${getNotificationColor(notification.type)}`}>
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-primary">{notification.title}</p>
                        <p className="text-xs text-secondary mt-1">{notification.message}</p>
                        <p className="text-xs text-secondary mt-1">
                          {formatMessageTime(new Date(notification.createdAt))}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {!notification.read && (
                          <div className="w-2 h-2 bg-[#00A884] rounded-full mt-1"></div>
                        )}
                        <button
                          onClick={(e) => handleDelete(e, notification._id)}
                          className="p-1 rounded-full hover:bg-gray-200 transition-colors opacity-0 group-hover:opacity-100"
                        >
                          <FiTrash2 className="w-3 h-3 text-secondary" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {hasMore && (
        <div className="px-4 py-3 border-t border-gray-200">
          <button
            onClick={() => setShowAll(!showAll)}
            className="w-full text-sm text-accent hover:text-[#06CF9C] transition-colors font-medium"
          >
            {showAll ? 'Show less' : `Show all (${notifications.length})`}
          </button>
        </div>
      )}
    </motion.div>
  );
}

export default NotificationsDropdown;
