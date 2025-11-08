import { useState } from 'react';
import { motion } from 'framer-motion';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { selectAuth } from '../../store/slices/authSlice.js';
import { createChat, fetchChats } from '../../store/slices/chatSlice.js';
import { searchUsers } from '../../store/slices/userSlice.js';
import * as groupService from '../../services/groupService.js';
import toast from 'react-hot-toast';

function HomePage() {
  const { user } = useSelector(selectAuth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');
  const [selectedUsers, setSelectedUsers] = useState([]);
  const { searchResults, loading: searchLoading } = useSelector((state) => state.user);

  const handleSearchUsers = async (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      await dispatch(searchUsers(searchQuery));
    }
  };

  const handleCreateChat = async (participantId) => {
    try {
      const result = await dispatch(createChat(participantId)).unwrap();
      setShowNewChatModal(false);
      setSearchQuery('');
      // Refresh chats list to include the new chat
      dispatch(fetchChats());
      navigate(`/chat/${result._id}`);
      toast.success('Chat created successfully!');
    } catch (error) {
      toast.error(error || 'Failed to create chat');
    }
  };

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    if (!groupName.trim()) {
      toast.error('Group name is required');
      return;
    }

    try {
      const memberIds = selectedUsers.map((u) => u._id);
      const response = await groupService.createGroup(
        { name: groupName, description: groupDescription, memberIds },
        null
      );
      const group = response.data.data || response.data;
      setShowGroupModal(false);
      setGroupName('');
      setGroupDescription('');
      setSelectedUsers([]);
      // Navigate to the chat associated with the group
      // chat can be an object with _id or just the ID string
      const chatId = typeof group.chat === 'object' ? group.chat._id : group.chat;
      if (chatId) {
        // Refresh chats list to include the new group
        dispatch(fetchChats());
        navigate(`/chat/${chatId}`);
        toast.success('Group created successfully!');
      } else {
        toast.error('Group created but chat not found');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create group');
    }
  };

  const toggleUserSelection = (user) => {
    setSelectedUsers((prev) =>
      prev.some((u) => u._id === user._id)
        ? prev.filter((u) => u._id !== user._id)
        : [...prev, user]
    );
  };

  return (
    <div className="h-full flex items-center justify-center p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass p-12 text-center max-w-2xl"
      >
        <h1 className="text-4xl font-bold text-white mb-4">
          Welcome to Pingify, {user?.username}!
        </h1>
        <p className="text-white/80 text-lg mb-8">
          Start a conversation by selecting a chat from the sidebar or create a new one.
        </p>
        <div className="flex gap-4 justify-center">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowNewChatModal(true)}
            className="glass-button"
          >
            New Chat
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowGroupModal(true)}
            className="glass-button"
          >
            Create Group
          </motion.button>
        </div>
      </motion.div>

      {/* New Chat Modal */}
      {showNewChatModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass p-6 rounded-xl max-w-md w-full mx-4"
          >
            <h2 className="text-2xl font-bold text-white mb-4">New Chat</h2>
            <form onSubmit={handleSearchUsers} className="mb-4">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search users..."
                className="glass-input w-full mb-2"
              />
              <button type="submit" className="glass-button w-full" disabled={searchLoading}>
                {searchLoading ? 'Searching...' : 'Search'}
              </button>
            </form>
            <div className="max-h-60 overflow-y-auto">
              {searchResults.map((result) => (
                <div
                  key={result._id}
                  onClick={() => handleCreateChat(result._id)}
                  className="glass p-3 mb-2 rounded cursor-pointer hover:bg-indigo-500/20"
                >
                  <p className="text-white">{result.username}</p>
                  <p className="text-white/60 text-sm">{result.email}</p>
                </div>
              ))}
            </div>
            <button
              onClick={() => {
                setShowNewChatModal(false);
                setSearchQuery('');
              }}
              className="glass-button w-full mt-4"
            >
              Cancel
            </button>
          </motion.div>
        </div>
      )}

      {/* Create Group Modal */}
      {showGroupModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass p-6 rounded-xl max-w-md w-full mx-4 max-h-[80vh] overflow-y-auto"
          >
            <h2 className="text-2xl font-bold text-white mb-4">Create Group</h2>
            <form onSubmit={handleCreateGroup}>
              <input
                type="text"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="Group name"
                className="glass-input w-full mb-2"
                required
              />
              <textarea
                value={groupDescription}
                onChange={(e) => setGroupDescription(e.target.value)}
                placeholder="Description (optional)"
                className="glass-input w-full mb-2"
                rows={3}
              />
              <div className="mb-4">
                <p className="text-white mb-2">Add Members (search first)</p>
                <form onSubmit={handleSearchUsers} className="mb-2">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search users to add..."
                    className="glass-input w-full"
                  />
                  <button type="submit" className="glass-button w-full mt-2" disabled={searchLoading}>
                    {searchLoading ? 'Searching...' : 'Search'}
                  </button>
                </form>
                <div className="max-h-40 overflow-y-auto mb-2">
                  {searchResults.map((result) => (
                    <div
                      key={result._id}
                      onClick={() => toggleUserSelection(result)}
                      className={`glass p-2 mb-1 rounded cursor-pointer ${
                        selectedUsers.some((u) => u._id === result._id) ? 'bg-indigo-500/30' : ''
                      }`}
                    >
                      <p className="text-white text-sm">{result.username}</p>
                    </div>
                  ))}
                </div>
                {selectedUsers.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {selectedUsers.map((user) => (
                      <span
                        key={user._id}
                        className="glass px-2 py-1 rounded text-white text-sm"
                      >
                        {user.username}
                        <button
                          onClick={() => toggleUserSelection(user)}
                          className="ml-2 text-red-400"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <button type="submit" className="glass-button flex-1">
                  Create Group
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowGroupModal(false);
                    setGroupName('');
                    setGroupDescription('');
                    setSelectedUsers([]);
                    setSearchQuery('');
                  }}
                  className="glass-button flex-1"
                >
                  Cancel
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}

export default HomePage;

