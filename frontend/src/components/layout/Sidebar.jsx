import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useSelector, useDispatch } from 'react-redux';
import { fetchChats, setCurrentChat } from '../../store/slices/chatSlice.js';
import { selectAuth } from '../../store/slices/authSlice.js';
import { getInitials, truncate, getIdString, getOtherParticipantFromChat } from '../../utils/helpers.js';
import { formatMessageTime } from '../../utils/helpers.js';

function Sidebar() {
  const { chatId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { chats, loading } = useSelector((state) => state.chat);
  const { user } = useSelector(selectAuth);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (user) {
      dispatch(fetchChats());
    }
  }, [dispatch, user]);

  const handleChatClick = (chat) => {
    dispatch(setCurrentChat(chat));
    navigate(`/chat/${chat._id}`);
  };

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
    <motion.div
      initial={{ x: -300 }}
      animate={{ x: 0 }}
      className="w-80 glass-dark p-4 flex flex-col h-full"
    >
      <div className="mb-4">
        <h2 className="text-2xl font-bold text-white mb-2">Chats</h2>
        <div className="glass-input w-full flex items-center">
          <input
            type="text"
            placeholder="Search chats..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-transparent outline-none text-white placeholder:text-white/60"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-hide">
        {loading ? (
          <div className="text-white/60 text-center py-8">Loading chats...</div>
        ) : filteredChats.length === 0 ? (
          <div className="text-white/60 text-center py-8">
            {searchQuery ? 'No chats found' : 'No chats yet'}
          </div>
        ) : (
          filteredChats.map((chat) => {
            const other = getOtherParticipantFromChat(chat, user?._id);
            const isActive = chat._id === chatId;

            return (
              <motion.div
                key={chat._id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleChatClick(chat)}
                className={`glass p-3 mb-2 rounded-xl cursor-pointer transition-all ${
                  isActive ? 'bg-indigo-500/30 border-indigo-400/30' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-semibold">
                    {other.avatar ? (
                      <img src={other.avatar} alt={other.username} className="w-full h-full rounded-full object-cover" />
                    ) : (
                      getInitials(other.username)
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="text-white font-semibold truncate">{other.username}</h3>
                      {chat.lastMessage && (
                        <span className="text-white/60 text-xs">
                          {formatMessageTime(new Date(chat.lastMessage.createdAt))}
                        </span>
                      )}
                    </div>
                    {chat.lastMessage && (
                      <p className="text-white/70 text-sm truncate">
                        {truncate(chat.lastMessage.content, 30)}
                      </p>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </motion.div>
  );
}

export default Sidebar;

