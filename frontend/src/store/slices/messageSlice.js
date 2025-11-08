import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as messageService from '../../services/messageService.js';

const initialState = {
  messages: {},
  typingUsers: {},
  loading: false,
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

export const sendMessage = createAsyncThunk('message/sendMessage', async ({ chatId, content, messageType, replyTo }, { rejectWithValue }) => {
  try {
    const response = await messageService.sendMessage(chatId, content, messageType, replyTo);
    return response.data.data || response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to send message');
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
        state.loading = true;
        state.error = null;
      })
      .addCase(sendMessage.fulfilled, (state, action) => {
        state.loading = false;
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
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { addMessage, updateMessage, deleteMessage, setTyping, clearMessages } = messageSlice.actions;
export default messageSlice.reducer;

