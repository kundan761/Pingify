import { Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectAuth } from '../../store/slices/authSlice.js';
import ProtectedRoute from './ProtectedRoute.jsx';
import PublicRoute from './PublicRoute.jsx';
import Layout from '../layout/Layout.jsx';
import AuthPage from '../auth/AuthPage.jsx';
import HomePage from '../page/HomePage.jsx';
import ChatPage from '../chat/ChatPage.jsx';
import ProfilePage from '../profile/ProfilePage.jsx';
import SettingsPage from '../settings/SettingsPage.jsx';

function AppRoutes() {
  const { isAuthenticated } = useSelector(selectAuth);

  return (
    <Routes>
      <Route element={<PublicRoute />}>
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/auth/login" element={<Navigate to="/auth" replace />} />
        <Route path="/auth/register" element={<Navigate to="/auth" replace />} />
        <Route path="/auth/forgot-password" element={<Navigate to="/auth" replace />} />
        <Route path="/auth/reset-password" element={<Navigate to="/auth" replace />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/chat/:chatId?" element={<ChatPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
      </Route>

      <Route
        path="*"
        element={
          isAuthenticated ? (
            <Navigate to="/" replace />
          ) : (
            <Navigate to="/auth" replace />
          )
        }
      />
    </Routes>
  );
}

export default AppRoutes;
