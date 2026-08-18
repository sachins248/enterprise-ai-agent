import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const LINKS = [
  { path: '/chat',      label: 'Chat' },
  { path: '/sessions',  label: 'History' },
  { path: '/dashboard', label: 'Dashboard' },
];

export default function NavBar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <header className="bg-gray-900 border-b border-gray-800 px-6 py-3 flex items-center gap-6">
      <span className="text-white font-bold text-sm mr-2">AI Agent</span>

      <nav className="flex gap-1 flex-1">
        {LINKS.map(link => (
          <button
            key={link.path}
            onClick={() => navigate(link.path)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors
              ${location.pathname === link.path
                ? 'bg-indigo-600 text-white'
                : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
          >
            {link.label}
          </button>
        ))}
      </nav>

      <div className="flex items-center gap-3">
        <span className="text-xs text-gray-500 hidden sm:block">{user?.email}</span>
        {user?.role === 'ADMIN' && (
          <span className="text-xs bg-amber-900 text-amber-300 px-2 py-0.5 rounded-full">
            Admin
          </span>
        )}
        <button
          onClick={handleLogout}
          className="text-xs text-gray-400 hover:text-white transition-colors"
        >
          Sign out
        </button>
      </div>
    </header>
  );
}
