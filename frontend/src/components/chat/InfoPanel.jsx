import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiX,
  FiBell,
  FiBellOff,
  FiShield,
  FiTrash2,
  FiImage,
  FiFile,
  FiUsers,
  FiUserPlus,
  FiStar,
  FiShield as FiModerator,
  FiUserMinus,
  FiLogOut,
  FiSettings,
  FiEdit2,
} from 'react-icons/fi';
import { selectAuth } from '../../store/slices/authSlice.js';
import { getInitials, getOtherParticipantFromChat, compareIds, getIdString } from '../../utils/helpers.js';
import * as groupService from '../../services/groupService.js';
import * as userService from '../../services/userService.js';
import * as chatService from '../../services/chatService.js';
import { fetchChats, removeChat } from '../../store/slices/chatSlice.js';
import toast from 'react-hot-toast';

function InfoPanel({ chat, onClose }) {
  const { user } = useSelector(selectAuth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('info');
  const [groupData, setGroupData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [showTransferAdminModal, setShowTransferAdminModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showEditGroupModal, setShowEditGroupModal] = useState(false);
  const [showBlockConfirm, setShowBlockConfirm] = useState(false);
  const [showDeleteChatConfirm, setShowDeleteChatConfirm] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [editGroupName, setEditGroupName] = useState('');
  const [editGroupDescription, setEditGroupDescription] = useState('');

  const other = getOtherParticipantFromChat(chat, user?._id);
  const isGroup = chat?.chatType === 'group';
  const userId = getIdString(user?._id);

  useEffect(() => {
    if (isGroup && chat?._id) {
      fetchGroupData();
    }
  }, [chat, isGroup]);

  const fetchGroupData = async () => {
    if (!isGroup) return;
    setLoading(true);
    try {
      const response = await groupService.getMyGroups();
      const groups = response.data.data?.groups || response.data?.groups || [];
      const group = groups.find((g) => getIdString(g.chat?._id || g.chat) === getIdString(chat._id));

      if (group) {
        const groupResponse = await groupService.getGroup(group._id);
        setGroupData(groupResponse.data.data || groupResponse.data);
      }
    } catch (error) {
      
    } finally {
      setLoading(false);
    }
  };

  const isAdmin = groupData && compareIds(getIdString(groupData.admin?._id || groupData.admin), userId);
  const isModerator = groupData && groupData.moderators?.some((m) => compareIds(getIdString(m?._id || m), userId));
  const canManage = isAdmin || isModerator;
  const otherUserId = other?._id ? getIdString(other._id) : null;

  useEffect(() => {
    if (!isGroup && otherUserId) {
      checkBlockedStatus();
    }
  }, [otherUserId, isGroup]);

  const checkBlockedStatus = async () => {
    try {
      const response = await userService.getBlockedUsers();
      const blockedUsers = response.data.data || response.data || [];
      const blocked = blockedUsers.some((u) => getIdString(u._id || u) === otherUserId);
      setIsBlocked(blocked);
    } catch (error) {
      
    }
  };

  const handleLeaveGroup = async () => {
    if (!groupData) return;
    try {
      await groupService.leaveGroup(groupData._id);
      toast.success('Left group successfully');
      dispatch(removeChat(chat._id));
      dispatch(fetchChats());
      navigate('/');
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to leave group');
    }
  };

  const handleDeleteGroup = async () => {
    if (!groupData || !isAdmin) return;
    try {
      await groupService.deleteGroup(groupData._id);
      toast.success('Group deleted successfully');
      dispatch(removeChat(chat._id));
      dispatch(fetchChats());
      navigate('/');
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete group');
    }
  };

  const handleRemoveMember = async (memberId) => {
    if (!groupData || !canManage) return;
    try {
      await groupService.removeMember(groupData._id, memberId);
      toast.success('Member removed successfully');
      fetchGroupData();
      dispatch(fetchChats());
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to remove member');
    }
  };

  const handlePromoteToModerator = async (memberId) => {
    if (!groupData || !isAdmin) return;
    try {
      await groupService.promoteToModerator(groupData._id, memberId);
      toast.success('User promoted to moderator');
      fetchGroupData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to promote user');
    }
  };

  const handleDemoteModerator = async (memberId) => {
    if (!groupData || !isAdmin) return;
    try {
      await groupService.demoteModerator(groupData._id, memberId);
      toast.success('Moderator demoted');
      fetchGroupData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to demote moderator');
    }
  };

  const handleBlockUser = async () => {
    if (!otherUserId) return;
    try {
      await userService.blockUser(otherUserId);
      setIsBlocked(true);
      toast.success('User blocked successfully');
      setShowBlockConfirm(false);
      dispatch(fetchChats());
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to block user');
    }
  };

  const handleUnblockUser = async () => {
    if (!otherUserId) return;
    try {
      await userService.unblockUser(otherUserId);
      setIsBlocked(false);
      toast.success('User unblocked successfully');
      dispatch(fetchChats());
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to unblock user');
    }
  };

  const handleMuteNotifications = () => {
    setIsMuted(!isMuted);
    toast.success(isMuted ? 'Notifications unmuted' : 'Notifications muted');
  };

  const handleDeleteChat = async () => {
    if (!chat?._id) return;
    try {
      await chatService.deleteChat(chat._id);
      toast.success('Chat deleted successfully');
      dispatch(removeChat(chat._id));
      dispatch(fetchChats());
      navigate('/');
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete chat');
    }
  };

  const handleEditGroup = async () => {
    if (!groupData) return;
    try {
      await groupService.updateGroup(groupData._id, {
        name: editGroupName,
        description: editGroupDescription,
      });
      toast.success('Group updated successfully');
      setShowEditGroupModal(false);
      fetchGroupData();
      dispatch(fetchChats());
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update group');
    }
  };

  const handleTransferAdmin = async (newAdminId) => {
    if (!groupData || !isAdmin) return;
    try {
      await groupService.transferAdmin(groupData._id, newAdminId);
      toast.success('Admin transferred successfully');
      setShowTransferAdminModal(false);
      fetchGroupData();
      dispatch(fetchChats());
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to transfer admin');
    }
  };

  if (!chat) {
    return (
      <div className="w-[350px] bg-secondary border-l border-border flex flex-col h-full">
        <div className="flex items-center justify-center h-full">
          <p className="text-secondary">Select a chat to view details</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-[350px] bg-secondary border-l border-border flex flex-col h-full">
      <div className="px-4 py-3 border-b border-border flex items-center justify-between">
        <h3 className="font-medium text-primary">
          {isGroup ? 'Group Info' : 'Contact Info'}
        </h3>
        <button
          onClick={onClose}
          className="p-2 rounded-full hover:bg-tertiary transition-colors"
        >
          <FiX className="w-5 h-5 text-secondary" />
        </button>
      </div>

      <div className="px-4 py-6 border-b border-border text-center">
        <div className="avatar-xl mx-auto mb-4">
          {isGroup ? (
            groupData?.avatar ? (
              <img
                src={groupData.avatar}
                alt={groupData.name}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <div className="w-full h-full rounded-full bg-[#00A884] flex items-center justify-center">
                <span className="text-white text-2xl">
                  {groupData?.name?.[0]?.toUpperCase() || 'G'}
                </span>
              </div>
            )
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
        <div className="flex items-center justify-center gap-2 mb-1">
          <h2 className="font-medium text-lg text-primary">
            {isGroup ? (groupData?.name || chat.name || 'Group') : other?.username || 'Unknown'}
          </h2>
          {isGroup && isAdmin && (
            <button
              onClick={() => {
                setEditGroupName(groupData?.name || '');
                setEditGroupDescription(groupData?.description || '');
                setShowEditGroupModal(true);
              }}
              className="p-1 rounded-full hover:bg-tertiary transition-colors"
              title="Edit group"
            >
              <FiEdit2 className="w-4 h-4 text-secondary" />
            </button>
          )}
        </div>
        {isGroup && groupData?.description && (
          <p className="text-sm mb-2 text-secondary">
            {groupData.description}
          </p>
        )}
        {!isGroup && (
          <>
            <p className="text-sm mb-2 text-secondary">
              {other?.email || ''}
            </p>
            {other?.status && (
              <p className="text-sm italic text-secondary">
                "{other.status}"
              </p>
            )}
            {other?.isOnline && (
              <div className="flex items-center justify-center gap-2 mt-2">
                <div className="w-2 h-2 bg-accent rounded-full"></div>
                <span className="text-sm text-accent">Online</span>
              </div>
            )}
          </>
        )}
        {isGroup && groupData && (
          <p className="text-sm mt-2 text-secondary">
            {groupData.members?.length || 0} members
          </p>
        )}
      </div>

      <div className="flex border-b border-border">
        <button
          onClick={() => setActiveTab('info')}
          className={`flex-1 py-3 text-sm font-medium transition-colors ${
            activeTab === 'info'
              ? 'border-b-2 border-accent text-accent'
              : 'text-secondary'
          }`}
        >
          {isGroup ? 'Members' : 'Info'}
        </button>
        <button
          onClick={() => setActiveTab('media')}
          className={`flex-1 py-3 text-sm font-medium transition-colors ${
            activeTab === 'media'
              ? 'border-b-2 border-accent text-accent'
              : 'text-secondary'
          }`}
        >
          Media
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {activeTab === 'info' && (
          <div className="p-4 space-y-4">
            {isGroup && groupData ? (
              <>
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-medium text-primary">Members</h3>
                    {canManage && (
                      <button
                        onClick={() => setShowAddMemberModal(true)}
                        className="p-2 rounded-full hover:bg-tertiary transition-colors"
                      >
                        <FiUserPlus className="w-5 h-5 text-accent" />
                      </button>
                    )}
                  </div>
                  <div className="space-y-2">
                    {groupData.members?.map((member) => {
                      const memberId = getIdString(member?._id || member);
                      const isMemberAdmin = compareIds(getIdString(groupData.admin?._id || groupData.admin), memberId);
                      const isMemberModerator = groupData.moderators?.some((m) =>
                        compareIds(getIdString(m?._id || m), memberId)
                      );
                      const isCurrentUser = compareIds(memberId, userId);

                      return (
                        <div
                          key={memberId}
                          className="flex items-center justify-between p-2 rounded-lg hover:bg-tertiary transition-colors"
                        >
                          <div className="flex items-center gap-3 flex-1">
                            <div className="avatar-sm">
                              {member?.avatar ? (
                                <img
                                  src={member.avatar}
                                  alt={member.username}
                                  className="w-full h-full rounded-full object-cover"
                                />
                              ) : (
                                getInitials(member?.username || 'U')
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-medium truncate text-primary">
                                  {member?.username || 'Unknown'}
                                </p>
                                {isMemberAdmin && (
                                  <FiStar className="w-4 h-4 text-yellow-500" title="Admin" />
                                )}
                                {isMemberModerator && !isMemberAdmin && (
                                  <FiModerator className="w-4 h-4 text-accent" title="Moderator" />
                                )}
                              </div>
                              <p className="text-xs truncate text-secondary">
                                {member?.email || ''}
                              </p>
                            </div>
                          </div>
                          {canManage && !isCurrentUser && !isMemberAdmin && (
                            <div className="flex items-center gap-1">
                              {isAdmin && !isMemberModerator && (
                                <button
                                  onClick={() => handlePromoteToModerator(memberId)}
                                  className="p-1 rounded hover:bg-[var(--bg-tertiary)] transition-colors"
                                  title="Promote to moderator"
                                >
                                  <FiModerator className="w-4 h-4 text-[var(--accent-color)]" />
                                </button>
                              )}
                              {isAdmin && isMemberModerator && (
                                <button
                                  onClick={() => handleDemoteModerator(memberId)}
                                  className="p-1 rounded hover:bg-[var(--bg-tertiary)] transition-colors"
                                  title="Demote moderator"
                                >
                                  <FiModerator className="w-4 h-4 text-[var(--text-secondary)]" />
                                </button>
                              )}
                              <button
                                onClick={() => handleRemoveMember(memberId)}
                                className="p-1 rounded hover:bg-[var(--bg-tertiary)] transition-colors"
                                title="Remove member"
                              >
                                <FiUserMinus className="w-4 h-4 text-red-500" />
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {isAdmin && (
                  <div className="space-y-2 pt-4 border-t border-border">
                    <button
                      onClick={() => {
                        setEditGroupName(groupData?.name || '');
                        setEditGroupDescription(groupData?.description || '');
                        setShowEditGroupModal(true);
                      }}
                      className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-tertiary transition-colors"
                    >
                      <FiEdit2 className="w-5 h-5 text-accent" />
                      <span className="text-sm font-medium text-primary">
                        Edit Group Info
                      </span>
                    </button>
                    <button
                      onClick={() => setShowTransferAdminModal(true)}
                      className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-tertiary transition-colors"
                    >
                      <FiStar className="w-5 h-5 text-yellow-500" />
                      <span className="text-sm font-medium text-primary">
                        Transfer Admin
                      </span>
                    </button>
                    <button
                      onClick={() => setShowDeleteConfirm(true)}
                      className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-tertiary transition-colors"
                    >
                      <FiTrash2 className="w-5 h-5 text-red-500" />
                      <span className="text-sm font-medium text-red-500">
                        Delete Group
                      </span>
                    </button>
                  </div>
                )}

                {!isAdmin && (
                  <button
                    onClick={handleLeaveGroup}
                    className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-tertiary transition-colors border-t border-border mt-4 pt-4"
                  >
                    <FiLogOut className="w-5 h-5 text-red-500" />
                    <span className="text-sm font-medium text-red-500">
                      Leave Group
                    </span>
                  </button>
                )}
              </>
            ) : (
              <>
                <div className="p-4 rounded-lg bg-tertiary">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      {isMuted ? (
                        <FiBellOff className="w-5 h-5 text-secondary" />
                      ) : (
                        <FiBell className="w-5 h-5 text-secondary" />
                      )}
                      <span className="font-medium text-primary">Mute Notifications</span>
                    </div>
                    <button
                      onClick={handleMuteNotifications}
                      className="p-2 rounded-full hover:bg-secondary transition-colors"
                    >
                      {isMuted ? (
                        <FiBell className="w-5 h-5 text-accent" />
                      ) : (
                        <FiBellOff className="w-5 h-5 text-secondary" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-tertiary">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <FiShield className="w-5 h-5 text-secondary" />
                      <span className="font-medium text-primary">Block User</span>
                    </div>
                    {isBlocked ? (
                      <button
                        onClick={handleUnblockUser}
                        className="text-sm text-accent"
                      >
                        Unblock
                      </button>
                    ) : (
                      <button
                        onClick={() => setShowBlockConfirm(true)}
                        className="text-sm text-red-500"
                      >
                        Block
                      </button>
                    )}
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-tertiary">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <FiTrash2 className="w-5 h-5 text-red-500" />
                      <span className="font-medium text-primary">Delete Chat</span>
                    </div>
                    <button
                      onClick={() => setShowDeleteChatConfirm(true)}
                      className="text-sm text-red-500"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {activeTab === 'media' && (
          <div className="p-4">
            <h3 className="font-medium mb-4 text-primary">Shared Media</h3>
            <div className="grid grid-cols-3 gap-2">
              <div className="aspect-square rounded-lg flex items-center justify-center bg-tertiary">
                <FiImage className="w-6 h-6 text-secondary" />
              </div>
              <div className="aspect-square rounded-lg flex items-center justify-center bg-tertiary">
                <FiImage className="w-6 h-6 text-secondary" />
              </div>
              <div className="aspect-square rounded-lg flex items-center justify-center bg-tertiary">
                <FiFile className="w-6 h-6 text-secondary" />
              </div>
            </div>
          </div>
        )}
      </div>

      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowDeleteConfirm(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
              className="p-6 rounded-lg max-w-md w-full"
              style={{ backgroundColor: '#ffffff' }}
            >
              <h3 className="text-lg font-medium mb-2 text-primary">
                Delete Group
              </h3>
              <p className="mb-4 text-secondary">
                Are you sure you want to delete this group? This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="btn-secondary flex-1 py-2"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    handleDeleteGroup();
                  }}
                  className="flex-1 py-2 rounded-lg font-medium text-white transition-colors bg-red-500 hover:bg-red-600"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showDeleteChatConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowDeleteChatConfirm(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
              className="p-6 rounded-lg max-w-md w-full"
              style={{ backgroundColor: '#ffffff' }}
            >
              <h3 className="text-lg font-medium mb-2 text-primary">
                Delete Chat
              </h3>
              <p className="mb-4 text-secondary">
                Are you sure you want to delete this chat? This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteChatConfirm(false)}
                  className="btn-secondary flex-1 py-2"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setShowDeleteChatConfirm(false);
                    handleDeleteChat();
                  }}
                  className="flex-1 py-2 rounded-lg font-medium text-white transition-colors bg-red-500 hover:bg-red-600"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showBlockConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowBlockConfirm(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
              className="p-6 rounded-lg max-w-md w-full bg-secondary card"
            >
              <h3 className="text-lg font-medium mb-2 text-primary">
                Block User
              </h3>
              <p className="mb-4 text-secondary">
                Are you sure you want to block {other?.username || 'this user'}? You won't receive messages from them.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowBlockConfirm(false)}
                  className="btn-secondary flex-1 py-2"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBlockUser}
                  className="flex-1 py-2 rounded-lg font-medium text-white transition-colors bg-red-500 hover:bg-red-600"
                >
                  Block
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showEditGroupModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowEditGroupModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
              className="p-6 rounded-lg max-w-md w-full bg-secondary card"
            >
              <h3 className="text-lg font-medium mb-4 text-primary">
                Edit Group Info
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-primary">
                    Group Name
                  </label>
                  <input
                    type="text"
                    value={editGroupName}
                    onChange={(e) => setEditGroupName(e.target.value)}
                    className="input"
                    placeholder="Enter group name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-primary">
                    Description
                  </label>
                  <textarea
                    value={editGroupDescription}
                    onChange={(e) => setEditGroupDescription(e.target.value)}
                    className="input resize-none"
                    placeholder="Enter group description"
                    rows="3"
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowEditGroupModal(false)}
                  className="btn-secondary flex-1 py-2"
                >
                  Cancel
                </button>
                <button
                  onClick={handleEditGroup}
                  className="btn-primary flex-1 py-2"
                >
                  Save
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showTransferAdminModal && groupData && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowTransferAdminModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
              className="p-6 rounded-lg max-w-md w-full max-h-[80vh] overflow-y-auto bg-secondary card"
            >
              <h3 className="text-lg font-medium mb-4 text-primary">
                Transfer Admin
              </h3>
              <p className="text-sm mb-4 text-secondary">
                Select a member to transfer admin rights to:
              </p>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {groupData.members?.filter((member) => {
                  const memberId = getIdString(member?._id || member);
                  const isMemberAdmin = compareIds(getIdString(groupData.admin?._id || groupData.admin), memberId);
                  return !isMemberAdmin;
                }).map((member) => {
                  const memberId = getIdString(member?._id || member);
                  return (
                    <button
                      key={memberId}
                      onClick={() => handleTransferAdmin(memberId)}
                      className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-tertiary transition-colors text-left"
                    >
                      <div className="avatar-sm">
                        {member?.avatar ? (
                          <img
                            src={member.avatar}
                            alt={member.username}
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          getInitials(member?.username || 'U')
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-primary">
                          {member?.username || 'Unknown'}
                        </p>
                        <p className="text-xs text-secondary">
                          {member?.email || ''}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
              <button
                onClick={() => setShowTransferAdminModal(false)}
                className="btn-secondary w-full mt-4 py-2"
              >
                Cancel
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default InfoPanel;
