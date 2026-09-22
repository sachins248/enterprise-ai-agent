// Tools to change pages and to know which page we are on
import { useNavigate, useLocation } from 'react-router-dom';
// Lets us read the user and the logout function
import { useAuth } from '../context/AuthContext';
import Icon from './ui/Icon';
import Button from './ui/Button';
import Avatar from './ui/Avatar';
import Badge from './ui/Badge';
import ThemeToggle from './ui/ThemeToggle';

// The links shown in the sidebar
const LINKS = [
  { path: '/chat',      icon: 'chat',      label: 'Chat' },
  { path: '/sessions',  icon: 'history',   label: 'History' },
  { path: '/dashboard', icon: 'dashboard', label: 'Analytics' },
];

// The sidebar on the left side of every logged-in page
export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <aside className="w-[240px] min-w-[240px] h-screen overflow-hidden bg-surface border-r border-hairline
      flex flex-col">

      {/* Logo */}
      <div className="px-5 pt-7 pb-5 border-b border-hairline">
        <div className="flex items-baseline gap-0.5 leading-none">
          <span className="font-mono font-semibold text-accent">&lt;</span>
          <span className="font-display font-extrabold text-[15px] text-ink tracking-tight">AGENT</span>
          <span className="font-mono font-semibold text-accent">/&gt;</span>
        </div>
        <div className="mt-2 font-mono text-[9px] text-ink-3 tracking-wide2">
          ENTERPRISE · AI · PLATFORM
        </div>
      </div>

      {/* New chat button */}
      <div className="px-3.5 pt-3.5 pb-1.5">
        <Button variant="secondary" icon="new-chat" size="sm" className="w-full" onClick={() => navigate('/chat')}>
          New chat
        </Button>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3.5 py-2 flex flex-col gap-0.5">
        <div className="font-mono text-[9px] text-ink-3 tracking-wide2 px-2 pt-2 pb-1.5">
          NAVIGATE
        </div>

        {LINKS.map(({ path, icon, label }) => {
          const active = location.pathname === path;
          return (
            <button
              key={path}
              onClick={() => navigate(path)}
              className={`w-full flex items-center gap-2.5 px-2.5 py-2.5 text-left text-[13px]
                border-l-2 transition-colors duration-150
                ${active
                  ? 'border-l-accent text-accent bg-card font-medium'
                  : 'border-l-transparent text-ink-2 hover:text-ink hover:border-l-hairline-hi'}`}
            >
              <Icon name={icon} size={16} />
              {label}
            </button>
          );
        })}
      </nav>

      {/* User section */}
      <div className="px-3.5 pt-3.5 pb-5 border-t border-hairline">
        <div className="flex items-center gap-2.5 mb-3">
          <Avatar initial={user?.email?.[0]} kind="user" size={32} />
          <div className="flex-1 min-w-0">
            <div className="text-[12px] text-ink font-medium truncate">{user?.email}</div>
            <div className="mt-0.5">
              {user?.role === 'ADMIN' ? (
                <Badge tone="admin">ADMIN</Badge>
              ) : (
                <span className="font-mono text-[9px] text-ink-3 tracking-micro">{user?.role}</span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="danger" size="sm" icon="sign-out" className="flex-1" onClick={handleLogout}>
            Sign out
          </Button>
          <ThemeToggle />
        </div>
      </div>
    </aside>
  );
}
