import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { motion } from 'framer-motion';
import { fetchProfile, updateProfile } from '../../store/slices/userSlice.js';
import { getInitials } from '../../utils/helpers.js';
import toast from 'react-hot-toast';

function ProfilePage() {
  const dispatch = useDispatch();
  const { profile, loading } = useSelector((state) => state.user);
  const [formData, setFormData] = useState({ username: '', status: '' });
  const [avatar, setAvatar] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState('');

  useEffect(() => {
    dispatch(fetchProfile());
  }, [dispatch]);

  useEffect(() => {
    if (profile) {
      setFormData({ username: profile.username || '', status: profile.status || '' });
      setAvatarPreview(profile.avatar || '');
    }
  }, [profile]);

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatar(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await dispatch(updateProfile({ data: formData, avatar })).unwrap();
      toast.success('Profile updated successfully!');
    } catch (error) {
      toast.error(error || 'Failed to update profile');
    }
  };

  return (
    <div className="h-full overflow-y-auto p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass p-8 max-w-2xl mx-auto"
      >
        <h1 className="text-3xl font-bold text-white mb-6">Profile</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex flex-col items-center mb-6">
            <div className="w-32 h-32 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-4xl font-semibold mb-4 overflow-hidden">
              {avatarPreview ? (
                <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                getInitials(formData.username || 'U')
              )}
            </div>
            <label className="glass-button cursor-pointer">
              Change Avatar
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
              />
            </label>
          </div>

          <div>
            <label className="text-white/80 mb-2 block">Username</label>
            <input
              type="text"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              className="glass-input w-full"
              required
            />
          </div>

          <div>
            <label className="text-white/80 mb-2 block">Status</label>
            <input
              type="text"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="glass-input w-full"
              maxLength={100}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="glass-button w-full"
          >
            {loading ? 'Updating...' : 'Update Profile'}
          </button>
        </form>
      </motion.div>
    </div>
  );
}

export default ProfilePage;

