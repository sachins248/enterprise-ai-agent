// useState lets the page remember values (like what the user typed)
import { useState } from 'react';
// Lets us go to another page
import { useNavigate } from 'react-router-dom';
// Lets us save the login info after a successful login
import { useAuth } from '../context/AuthContext';
// Our helper for sending requests to the server
import { apiFetch } from '../api/client';

// The list of features shown on the left side of the page
const FEATURES = [
  'Real-time AI chat with Gemini streaming',
  'JWT auth · Role-based access control',
  'GitHub webhook pipeline analysis',
  'Kafka event bus · Full audit trail',
  'Analytics dashboard with usage metrics',
];

// The style used by both text inputs, written once so they match
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

// The login page
export default function Login() {
  // The login function that saves the token
  const { login }   = useAuth();
  // Lets us go to another page
  const navigate    = useNavigate();
  // What the user typed in the email box
  const [email, setEmail]       = useState('');
  // What the user typed in the password box
  const [password, setPassword] = useState('');
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
      // Send the email and password to the server
      const res  = await apiFetch('/auth/login', { method: 'POST', body: { email, password } });
      // Read the answer as JSON
      const data = await res.json();
      // Save the token so the rest of the app knows we are logged in
      login(data.accessToken);
      // Go to the chat page
      navigate('/chat');
    } catch (err) {
      // Show the error message (or a simple default)
      setError(err.message || 'Invalid credentials');
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
        {/* Accent orb */}
        {/* A soft green glow in the corner (just decoration) */}
        <div style={{
          // Place it freely inside the panel
          position: 'absolute',
          // Push it partly outside the bottom-left corner
          bottom: '-140px',
          left: '-140px',
          // The size of the glow
          width: '500px',
          height: '500px',
          // A green circle that fades out to nothing
          background: 'radial-gradient(circle, rgba(0,230,118,0.07) 0%, transparent 68%)',
          // Let clicks pass through it
          pointerEvents: 'none',
        }} />

        {/* Logo */}
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

        {/* Hero text + features */}
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
            Enterprise<br />
            {/* Show "AI" in the accent color */}
            <span style={{ color: 'var(--accent)' }}>AI</span><br />
            Platform.
          </h1>
          {/* The short description under the title */}
          <p style={{
            // The text size
            fontSize: '15px',
            // A softer text color
            color: 'var(--text-2)',
            // Comfortable space between lines
            lineHeight: 1.75,
            // Space below the paragraph
            marginBottom: '40px',
            // Keep the lines from getting too long
            maxWidth: '340px',
          }}>
            A production-grade AI coding agent built on 5 Spring Boot
            microservices, real-time Gemini streaming, and full observability.
          </p>

          {/* The list of features */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {/* Make one row for each feature */}
            {FEATURES.map((feat, i) => (
              // One row: a dot and the text
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {/* The small glowing dot */}
                <div style={{
                  // The size of the dot
                  width: '5px',
                  height: '5px',
                  // Make it a circle
                  borderRadius: '50%',
                  // The green accent color
                  background: 'var(--accent)',
                  // A soft glow around the dot
                  boxShadow: '0 0 7px var(--accent)',
                  // Don't let the dot shrink when the text is long
                  flexShrink: 0,
                }} />
                {/* The feature text */}
                <span style={{ fontSize: '13px', color: 'var(--text-2)' }}>{feat}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
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
            Welcome back
          </h2>
          {/* The short line under the title */}
          <p style={{ fontSize: '14px', color: 'var(--text-2)', marginBottom: '40px' }}>
            Sign in to your account to continue
          </p>

          {/* The login form: submitting it runs handleSubmit */}
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
              // Use the shared input style, and add more space below
              style={{ ...inputStyle, marginBottom: '28px' }}
              // When the box is clicked: show a green border and glow
              onFocus={e => { e.target.style.borderColor = 'rgba(0,230,118,0.45)'; e.target.style.boxShadow = '0 0 0 3px rgba(0,230,118,0.07)'; }}
              // When the box is left: go back to the normal border and remove the glow
              onBlur={e =>  { e.target.style.borderColor = 'var(--border)'; e.target.style.boxShadow = 'none'; }}
            />

            {/* Show the error box only if there is an error */}
            {error && <ErrorBox message={error} />}

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
              {loading ? 'Signing in…' : 'Sign in →'}
            </button>
          </form>

          {/* The line that links to the register page */}
          <p style={{ textAlign: 'center', fontSize: '13px', color: 'var(--text-2)', marginTop: '28px' }}>
            No account?{' '}
            <button
              // Go to the register page when clicked
              onClick={() => navigate('/register')}
              style={{
                // Make it look like a link, not a button
                background: 'none', border: 'none',
                // Green text and a hand cursor
                color: 'var(--accent)', cursor: 'pointer',
                // Text size, font and weight
                fontSize: '13px', fontFamily: 'Outfit, sans-serif', fontWeight: 500,
              }}
            >
              Create one
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

// A red box that shows an error message
function ErrorBox({ message }) {
  return (
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
      {message}
    </div>
  );
}
