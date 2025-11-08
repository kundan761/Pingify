import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { login } from '../../store/slices/authSlice.js';
import toast from 'react-hot-toast';

function LoginPage() {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading } = useSelector((state) => state.auth);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await dispatch(login(formData)).unwrap();
      toast.success('Login successful!');
      navigate('/');
    } catch (error) {
      toast.error(error || 'Login failed');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass p-8 w-full max-w-md"
      >
        <h1 className="text-3xl font-bold text-white mb-2">Welcome Back</h1>
        <p className="text-white/70 mb-6">Sign in to continue to Pingify</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="email"
              placeholder="Email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="glass-input w-full"
              required
            />
          </div>
          <div>
            <input
              type="password"
              placeholder="Password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="glass-input w-full"
              required
            />
          </div>
          <Link to="/auth/forgot-password" className="text-white/70 hover:text-white text-sm block text-right">
            Forgot password?
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="glass-button w-full"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p className="text-white/70 text-center mt-6">
          Don't have an account?{' '}
          <Link to="/auth/register" className="text-indigo-400 hover:text-indigo-300 font-semibold">
            Sign up
          </Link>
        </p>
      </motion.div>
    </div>
  );
}

export default LoginPage;

