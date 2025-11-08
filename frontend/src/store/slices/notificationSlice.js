import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as notificationService from '../../services/notificationService.js';

const initialState = {
  notifications: [],
  unreadCount: 0,
  loading: false,
  error: null,
};

export const fetchNotifications = createAsyncThunk('notification/fetchNotifications', async (_, { rejectWithValue }) => {
  try {
    const response = await notificationService.getNotifications();
    return response.data.data || response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to fetch notifications');
  }
});

export const markAsRead = createAsyncThunk('notification/markAsRead', async (notificationId, { rejectWithValue }) => {
  try {
    const response = await notificationService.markAsRead(notificationId);
    return response.data.data || response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to mark as read');
  }
});

export const markAllAsRead = createAsyncThunk('notification/markAllAsRead', async (_, { rejectWithValue }) => {
  try {
    const response = await notificationService.markAllAsRead();
    return response.data.data || response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to mark all as read');
  }
});

const notificationSlice = createSlice({
  name: 'notification',
  initialState,
  reducers: {
    addNotification: (state, action) => {
      state.notifications.unshift(action.payload);
      state.unreadCount += 1;
    },
    removeNotification: (state, action) => {
      const notificationId = action.payload;
      state.notifications = state.notifications.filter((n) => n._id !== notificationId);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchNotifications.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.loading = false;
        const payload = action.payload;
        state.notifications = payload.notifications || payload || [];
        state.unreadCount = payload.unreadCount || 0;
      })
      .addCase(fetchNotifications.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(markAsRead.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(markAsRead.fulfilled, (state, action) => {
        state.loading = false;
        const notification = action.payload;
        const index = state.notifications.findIndex((n) => n._id === notification._id);
        if (index !== -1) {
          state.notifications[index] = notification;
          if (!notification.read) {
            state.unreadCount = Math.max(0, state.unreadCount - 1);
          }
        }
      })
      .addCase(markAsRead.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(markAllAsRead.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(markAllAsRead.fulfilled, (state) => {
        state.loading = false;
        state.notifications = state.notifications.map((n) => ({ ...n, read: true }));
        state.unreadCount = 0;
      })
      .addCase(markAllAsRead.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { addNotification, removeNotification } = notificationSlice.actions;
export default notificationSlice.reducer;

