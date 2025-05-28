import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export default function Navbar() {
  const navigate = useNavigate();
  const { user, signOut } = useAuthStore();

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <nav className="bg-gray-900/50 backdrop-blur-sm border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
                Video Editor
              </span>
            </Link>
          </div>

          <div className="flex items-center space-x-4">
            {user ? (
              <>
                <Link
                  to="/"
                  className="text-gray-300 hover:text-white transition-colors duration-300"
                >
                  New Video
                </Link>
                <Link
                  to="/history"
                  className="text-gray-300 hover:text-white transition-colors duration-300"
                >
                  History
                </Link>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-400">
                    {user.email}
                  </span>
                  <button
                    onClick={handleSignOut}
                    className="bg-red-500/20 hover:bg-red-500/30 text-red-400 px-3 py-1 rounded-lg transition-colors duration-300"
                  >
                    Sign Out
                  </button>
                </div>
              </>
            ) : (
              <Link
                to="/login"
                className="bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 px-4 py-2 rounded-lg transition-colors duration-300"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
} 