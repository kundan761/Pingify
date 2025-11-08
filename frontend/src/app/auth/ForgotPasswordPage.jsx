import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { forgotPassword } from '../../services/authService.js';
import toast from 'react-hot-toast';

function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await forgotPassword(email);
      setSent(true);
      toast.success('Password reset email sent!');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass p-8 w-full max-w-md"
      >
        <h1 className="text-3xl font-bold text-white mb-2">Forgot Password</h1>
        <p className="text-white/70 mb-6">Enter your email to receive a reset link</p>

        {sent ? (
          <div className="text-center">
            <p className="text-white/80 mb-4">Check your email for the reset link</p>
            <Link to="/auth/login" className="text-indigo-400 hover:text-indigo-300 font-semibold">
              Back to Login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="glass-input w-full"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="glass-button w-full"
            >
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>
          </form>
        )}

        <p className="text-white/70 text-center mt-6">
          Remember your password?{' '}
          <Link to="/auth/login" className="text-indigo-400 hover:text-indigo-300 font-semibold">
            Sign in
          </Link>
        </p>
      </motion.div>
    </div>
  );
}

export default ForgotPasswordPage;

