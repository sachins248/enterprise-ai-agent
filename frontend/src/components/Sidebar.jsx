import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const LINKS = [
  { path: '/chat',      icon: '◈', label: 'Chat' },
  { path: '/sessions',  icon: '◉', label: 'History' },
  { path: '/dashboard', icon: '◆', label: 'Analytics' },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate  = useNavigate();
  const location  = useLocation();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <aside
      className="scanlines"
      style={{
        width: '240px',
        minWidth: '240px',
        background: 'var(--surface)',
        borderRight: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        overflow: 'hidden',
      }}
    >
      {/* Logo */}
      <div style={{
        padding: '28px 20px 22px',
        borderBottom: '1px solid var(--border)',
        position: 'relative',
        zIndex: 1,
      }}>
        <div style={{
          fontFamily: 'Syne, sans-serif',
          fontSize: '15px',
          fontWeight: 800,
          letterSpacing: '0.18em',
          color: 'var(--accent)',
          lineHeight: 1,
        }}>
          {'<AGENT/>'}
        </div>
        <div style={{
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: '9px',
          color: 'var(--text-3)',
          marginTop: '7px',
          letterSpacing: '0.2em',
        }}>
          ENTERPRISE · AI · PLATFORM
        </div>
      </div>

      {/* New chat button */}
      <div style={{ padding: '14px 14px 6px', position: 'relative', zIndex: 1 }}>
        <button
          onClick={() => navigate('/chat')}
          style={{
            width: '100%',
            padding: '9px 14px',
            background: 'var(--accent-glow)',
            border: '1px solid rgba(0,230,118,0.22)',
            borderRadius: '8px',
            color: 'var(--accent)',
            fontFamily: 'Outfit, sans-serif',
            fontSize: '13px',
            fontWeight: 500,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'background 0.15s, border-color 0.15s',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = 'rgba(0,230,118,0.18)';
            e.currentTarget.style.borderColor = 'rgba(0,230,118,0.38)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'var(--accent-glow)';
            e.currentTarget.style.borderColor = 'rgba(0,230,118,0.22)';
          }}
        >
          <span style={{ fontSize: '17px', lineHeight: 1 }}>+</span>
          New chat
        </button>
      </div>

      {/* Nav */}
      <nav style={{
        flex: 1,
        padding: '8px 14px',
        display: 'flex',
        flexDirection: 'column',
        gap: '2px',
        position: 'relative',
        zIndex: 1,
      }}>
        <div style={{
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: '9px',
          color: 'var(--text-3)',
          letterSpacing: '0.18em',
          padding: '8px 8px 6px',
        }}>
          NAVIGATE
        </div>

        {LINKS.map(({ path, icon, label }) => {
          const active = location.pathname === path;
          return (
            <button
              key={path}
              onClick={() => navigate(path)}
              style={{
                width: '100%',
                padding: '10px 12px',
                background: active ? 'rgba(0,230,118,0.08)' : 'transparent',
                border: active ? '1px solid rgba(0,230,118,0.18)' : '1px solid transparent',
                borderRadius: '8px',
                color: active ? 'var(--accent)' : 'var(--text-2)',
                fontFamily: 'Outfit, sans-serif',
                fontSize: '13px',
                fontWeight: active ? 600 : 400,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                textAlign: 'left',
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => {
                if (!active) {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
                  e.currentTarget.style.color = 'var(--text-1)';
                }
              }}
              onMouseLeave={e => {
                if (!active) {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = 'var(--text-2)';
                }
              }}
            >
              <span style={{ fontSize: '11px', opacity: active ? 1 : 0.55, width: '14px' }}>{icon}</span>
              {label}
              {active && (
                <span style={{
                  marginLeft: 'auto',
                  width: '4px',
                  height: '4px',
                  borderRadius: '50%',
                  background: 'var(--accent)',
                  boxShadow: '0 0 6px var(--accent)',
                }} />
              )}
            </button>
          );
        })}
      </nav>

      {/* User section */}
      <div style={{
        padding: '14px 14px 20px',
        borderTop: '1px solid var(--border)',
        position: 'relative',
        zIndex: 1,
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          marginBottom: '10px',
        }}>
          {/* Avatar */}
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            background: 'linear-gradient(135deg, #1a2a4a, #0f1f3a)',
            border: '1px solid var(--border-hi)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'Syne, sans-serif',
            fontWeight: 800,
            fontSize: '13px',
            color: 'var(--accent)',
            flexShrink: 0,
          }}>
            {user?.email?.[0]?.toUpperCase() ?? '?'}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: '12px',
              color: 'var(--text-1)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              fontWeight: 500,
            }}>
              {user?.email}
            </div>
            <div style={{ marginTop: '3px' }}>
              {user?.role === 'ADMIN' ? (
                <span style={{
                  fontSize: '9px',
                  fontFamily: 'JetBrains Mono, monospace',
                  letterSpacing: '0.1em',
                  color: 'var(--gold)',
                  background: 'rgba(251,191,36,0.1)',
                  border: '1px solid rgba(251,191,36,0.22)',
                  padding: '1px 5px',
                  borderRadius: '3px',
                }}>
                  ADMIN
                </span>
              ) : (
                <span style={{
                  fontSize: '9px',
                  fontFamily: 'JetBrains Mono, monospace',
                  color: 'var(--text-3)',
                  letterSpacing: '0.08em',
                }}>
                  {user?.role}
                </span>
              )}
            </div>
          </div>
        </div>

        <button
          onClick={handleLogout}
          style={{
            width: '100%',
            padding: '8px',
            background: 'transparent',
            border: '1px solid var(--border)',
            borderRadius: '6px',
            color: 'var(--text-2)',
            fontSize: '12px',
            fontFamily: 'Outfit, sans-serif',
            cursor: 'pointer',
            transition: 'all 0.15s',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.borderColor = 'rgba(255,82,82,0.35)';
            e.currentTarget.style.color = '#ff5252';
            e.currentTarget.style.background = 'rgba(255,82,82,0.06)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.borderColor = 'var(--border)';
            e.currentTarget.style.color = 'var(--text-2)';
            e.currentTarget.style.background = 'transparent';
          }}
        >
          Sign out
        </button>
      </div>
    </aside>
  );
}
