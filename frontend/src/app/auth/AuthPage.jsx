import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { FiUser, FiMail, FiArrowRight, FiArrowLeft, FiMessageCircle, FiShield, FiZap, FiUsers, FiCheck } from 'react-icons/fi';
import { sendOtp, verifyOtp, resetOtpState, selectAuth } from '../../store/slices/authSlice.js';
import toast from 'react-hot-toast';

const SLIDES = { FORM: 0, OTP: 1, SUCCESS: 2 };
const OTP_LENGTH = 6;
const OTP_EXPIRY = 300; // 5 minutes in seconds

function AuthPage() {
  const [mode, setMode] = useState('login'); // 'login' or 'signup'
  const [slide, setSlide] = useState(SLIDES.FORM);
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [otp, setOtp] = useState(Array(OTP_LENGTH).fill(''));
  const [timer, setTimer] = useState(OTP_EXPIRY);
  const [canResend, setCanResend] = useState(false);

  const otpRefs = useRef([]);
  const timerRef = useRef(null);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, otpSent, error } = useSelector(selectAuth);

  // Timer countdown
  useEffect(() => {
    if (slide === SLIDES.OTP) {
      setTimer(OTP_EXPIRY);
      setCanResend(false);
      timerRef.current = setInterval(() => {
        setTimer((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timerRef.current);
    }
  }, [slide]);

  // Navigate to OTP slide when OTP is sent
  useEffect(() => {
    if (otpSent && slide === SLIDES.FORM) {
      setSlide(SLIDES.OTP);
      setOtp(Array(OTP_LENGTH).fill(''));
    }
  }, [otpSent]);

  const formatTimer = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error('Please enter your email');
      return;
    }
    if (mode === 'signup' && !username.trim()) {
      toast.error('Please enter a username');
      return;
    }

    try {
      const data = { email: email.trim() };
      if (mode === 'signup') {
        data.username = username.trim();
      }
      await dispatch(sendOtp(data)).unwrap();
      toast.success('OTP sent to your email!');
    } catch (err) {
      toast.error(err || 'Failed to send OTP');
    }
  };

  const handleVerifyOtp = useCallback(async (otpValue) => {
    const otpStr = otpValue || otp.join('');
    if (otpStr.length !== OTP_LENGTH) {
      toast.error('Please enter the complete OTP');
      return;
    }

    try {
      await dispatch(verifyOtp({ email: email.trim(), otp: otpStr })).unwrap();
      setSlide(SLIDES.SUCCESS);
      toast.success('Welcome to Pingify!');
      setTimeout(() => {
        navigate('/');
      }, 1500);
    } catch (err) {
      toast.error(err || 'Invalid OTP');
      setOtp(Array(OTP_LENGTH).fill(''));
      otpRefs.current[0]?.focus();
    }
  }, [otp, email, dispatch, navigate]);

  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < OTP_LENGTH - 1) {
      otpRefs.current[index + 1]?.focus();
    }

    // Auto-submit when last digit entered
    if (value && index === OTP_LENGTH - 1) {
      const fullOtp = newOtp.join('');
      if (fullOtp.length === OTP_LENGTH) {
        handleVerifyOtp(fullOtp);
      }
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
    if (e.key === 'Enter') {
      handleVerifyOtp();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH);
    if (pastedData.length > 0) {
      const newOtp = Array(OTP_LENGTH).fill('');
      pastedData.split('').forEach((char, i) => {
        newOtp[i] = char;
      });
      setOtp(newOtp);
      if (pastedData.length === OTP_LENGTH) {
        handleVerifyOtp(pastedData);
      } else {
        otpRefs.current[pastedData.length]?.focus();
      }
    }
  };

  const handleResend = async () => {
    if (!canResend) return;
    try {
      const data = { email: email.trim() };
      if (mode === 'signup') {
        data.username = username.trim();
      }
      await dispatch(sendOtp(data)).unwrap();
      setTimer(OTP_EXPIRY);
      setCanResend(false);
      setOtp(Array(OTP_LENGTH).fill(''));
      toast.success('New OTP sent!');
    } catch (err) {
      toast.error(err || 'Failed to resend OTP');
    }
  };

  const handleBack = () => {
    dispatch(resetOtpState());
    setSlide(SLIDES.FORM);
    setOtp(Array(OTP_LENGTH).fill(''));
    clearInterval(timerRef.current);
  };

  const switchMode = (newMode) => {
    setMode(newMode);
    dispatch(resetOtpState());
    setSlide(SLIDES.FORM);
    setOtp(Array(OTP_LENGTH).fill(''));
    setEmail('');
    setUsername('');
  };

  const features = [
    { icon: FiShield, title: 'End-to-End Secure', desc: 'Your messages are always protected' },
    { icon: FiZap, title: 'Lightning Fast', desc: 'Real-time messaging experience' },
    { icon: FiUsers, title: 'Group Chats', desc: 'Connect with everyone at once' },
  ];

  const slideVariants = {
    enter: (direction) => ({ x: direction > 0 ? 300 : -300, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (direction) => ({ x: direction > 0 ? -300 : 300, opacity: 0 }),
  };

  return (
    <div className="min-h-screen flex app-bg">
      {/* Left Brand Panel */}
      <div className="hidden lg:flex lg:w-1/2 flex-col auth-brand-panel relative overflow-hidden">
        {/* Animated background shapes */}
        <div className="absolute inset-0">
          <motion.div
            animate={{ y: [0, -20, 0], rotate: [0, 5, 0] }}
            transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute top-20 left-10 w-32 h-32 rounded-full"
            style={{ background: 'rgba(255,255,255,0.06)' }}
          />
          <motion.div
            animate={{ y: [0, 15, 0], rotate: [0, -5, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
            className="absolute bottom-32 right-10 w-24 h-24 rounded-full"
            style={{ background: 'rgba(255,255,255,0.08)' }}
          />
          <motion.div
            animate={{ y: [0, -10, 0], x: [0, 10, 0] }}
            transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
            className="absolute top-1/2 left-1/3 w-40 h-40 rounded-full"
            style={{ background: 'rgba(255,255,255,0.04)' }}
          />
        </div>

        <div className="relative z-10 flex flex-col h-full px-10 py-12">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-auto">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.2)' }}>
              <FiMessageCircle className="w-7 h-7 text-white" />
            </div>
            <span className="text-white text-2xl font-semibold tracking-tight">Pingify</span>
          </div>

          {/* Main content */}
          <div className="my-auto">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-white text-4xl font-bold leading-tight mb-4"
            >
              Connect with<br />
              anyone, anywhere
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-lg mb-10 text-white/75"
            >
              Fast, secure, and beautifully simple messaging for everyone.
            </motion.p>

            {/* Feature cards */}
            <div className="space-y-4">
              {features.map((feature, i) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + i * 0.1 }}
                  className="flex items-center gap-4 p-4 rounded-xl bg-white/10 backdrop-blur-sm"
                >
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 bg-white/20"
                  >
                    <feature.icon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-white font-medium text-sm">{feature.title}</p>
                    <p className="text-white/65 text-[13px]">{feature.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <p className="text-white/40 text-[13px] mt-auto">
            © {new Date().getFullYear()} Pingify. Secure Messaging.
          </p>
        </div>
      </div>

      {/* Right Auth Form Panel */}
      <div className="flex-1 lg:w-1/2 flex items-center justify-center px-6 py-8">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex items-center justify-center gap-2 mb-8 lg:hidden">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-accent">
              <FiMessageCircle className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-semibold text-primary">Pingify</span>
          </div>

          {/* Mode Toggle */}
          {slide === SLIDES.FORM && (
            <div className="flex rounded-xl p-1 mb-8 bg-tertiary">
              <button
                onClick={() => switchMode('login')}
                className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all duration-300 ${
                  mode === 'login'
                    ? 'bg-secondary text-primary shadow-sm'
                    : 'text-secondary hover:text-primary'
                }`}
              >
                Sign In
              </button>
              <button
                onClick={() => switchMode('signup')}
                className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all duration-300 ${
                  mode === 'signup'
                    ? 'bg-secondary text-primary shadow-sm'
                    : 'text-secondary hover:text-primary'
                }`}
              >
                Sign Up
              </button>
            </div>
          )}

          {/* Slide Container */}
          <div className="relative overflow-hidden min-h-[380px]">
            <AnimatePresence mode="wait" custom={slide}>
              {/* Slide 1: Form */}
              {slide === SLIDES.FORM && (
                <motion.div
                  key="form"
                  custom={1}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                >
                  <div className="p-8">
                    <div className="text-center mb-8">
                      <h1 className="text-2xl font-semibold mb-2 text-primary">
                        {mode === 'login' ? 'Welcome back' : 'Create your account'}
                      </h1>
                      <p className="text-secondary text-[14px]">
                        {mode === 'login'
                          ? 'Enter your email to receive a verification code'
                          : 'Choose a username and enter your email'}
                      </p>
                    </div>

                    <form onSubmit={handleSendOtp} className="space-y-4">
                      <AnimatePresence mode="wait">
                        {mode === 'signup' && (
                          <motion.div
                            key="username-field"
                            initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                            animate={{ opacity: 1, height: 'auto', marginBottom: 16 }}
                            exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                            transition={{ duration: 0.25 }}
                          >
                            <label className="text-sm font-medium flex items-center gap-2 mb-1.5 text-primary">
                              <FiUser className="w-4 h-4 text-accent" />
                              Username
                            </label>
                            <input
                              type="text"
                              placeholder="Choose a username"
                              value={username}
                              onChange={(e) => setUsername(e.target.value)}
                              className="auth-input"
                              required={mode === 'signup'}
                              autoComplete="username"
                            />
                          </motion.div>
                        )}
                      </AnimatePresence>

                      <div>
                        <label className="text-sm font-medium flex items-center gap-2 mb-1.5 text-primary">
                          <FiMail className="w-4 h-4 text-accent" />
                          Email
                        </label>
                        <input
                          type="email"
                          placeholder="Enter your email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="auth-input"
                          required
                          autoComplete="email"
                        />
                      </div>

                      <motion.button
                        type="submit"
                        disabled={loading}
                        whileHover={{ scale: loading ? 1 : 1.01 }}
                        whileTap={{ scale: loading ? 1 : 0.99 }}
                        className="auth-button"
                      >
                        {loading ? (
                          <span className="flex items-center justify-center gap-2">
                            <div className="spinner !border-t-white"></div>
                            <span>Sending OTP...</span>
                          </span>
                        ) : (
                          <span className="flex items-center justify-center gap-2">
                            <span>Send Verification Code</span>
                            <FiArrowRight className="w-4 h-4" />
                          </span>
                        )}
                      </motion.button>
                    </form>

                    <div className="mt-6 text-center">
                      <p className="text-secondary text-[13px]">
                        {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
                        <button
                          onClick={() => switchMode(mode === 'login' ? 'signup' : 'login')}
                          className="font-medium hover:opacity-80 transition-opacity text-accent"
                        >
                          {mode === 'login' ? 'Sign Up' : 'Sign In'}
                        </button>
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Slide 2: OTP */}
              {slide === SLIDES.OTP && (
                <motion.div
                  key="otp"
                  custom={1}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                >
                  <div className="p-8">
                    <button
                      onClick={handleBack}
                      className="flex items-center gap-1 text-sm mb-6 hover:opacity-80 transition-opacity text-secondary"
                    >
                      <FiArrowLeft className="w-4 h-4" />
                      Back
                    </button>

                    <div className="text-center mb-8">
                      <div
                        className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 bg-gradient-to-br from-accent to-[#06CF9C]"
                      >
                        <FiShield className="w-8 h-8 text-white" />
                      </div>
                      <h2 className="text-2xl font-semibold mb-2 text-primary">
                        Verify your email
                      </h2>
                      <p className="text-secondary text-[14px]">
                        We've sent a 6-digit code to
                      </p>
                      <p className="font-medium mt-1 text-primary text-[14px]">
                        {email}
                      </p>
                    </div>

                    {/* OTP Input */}
                    <div className="flex justify-center gap-3 mb-6" onPaste={handleOtpPaste}>
                      {otp.map((digit, index) => (
                        <input
                          key={index}
                          ref={(el) => (otpRefs.current[index] = el)}
                          type="text"
                          inputMode="numeric"
                          maxLength={1}
                          value={digit}
                          onChange={(e) => handleOtpChange(index, e.target.value)}
                          onKeyDown={(e) => handleOtpKeyDown(index, e)}
                          className="otp-input"
                          autoFocus={index === 0}
                        />
                      ))}
                    </div>

                    {/* Timer & Resend */}
                    <div className="text-center mb-6">
                      {!canResend ? (
                        <p className="text-secondary text-[13px]">
                          Code expires in{' '}
                          <span className="font-semibold text-accent">
                            {formatTimer(timer)}
                          </span>
                        </p>
                      ) : (
                        <button
                          onClick={handleResend}
                          disabled={loading}
                          className="text-sm font-medium hover:opacity-80 transition-opacity text-accent"
                        >
                          {loading ? 'Sending...' : 'Resend Code'}
                        </button>
                      )}
                    </div>

                    <motion.button
                      onClick={() => handleVerifyOtp()}
                      disabled={loading || otp.join('').length !== OTP_LENGTH}
                      whileHover={{ scale: loading ? 1 : 1.01 }}
                      whileTap={{ scale: loading ? 1 : 0.99 }}
                      className="auth-button"
                    >
                      {loading ? (
                        <span className="flex items-center justify-center gap-2">
                          <div className="spinner !border-t-white"></div>
                          <span>Verifying...</span>
                        </span>
                      ) : (
                        <span className="flex items-center justify-center gap-2">
                          <span>Verify & Continue</span>
                          <FiArrowRight className="w-4 h-4" />
                        </span>
                      )}
                    </motion.button>
                  </div>
                </motion.div>
              )}

              {/* Slide 3: Success */}
              {slide === SLIDES.SUCCESS && (
                <motion.div
                  key="success"
                  custom={1}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                >
                  <div className="p-8 text-center">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}
                      className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 bg-gradient-to-br from-accent to-[#06CF9C]"
                    >
                      <FiCheck className="w-10 h-10 text-white" />
                    </motion.div>

                    <motion.h2
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                      className="text-2xl font-semibold mb-2 text-primary"
                    >
                      Welcome to Pingify!
                    </motion.h2>
                    <motion.p
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 }}
                      className="text-secondary text-[14px]"
                    >
                      Setting up your experience...
                    </motion.p>

                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.6 }}
                      className="mt-6"
                    >
                      <div className="spinner mx-auto !w-6 !h-6"></div>
                    </motion.div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Footer on mobile */}
          <p className="text-center mt-8 lg:hidden text-secondary/70 text-[12px]">
            © {new Date().getFullYear()} Pingify. Secure Messaging.
          </p>
        </div>
      </div>
    </div>
  );
}

export default AuthPage;
