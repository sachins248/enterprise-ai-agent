// Tools to change pages and to know which page we are on
import { useNavigate, useLocation } from 'react-router-dom';
// Lets us read the user and the logout function
import { useAuth } from '../context/AuthContext';

// The links shown in the top bar
const LINKS = [
  // The chat page
  { path: '/chat',      label: 'Chat' },
  // The history page
  { path: '/sessions',  label: 'History' },
  // The dashboard page
  { path: '/dashboard', label: 'Dashboard' },
];

// The top navigation bar
export default function NavBar() {
  // Get the current user and the logout function
  const { user, logout } = useAuth();
  // Lets us go to another page
  const navigate = useNavigate();
  // Tells us which page we are on now
  const location = useLocation();

  // Runs when the user clicks "Sign out"
  function handleLogout() {
    // Forget the token and the user
    logout();
    // Go back to the login page
    navigate('/login');
  }

  return (
    // The bar itself: dark background, a line at the bottom, items in a row
    <header className="bg-gray-900 border-b border-gray-800 px-6 py-3 flex items-center gap-6">
      {/* The app name */}
      <span className="text-white font-bold text-sm mr-2">AI Agent</span>

      {/* The page links */}
      <nav className="flex gap-1 flex-1">
        {/* Make one button for each link */}
        {LINKS.map(link => (
          <button
            // React needs a unique key for each item in a list
            key={link.path}
            // Go to the page when clicked
            onClick={() => navigate(link.path)}
            // Highlight the button if it is the current page
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors
              ${location.pathname === link.path
                ? 'bg-indigo-600 text-white'
                : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
          >
            {/* The button text */}
            {link.label}
          </button>
        ))}
      </nav>

      {/* The user info on the right */}
      <div className="flex items-center gap-3">
        {/* The user's email (hidden on very small screens) */}
        <span className="text-xs text-gray-500 hidden sm:block">{user?.email}</span>
        {/* Show an "Admin" badge only for admins */}
        {user?.role === 'ADMIN' && (
          <span className="text-xs bg-amber-900 text-amber-300 px-2 py-0.5 rounded-full">
            Admin
          </span>
        )}
        {/* The sign out button */}
        <button
          // Log out when clicked
          onClick={handleLogout}
          className="text-xs text-gray-400 hover:text-white transition-colors"
        >
          Sign out
        </button>
      </div>
    </header>
  );
}
