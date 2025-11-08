import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as chatService from '../../services/chatService.js';

const initialState = {
  chats: [],
  currentChat: null,
  socket: null,
  loading: false,
  error: null,
};

export const fetchChats = createAsyncThunk('chat/fetchChats', async (_, { rejectWithValue }) => {
  try {
    const response = await chatService.getChats();
    return response.data.data || response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to fetch chats');
  }
});

export const createChat = createAsyncThunk('chat/createChat', async (participantId, { rejectWithValue }) => {
  try {
    const response = await chatService.createChat(participantId);
    return response.data.data || response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to create chat');
  }
});

export const getChat = createAsyncThunk('chat/getChat', async (chatId, { rejectWithValue }) => {
  try {
    const response = await chatService.getChat(chatId);
    return response.data.data || response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to get chat');
  }
});

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    setSocket: (state, action) => {
      state.socket = action.payload;
    },
    setCurrentChat: (state, action) => {
      state.currentChat = action.payload;
    },
    addChat: (state, action) => {
      const chat = action.payload;
      const exists = state.chats.find((c) => c._id === chat._id);
      if (!exists) {
        state.chats.unshift(chat);
      }
    },
    updateChat: (state, action) => {
      const updatedChat = action.payload;
      const index = state.chats.findIndex((c) => c._id === updatedChat._id);
      if (index !== -1) {
        state.chats[index] = updatedChat;
      }
      if (state.currentChat?._id === updatedChat._id) {
        state.currentChat = updatedChat;
      }
    },
    removeChat: (state, action) => {
      const chatId = action.payload;
      state.chats = state.chats.filter((c) => c._id !== chatId);
      if (state.currentChat?._id === chatId) {
        state.currentChat = null;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchChats.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchChats.fulfilled, (state, action) => {
        state.loading = false;
        state.chats = action.payload.chats || [];
      })
      .addCase(fetchChats.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(createChat.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createChat.fulfilled, (state, action) => {
        state.loading = false;
        const chat = action.payload;
        const exists = state.chats.find((c) => c._id === chat._id);
        if (!exists) {
          state.chats.unshift(chat);
        }
        state.currentChat = chat;
      })
      .addCase(createChat.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(getChat.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getChat.fulfilled, (state, action) => {
        state.loading = false;
        state.currentChat = action.payload;
      })
      .addCase(getChat.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { setSocket, setCurrentChat, addChat, updateChat, removeChat } = chatSlice.actions;
export default chatSlice.reducer;

