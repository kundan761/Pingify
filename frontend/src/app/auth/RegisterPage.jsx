import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { register } from '../../store/slices/authSlice.js';
import toast from 'react-hot-toast';

function RegisterPage() {
  const [formData, setFormData] = useState({ username: '', email: '', password: '', confirmPassword: '' });
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading } = useSelector((state) => state.auth);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    try {
      // Remove confirmPassword before sending to backend
      const { confirmPassword, ...userData } = formData;
      await dispatch(register(userData)).unwrap();
      toast.success('Registration successful!');
      navigate('/');
    } catch (error) {
      // Handle validation errors
      if (error && typeof error === 'string') {
        toast.error(error);
      } else if (error?.errors && Array.isArray(error.errors)) {
        error.errors.forEach((err) => {
          toast.error(err.message || 'Validation error');
        });
      } else {
        toast.error(error?.message || 'Registration failed');
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass p-8 w-full max-w-md"
      >
        <h1 className="text-3xl font-bold text-white mb-2">Create Account</h1>
        <p className="text-white/70 mb-6">Sign up to start chatting</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="text"
              placeholder="Username"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              className="glass-input w-full"
              required
            />
          </div>
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
          <div>
            <input
              type="password"
              placeholder="Confirm Password"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              className="glass-input w-full"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="glass-button w-full"
          >
            {loading ? 'Creating account...' : 'Sign Up'}
          </button>
        </form>

        <p className="text-white/70 text-center mt-6">
          Already have an account?{' '}
          <Link to="/auth/login" className="text-indigo-400 hover:text-indigo-300 font-semibold">
            Sign in
          </Link>
        </p>
      </motion.div>
    </div>
  );
}

export default RegisterPage;

