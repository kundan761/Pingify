import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { motion } from 'framer-motion';
import { FiSettings, FiEye, FiEyeOff, FiShield } from 'react-icons/fi';
import { fetchProfile, updateProfile } from '../../store/slices/userSlice.js';
import toast from 'react-hot-toast';

function SettingsPage() {
  const dispatch = useDispatch();
  const { profile } = useSelector((state) => state.user);
  const [privacy, setPrivacy] = useState({
    showLastSeen: true,
    showOnlineStatus: true,
  });

  useEffect(() => {
    dispatch(fetchProfile());
  }, [dispatch]);

  useEffect(() => {
    if (profile?.privacy) {
      setPrivacy(profile.privacy);
    }
  }, [profile]);

  const handlePrivacyChange = async (key, value) => {
    const newPrivacy = { ...privacy, [key]: value };
    setPrivacy(newPrivacy);
    try {
      await dispatch(updateProfile({ data: { privacy: newPrivacy } })).unwrap();
      toast.success('Privacy settings updated');
    } catch (error) {
      toast.error('Failed to update privacy settings');
    }
  };

  return (
    <div className="h-full overflow-y-auto p-8 app-bg">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl mx-auto"
      >
        <div className="card p-8 rounded-lg">

          <div className="flex items-center gap-3 mb-8">
            <div className="p-3 rounded-lg" style={{ backgroundColor: 'rgba(0, 168, 132, 0.1)' }}>
              <FiSettings className="w-6 h-6 text-accent" />
            </div>
            <h1 className="text-2xl font-medium text-primary">Settings</h1>
          </div>


          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-6">
              <FiShield className="w-5 h-5 text-accent" />
              <h2 className="text-xl font-medium text-primary">Privacy</h2>
            </div>

            <div className="space-y-4">

              <motion.div
                whileHover={{ backgroundColor: '#F5F5F5' }}
                className="card p-6 rounded-lg"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      {privacy.showLastSeen ? (
                        <FiEye className="w-5 h-5 text-accent" />
                      ) : (
                        <FiEyeOff className="w-5 h-5 text-secondary" />
                      )}
                      <p className="text-primary font-medium text-base">Show Last Seen</p>
                    </div>
                    <p className="text-secondary text-sm ml-8">
                      Allow others to see when you were last active
                    </p>
                  </div>
                  <motion.button
                    onClick={() => handlePrivacyChange('showLastSeen', !privacy.showLastSeen)}
                    whileTap={{ scale: 0.95 }}
                    className={`relative w-14 h-8 rounded-full transition-colors duration-300 ${
                      privacy.showLastSeen
                        ? 'bg-accent'
                        : 'bg-gray-300'
                    }`}
                  >
                    <motion.div
                      layout
                      className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow-lg ${
                        privacy.showLastSeen ? 'left-7' : 'left-1'
                      }`}
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    />
                  </motion.button>
                </div>
              </motion.div>


              <motion.div
                whileHover={{ backgroundColor: '#F5F5F5' }}
                className="card p-6 rounded-lg"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      {privacy.showOnlineStatus ? (
                        <FiEye className="w-5 h-5 text-accent" />
                      ) : (
                        <FiEyeOff className="w-5 h-5 text-secondary" />
                      )}
                      <p className="text-primary font-medium text-base">Show Online Status</p>
                    </div>
                    <p className="text-secondary text-sm ml-8">
                      Allow others to see when you're online
                    </p>
                  </div>
                  <motion.button
                    onClick={() => handlePrivacyChange('showOnlineStatus', !privacy.showOnlineStatus)}
                    whileTap={{ scale: 0.95 }}
                    className={`relative w-14 h-8 rounded-full transition-colors duration-300 ${
                      privacy.showOnlineStatus
                        ? 'bg-accent'
                        : 'bg-gray-300'
                    }`}
                  >
                    <motion.div
                      layout
                      className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow-lg ${
                        privacy.showOnlineStatus ? 'left-7' : 'left-1'
                      }`}
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    />
                  </motion.button>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default SettingsPage;
