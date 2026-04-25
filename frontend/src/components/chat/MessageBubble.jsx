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

const DecryptedReply = ({ content, currentUserId }) => {
  const [decrypted, setDecrypted] = useState('🔒 Decrypting...');
  useEffect(() => {
    const process = async () => {
      const privateKey = localStorage.getItem('privateKey');
      if (privateKey) {
        const result = await decryptMessage(content, privateKey, currentUserId);
        setDecrypted(result);
      } else {
        setDecrypted('🔒 Encrypted');
      }
    };
    process();
  }, [content, currentUserId]);
  return <span>{decrypted}</span>;
};

function MessageBubble({ message, isSent, showAvatar, sender, currentUserId, otherParticipantId, isPending = false, onReply, onForward, isGroupChat = false, showTail = false }) {
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
  if (isSent) {
    const totalParticipants = isGroupChat ? 0 : 2; // In 1:1, we expect 2 participants
    
    const isReadByOther = otherParticipantId 
      ? message.readBy?.some((r) => getIdString(r.user) === otherParticipantId)
      : message.readBy?.length > 0; // Simplified for groups: if anyone read it
      
    const isDeliveredToOther = otherParticipantId
      ? message.deliveredTo?.some((d) => getIdString(d.user) === otherParticipantId)
      : message.deliveredTo?.length > 0;

    if (isReadByOther) {
      messageStatus = 'read';
    } else if (isDeliveredToOther) {
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
        <div className={`relative ${isSent ? 'ml-auto' : 'mr-auto'}`} style={{ maxWidth: '95%' }}>
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
    <div className={`flex items-end gap-2 ${isSent ? 'justify-end' : 'justify-start'} ${message.reactions?.length > 0 ? 'mb-5' : 'mb-1'} group relative`}>

      <div className={`relative ${isSent ? 'ml-auto' : 'mr-auto'}`} style={{ maxWidth: '95%' }}>
        <div className="flex items-start gap-2">
          <div
            className={`chat-bubble ${isSent ? 'chat-bubble-sent' : 'chat-bubble-received'} relative ${showTail ? 'has-tail' : ''} ${message.reactions?.length > 0 ? 'pb-3' : ''}`}
            onDoubleClick={(e) => {
              e.stopPropagation();
              if (!isEditing) setShowEmojiPicker(prev => !prev);
            }}
          >
            {message.replyTo && (
              <div className="mb-1.5 pl-2.5 border-l-[3px] border-[#00A884]/60 bg-black/5 p-1 rounded-r-md">
                {isGroupChat && (
                  <p className="text-[#00A884] text-[11px] font-semibold mb-0.5">
                    {getIdString(message.replyTo.sender?._id || message.replyTo.sender) === currentUserId 
                      ? 'You' 
                      : (message.replyTo.sender?.username || 'User')}
                  </p>
                )}
                {!isGroupChat && getIdString(message.replyTo.sender?._id || message.replyTo.sender) === currentUserId && (
                  <p className="text-[#00A884] text-[11px] font-semibold mb-0.5">You</p>
                )}
                <div className="text-secondary text-xs truncate opacity-80">
                  {typeof message.replyTo === 'object' ? (
                    isEncryptedPayload(message.replyTo.content) ? (
                      <DecryptedReply content={message.replyTo.content} currentUserId={currentUserId} />
                    ) : (
                      message.replyTo.content
                    )
                  ) : ''}
                </div>
              </div>
            )}

            <div className="flex flex-col">
              {!isSent && isGroupChat && showAvatar && (
                <p className="text-accent text-[12.5px] mb-0.5 font-semibold">
                  {sender?.username || 'Unknown'}
                </p>
              )}
              
              <div className="relative">
                {message.content && (
                  <div className={`text-primary text-[14.5px] leading-[19px] whitespace-pre-wrap inline-block mr-16`}>
                    {isDecrypting ? 'Decrypting...' : decryptedContent}
                    {message.edited && <span className="text-secondary text-[10px] ml-1">(edited)</span>}
                  </div>
                )}
                
                {message.media && (
                  <div className="mt-1 mb-1 rounded-lg overflow-hidden max-w-[280px]">
                    {message.messageType === 'image' ? (
                      <img
                        src={message.media.url}
                        alt="Shared image"
                        className="w-full h-auto rounded-lg cursor-pointer border border-black/5"
                        onClick={() => window.open(message.media.url, '_blank')}
                      />
                    ) : message.messageType === 'video' ? (
                      <div className="relative">
                        <video
                          src={message.media.url}
                          controls
                          className="w-full h-auto rounded-lg"
                        >
                          Your browser does not support the video tag.
                        </video>
                      </div>
                    ) : message.messageType === 'audio' ? (
                      <div className="bg-tertiary/30 p-2 rounded-lg">
                        <audio src={message.media.url} controls className="w-full h-8" />
                      </div>
                    ) : (
                      <a
                        href={message.media.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 p-2 bg-tertiary/30 hover:bg-tertiary/50 rounded-lg transition-colors"
                      >
                        <FiFile className="w-5 h-5 text-secondary" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-primary truncate">
                            {isDecrypting ? 'File' : (decryptedContent || 'File')}
                          </p>
                        </div>
                        <FiDownload className="w-4 h-4 text-accent" />
                      </a>
                    )}
                  </div>
                )}

                <div className="absolute bottom-[-2px] right-[-4px] flex items-center gap-1 pl-4 pb-0.5 pt-1 bg-gradient-to-l from-inherit via-inherit to-transparent">
                  <span className="text-secondary text-[11px] opacity-70 leading-none">
                    {formatMessageTime(new Date(message.createdAt))}
                  </span>
                  {isSent && (
                    <div className="flex items-center leading-none">
                      {isPending ? (
                        <div className="w-3 h-3 border border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                      ) : messageStatus === 'read' ? (
                        <div className="flex items-center" style={{ color: '#53bdeb' }}>
                          <FiCheck className="w-[13px] h-[13px]" />
                          <FiCheck className="w-[13px] h-[13px] -ml-[9px]" />
                        </div>
                      ) : messageStatus === 'delivered' ? (
                        <div className="flex items-center text-secondary opacity-60">
                          <FiCheck className="w-[13px] h-[13px]" />
                          <FiCheck className="w-[13px] h-[13px] -ml-[9px]" />
                        </div>
                      ) : (
                        <FiCheck className="w-[13px] h-[13px] text-secondary opacity-60" />
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Message Menu (WhatsApp style) */}
            <div className="absolute top-1 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-20">
              <div className="relative" ref={menuRef}>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowMenu(!showMenu);
                    setShowEmojiPicker(false);
                  }}
                  className="p-1 rounded-full hover:bg-black/5 transition-colors"
                >
                  <FiMoreVertical className="w-4 h-4 text-secondary/70" />
                </button>

                <AnimatePresence>
                  {showMenu && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className={`absolute right-0 top-7 bg-secondary rounded-lg shadow-xl border border-border/50 py-1 z-50 min-w-[160px] card`}
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
                          {messageStatus !== 'read' && (
                            <button
                              onClick={handleDelete}
                              className="w-full px-4 py-2 text-left text-sm text-red-500 hover:bg-tertiary flex items-center gap-2"
                            >
                              <FiTrash2 className="w-4 h-4" />
                              Delete
                            </button>
                          )}
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
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {message.reactions && message.reactions.length > 0 && (
              <div className={`absolute -bottom-3 left-3 flex flex-wrap gap-1 z-10`}>
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
                    className="text-[10px] flex items-center gap-0.5 hover:scale-110 transition-transform"
                  >
                    <span>{emoji}</span>
                    {reactions.length > 1 && <span className="text-secondary font-medium">{reactions.length}</span>}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

        <AnimatePresence>
          {showEmojiPicker && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.9 }}
              ref={emojiPickerRef}
              className={`absolute top-[105%] ${isSent ? 'right-0' : 'left-0'} z-50`}
            >
              <div className="bg-secondary rounded-full shadow-xl px-2 py-1.5 flex items-center gap-1.5 animate-fade-in backdrop-blur-sm bg-opacity-95">
                {EMOJI_OPTIONS.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => {
                      handleReact(emoji);
                      setShowEmojiPicker(false);
                    }}
                    className="text-2xl hover:scale-125 transition-transform duration-200 px-1 rounded-full hover:bg-tertiary flex items-center justify-center"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>


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
