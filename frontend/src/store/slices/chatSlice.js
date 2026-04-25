import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as chatService from '../../services/chatService.js';
import { getIdString } from '../../utils/helpers.js';
import { deleteMessageAction } from './messageSlice.js';

const initialState = {
  chats: [],
  currentChat: null,
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
    updateUserOnlineStatus: (state, action) => {
      const { userId, isOnline } = action.payload;
      state.chats = state.chats.map((chat) => {
        if (chat.participants) {
          const updatedParticipants = chat.participants.map((participant) => {
            const pId = getIdString(participant._id || participant);
            const targetId = getIdString(userId);
            if (pId === targetId) {
              return typeof participant === 'object'
                ? { ...participant, isOnline }
                : participant;
            }
            return participant;
          });
          return { ...chat, participants: updatedParticipants };
        }
        return chat;
      });
      if (state.currentChat?.participants) {
        const updatedParticipants = state.currentChat.participants.map((participant) => {
          const pId = getIdString(participant._id || participant);
          const targetId = getIdString(userId);
          if (pId === targetId) {
            return typeof participant === 'object'
              ? { ...participant, isOnline }
              : participant;
          }
          return participant;
        });
        state.currentChat = { ...state.currentChat, participants: updatedParticipants };
      }
    },
    updateLastMessage: (state, action) => {
      const { chatId, message } = action.payload;
      const index = state.chats.findIndex((c) => c._id === chatId);
      if (index !== -1) {
        state.chats[index].lastMessage = message;
        // Move chat to top
        const chat = state.chats.splice(index, 1)[0];
        state.chats.unshift(chat);
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
      })
      .addCase(deleteMessageAction.fulfilled, (state, action) => {
        const deletedMessage = action.payload;
        const chatId = deletedMessage.chat;
        const index = state.chats.findIndex((c) => c._id === chatId);
        if (index !== -1) {
          // If the deleted message was the last message, update it
          if (state.chats[index].lastMessage && state.chats[index].lastMessage._id === deletedMessage._id) {
            state.chats[index].lastMessage = deletedMessage;
          }
        }
        if (state.currentChat?._id === chatId) {
          if (state.currentChat.lastMessage?._id === deletedMessage._id) {
            state.currentChat.lastMessage = deletedMessage;
          }
        }
      });
  },
});

export const { setCurrentChat, addChat, updateChat, removeChat, updateUserOnlineStatus, updateLastMessage } = chatSlice.actions;
export default chatSlice.reducer;
