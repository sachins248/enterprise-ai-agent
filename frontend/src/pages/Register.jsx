// useState lets the page remember values (like what the user typed)
import { useState } from 'react';
// Lets us go to another page
import { useNavigate } from 'react-router-dom';
// Lets us save the login info after a successful register
import { useAuth } from '../context/AuthContext';
// Our helper for sending requests to the server
import { apiFetch } from '../api/client';

// The style used by all inputs, written once so they match
const inputStyle = {
  // Fill the full width of the form
  width: '100%',
  // Space inside the box (top/bottom 12px, left/right 16px)
  padding: '12px 16px',
  // The box color
  background: 'var(--surface)',
  // A thin border
  border: '1px solid var(--border)',
  // Rounded corners
  borderRadius: '10px',
  // The text color
  color: 'var(--text-1)',
  // The text size
  fontSize: '14px',
  // The text font
  fontFamily: 'Outfit, sans-serif',
  // Remove the browser's default outline (we add our own glow on focus)
  outline: 'none',
  // Make the border and glow change smoothly
  transition: 'border-color 0.15s, box-shadow 0.15s',
};

// The register page
export default function Register() {
  // The login function that saves the token
  const { login }   = useAuth();
  // Lets us go to another page
  const navigate    = useNavigate();
  // What the user typed in the email box
  const [email, setEmail]       = useState('');
  // What the user typed in the password box
  const [password, setPassword] = useState('');
  // The role the user picked (DEVELOPER by default)
  const [role, setRole]         = useState('DEVELOPER');
  // The error message to show (empty means no error)
  const [error, setError]       = useState('');
  // True while we wait for the server
  const [loading, setLoading]   = useState(false);

  // Runs when the user submits the form
  async function handleSubmit(e) {
    // Stop the browser from reloading the page
    e.preventDefault();
    // Clear any old error
    setError('');
    // Show the loading state
    setLoading(true);
    // The request can fail, so we use try
    try {
      // Send the email, password and role to the server
      const res  = await apiFetch('/auth/register', { method: 'POST', body: { email, password, role } });
      // Read the answer as JSON
      const data = await res.json();
      // Save the token so the rest of the app knows we are logged in
      login(data.accessToken);
      // Go to the chat page
      navigate('/chat');
    } catch (err) {
      // Show the error message (or a simple default)
      setError(err.message || 'Registration failed');
    } finally {
      // Whether it worked or not, stop the loading state
      setLoading(false);
    }
  }

  return (
    // The whole page: two columns of equal width
    <div style={{
      // At least as tall as the screen
      minHeight: '100vh',
      // Use a grid layout
      display: 'grid',
      // Two equal columns
      gridTemplateColumns: '1fr 1fr',
      // The page font
      fontFamily: 'Outfit, sans-serif',
    }}>
      {/* ── Left panel: brand ──────────────────────── */}
      <div
        // Adds a dotted background pattern (defined in index.css)
        className="dot-grid"
        style={{
          // The panel color
          background: 'var(--surface)',
          // Space inside the panel
          padding: '56px',
          // Stack the content from top to bottom
          display: 'flex',
          flexDirection: 'column',
          // Spread the content: logo at top, text in the middle, footer at the bottom
          justifyContent: 'space-between',
          // Lets the glow circle be placed inside this panel
          position: 'relative',
          // Hide anything that sticks out of the panel
          overflow: 'hidden',
          // A line between the two panels
          borderRight: '1px solid var(--border)',
        }}
      >
        {/* A soft green glow in the top-right corner (just decoration) */}
        <div style={{
          // Place it freely inside the panel
          position: 'absolute',
          // Push it partly outside the top-right corner
          top: '-100px',
          right: '-100px',
          // The size of the glow
          width: '420px',
          height: '420px',
          // A green circle that fades out to nothing
          background: 'radial-gradient(circle, rgba(0,230,118,0.07) 0%, transparent 68%)',
          // Let clicks pass through it
          pointerEvents: 'none',
        }} />

        {/* Keep the logo above the glow */}
        <div style={{ position: 'relative', zIndex: 1 }}>
          {/* The logo text */}
          <div style={{
            // The heading font
            fontFamily: 'Syne, sans-serif',
            // The text size
            fontSize: '13px',
            // Very bold text
            fontWeight: 800,
            // Space between letters
            letterSpacing: '0.22em',
            // The green accent color
            color: 'var(--accent)',
          }}>
            {/* The braces make React show the < and > symbols as plain text */}
            {'<AGENT/>'}
          </div>
        </div>

        {/* Keep this block above the glow */}
        <div style={{ position: 'relative', zIndex: 1 }}>
          {/* The big title */}
          <h1 style={{
            // The heading font
            fontFamily: 'Syne, sans-serif',
            // A very large size
            fontSize: '52px',
            // Very bold text
            fontWeight: 800,
            // Tight space between lines
            lineHeight: 1.05,
            // The main text color
            color: 'var(--text-1)',
            // Space below the title
            marginBottom: '22px',
            // Pull the letters slightly closer together
            letterSpacing: '-0.02em',
          }}>
            Join the<br />
            {/* Show "future" in the accent color */}
            <span style={{ color: 'var(--accent)' }}>future</span><br />
            of code.
          </h1>
          {/* The short description under the title */}
          <p style={{
            // The text size
            fontSize: '15px',
            // A softer text color
            color: 'var(--text-2)',
            // Comfortable space between lines
            lineHeight: 1.75,
            // Keep the lines from getting too long
            maxWidth: '340px',
          }}>
            Create your account and start chatting with your AI coding agent.
            Roles control what you can see and do across the platform.
          </p>

          {/* A row of three small cards that explain the roles */}
          <div style={{
            // Space above the cards
            marginTop: '40px',
            // Use a grid layout
            display: 'grid',
            // Three equal columns
            gridTemplateColumns: 'repeat(3, 1fr)',
            // Space between the cards
            gap: '12px',
          }}>
            {/* Make one card for each role */}
            {['ADMIN', 'DEVELOPER', 'VIEWER'].map(r => (
              // One card
              <div key={r} style={{
                // A faint green background
                background: 'rgba(0,230,118,0.06)',
                // A faint green border
                border: '1px solid rgba(0,230,118,0.14)',
                // Rounded corners
                borderRadius: '10px',
                // Space inside the card
                padding: '14px 12px',
                // Center the text
                textAlign: 'center',
              }}>
                {/* The role name */}
                <div style={{
                  // The code-style font
                  fontFamily: 'JetBrains Mono, monospace',
                  // A tiny text size
                  fontSize: '9px',
                  // Space between letters
                  letterSpacing: '0.12em',
                  // The green accent color
                  color: 'var(--accent)',
                  // Space below the role name
                  marginBottom: '6px',
                }}>
                  {r}
                </div>
                {/* A short description of what the role can do */}
                <div style={{ fontSize: '11px', color: 'var(--text-2)', lineHeight: 1.5 }}>
                  {/* Only one of these three lines shows, depending on the role */}
                  {r === 'ADMIN' && 'Full access\nall teams'}
                  {r === 'DEVELOPER' && 'Chat +\nanalytics'}
                  {r === 'VIEWER' && 'Read-only\naccess'}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* The small text at the bottom of the panel */}
        <div style={{
          // Keep it above the glow
          position: 'relative',
          zIndex: 1,
          // The code-style font
          fontFamily: 'JetBrains Mono, monospace',
          // A very small size
          fontSize: '10px',
          // The faintest text color
          color: 'var(--text-3)',
          // Wide space between letters
          letterSpacing: '0.15em',
        }}>
          POWERED BY GEMINI · SPRING BOOT · REACT
        </div>
      </div>

      {/* ── Right panel: form ──────────────────────── */}
      {/* The right column that holds the form */}
      <div style={{
        // The page background color
        background: 'var(--bg)',
        // Center the form both ways
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        // Space around the form
        padding: '56px',
      }}>
        {/* The form area: full width but never wider than 380px */}
        <div style={{ width: '100%', maxWidth: '380px' }}>
          {/* The form title */}
          <h2 style={{
            // The heading font
            fontFamily: 'Syne, sans-serif',
            // The text size
            fontSize: '30px',
            // Bold text
            fontWeight: 700,
            // The main text color
            color: 'var(--text-1)',
            // Space below the title
            marginBottom: '8px',
          }}>
            Create account
          </h2>
          {/* The short line under the title */}
          <p style={{ fontSize: '14px', color: 'var(--text-2)', marginBottom: '40px' }}>
            Join the Enterprise AI Agent platform
          </p>

          {/* The register form: submitting it runs handleSubmit */}
          <form onSubmit={handleSubmit}>
            {/* The label above the email box */}
            <FieldLabel label="Email" />
            <input
              // The browser checks that this looks like an email
              type="email"
              // Show what is in our email state
              value={email}
              // Update the state every time the user types
              onChange={e => setEmail(e.target.value)}
              // The form can't be sent while this is empty
              required
              // The gray hint text
              placeholder="you@company.com"
              // Use the shared input style, and add space below
              style={{ ...inputStyle, marginBottom: '20px' }}
              // When the box is clicked: show a green border and glow
              onFocus={e => { e.target.style.borderColor = 'rgba(0,230,118,0.45)'; e.target.style.boxShadow = '0 0 0 3px rgba(0,230,118,0.07)'; }}
              // When the box is left: go back to the normal border and remove the glow
              onBlur={e =>  { e.target.style.borderColor = 'var(--border)'; e.target.style.boxShadow = 'none'; }}
            />

            {/* The label above the password box */}
            <FieldLabel label="Password" />
            <input
              // Hide the characters as the user types
              type="password"
              // Show what is in our password state
              value={password}
              // Update the state every time the user types
              onChange={e => setPassword(e.target.value)}
              // The form can't be sent while this is empty
              required
              // The gray hint text (dots)
              placeholder="••••••••"
              // Use the shared input style, and add space below
              style={{ ...inputStyle, marginBottom: '20px' }}
              // When the box is clicked: show a green border and glow
              onFocus={e => { e.target.style.borderColor = 'rgba(0,230,118,0.45)'; e.target.style.boxShadow = '0 0 0 3px rgba(0,230,118,0.07)'; }}
              // When the box is left: go back to the normal border and remove the glow
              onBlur={e =>  { e.target.style.borderColor = 'var(--border)'; e.target.style.boxShadow = 'none'; }}
            />

            {/* The label above the role dropdown */}
            <FieldLabel label="Role" />
            <select
              // Show what is in our role state
              value={role}
              // Update the state when the user picks a role
              onChange={e => setRole(e.target.value)}
              // Use the shared input style, with a hand cursor
              style={{ ...inputStyle, marginBottom: '28px', cursor: 'pointer' }}
              // When the box is clicked: show a green border and glow
              onFocus={e => { e.target.style.borderColor = 'rgba(0,230,118,0.45)'; e.target.style.boxShadow = '0 0 0 3px rgba(0,230,118,0.07)'; }}
              // When the box is left: go back to the normal border and remove the glow
              onBlur={e =>  { e.target.style.borderColor = 'var(--border)'; e.target.style.boxShadow = 'none'; }}
            >
              {/* The choices in the dropdown */}
              <option value="DEVELOPER">Developer</option>
              <option value="VIEWER">Viewer</option>
              <option value="ADMIN">Admin</option>
            </select>

            {/* Show the error box only if there is an error */}
            {error && (
              <div style={{
                // Space inside the box
                padding: '12px 16px',
                // A light red background
                background: 'var(--error-bg)',
                // A thin red border
                border: '1px solid rgba(255,82,82,0.22)',
                // Rounded corners
                borderRadius: '10px',
                // Red text
                color: 'var(--error)',
                // The text size
                fontSize: '13px',
                // Space below the box
                marginBottom: '20px',
              }}>
                {/* The error text */}
                {error}
              </div>
            )}

            <button
              // Clicking it submits the form
              type="submit"
              // Can't click while we are waiting for the server
              disabled={loading}
              style={{
                // Fill the full width
                width: '100%',
                // Space inside the button
                padding: '13px',
                // Faded green while loading, full green otherwise
                background: loading ? 'rgba(0,230,118,0.35)' : 'var(--accent)',
                // No border
                border: 'none',
                // Rounded corners
                borderRadius: '10px',
                // Dark text on the green button
                color: '#07080e',
                // The text size
                fontSize: '14px',
                // Bold text
                fontWeight: 700,
                // The text font
                fontFamily: 'Outfit, sans-serif',
                // Show a "not allowed" cursor while loading
                cursor: loading ? 'not-allowed' : 'pointer',
                // Make the color change smoothly
                transition: 'background 0.15s',
                // A little space between letters
                letterSpacing: '0.04em',
              }}
              // When the mouse enters: use a brighter green (unless loading)
              onMouseEnter={e => { if (!loading) e.currentTarget.style.background = '#1aff88'; }}
              // When the mouse leaves: go back to the normal green (unless loading)
              onMouseLeave={e => { if (!loading) e.currentTarget.style.background = 'var(--accent)'; }}
            >
              {/* The button text changes while loading */}
              {loading ? 'Creating account…' : 'Create account →'}
            </button>
          </form>

          {/* The line that links to the login page */}
          <p style={{ textAlign: 'center', fontSize: '13px', color: 'var(--text-2)', marginTop: '28px' }}>
            Already have an account?{' '}
            <button
              // Go to the login page when clicked
              onClick={() => navigate('/login')}
              style={{
                // Make it look like a link, not a button
                background: 'none', border: 'none',
                // Green text and a hand cursor
                color: 'var(--accent)', cursor: 'pointer',
                // Text size, font and weight
                fontSize: '13px', fontFamily: 'Outfit, sans-serif', fontWeight: 500,
              }}
            >
              Sign in
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

// A small label shown above each input
function FieldLabel({ label }) {
  return (
    <label style={{
      // Put it on its own line
      display: 'block',
      // A small text size
      fontSize: '11px',
      // Medium weight
      fontWeight: 500,
      // A softer text color
      color: 'var(--text-2)',
      // Space below the label
      marginBottom: '8px',
      // Space between letters
      letterSpacing: '0.1em',
      // Show the text in capital letters
      textTransform: 'uppercase',
      // The code-style font
      fontFamily: 'JetBrains Mono, monospace',
    }}>
      {/* The label text */}
      {label}
    </label>
  );
}
