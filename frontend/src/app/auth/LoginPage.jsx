import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { FiMail, FiLock, FiArrowRight, FiMessageCircle, FiEye, FiEyeOff } from 'react-icons/fi';
import { login } from '../../store/slices/authSlice.js';
import toast from 'react-hot-toast';

function LoginPage() {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading } = useSelector((state) => state.auth);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await dispatch(login(formData)).unwrap();
      toast.success('Welcome back!');
      navigate('/');
    } catch (error) {
      toast.error(error || 'Login failed');
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 app-bg"
      style={{ backgroundColor: '#F5F5F5', minHeight: '100vh' }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="card p-8 md:p-10 w-full max-w-md"
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '8px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          padding: '2rem'
        }}
      >
        <div className="flex flex-col items-center mb-8">
          <div className="w-20 h-20 rounded-full bg-[#00A884] flex items-center justify-center shadow-lg mb-4">
            <FiMessageCircle className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-light mb-2" style={{ color: '#111B21' }}>Welcome Back</h1>
          <p className="text-center" style={{ color: '#667781' }}>Sign in to continue to Pingify</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1">
            <label className="text-sm font-medium flex items-center gap-2" style={{ color: '#111B21' }}>
              <FiMail className="w-4 h-4" />
              Email
            </label>
            <input
              type="email"
              placeholder="Enter your email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="input"
              style={{
                width: '100%',
                padding: '0.5rem 1rem',
                borderRadius: '0.5rem',
                border: '1px solid #e5e7eb',
                backgroundColor: '#ffffff',
                color: '#111B21'
              }}
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium flex items-center gap-2" style={{ color: '#111B21' }}>
              <FiLock className="w-4 h-4" />
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="input"
                style={{
                  width: '100%',
                  padding: '0.5rem 2.5rem 0.5rem 1rem',
                  borderRadius: '0.5rem',
                  border: '1px solid #e5e7eb',
                  backgroundColor: '#ffffff',
                  color: '#111B21'
                }}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-gray-100 transition-colors"
                style={{ color: '#667781' }}
              >
                {showPassword ? (
                  <FiEyeOff className="w-5 h-5" />
                ) : (
                  <FiEye className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between text-sm">
            <Link
              to="/auth/forgot-password"
              style={{ color: '#00A884' }}
              className="hover:opacity-80 transition-opacity"
            >
              Forgot password?
            </Link>
          </div>

          <motion.button
            type="submit"
            disabled={loading}
            whileHover={{ scale: loading ? 1 : 1.02 }}
            whileTap={{ scale: loading ? 1 : 0.98 }}
            className="w-full flex items-center justify-center gap-2"
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '0.5rem',
              backgroundColor: '#00A884',
              color: '#ffffff',
              fontWeight: '500',
              border: 'none',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.5 : 1
            }}
          >
            {loading ? (
              <>
                <div className="spinner"></div>
                <span>Signing in...</span>
              </>
            ) : (
              <>
                <span>Sign In</span>
                <FiArrowRight className="w-4 h-4" />
              </>
            )}
          </motion.button>
        </form>

        <div className="mt-6 text-center">
          <p style={{ color: '#667781', fontSize: '0.875rem' }}>
            Don't have an account?{' '}
            <Link
              to="/auth/register"
              style={{ color: '#00A884', fontWeight: '500' }}
              className="hover:opacity-80 transition-opacity"
            >
              Sign up
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}

export default LoginPage;
