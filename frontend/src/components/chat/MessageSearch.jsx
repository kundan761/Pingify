import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiSearch, FiX, FiArrowUp, FiArrowDown } from 'react-icons/fi';
import { useDispatch, useSelector } from 'react-redux';
import { searchMessages } from '../../store/slices/messageSlice.js';
import { formatMessageTime, compareIds, getIdString } from '../../utils/helpers.js';
import { selectAuth } from '../../store/slices/authSlice.js';

function MessageSearch({ chatId, onClose, onMessageClick }) {
  const dispatch = useDispatch();
  const { user } = useSelector(selectAuth);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const searchTimeoutRef = useRef(null);

  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (query.trim() && chatId) {
      setLoading(true);
      searchTimeoutRef.current = setTimeout(async () => {
        try {
          const result = await dispatch(searchMessages({ chatId, query: query.trim() })).unwrap();
          setResults(result || []);
          setSelectedIndex(-1);
        } catch (error) {
          setResults([]);
        } finally {
          setLoading(false);
        }
      }, 500);
    } else {
      setResults([]);
      setLoading(false);
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [query, chatId, dispatch]);

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < results.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === 'Enter' && selectedIndex >= 0 && results[selectedIndex]) {
      handleMessageClick(results[selectedIndex]);
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  const handleMessageClick = (message) => {
    if (onMessageClick) {
      onMessageClick(message);
    }
    onClose();
  };

  return (
    <div className="absolute top-0 left-0 right-0 bg-secondary border-b border-border z-10">
      <div className="px-4 py-3 flex items-center gap-3">
        <button
          onClick={onClose}
          className="p-2 rounded-full hover:bg-tertiary transition-colors"
        >
          <FiX className="w-5 h-5 text-secondary" />
        </button>
        <div className="flex-1 relative">
          <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-secondary" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search messages..."
            autoFocus
            className="input pl-10"
          />
        </div>
        {results.length > 0 && (
          <div className="flex items-center gap-2 text-sm text-secondary">
            <span>{selectedIndex + 1} / {results.length}</span>
          </div>
        )}
      </div>

      <AnimatePresence>
        {results.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="max-h-64 overflow-y-auto border-t border-border bg-secondary"
          >
            {results.map((message, index) => {
              const senderId = getIdString(message.sender?._id || message.sender);
              const userId = getIdString(user?._id);
              const isSent = compareIds(senderId, userId);

              return (
                <motion.div
                  key={message._id}
                  whileHover={{ backgroundColor: 'var(--bg-tertiary)' }}
                  onClick={() => handleMessageClick(message)}
                  className={`p-3 cursor-pointer border-b border-border ${
                    index === selectedIndex ? 'bg-accent/20' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium text-accent">
                          {typeof message.sender === 'object' ? message.sender.username : 'User'}
                        </span>
                        <span className="text-xs text-secondary">
                          {formatMessageTime(new Date(message.createdAt))}
                        </span>
                      </div>
                      <p className="text-sm truncate text-primary">
                        {message.content}
                      </p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {loading && (
        <div className="px-4 py-2 text-center">
          <div className="spinner mx-auto"></div>
          <p className="text-xs mt-2 text-secondary">Searching...</p>
        </div>
      )}

      {!loading && query.trim() && results.length === 0 && (
        <div className="px-4 py-8 text-center">
          <p className="text-sm text-secondary">No messages found</p>
        </div>
      )}
    </div>
  );
}

export default MessageSearch;
