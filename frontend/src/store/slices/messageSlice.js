import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as messageService from '../../services/messageService.js';
import * as userService from '../../services/userService.js';
import { encryptMessage } from '../../utils/crypto.js';

const initialState = {
  messages: {},
  typingUsers: {},
  loading: false,
  sendingMessage: false,
  error: null,
};

export const fetchMessages = createAsyncThunk('message/fetchMessages', async (chatId, { rejectWithValue }) => {
  try {
    const response = await messageService.getMessages(chatId);
    const messages = response.data.data || response.data;
    return { chatId, messages };
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to fetch messages');
  }
});

export const sendMessage = createAsyncThunk('message/sendMessage', async ({ chatId, content, messageType, replyTo, media }, { getState, rejectWithValue }) => {
  try {
    let finalContent = content;
    const state = getState();
    const currentChat = state.chat.chats.find(c => c._id === chatId);
    const currentUser = state.auth.user;

    // Encrypt text messages for 1-on-1 chats
    if (messageType === 'text' && currentChat && currentChat.chatType === 'private') {
      const otherParticipant = currentChat.participants.find(p => p._id !== currentUser._id);
      if (otherParticipant) {
        try {
          // Get public keys for both participants (sender and recipient)
          const recipientKeyRes = await userService.getPublicKey(otherParticipant._id);
          const recipientPublicKey = recipientKeyRes.data?.data?.publicKey;
          
          // Sender's public key (current user)
          const senderPublicKey = currentUser.publicKey;

          if (recipientPublicKey && senderPublicKey) {
            const keys = {
              [otherParticipant._id]: recipientPublicKey,
              [currentUser._id]: senderPublicKey
            };
            finalContent = await encryptMessage(content, keys);
          } else if (recipientPublicKey) {
            // Fallback to only recipient key if sender key is somehow missing
            finalContent = await encryptMessage(content, { [otherParticipant._id]: recipientPublicKey });
          }
        } catch (err) {
          console.error('Failed to fetch public key or encrypt message:', err);
        }
      }
    }

    const response = await messageService.sendMessage(chatId, finalContent, messageType, replyTo, media);
    return response.data.data || response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to send message');
  }
});

export const editMessage = createAsyncThunk('message/editMessage', async ({ messageId, content }, { rejectWithValue }) => {
  try {
    const response = await messageService.editMessage(messageId, content);
    return response.data.data || response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to edit message');
  }
});

export const deleteMessageAction = createAsyncThunk('message/deleteMessage', async (messageId, { rejectWithValue }) => {
  try {
    const response = await messageService.deleteMessage(messageId);
    return response.data.data || response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to delete message');
  }
});

export const reactToMessage = createAsyncThunk('message/reactToMessage', async ({ messageId, emoji }, { rejectWithValue }) => {
  try {
    const response = await messageService.reactToMessage(messageId, emoji);
    return response.data.data || response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to react to message');
  }
});

export const forwardMessage = createAsyncThunk('message/forwardMessage', async ({ messageId, targetChatIds }, { rejectWithValue }) => {
  try {
    const response = await messageService.forwardMessage(messageId, targetChatIds);
    return response.data.data || response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to forward message');
  }
});

export const starMessage = createAsyncThunk('message/starMessage', async (messageId, { rejectWithValue }) => {
  try {
    const response = await messageService.starMessage(messageId);
    return { messageId, ...response.data.data };
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to star message');
  }
});

export const searchMessages = createAsyncThunk('message/searchMessages', async ({ chatId, query }, { rejectWithValue }) => {
  try {
    const response = await messageService.searchMessages(chatId, query);
    return response.data.data || response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to search messages');
  }
});

export const clearChat = createAsyncThunk('message/clearChat', async (chatId, { rejectWithValue }) => {
  try {
    const response = await messageService.clearChat(chatId);
    return { chatId, ...response.data.data };
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to clear chat');
  }
});

const messageSlice = createSlice({
  name: 'message',
  initialState,
  reducers: {
    addMessage: (state, action) => {
      const message = action.payload;
      const chatId = message.chat;
      if (!state.messages[chatId]) {
        state.messages[chatId] = [];
      }
      const exists = state.messages[chatId].find((m) => m._id === message._id);
      if (!exists) {
        state.messages[chatId].push(message);
      }
    },
    updateMessage: (state, action) => {
      const updatedMessage = action.payload;
      const chatId = updatedMessage.chat;
      if (state.messages[chatId]) {
        const index = state.messages[chatId].findIndex((m) => m._id === updatedMessage._id);
        if (index !== -1) {
          state.messages[chatId][index] = updatedMessage;
        }
      }
    },
    deleteMessage: (state, action) => {
      const { chatId, messageId } = action.payload;
      if (state.messages[chatId]) {
        state.messages[chatId] = state.messages[chatId].filter((m) => m._id !== messageId);
      }
    },
    setTyping: (state, action) => {
      const { chatId, userId, isTyping } = action.payload;
      if (!state.typingUsers[chatId]) {
        state.typingUsers[chatId] = [];
      }
      if (isTyping) {
        if (!state.typingUsers[chatId].includes(userId)) {
          state.typingUsers[chatId].push(userId);
        }
      } else {
        state.typingUsers[chatId] = state.typingUsers[chatId].filter((id) => id !== userId);
      }
    },
    clearMessages: (state, action) => {
      const chatId = action.payload;
      delete state.messages[chatId];
    },
    markAllMessagesAsRead: (state, action) => {
      const { chatId, userId } = action.payload;
      if (state.messages[chatId]) {
        state.messages[chatId] = state.messages[chatId].map((m) => {
          const senderId = getIdString(m.sender?._id || m.sender);
          const readerId = getIdString(userId);
          if (senderId !== readerId && !m.readBy.some((r) => getIdString(r.user?._id || r.user) === readerId)) {
            return {
              ...m,
              readBy: [...m.readBy, { user: userId, readAt: new Date().toISOString() }],
            };
          }
          return m;
        });
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMessages.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchMessages.fulfilled, (state, action) => {
        state.loading = false;
        const { chatId, messages } = action.payload;
        state.messages[chatId] = messages;
      })
      .addCase(fetchMessages.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(sendMessage.pending, (state) => {
        state.sendingMessage = true;
        state.error = null;
      })
      .addCase(sendMessage.fulfilled, (state, action) => {
        state.sendingMessage = false;
        const message = action.payload;
        const chatId = message.chat || message.chatId;
        if (!state.messages[chatId]) {
          state.messages[chatId] = [];
        }
        const exists = state.messages[chatId].find((m) => m._id === message._id);
        if (!exists) {
          state.messages[chatId].push(message);
        }
      })
      .addCase(sendMessage.rejected, (state, action) => {
        state.sendingMessage = false;
        state.error = action.payload;
      })
      .addCase(editMessage.fulfilled, (state, action) => {
        const updatedMessage = action.payload;
        const chatId = updatedMessage.chat;
        if (state.messages[chatId]) {
          const index = state.messages[chatId].findIndex((m) => m._id === updatedMessage._id);
          if (index !== -1) {
            state.messages[chatId][index] = updatedMessage;
          }
        }
      })
      .addCase(deleteMessageAction.fulfilled, (state, action) => {
        const deletedMessage = action.payload;
        const chatId = deletedMessage.chat;
        if (state.messages[chatId]) {
          const index = state.messages[chatId].findIndex((m) => m._id === deletedMessage._id);
          if (index !== -1) {
            state.messages[chatId][index] = deletedMessage;
          }
        }
      })
      .addCase(reactToMessage.fulfilled, (state, action) => {
        const updatedMessage = action.payload;
        const chatId = updatedMessage.chat;
        if (state.messages[chatId]) {
          const index = state.messages[chatId].findIndex((m) => m._id === updatedMessage._id);
          if (index !== -1) {
            state.messages[chatId][index] = updatedMessage;
          }
        }
      })
      .addCase(clearChat.fulfilled, (state, action) => {
        const { chatId } = action.payload;
        delete state.messages[chatId];
      });
  },
});

export const { addMessage, updateMessage, deleteMessage, setTyping, clearMessages, markAllMessagesAsRead } = messageSlice.actions;
export default messageSlice.reducer;

