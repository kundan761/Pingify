import { Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Layout from './layout/Layout.jsx';
import HomePage from './page/HomePage.jsx';
import LoginPage from './auth/LoginPage.jsx';
import RegisterPage from './auth/RegisterPage.jsx';
import ForgotPasswordPage from './auth/ForgotPasswordPage.jsx';
import ResetPasswordPage from './auth/ResetPasswordPage.jsx';
import ChatPage from './chat/ChatPage.jsx';
import ProfilePage from './profile/ProfilePage.jsx';
import SettingsPage from './settings/SettingsPage.jsx';
import { selectAuth } from '../store/slices/authSlice.js';

function App() {
  const { isAuthenticated } = useSelector(selectAuth);

  return (
    <Routes>
      <Route path="/auth/login" element={!isAuthenticated ? <LoginPage /> : <Navigate to="/" />} />
      <Route path="/auth/register" element={!isAuthenticated ? <RegisterPage /> : <Navigate to="/" />} />
      <Route path="/auth/forgot-password" element={!isAuthenticated ? <ForgotPasswordPage /> : <Navigate to="/" />} />
      <Route path="/auth/reset-password" element={!isAuthenticated ? <ResetPasswordPage /> : <Navigate to="/" />} />
      
      <Route element={<Layout />}>
        <Route path="/" element={isAuthenticated ? <HomePage /> : <Navigate to="/auth/login" />} />
        <Route path="/chat/:chatId?" element={isAuthenticated ? <ChatPage /> : <Navigate to="/auth/login" />} />
        <Route path="/profile" element={isAuthenticated ? <ProfilePage /> : <Navigate to="/auth/login" />} />
        <Route path="/settings" element={isAuthenticated ? <SettingsPage /> : <Navigate to="/auth/login" />} />
      </Route>
    </Routes>
  );
}

export default App;

