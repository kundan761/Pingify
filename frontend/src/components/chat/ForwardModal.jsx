import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiSearch, FiCheck } from 'react-icons/fi';
import { useSelector, useDispatch } from 'react-redux';
import { fetchChats } from '../../store/slices/chatSlice.js';
import { getInitials, getOtherParticipantFromChat } from '../../utils/helpers.js';
import { selectAuth } from '../../store/slices/authSlice.js';

function ForwardModal({ message, onClose, onConfirm }) {
  const dispatch = useDispatch();
  const { chats } = useSelector((state) => state.chat);
  const { user } = useSelector(selectAuth);
  const [selectedChats, setSelectedChats] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    dispatch(fetchChats());
  }, [dispatch]);

  const filteredChats = chats.filter((chat) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    if (chat.chatType === 'group') {
      return (chat.name || '').toLowerCase().includes(query);
    }
    const other = getOtherParticipantFromChat(chat, user?._id);
    return (other.username || '').toLowerCase().includes(query);
  });

  const toggleChatSelection = (chatId) => {
    setSelectedChats((prev) =>
      prev.includes(chatId)
        ? prev.filter((id) => id !== chatId)
        : [...prev, chatId]
    );
  };

  const handleConfirm = () => {
    if (selectedChats.length > 0) {
      onConfirm(selectedChats);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9 }}
          onClick={(e) => e.stopPropagation()}
          className="card p-6 max-w-md w-full max-h-[80vh] overflow-y-auto"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-medium text-primary">
              Forward Message
            </h2>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-tertiary transition-colors"
            >
              <FiX className="w-5 h-5 text-secondary" />
            </button>
          </div>

          {message && (
            <div className="mb-4 p-3 rounded-lg bg-tertiary">
              <p className="text-xs mb-1 text-secondary">Forwarding:</p>
              <p className="text-sm text-primary">
                {message.content || 'Media message'}
              </p>
            </div>
          )}

          <div className="mb-4">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-secondary" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search chats..."
                className="input pl-10"
              />
            </div>
          </div>

          <div className="space-y-2 max-h-60 overflow-y-auto mb-4">
            {filteredChats.map((chat) => {
              const other = getOtherParticipantFromChat(chat, user?._id);
              const isSelected = selectedChats.includes(chat._id);
              const isGroup = chat.chatType === 'group';

              return (
                <motion.div
                  key={chat._id}
                  whileHover={{ backgroundColor: 'var(--bg-tertiary)' }}
                  whileTap={{ backgroundColor: 'var(--bg-tertiary)' }}
                  onClick={() => toggleChatSelection(chat._id)}
                  className={`p-3 rounded-lg cursor-pointer transition-colors ${
                    isSelected ? 'bg-accent/20' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="avatar-md">
                        {isGroup ? (
                          <div className="w-full h-full rounded-full bg-[#00A884] flex items-center justify-center">
                            <span className="text-white text-sm">G</span>
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
                      <div>
                        <p className="text-sm font-medium text-primary">
                          {isGroup ? chat.name : other?.username || 'Unknown'}
                        </p>
                        {!isGroup && (
                          <p className="text-xs text-secondary">
                            {other?.email || ''}
                          </p>
                        )}
                      </div>
                    </div>
                    {isSelected && (
                      <FiCheck className="w-5 h-5 text-accent" />
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>

          <div className="flex gap-3">
            <motion.button
              onClick={handleConfirm}
              disabled={selectedChats.length === 0}
              whileHover={{ scale: selectedChats.length > 0 ? 1.02 : 1 }}
              whileTap={{ scale: selectedChats.length > 0 ? 0.98 : 1 }}
              className="btn-primary flex-1 py-2"
            >
              Forward ({selectedChats.length})
            </motion.button>
            <motion.button
              onClick={onClose}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="btn-secondary px-4 py-2"
            >
              Cancel
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default ForwardModal;
