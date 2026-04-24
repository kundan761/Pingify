import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { motion } from 'framer-motion';
import { FiUser, FiEdit2, FiCamera, FiSave, FiX } from 'react-icons/fi';
import { fetchProfile, updateProfile } from '../../store/slices/userSlice.js';
import { updateUser } from '../../store/slices/authSlice.js';
import { getInitials } from '../../utils/helpers.js';
import toast from 'react-hot-toast';

function ProfilePage() {
  const dispatch = useDispatch();
  const { profile, loading } = useSelector((state) => state.user);
  const [formData, setFormData] = useState({ username: '', status: '' });
  const [avatar, setAvatar] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState('');
  const [isEditing, setIsEditing] = useState(false);

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
      const updatedProfile = await dispatch(updateProfile({ data: formData, avatar })).unwrap();
      dispatch(updateUser({
        username: updatedProfile.username,
        avatar: updatedProfile.avatar,
        status: updatedProfile.status,
      }));
      setIsEditing(false);
      toast.success('Profile updated successfully!');
    } catch (error) {
      toast.error(error || 'Failed to update profile');
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

          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg" style={{ backgroundColor: 'rgba(0, 168, 132, 0.1)' }}>
                <FiUser className="w-6 h-6 text-accent" />
              </div>
              <h1 className="text-2xl font-medium text-primary">Profile</h1>
            </div>
            {!isEditing && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsEditing(true)}
                className="btn-secondary flex items-center gap-2"
              >
                <FiEdit2 className="w-4 h-4" />
                Edit
              </motion.button>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">

            <div className="flex flex-col items-center">
              <div className="relative group">
                <div className="avatar-xl text-white">
                  {avatarPreview ? (
                    <img
                      src={avatarPreview}
                      alt="Avatar"
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    getInitials(formData.username || 'U')
                  )}
                </div>
                {isEditing && (
                  <label className="absolute bottom-0 right-0 p-3 rounded-full bg-accent cursor-pointer shadow-lg hover:bg-[#06CF9C] transition-colors">
                    <FiCamera className="w-5 h-5 text-white" />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
              {isEditing && (
                <p className="text-secondary text-sm mt-4 text-center">
                  Click the camera icon to change your avatar
                </p>
              )}
            </div>

            <div className="divider"></div>


            <div className="space-y-6">
              <div>
                <label className="text-primary text-sm font-medium mb-2 flex items-center gap-2">
                  <FiUser className="w-4 h-4" />
                  Username
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className="input"
                    required
                  />
                ) : (
                  <div className="card p-4 rounded-lg">
                    <p className="text-primary">{formData.username || 'Not set'}</p>
                  </div>
                )}
              </div>

              <div>
                <label className="text-primary text-sm font-medium mb-2 flex items-center gap-2">
                  <FiEdit2 className="w-4 h-4" />
                  Status
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    placeholder="What's on your mind?"
                    className="input"
                    maxLength={100}
                  />
                ) : (
                  <div className="card p-4 rounded-lg">
                    <p className="text-primary">{formData.status || 'No status set'}</p>
                  </div>
                )}
              </div>
            </div>


            {isEditing && (
              <div className="flex gap-3 pt-4">
                <motion.button
                  type="submit"
                  disabled={loading}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="btn-primary flex-1 flex items-center justify-center gap-2"
                >
                  <FiSave className="w-4 h-4" />
                  {loading ? 'Saving...' : 'Save Changes'}
                </motion.button>
                <motion.button
                  type="button"
                  onClick={() => {
                    setIsEditing(false);
                    if (profile) {
                      setFormData({ username: profile.username || '', status: profile.status || '' });
                      setAvatarPreview(profile.avatar || '');
                      setAvatar(null);
                    }
                  }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="btn-secondary flex-1 flex items-center justify-center gap-2"
                >
                  <FiX className="w-4 h-4" />
                  Cancel
                </motion.button>
              </div>
            )}
          </form>
        </div>
      </motion.div>
    </div>
  );
}

export default ProfilePage;
