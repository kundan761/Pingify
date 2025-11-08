import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { motion } from 'framer-motion';
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
    <div className="h-full overflow-y-auto p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass p-8 max-w-2xl mx-auto"
      >
        <h1 className="text-3xl font-bold text-white mb-6">Settings</h1>

        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold text-white mb-4">Privacy</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white font-medium">Show Last Seen</p>
                  <p className="text-white/60 text-sm">Allow others to see when you were last active</p>
                </div>
                <button
                  onClick={() => handlePrivacyChange('showLastSeen', !privacy.showLastSeen)}
                  className={`w-14 h-8 rounded-full transition-colors ${
                    privacy.showLastSeen ? 'bg-indigo-500' : 'bg-white/20'
                  }`}
                >
                  <div
                    className={`w-6 h-6 bg-white rounded-full transition-transform ${
                      privacy.showLastSeen ? 'translate-x-7' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white font-medium">Show Online Status</p>
                  <p className="text-white/60 text-sm">Allow others to see when you're online</p>
                </div>
                <button
                  onClick={() => handlePrivacyChange('showOnlineStatus', !privacy.showOnlineStatus)}
                  className={`w-14 h-8 rounded-full transition-colors ${
                    privacy.showOnlineStatus ? 'bg-indigo-500' : 'bg-white/20'
                  }`}
                >
                  <div
                    className={`w-6 h-6 bg-white rounded-full transition-transform ${
                      privacy.showOnlineStatus ? 'translate-x-7' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default SettingsPage;

