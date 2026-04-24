import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { motion } from 'framer-motion';
import { FiSend, FiPaperclip, FiSmile, FiMoreVertical, FiSearch, FiInfo, FiX, FiImage, FiFile, FiVideo, FiMusic, FiTrash2 } from 'react-icons/fi';
import { fetchMessages, sendMessage, setTyping, addMessage, updateMessage, markAllMessagesAsRead, forwardMessage, clearChat, clearMessages } from '../../store/slices/messageSlice.js';
import { getChat, fetchChats } from '../../store/slices/chatSlice.js';
import { useSocket } from '../../hooks/useSocket.js';
import { getSocket } from '../../services/socketService.js';
import { selectAuth } from '../../store/slices/authSlice.js';
import InfoPanel from '../../components/chat/InfoPanel.jsx';
import MessageBubble from '../../components/chat/MessageBubble.jsx';
import TypingIndicator from '../../components/chat/TypingIndicator.jsx';
import ForwardModal from '../../components/chat/ForwardModal.jsx';
import MessageSearch from '../../components/chat/MessageSearch.jsx';
import {
  formatMessageTime,
  getInitials,
  compareIds,
  getIdString,
  getOtherParticipantFromChat,
} from '../../utils/helpers.js';
import toast from 'react-hot-toast';

function ChatPage() {
  const { chatId } = useParams();
  const dispatch = useDispatch();
  const { currentChat, loading: chatLoading } = useSelector((state) => state.chat);
  const { messages, typingUsers, loading: messagesLoading } = useSelector((state) => state.message);
  const { user } = useSelector(selectAuth);
  const socket = useSocket();
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showInfoPanel, setShowInfoPanel] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  const [showForwardModal, setShowForwardModal] = useState(false);
  const [messageToForward, setMessageToForward] = useState(null);
  const [showSearch, setShowSearch] = useState(false);
  const [searchResultMessage, setSearchResultMessage] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [pendingMessages, setPendingMessages] = useState(new Set());
  const [showMenu, setShowMenu] = useState(false);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const fileInputRef = useRef(null);
  const emojiPickerRef = useRef(null);
  const inputRef = useRef(null);
  const menuRef = useRef(null);

  useEffect(() => {
    if (socket) {
      const handleNewMessage = (message) => {
        dispatch(addMessage(message));
        const messageSenderId = getIdString(message.sender?._id || message.sender);
        const userId = getIdString(user?._id);
        if (compareIds(messageSenderId, userId)) {
          setPendingMessages(prev => {
            const next = new Set(prev);
            next.delete(message._id);
            return next;
          });
        } else if (message.chat === chatId) {
          // Mark as read if we are in this chat
          socket.emit('mark-read', { chatId });
        }
      };

      const handleTyping = (data) => {
        dispatch(setTyping({ chatId: data.chatId, userId: data.userId, isTyping: data.isTyping }));
      };

      const handleMessageUpdated = (message) => {
        if (message.chat === chatId) {
          dispatch(updateMessage(message));
          // If message is deleted, also update sidebar preview
          dispatch(fetchChats()); 
        }
      };

      const handleMessagesRead = (data) => {
        if (data.chatId === chatId) {
          dispatch(markAllMessagesAsRead({ chatId: data.chatId, userId: data.userId }));
        }
      };

      socket.on('new-message', handleNewMessage);
      socket.on('typing', handleTyping);
      socket.on('message-updated', handleMessageUpdated);
      socket.on('messages-read', handleMessagesRead);

      return () => {
        socket.off('new-message', handleNewMessage);
        socket.off('typing', handleTyping);
        socket.off('message-updated', handleMessageUpdated);
        socket.off('messages-read', handleMessagesRead);
      };
    }
  }, [socket, dispatch, user]);


  useEffect(() => {
    if (chatId) {
      dispatch(getChat(chatId));
      dispatch(fetchMessages(chatId));
      
      const socket = getSocket();
      if (socket) {
        socket.emit('mark-read', { chatId });
      }
    }
  }, [chatId, dispatch]);

  useEffect(() => {
    const socket = getSocket();
    if (socket && chatId) {
      socket.emit('join-chat', chatId);

      const handleChatCleared = (data) => {
        if (data.chatId === chatId) {
          dispatch(clearMessages(chatId));
          toast.success('Chat cleared');
        }
      };

      socket.on('chat-cleared', handleChatCleared);

      return () => {
        socket.emit('leave-chat', chatId);
        socket.off('chat-cleared', handleChatCleared);
      };
    }
  }, [chatId, dispatch]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages[chatId]]);

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must be less than 10MB');
      return;
    }

    setSelectedFile(file);

    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFilePreview(reader.result);
      };
      reader.readAsDataURL(file);
    } else {
      setFilePreview(null);
    }
  };

  const getMessageType = (file) => {
    if (file.type.startsWith('image/')) return 'image';
    if (file.type.startsWith('video/')) return 'video';
    if (file.type.startsWith('audio/')) return 'audio';
    return 'file';
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if ((!input.trim() && !selectedFile) || !chatId) return;

    const content = input.trim() || (selectedFile ? selectedFile.name : '');
    const fileToSend = selectedFile;
    const messageType = fileToSend ? getMessageType(fileToSend) : 'text';

    const contentToSend = input.trim();
    const fileToSendCopy = fileToSend;

    setInput('');
    setSelectedFile(null);
    setFilePreview(null);
    setIsTyping(false);

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    const socket = getSocket();
    if (socket) {
      socket.emit('stop-typing', { chatId });
    }

    const tempMessageId = `temp-${Date.now()}-${Math.random()}`;
    setPendingMessages(prev => new Set([...prev, tempMessageId]));

    try {
      const result = await dispatch(sendMessage({
        chatId,
        content: contentToSend,
        messageType,
        replyTo: replyingTo?._id,
        media: fileToSendCopy
      })).unwrap();

      setPendingMessages(prev => {
        const next = new Set(prev);
        next.delete(tempMessageId);
        if (result._id) {
          next.add(result._id);
        }
        return next;
      });

      setReplyingTo(null);

      setTimeout(() => {
        setPendingMessages(prev => {
          const next = new Set(prev);
          if (result._id) {
            next.delete(result._id);
          }
          return next;
        });
      }, 1000);
    } catch (error) {
      setPendingMessages(prev => {
        const next = new Set(prev);
        next.delete(tempMessageId);
        return next;
      });
      toast.error(error || 'Failed to send message');
      setInput(contentToSend);
      if (fileToSendCopy) {
        setSelectedFile(fileToSendCopy);
        if (fileToSendCopy.type.startsWith('image/')) {
          const reader = new FileReader();
          reader.onloadend = () => {
            setFilePreview(reader.result);
          };
          reader.readAsDataURL(fileToSendCopy);
        }
      }
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleReply = (message) => {
    setReplyingTo(message);
  };

  const handleForward = async (message) => {
    setMessageToForward(message);
    setShowForwardModal(true);
    dispatch(fetchChats());
  };

  const handleForwardConfirm = async (targetChatIds) => {
    if (!messageToForward) return;
    try {
      await dispatch(forwardMessage({
        messageId: messageToForward._id,
        targetChatIds
      })).unwrap();
      toast.success('Message forwarded successfully');
      setShowForwardModal(false);
      setMessageToForward(null);
    } catch (error) {
      toast.error(error || 'Failed to forward message');
    }
  };

  const handleClearChat = async () => {
    if (!chatId) return;

    if (!window.confirm('Are you sure you want to clear all messages in this chat? This action cannot be undone.')) {
      return;
    }

    try {
      await dispatch(clearChat(chatId)).unwrap();
      setShowMenu(false);
      toast.success('Chat cleared successfully');
    } catch (error) {
      toast.error(error || 'Failed to clear chat');
    }
  };

  const handleSearchMessageClick = (message) => {
    setSearchResultMessage(message);
  };

  useEffect(() => {
    if (searchResultMessage) {
      const messageElement = document.querySelector(`[data-message-id="${searchResultMessage._id}"]`);
      if (messageElement) {
        messageElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        messageElement.classList.add('highlight-message');
        setTimeout(() => {
          messageElement.classList.remove('highlight-message');
        }, 2000);
      }
      setSearchResultMessage(null);
    }
  }, [searchResultMessage]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target)) {
        setShowEmojiPicker(false);
      }
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleTyping = () => {
    const socket = getSocket();
    if (socket && chatId) {
      if (!isTyping) {
        setIsTyping(true);
        socket.emit('typing', { chatId });
      }

      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        setIsTyping(false);
        socket.emit('stop-typing', { chatId });
      }, 3000);
    }
  };

  const chatMessages = messages[chatId] || [];
  const other = getOtherParticipantFromChat(currentChat, user?._id);
  const typingUserIds = typingUsers[chatId] || [];

  if (!chatId) {
    return (
      <div className="h-full flex items-center justify-center chat-bg">
        <div className="text-center">
          <div className="w-24 h-24 rounded-full bg-secondary flex items-center justify-center mx-auto mb-4 shadow-md">
            <FiSend className="w-12 h-12 text-accent" />
          </div>
          <p className="text-secondary text-lg">Select a chat to start messaging</p>
        </div>
      </div>
    );
  }

  if (chatLoading && !currentChat) {
    return (
      <div className="h-full flex items-center justify-center chat-bg">
        <div className="text-center">
          <div className="spinner mx-auto mb-4 w-8 h-8"></div>
          <p className="text-secondary">Loading chat...</p>
        </div>
      </div>
    );
  }

  if (messagesLoading && chatMessages.length === 0) {
    return (
      <div className="h-full flex items-center justify-center chat-bg">
        <div className="text-center">
          <div className="spinner mx-auto mb-4 w-8 h-8"></div>
          <p className="text-secondary">Loading messages...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex">
      <div className="flex-1 flex flex-col chat-bg min-w-0 relative">
        {showSearch && (
          <MessageSearch
            chatId={chatId}
            onClose={() => setShowSearch(false)}
            onMessageClick={handleSearchMessageClick}
          />
        )}

        {currentChat && (
          <div className="bg-secondary px-4 py-3 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="avatar-md flex-shrink-0">
                {other?.avatar ? (
                  <img
                    src={other.avatar}
                    alt={other.username}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  getInitials(other?.username || 'U')
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-primary font-medium text-base truncate">
                  {currentChat.chatType === 'group' ? currentChat.name : other?.username || 'Unknown'}
                </h3>
                <div className="flex items-center gap-2">
                  {currentChat.chatType !== 'group' && other?.isOnline && (
                    <>
                      <div className="w-2 h-2 bg-accent rounded-full"></div>
                      <span className="text-secondary text-xs">Online</span>
                    </>
                  )}
                  {currentChat.chatType !== 'group' && !other?.isOnline && (
                    <span className="text-secondary text-xs">Offline</span>
                  )}
                  {currentChat.chatType === 'group' && (
                    <span className="text-secondary text-xs">
                      {currentChat.participants?.length || 0} members
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setShowSearch(!showSearch)}
                className="p-2 rounded-full hover:bg-tertiary transition-colors"
              >
                <FiSearch className="w-5 h-5 text-secondary" />
              </button>
              <button
                onClick={() => setShowInfoPanel(!showInfoPanel)}
                className="p-2 rounded-full hover:bg-tertiary transition-colors"
              >
                <FiInfo className="w-5 h-5 text-secondary" />
              </button>
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  className="p-2 rounded-full hover:bg-tertiary transition-colors"
                >
                  <FiMoreVertical className="w-5 h-5 text-secondary" />
                </button>
                {showMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute right-0 top-12 bg-secondary rounded-lg shadow-lg border border-border py-1 z-50 min-w-[180px] card"
                  >
                    <button
                      onClick={handleClearChat}
                      className="w-full px-4 py-2 text-left text-sm text-red-500 hover:bg-tertiary flex items-center gap-2"
                    >
                      <FiTrash2 className="w-4 h-4" />
                      Clear Chat
                    </button>
                  </motion.div>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto px-4 py-2 space-y-1">
          {chatMessages.map((message, index) => {
            const senderId = getIdString(message.sender?._id || message.sender);
            const userId = getIdString(user?._id);
            const isSent = compareIds(senderId, userId);
            const prevMessage = index > 0 ? chatMessages[index - 1] : null;
            const showAvatar = !isSent && (!prevMessage || getIdString(prevMessage.sender?._id || prevMessage.sender) !== senderId);
            const sender = typeof message.sender === 'object' ? message.sender : null;

            const otherParticipantId = currentChat?.participants?.find(p => {
              const pId = getIdString(p);
              return pId !== userId;
            });
            const otherParticipantIdString = otherParticipantId ? getIdString(otherParticipantId) : null;

            return (
              <div key={message._id} data-message-id={message._id}>
                <MessageBubble
                  message={message}
                  isSent={isSent}
                  showAvatar={showAvatar}
                  sender={sender}
                  currentUserId={userId}
                  otherParticipantId={otherParticipantIdString}
                  isPending={pendingMessages.has(message._id)}
                  onReply={handleReply}
                  onForward={handleForward}
                  isGroupChat={currentChat?.chatType === 'group'}
                />
              </div>
            );
          })}

          {typingUserIds.length > 0 && <TypingIndicator />}

          <div ref={messagesEndRef} />
        </div>

        {replyingTo && (
          <div className="bg-tertiary border-t border-border px-4 py-2 flex items-center justify-between">
            <div className="flex-1">
              <p className="text-xs text-secondary mb-1">Replying to {typeof replyingTo.sender === 'object' ? replyingTo.sender.username : 'User'}</p>
              <p className="text-sm text-primary truncate">{replyingTo.content}</p>
            </div>
            <button
              onClick={() => setReplyingTo(null)}
              className="p-1 rounded-full hover:bg-secondary transition-colors"
            >
              <FiX className="w-4 h-4 text-secondary" />
            </button>
          </div>
        )}

        {filePreview && (
          <div className="bg-tertiary border-t border-border px-4 py-2">
            <div className="flex items-center gap-3">
              {selectedFile.type.startsWith('image/') ? (
                <img
                  src={filePreview}
                  alt="Preview"
                  className="w-16 h-16 object-cover rounded-lg"
                />
              ) : (
                <div className="w-16 h-16 bg-secondary rounded-lg flex items-center justify-center">
                  {selectedFile.type.startsWith('video/') ? (
                    <FiVideo className="w-8 h-8 text-secondary" />
                  ) : selectedFile.type.startsWith('audio/') ? (
                    <FiMusic className="w-8 h-8 text-secondary" />
                  ) : (
                    <FiFile className="w-8 h-8 text-secondary" />
                  )}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-primary truncate">{selectedFile.name}</p>
                <p className="text-xs text-secondary">
                  {(selectedFile.size / 1024).toFixed(1)} KB
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedFile(null);
                  setFilePreview(null);
                  if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                  }
                }}
                className="p-2 rounded-full hover:bg-secondary transition-colors"
              >
                <FiX className="w-4 h-4 text-secondary" />
              </button>
            </div>
          </div>
        )}

        <div className="bg-secondary px-4 py-2">
          <form onSubmit={handleSend} className="flex items-end gap-2">
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileSelect}
              accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt"
              className="hidden"
              id="file-input"
            />
            <label
              htmlFor="file-input"
              className="p-3 rounded-full hover:bg-tertiary transition-colors flex-shrink-0 cursor-pointer"
              title="Attach file"
            >
              <FiPaperclip className="w-5 h-5 text-secondary" />
            </label>
            <div className="flex-1 relative">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  handleTyping();
                }}
                placeholder={replyingTo ? 'Type a reply...' : 'Type a message'}
                className="input rounded-full py-3 pr-12"
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2" ref={emojiPickerRef}>
                <button
                  type="button"
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className="p-2 rounded-full hover:bg-tertiary transition-colors flex items-center justify-center"
                  title="Emoji"
                >
                  <FiSmile className="w-5 h-5 text-secondary" />
                </button>
                {showEmojiPicker && (
                  <div className="absolute bottom-full right-0 mb-2 bg-secondary rounded-lg shadow-lg border border-border p-3 z-50 card">
                    <div className="grid grid-cols-6 gap-2 w-[240px]">
                      {['😀', '😂', '🥰', '😍', '🤔', '😮', '👍', '❤️', '🔥', '🎉', '😢', '🙏', '👏', '💯', '✨', '🎊', '😎', '🤗', '😴', '🤯', '😱', '🥳', '😋', '🤤'].map((emoji) => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => {
                            setInput((prev) => prev + emoji);
                            setShowEmojiPicker(false);
                            inputRef.current?.focus();
                          }}
                          className="text-3xl hover:scale-110 transition-transform p-2 rounded hover:bg-tertiary flex items-center justify-center min-w-[36px] min-h-[36px] w-full aspect-square"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
            <motion.button
              type="submit"
              disabled={!input.trim() && !selectedFile}
              whileHover={{ scale: (input.trim() || selectedFile) ? 1.05 : 1 }}
              whileTap={{ scale: (input.trim() || selectedFile) ? 0.95 : 1 }}
              className="p-3 rounded-full bg-accent hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex-shrink-0"
            >
              <FiSend className="w-5 h-5 text-white" />
            </motion.button>
          </form>
        </div>
      </div>

      {showInfoPanel && (
        <InfoPanel chat={currentChat} onClose={() => setShowInfoPanel(false)} />
      )}

      {showForwardModal && messageToForward && (
        <ForwardModal
          message={messageToForward}
          onClose={() => {
            setShowForwardModal(false);
            setMessageToForward(null);
          }}
          onConfirm={handleForwardConfirm}
        />
      )}
    </div>
  );
}

export default ChatPage;
