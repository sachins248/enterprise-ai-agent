// Tools to change pages and to know which page we are on
import { useNavigate, useLocation } from 'react-router-dom';
// Lets us read the user and the logout function
import { useAuth } from '../context/AuthContext';

// The links shown in the sidebar
const LINKS = [
  // The chat page
  { path: '/chat',      icon: '◈', label: 'Chat' },
  // The history page
  { path: '/sessions',  icon: '◉', label: 'History' },
  // The analytics page
  { path: '/dashboard', icon: '◆', label: 'Analytics' },
];

// The sidebar on the left side of every logged-in page
export default function Sidebar() {
  // Get the current user and the logout function
  const { user, logout } = useAuth();
  // Lets us go to another page
  const navigate  = useNavigate();
  // Tells us which page we are on now
  const location  = useLocation();

  // Runs when the user clicks "Sign out"
  function handleLogout() {
    // Forget the token and the user
    logout();
    // Go back to the login page
    navigate('/login');
  }

  return (
    <aside
      // Adds a faint scan-line look (defined in index.css)
      className="scanlines"
      style={{
        // A fixed width for the sidebar
        width: '240px',
        // Never let it get narrower
        minWidth: '240px',
        // The sidebar color
        background: 'var(--surface)',
        // A line between the sidebar and the page
        borderRight: '1px solid var(--border)',
        // Stack the content from top to bottom
        display: 'flex',
        flexDirection: 'column',
        // Full screen height
        height: '100vh',
        // Hide anything that sticks out
        overflow: 'hidden',
      }}
    >
      {/* Logo */}
      {/* The logo area at the top */}
      <div style={{
        // Space inside the area
        padding: '28px 20px 22px',
        // A line below the logo area
        borderBottom: '1px solid var(--border)',
        // Keep it above the scan lines
        position: 'relative',
        zIndex: 1,
      }}>
        {/* The logo text */}
        <div style={{
          // The heading font
          fontFamily: 'Syne, sans-serif',
          // The text size
          fontSize: '15px',
          // Very bold text
          fontWeight: 800,
          // Space between letters
          letterSpacing: '0.18em',
          // The green accent color
          color: 'var(--accent)',
          // No extra line space
          lineHeight: 1,
        }}>
          {/* The braces make React show the < and > symbols as plain text */}
          {'<AGENT/>'}
        </div>
        {/* The small text under the logo */}
        <div style={{
          // The code-style font
          fontFamily: 'JetBrains Mono, monospace',
          // A tiny text size
          fontSize: '9px',
          // The faintest text color
          color: 'var(--text-3)',
          // Space above the text
          marginTop: '7px',
          // Very wide space between letters
          letterSpacing: '0.2em',
        }}>
          ENTERPRISE · AI · PLATFORM
        </div>
      </div>

      {/* New chat button */}
      {/* The area that holds the "New chat" button */}
      <div style={{ padding: '14px 14px 6px', position: 'relative', zIndex: 1 }}>
        <button
          // Go to the chat page when clicked
          onClick={() => navigate('/chat')}
          style={{
            // Fill the full width
            width: '100%',
            // Space inside the button
            padding: '9px 14px',
            // A faint green background
            background: 'var(--accent-glow)',
            // A faint green border
            border: '1px solid rgba(0,230,118,0.22)',
            // Rounded corners
            borderRadius: '8px',
            // Green text
            color: 'var(--accent)',
            // The text font
            fontFamily: 'Outfit, sans-serif',
            // The text size
            fontSize: '13px',
            // Medium weight
            fontWeight: 500,
            // A hand cursor
            cursor: 'pointer',
            // Put the plus sign and text side by side
            display: 'flex',
            alignItems: 'center',
            // Space between the plus sign and the text
            gap: '8px',
            // Make the colors change smoothly
            transition: 'background 0.15s, border-color 0.15s',
          }}
          // When the mouse enters: make the background and border stronger
          onMouseEnter={e => {
            e.currentTarget.style.background = 'rgba(0,230,118,0.18)';
            e.currentTarget.style.borderColor = 'rgba(0,230,118,0.38)';
          }}
          // When the mouse leaves: go back to the normal look
          onMouseLeave={e => {
            e.currentTarget.style.background = 'var(--accent-glow)';
            e.currentTarget.style.borderColor = 'rgba(0,230,118,0.22)';
          }}
        >
          {/* The plus sign */}
          <span style={{ fontSize: '17px', lineHeight: 1 }}>+</span>
          New chat
        </button>
      </div>

      {/* Nav */}
      {/* The navigation area (it takes all the free space in the middle) */}
      <nav style={{
        // Grow to fill the free space
        flex: 1,
        // Space inside the area
        padding: '8px 14px',
        // Stack the links from top to bottom
        display: 'flex',
        flexDirection: 'column',
        // A tiny space between links
        gap: '2px',
        // Keep it above the scan lines
        position: 'relative',
        zIndex: 1,
      }}>
        {/* The small title above the links */}
        <div style={{
          // The code-style font
          fontFamily: 'JetBrains Mono, monospace',
          // A tiny text size
          fontSize: '9px',
          // The faintest text color
          color: 'var(--text-3)',
          // Wide space between letters
          letterSpacing: '0.18em',
          // Space inside the title
          padding: '8px 8px 6px',
        }}>
          NAVIGATE
        </div>

        {/* Make one button for each link */}
        {LINKS.map(({ path, icon, label }) => {
          // True if this link is the page we are on now
          const active = location.pathname === path;
          return (
            <button
              // React needs a unique key for each item in a list
              key={path}
              // Go to the page when clicked
              onClick={() => navigate(path)}
              style={{
                // Fill the full width
                width: '100%',
                // Space inside the button
                padding: '10px 12px',
                // A faint green background if this is the current page
                background: active ? 'rgba(0,230,118,0.08)' : 'transparent',
                // A faint green border if this is the current page
                border: active ? '1px solid rgba(0,230,118,0.18)' : '1px solid transparent',
                // Rounded corners
                borderRadius: '8px',
                // Green text if this is the current page
                color: active ? 'var(--accent)' : 'var(--text-2)',
                // The text font
                fontFamily: 'Outfit, sans-serif',
                // The text size
                fontSize: '13px',
                // Bolder text if this is the current page
                fontWeight: active ? 600 : 400,
                // A hand cursor
                cursor: 'pointer',
                // Put the icon and text side by side
                display: 'flex',
                alignItems: 'center',
                // Space between the icon and the text
                gap: '10px',
                // Align the text to the left
                textAlign: 'left',
                // Make the colors change smoothly
                transition: 'all 0.15s',
              }}
              // When the mouse enters: highlight it (only if it is not the current page)
              onMouseEnter={e => {
                if (!active) {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
                  e.currentTarget.style.color = 'var(--text-1)';
                }
              }}
              // When the mouse leaves: go back to normal (only if it is not the current page)
              onMouseLeave={e => {
                if (!active) {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = 'var(--text-2)';
                }
              }}
            >
              {/* The icon (brighter when this is the current page) */}
              <span style={{ fontSize: '11px', opacity: active ? 1 : 0.55, width: '14px' }}>{icon}</span>
              {/* The link text */}
              {label}
              {/* Show a small glowing dot on the right only for the current page */}
              {active && (
                <span style={{
                  // Push the dot to the far right
                  marginLeft: 'auto',
                  // The size of the dot
                  width: '4px',
                  height: '4px',
                  // Make it a circle
                  borderRadius: '50%',
                  // The green accent color
                  background: 'var(--accent)',
                  // A soft glow around the dot
                  boxShadow: '0 0 6px var(--accent)',
                }} />
              )}
            </button>
          );
        })}
      </nav>

      {/* User section */}
      {/* The area at the bottom that shows who is logged in */}
      <div style={{
        // Space inside the area
        padding: '14px 14px 20px',
        // A line above this area
        borderTop: '1px solid var(--border)',
        // Keep it above the scan lines
        position: 'relative',
        zIndex: 1,
      }}>
        {/* A row with the avatar and the user's details */}
        <div style={{
          // Put the avatar and details side by side
          display: 'flex',
          alignItems: 'center',
          // Space between them
          gap: '10px',
          // Space below the row
          marginBottom: '10px',
        }}>
          {/* Avatar */}
          {/* A small square that shows the first letter of the email */}
          <div style={{
            // The size of the square
            width: '32px',
            height: '32px',
            // Rounded corners
            borderRadius: '8px',
            // A dark blue gradient background
            background: 'linear-gradient(135deg, #1a2a4a, #0f1f3a)',
            // A thin border
            border: '1px solid var(--border-hi)',
            // Center the letter both ways
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            // The heading font
            fontFamily: 'Syne, sans-serif',
            // Very bold text
            fontWeight: 800,
            // The text size
            fontSize: '13px',
            // The green accent color
            color: 'var(--accent)',
            // Don't let the square shrink
            flexShrink: 0,
          }}>
            {/* The first letter of the email in capitals, or "?" if there is no email */}
            {user?.email?.[0]?.toUpperCase() ?? '?'}
          </div>
          {/* The email and role, taking the rest of the row */}
          <div style={{ flex: 1, minWidth: 0 }}>
            {/* The user's email */}
            <div style={{
              // The text size
              fontSize: '12px',
              // The main text color
              color: 'var(--text-1)',
              // Cut long emails and show "..." at the end
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              // Medium weight
              fontWeight: 500,
            }}>
              {user?.email}
            </div>
            {/* The role, just below the email */}
            <div style={{ marginTop: '3px' }}>
              {/* Admins get a gold badge, everyone else gets plain text */}
              {user?.role === 'ADMIN' ? (
                // The gold ADMIN badge
                <span style={{
                  // A tiny text size
                  fontSize: '9px',
                  // The code-style font
                  fontFamily: 'JetBrains Mono, monospace',
                  // Space between letters
                  letterSpacing: '0.1em',
                  // Gold text
                  color: 'var(--gold)',
                  // A faint gold background
                  background: 'rgba(251,191,36,0.1)',
                  // A faint gold border
                  border: '1px solid rgba(251,191,36,0.22)',
                  // Space inside the badge
                  padding: '1px 5px',
                  // Slightly rounded corners
                  borderRadius: '3px',
                }}>
                  ADMIN
                </span>
              ) : (
                // The plain role text
                <span style={{
                  // A tiny text size
                  fontSize: '9px',
                  // The code-style font
                  fontFamily: 'JetBrains Mono, monospace',
                  // The faintest text color
                  color: 'var(--text-3)',
                  // Space between letters
                  letterSpacing: '0.08em',
                }}>
                  {user?.role}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* The sign out button */}
        <button
          // Log out when clicked
          onClick={handleLogout}
          style={{
            // Fill the full width
            width: '100%',
            // Space inside the button
            padding: '8px',
            // No background color
            background: 'transparent',
            // A thin border
            border: '1px solid var(--border)',
            // Rounded corners
            borderRadius: '6px',
            // A softer text color
            color: 'var(--text-2)',
            // The text size
            fontSize: '12px',
            // The text font
            fontFamily: 'Outfit, sans-serif',
            // A hand cursor
            cursor: 'pointer',
            // Make the colors change smoothly
            transition: 'all 0.15s',
          }}
          // When the mouse enters: turn red to warn that this leaves the app
          onMouseEnter={e => {
            e.currentTarget.style.borderColor = 'rgba(255,82,82,0.35)';
            e.currentTarget.style.color = '#ff5252';
            e.currentTarget.style.background = 'rgba(255,82,82,0.06)';
          }}
          // When the mouse leaves: go back to the normal look
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
