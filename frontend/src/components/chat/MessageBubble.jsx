import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiMoreVertical, FiEdit2, FiTrash2, FiCornerUpRight, FiStar, FiSmile, FiX, FiFile, FiVideo, FiMusic, FiDownload } from 'react-icons/fi';
import { useDispatch, useSelector } from 'react-redux';
import { editMessage, deleteMessageAction, reactToMessage, forwardMessage, starMessage } from '../../store/slices/messageSlice.js';
import { selectAuth } from '../../store/slices/authSlice.js';
import { formatMessageTime, getInitials, compareIds, getIdString } from '../../utils/helpers.js';
import { decryptMessage, isEncryptedPayload } from '../../utils/crypto.js';
import { FiCheck } from 'react-icons/fi';
import toast from 'react-hot-toast';

const EMOJI_OPTIONS = ['👍', '❤️', '😂', '😮', '😢', '🙏'];

function MessageBubble({ message, isSent, showAvatar, sender, currentUserId, otherParticipantId, isPending = false, onReply, onForward, isGroupChat = false }) {
  const dispatch = useDispatch();
  const { user } = useSelector(selectAuth);
  const [showMenu, setShowMenu] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [decryptedContent, setDecryptedContent] = useState(
    isEncryptedPayload(message.content) ? '🔒 Decrypting...' : message.content
  );
  const [isDecrypting, setIsDecrypting] = useState(isEncryptedPayload(message.content));
  const [editContent, setEditContent] = useState('');
  const menuRef = useRef(null);
  const emojiPickerRef = useRef(null);

  let messageStatus = 'sent';
  if (isSent && message.readBy) {
    if (otherParticipantId && message.readBy.some((r) => getIdString(r.user) === otherParticipantId)) {
      messageStatus = 'read';
    } else if (message.readBy.length > 0) {
      messageStatus = 'delivered';
    }
  }

  const isStarred = user?.starredMessages?.includes(message._id);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target)) {
        setShowEmojiPicker(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const processDecryption = async () => {
      if (message.messageType === 'text' && isEncryptedPayload(message.content)) {
        setIsDecrypting(true);
        const privateKey = localStorage.getItem('privateKey');
        if (privateKey) {
          const decrypted = await decryptMessage(message.content, privateKey, currentUserId);
          setDecryptedContent(decrypted);
          setEditContent(decrypted);
        } else {
          setDecryptedContent('🔒 Encrypted message (key missing)');
        }
        setIsDecrypting(false);
      } else {
        setDecryptedContent(message.content);
        setEditContent(message.content);
      }
    };
    processDecryption();
  }, [message.content, message.messageType]);

  const handleEdit = async () => {
    if (!editContent.trim()) {
      toast.error('Message cannot be empty');
      return;
    }
    try {
      await dispatch(editMessage({ messageId: message._id, content: editContent })).unwrap();
      setIsEditing(false);
      setShowMenu(false);
      toast.success('Message edited');
    } catch (error) {
      toast.error(error || 'Failed to edit message');
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this message?')) {
      try {
        await dispatch(deleteMessageAction(message._id)).unwrap();
        setShowMenu(false);
        toast.success('Message deleted');
      } catch (error) {
        toast.error(error || 'Failed to delete message');
      }
    }
  };

  const handleReact = async (emoji) => {
    try {
      await dispatch(reactToMessage({ messageId: message._id, emoji })).unwrap();
      setShowEmojiPicker(false);
      setShowMenu(false);
    } catch (error) {
      toast.error(error || 'Failed to react');
    }
  };

  const handleStar = async () => {
    try {
      await dispatch(starMessage(message._id)).unwrap();
      setShowMenu(false);
    } catch (error) {
      toast.error(error || 'Failed to star message');
    }
  };

  const handleForward = () => {
    setShowMenu(false);
    if (onForward) {
      onForward(message);
    }
  };

  const handleReply = () => {
    setShowMenu(false);
    if (onReply) {
      onReply(message);
    }
  };

  if (message.deleted) {
    return (
      <div className={`flex items-end gap-2 ${isSent ? 'justify-end' : 'justify-start'} mb-1`}>
        <div className={`relative ${isSent ? 'ml-auto' : 'mr-auto'} ${isSent ? 'pr-8' : 'pl-8'}`} style={{ maxWidth: '85%' }}>
          <div className="flex items-start gap-2">
            <div className={`chat-bubble ${isSent ? 'chat-bubble-sent' : 'chat-bubble-received'} opacity-60`}>
              <p className="text-secondary text-sm italic flex items-center gap-2">
                <FiTrash2 className="w-3 h-3" />
                This message was deleted
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex items-end gap-2 ${isSent ? 'justify-end' : 'justify-start'} mb-1 group`}>
      {!isSent && isGroupChat && (
        <div className="w-6 h-6 flex-shrink-0">
          {showAvatar ? (
            <div className="avatar-sm">
              {sender?.avatar ? (
                <img
                  src={sender.avatar}
                  alt={sender.username}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                getInitials(sender?.username || 'U')
              )}
            </div>
          ) : (
            <div></div>
          )}
        </div>
      )}

      <div className={`relative ${isSent ? 'ml-auto' : 'mr-auto'} ${isSent ? 'pr-8' : 'pl-8'}`} style={{ maxWidth: '85%' }}>
        <div className="flex items-start gap-2">
          <div
            className={`chat-bubble ${isSent ? 'chat-bubble-sent' : 'chat-bubble-received'} relative ${message.reactions?.length > 0 ? 'pb-4' : ''}`}
            onDoubleClick={() => !isEditing && handleReact('❤️')}
          >
          {message.replyTo && (
            <div className="mb-2 pl-3 border-l-2 border-accent/50">
              <p className="text-accent text-xs font-medium">
                {typeof message.replyTo === 'object' && message.replyTo.sender
                  ? typeof message.replyTo.sender === 'object'
                    ? message.replyTo.sender.username
                    : 'User'
                  : 'User'}
              </p>
              <p className="text-secondary text-xs truncate">
                {typeof message.replyTo === 'object' ? (isEncryptedPayload(message.replyTo.content) ? '🔒 Encrypted message' : message.replyTo.content) : ''}
              </p>
            </div>
          )}

          <>
              {!isSent && isGroupChat && showAvatar && (
                <p className="text-accent text-xs mb-1 font-medium">
                  {sender?.username || 'Unknown'}
                </p>
              )}
              {message.content && (
                <p className={`text-primary text-sm leading-relaxed whitespace-pre-wrap ${message.media ? 'mb-2' : ''}`}>
                  {isDecrypting ? 'Decrypting...' : decryptedContent}
                </p>
              )}
              {message.media && (
                <div className="mt-2 rounded-lg overflow-hidden">
                  {message.messageType === 'image' ? (
                    <img
                      src={message.media.url}
                      alt="Shared image"
                      className="max-w-full h-auto rounded-lg cursor-pointer"
                      onClick={() => window.open(message.media.url, '_blank')}
                    />
                  ) : message.messageType === 'video' ? (
                    <div className="relative">
                      <video
                        src={message.media.url}
                        controls
                        className="max-w-full h-auto rounded-lg"
                        style={{ maxHeight: '400px' }}
                      >
                        Your browser does not support the video tag.
                      </video>
                    </div>
                  ) : message.messageType === 'audio' ? (
                    <div className="bg-tertiary p-4 rounded-lg">
                      <div className="flex items-center gap-3">
                        <FiMusic className="w-6 h-6 text-accent flex-shrink-0" />
                        <audio
                          src={message.media.url}
                          controls
                          className="flex-1"
                        >
                          Your browser does not support the audio tag.
                        </audio>
                      </div>
                    </div>
                  ) : (
                    <a
                      href={message.media.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 bg-tertiary hover:opacity-90 rounded-lg transition-colors"
                    >
                      <div className="w-12 h-12 bg-secondary rounded-lg flex items-center justify-center flex-shrink-0">
                        <FiFile className="w-6 h-6 text-secondary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-primary truncate">
                          {isDecrypting ? 'File' : (decryptedContent || 'File')}
                        </p>
                        {message.media.size && (
                          <p className="text-xs text-secondary">
                            {(message.media.size / 1024).toFixed(1)} KB
                          </p>
                        )}
                      </div>
                      <FiDownload className="w-5 h-5 text-accent flex-shrink-0" />
                    </a>
                  )}
                </div>
              )}
              {message.edited && (
                <span className="text-secondary text-[10px] italic">(edited)</span>
              )}
          </>

          {message.reactions && message.reactions.length > 0 && (
            <div className="absolute -bottom-4 left-2 flex flex-wrap gap-1 z-10">
              {Object.entries(
                message.reactions.reduce((acc, r) => {
                  const emoji = r.emoji;
                  if (!acc[emoji]) acc[emoji] = [];
                  acc[emoji].push(r);
                  return acc;
                }, {})
              ).map(([emoji, reactions]) => (
                <button
                  key={emoji}
                  onClick={() => handleReact(emoji)}
                  className="bg-secondary px-1.5 py-0.5 rounded-full text-[10px] flex items-center gap-1 hover:bg-tertiary transition-all shadow-sm"
                >
                  <span>{emoji}</span>
                  {reactions.length > 1 && <span className="text-secondary font-medium">{reactions.length}</span>}
                </button>
              ))}
            </div>
          )}

          <div className="flex items-center justify-end gap-1 mt-1">
            <span className="text-secondary text-[11px]">
              {formatMessageTime(new Date(message.createdAt))}
            </span>
            {isSent && (
              <span className="text-secondary text-xs flex items-center">
                {isPending ? (
                  <div className="w-3 h-3 border border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                ) : messageStatus === 'read' ? (
                  <span className="flex items-center" style={{ color: '#34B7F1' }}>
                    <FiCheck className="w-3 h-3" />
                    <FiCheck className="w-3 h-3 -ml-1" />
                  </span>
                ) : messageStatus === 'delivered' ? (
                  <span className="flex items-center text-secondary">
                    <FiCheck className="w-3 h-3" />
                    <FiCheck className="w-3 h-3 -ml-1" />
                  </span>
                ) : (
                  <FiCheck className="w-3 h-3 text-secondary" />
                )}
              </span>
            )}
          </div>
        </div>

          <div className={`absolute top-0 ${isSent ? 'right-0' : 'left-0'} opacity-0 group-hover:opacity-100 transition-opacity`}>
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-1 rounded-full hover:bg-tertiary transition-colors"
              >
                <FiMoreVertical className="w-4 h-4 text-secondary" />
              </button>

              <AnimatePresence>
                {showMenu && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className={`absolute ${isSent ? 'right-0' : 'left-0'} top-8 bg-secondary rounded-lg shadow-lg border border-border py-1 z-50 min-w-[180px] card`}
                  >
                    <button
                      onClick={handleReply}
                      className="w-full px-4 py-2 text-left text-sm text-primary hover:bg-tertiary flex items-center gap-2"
                    >
                      <FiCornerUpRight className="w-4 h-4" />
                      Reply
                    </button>
                    {isSent && (
                      <>
                        <button
                          onClick={() => {
                            setIsEditing(true);
                            setShowMenu(false);
                          }}
                          className="w-full px-4 py-2 text-left text-sm text-primary hover:bg-tertiary flex items-center gap-2"
                        >
                          <FiEdit2 className="w-4 h-4" />
                          Edit
                        </button>
                        <button
                          onClick={handleDelete}
                          className="w-full px-4 py-2 text-left text-sm text-red-500 hover:bg-tertiary flex items-center gap-2"
                        >
                          <FiTrash2 className="w-4 h-4" />
                          Delete
                        </button>
                      </>
                    )}
                    <button
                      onClick={handleForward}
                      className="w-full px-4 py-2 text-left text-sm text-primary hover:bg-tertiary flex items-center gap-2"
                    >
                      <FiCornerUpRight className="w-4 h-4" />
                      Forward
                    </button>
                    <button
                      onClick={handleStar}
                      className="w-full px-4 py-2 text-left text-sm text-primary hover:bg-tertiary flex items-center gap-2"
                    >
                      <FiStar className={`w-4 h-4 ${isStarred ? 'fill-yellow-400 text-yellow-400' : ''}`} />
                      {isStarred ? 'Unstar' : 'Star'}
                    </button>
                    <div className="border-t border-gray-200 my-1"></div>
                    <button
                      onClick={() => {
                        setShowEmojiPicker(!showEmojiPicker);
                        setShowMenu(false);
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-primary hover:bg-tertiary flex items-center gap-2"
                    >
                      <FiSmile className="w-4 h-4" />
                      React
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        <AnimatePresence>
          {showEmojiPicker && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              ref={emojiPickerRef}
              className={`absolute bottom-full ${isSent ? 'right-0' : 'left-0'} mb-2 z-50`}
            >
              <div className="bg-secondary rounded-lg shadow-lg border border-border p-3 card">
                <div className="flex gap-2">
                  {EMOJI_OPTIONS.map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => handleReact(emoji)}
                      className="text-3xl hover:scale-110 transition-transform p-2 rounded hover:bg-tertiary flex items-center justify-center min-w-[40px] min-h-[40px] w-[40px] h-[40px]"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {isSent && <div className="w-6 h-6 flex-shrink-0"></div>}

      {/* Edit Message Modal */}
      <AnimatePresence>
        {isEditing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100]"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setIsEditing(false);
                setEditContent(decryptedContent);
              }
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-secondary rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden card border border-border"
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-border">
                <h3 className="text-primary font-semibold text-base">Edit Message</h3>
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setEditContent(decryptedContent);
                  }}
                  className="p-1.5 rounded-full hover:bg-tertiary transition-colors"
                >
                  <FiX className="w-5 h-5 text-secondary" />
                </button>
              </div>
              <div className="p-5">
                <div className="mb-3 text-xs text-secondary">
                  Original: <span className="italic">{decryptedContent}</span>
                </div>
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="input text-sm resize-none w-full"
                  rows={4}
                  autoFocus
                  placeholder="Type your edited message..."
                />
              </div>
              <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-border bg-tertiary">
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setEditContent(decryptedContent);
                  }}
                  className="px-4 py-2 text-sm text-secondary hover:text-primary rounded-lg hover:bg-secondary transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  className="px-4 py-2 text-sm text-red-500 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors flex items-center gap-2"
                >
                  <FiTrash2 className="w-4 h-4" />
                  Delete
                </button>
                <button
                  onClick={handleEdit}
                  disabled={!editContent.trim() || editContent.trim() === decryptedContent}
                  className="btn-primary text-sm px-5 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Save Changes
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default MessageBubble;
