import { Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../../store/slices/authSlice.js';
import { selectAuth } from '../../store/slices/authSlice.js';
import { getInitials } from '../../utils/helpers.js';

function Navbar() {
  const dispatch = useDispatch();
  const { user } = useSelector(selectAuth);

  const handleLogout = () => {
    dispatch(logout());
  };

  return (
    <nav className="glass-dark p-4 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <h1 className="text-2xl font-bold text-white">Pingify</h1>
      </div>

      <div className="flex items-center gap-4">
        <Link to="/profile" className="text-white/80 hover:text-white transition-colors">
          Profile
        </Link>
        <Link to="/settings" className="text-white/80 hover:text-white transition-colors">
          Settings
        </Link>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-semibold">
            {user?.avatar ? (
              <img src={user.avatar} alt={user.username} className="w-full h-full rounded-full object-cover" />
            ) : (
              getInitials(user?.username || 'U')
            )}
          </div>
          <button
            onClick={handleLogout}
            className="glass-button text-sm"
          >
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;

