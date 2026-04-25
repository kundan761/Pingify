import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  FiMessageCircle,
  FiUsers,
  FiSearch,
  FiX,
  FiCheck,
  FiPlus,
  FiUserPlus,
} from 'react-icons/fi';
import { selectAuth } from '../../store/slices/authSlice.js';
import { createChat, fetchChats } from '../../store/slices/chatSlice.js';
import { searchUsers, clearSearchResults } from '../../store/slices/userSlice.js';
import * as groupService from '../../services/groupService.js';
import { getIdString } from '../../utils/helpers.js';
import toast from 'react-hot-toast';

function HomePage() {
  const { user } = useSelector(selectAuth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [newChatSearchQuery, setNewChatSearchQuery] = useState('');
  const [groupSearchQuery, setGroupSearchQuery] = useState('');
  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');
  const [selectedUsers, setSelectedUsers] = useState([]);
  const { searchResults, loading: searchLoading } = useSelector((state) => state.user);
  const { chats } = useSelector((state) => state.chat);
  const [searchParams, setSearchParams] = useSearchParams();
  const newChatSearchTimeoutRef = useRef(null);
  const groupSearchTimeoutRef = useRef(null);

  useEffect(() => {
    if (newChatSearchTimeoutRef.current) {
      clearTimeout(newChatSearchTimeoutRef.current);
    }

    if (newChatSearchQuery.trim() && showNewChatModal) {
      newChatSearchTimeoutRef.current = setTimeout(() => {
        dispatch(searchUsers(newChatSearchQuery.trim()));
      }, 1000);
    } else if (!newChatSearchQuery.trim() && showNewChatModal) {
      dispatch(clearSearchResults());
    }

    return () => {
      if (newChatSearchTimeoutRef.current) {
        clearTimeout(newChatSearchTimeoutRef.current);
      }
    };
  }, [newChatSearchQuery, showNewChatModal, dispatch]);

  useEffect(() => {
    if (groupSearchTimeoutRef.current) {
      clearTimeout(groupSearchTimeoutRef.current);
    }

    if (groupSearchQuery.trim() && showGroupModal) {
      groupSearchTimeoutRef.current = setTimeout(() => {
        dispatch(searchUsers(groupSearchQuery.trim()));
      }, 1000);
    } else if (!groupSearchQuery.trim() && showGroupModal) {
      dispatch(clearSearchResults());
    }

    return () => {
      if (groupSearchTimeoutRef.current) {
        clearTimeout(groupSearchTimeoutRef.current);
      }
    };
  }, [groupSearchQuery, showGroupModal, dispatch]);

  useEffect(() => {
    if (!showNewChatModal) {
      setNewChatSearchQuery('');
      dispatch(clearSearchResults());
    }
  }, [showNewChatModal, dispatch]);

  useEffect(() => {
    if (!showGroupModal) {
      setGroupSearchQuery('');
      dispatch(clearSearchResults());
      setSelectedUsers([]);
    }
  }, [showGroupModal, dispatch]);
  useEffect(() => {
    if (searchParams.get('newChat') === 'true') {
      setShowNewChatModal(true);
      // Remove the parameter after opening
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('newChat');
      setSearchParams(newParams, { replace: true });
    }
    if (searchParams.get('newGroup') === 'true') {
      setShowGroupModal(true);
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('newGroup');
      setSearchParams(newParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);
  const handleCreateChat = async (participantId) => {
    try {
      const result = await dispatch(createChat(participantId)).unwrap();
      setShowNewChatModal(false);
      setNewChatSearchQuery('');
      dispatch(clearSearchResults());
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
      const chatId = typeof group.chat === 'object' ? group.chat._id : group.chat;
      if (chatId) {
        dispatch(fetchChats());
        navigate(`/chat/${chatId}`);
        toast.success('Group created successfully!');
      } else {
        toast.error('Group created but chat not found');
      }
    } catch (error) {

      let errorMessage = 'Failed to create group';
      if (error.response?.data) {
        if (error.response.data.errors && Array.isArray(error.response.data.errors)) {
          errorMessage = error.response.data.errors.map(err => `${err.path}: ${err.message}`).join(', ');
        } else if (error.response.data.message) {
          errorMessage = error.response.data.message;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage);
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
    <div className="h-full flex items-center justify-center chat-bg">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center max-w-md px-4"
      >
        <div className="mb-8">
          <div className="w-32 h-32 rounded-full bg-[#00A884] flex items-center justify-center shadow-lg mx-auto mb-6">
            <FiMessageCircle className="w-16 h-16 text-white" />
          </div>
          <h1 className="text-4xl font-light text-primary mb-3">
            Welcome to <span className="font-normal">Pingify</span>
          </h1>
          <p className="text-secondary text-base mb-1">Hello, {user?.username}!</p>
          <p className="text-secondary text-sm">
            Start a conversation by selecting a chat from the sidebar or create a new one.
          </p>
        </div>

        <div className="flex gap-3 justify-center flex-wrap">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowNewChatModal(true)}
            className="btn-primary flex items-center gap-2 px-6 py-3"
          >
            <FiMessageCircle className="w-5 h-5" />
            <span>New Chat</span>
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowGroupModal(true)}
            className="btn-secondary flex items-center gap-2 px-6 py-3"
          >
            <FiUsers className="w-5 h-5" />
            <span>Create Group</span>
          </motion.button>
        </div>
      </motion.div>


      <AnimatePresence>
        {showNewChatModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => {
              setShowNewChatModal(false);
              setNewChatSearchQuery('');
              dispatch(clearSearchResults());
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
              className="card p-6 max-w-md w-full max-h-[80vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-medium text-primary">New Chat</h2>
                <button
                  onClick={() => {
                    setShowNewChatModal(false);
                    setNewChatSearchQuery('');
                    dispatch(clearSearchResults());
                  }}
                  className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                >
                  <FiX className="w-5 h-5 text-secondary" />
                </button>
              </div>

              <div className="mb-4">
                <div className="relative">
                  <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-secondary" />
                  <input
                    type="text"
                    value={newChatSearchQuery}
                    onChange={(e) => setNewChatSearchQuery(e.target.value)}
                    placeholder="Search by username or email..."
                    className="input pl-10"
                  />
                </div>
                {searchLoading && (
                  <div className="flex items-center justify-center mt-2">
                    <div className="spinner"></div>
                    <span className="text-secondary text-sm ml-2">Searching...</span>
                  </div>
                )}
              </div>

              <div className="space-y-2 max-h-60 overflow-y-auto">
                {searchResults.map((result) => {
                  const existingChat = chats.find(c => 
                    c.chatType === 'private' && 
                    c.participants.some(p => getIdString(p._id || p) === result._id)
                  );
                  
                  return (
                    <motion.div
                      key={result._id}
                      whileHover={{ backgroundColor: 'var(--bg-tertiary)' }}
                      whileTap={{ backgroundColor: 'var(--bg-tertiary)' }}
                      onClick={() => existingChat ? (navigate(`/chat/${existingChat._id}`), setShowNewChatModal(false)) : handleCreateChat(result._id)}
                      className="card-hover p-3 cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <div className="avatar-md">
                          {result.avatar ? (
                            <img
                              src={result.avatar}
                              alt={result.username}
                              className="w-full h-full rounded-full object-cover"
                            />
                          ) : (
                            <span className="text-white">{result.username?.[0] || 'U'}</span>
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="text-primary font-medium">{result.username}</p>
                          <p className="text-secondary text-sm">{result.email}</p>
                        </div>
                        {existingChat ? (
                          <span className="text-accent text-xs font-medium px-2 py-1 bg-accent/10 rounded">Chat exists</span>
                        ) : (
                          <FiUserPlus className="w-5 h-5 text-secondary" />
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>


      <AnimatePresence>
        {showGroupModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => {
              setShowGroupModal(false);
              setGroupName('');
              setGroupDescription('');
              setSelectedUsers([]);
              setGroupSearchQuery('');
              dispatch(clearSearchResults());
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
              className="card p-6 max-w-md w-full max-h-[85vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-medium text-primary">Create Group</h2>
                <button
                  onClick={() => {
                    setShowGroupModal(false);
                    setGroupName('');
                    setGroupDescription('');
                    setSelectedUsers([]);
                    setGroupSearchQuery('');
                    dispatch(clearSearchResults());
                  }}
                  className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                >
                  <FiX className="w-5 h-5 text-secondary" />
                </button>
              </div>

              <form onSubmit={handleCreateGroup} className="space-y-4">
                <div>
                  <label className="text-primary text-sm font-medium mb-2 block">
                    Group Name
                  </label>
                  <input
                    type="text"
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    placeholder="Enter group name"
                    className="input"
                    required
                  />
                </div>

                <div>
                  <label className="text-primary text-sm font-medium mb-2 block">
                    Description (optional)
                  </label>
                  <textarea
                    value={groupDescription}
                    onChange={(e) => setGroupDescription(e.target.value)}
                    placeholder="Add a description..."
                    className="input resize-none"
                    rows={3}
                  />
                </div>

                <div>
                  <label className="text-primary text-sm font-medium mb-2 block">
                    Add Members
                  </label>
                  <div className="mb-3">
                    <div className="relative">
                      <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-secondary" />
                      <input
                        type="text"
                        value={groupSearchQuery}
                        onChange={(e) => setGroupSearchQuery(e.target.value)}
                        placeholder="Search by username or email..."
                        className="input pl-10"
                      />
                    </div>
                    {searchLoading && (
                      <div className="flex items-center justify-center mt-2">
                        <div className="spinner"></div>
                        <span className="text-secondary text-sm ml-2">Searching...</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2 max-h-32 overflow-y-auto mb-3">
                    {searchResults.map((result) => (
                      <motion.div
                        key={result._id}
                        whileHover={{ backgroundColor: 'var(--bg-tertiary)' }}
                        whileTap={{ backgroundColor: 'var(--bg-tertiary)' }}
                        onClick={() => toggleUserSelection(result)}
                        className={`card-hover p-3 cursor-pointer ${
                          selectedUsers.some((u) => u._id === result._id)
                            ? 'bg-accent/20'
                            : ''
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="avatar-sm">
                              {result.avatar ? (
                                <img
                                  src={result.avatar}
                                  alt={result.username}
                                  className="w-full h-full rounded-full object-cover"
                                />
                              ) : (
                                <span className="text-white text-xs">{result.username?.[0] || 'U'}</span>
                              )}
                            </div>
                            <span className="text-primary text-sm">{result.username}</span>
                          </div>
                          {selectedUsers.some((u) => u._id === result._id) && (
                            <FiCheck className="w-5 h-5 text-accent" />
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  {selectedUsers.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {selectedUsers.map((user) => (
                        <motion.span
                          key={user._id}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="card px-3 py-1.5 rounded-full text-primary text-sm flex items-center gap-2"
                        >
                          {user.username}
                          <button
                            onClick={() => toggleUserSelection(user)}
                            className="hover:text-red-500 transition-colors"
                          >
                            <FiX className="w-4 h-4" />
                          </button>
                        </motion.span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex gap-3 pt-2">
                  <motion.button
                    type="submit"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="btn-primary flex-1 flex items-center justify-center gap-2"
                  >
                    <FiPlus className="w-4 h-4" />
                    Create Group
                  </motion.button>
                  <motion.button
                    type="button"
                    onClick={() => {
                      setShowGroupModal(false);
                      setGroupName('');
                      setGroupDescription('');
                      setSelectedUsers([]);
                      setGroupSearchQuery('');
                      dispatch(clearSearchResults());
                    }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="btn-secondary flex-1"
                  >
                    Cancel
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default HomePage;
