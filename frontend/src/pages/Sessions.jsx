// React tools: state and a way to run code on load
import { useState, useEffect } from 'react';
// Lets us go to another page
import { useNavigate } from 'react-router-dom';
// Lets us read the token and the current user
import { useAuth } from '../context/AuthContext';
// Our helper for sending requests to the server
import { apiFetch } from '../api/client';

// The chat history page
export default function Sessions() {
  // The token and the current user
  const { token, user } = useAuth();
  // Lets us go to another page
  const navigate = useNavigate();

  // The list of past chat sessions
  const [sessions, setSessions]        = useState([]);
  // The messages of the session we clicked on (null means none picked yet)
  const [messages, setMessages]        = useState(null);
  // Which session is currently open
  const [selectedSession, setSelected] = useState(null);
  // True while the session list is loading
  const [loading, setLoading]          = useState(true);
  // True while a session's messages are loading
  const [msgLoading, setMsgLoading]    = useState(false);
  // An error message to show, if anything failed
  const [error, setError]              = useState('');

  // Load the session list once when the page opens
  useEffect(() => {
    // Loads the user's sessions from the server
    async function load() {
      // The request can fail, so we use try
      try {
        // Ask the server for this user's sessions
        const res = await apiFetch(`/agent/sessions/${user.userId}`, {}, token);
        // Save the list
        setSessions(await res.json());
      } catch (err) {
        // Show the error
        setError(err.message);
      } finally {
        // Either way, we are done loading
        setLoading(false);
      }
    }
    // Run it
    load();
  }, [user.userId, token]);

  // Loads the messages for one session
  async function loadMessages(session) {
    // Mark this session as open
    setSelected(session);
    // Show that we are loading its messages
    setMsgLoading(true);
    // The request can fail, so we use try
    try {
      // Ask the server for the messages in this session
      const res = await apiFetch(`/agent/sessions/${session.id}/messages`, {}, token);
      // Save them
      setMessages(await res.json());
    } catch (err) {
      // Show the error
      setError(err.message);
    } finally {
      // Either way, we are done loading
      setMsgLoading(false);
    }
  }

  // Turns a stored date into a short, readable text
  function formatDate(iso) {
    // Show the month, day, hour and minute
    return new Date(iso).toLocaleString(undefined, {
      month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  }

  return (
    // The whole page: session list on the left, messages on the right
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>

      {/* ── Session list panel ─────────────────────── */}
      {/* The list of sessions on the left */}
      <div style={{
        // A fixed width
        width: '280px',
        // Never let it get narrower
        minWidth: '280px',
        // A line separating it from the messages
        borderRight: '1px solid var(--border)',
        // Stack the header and list top to bottom
        display: 'flex',
        flexDirection: 'column',
        // The panel color
        background: 'var(--surface)',
        // Hide anything that sticks out
        overflow: 'hidden',
      }}>
        {/* Header */}
        {/* The title area above the list */}
        <div style={{
          // Space inside the header
          padding: '20px 20px 16px',
          // A line below the header
          borderBottom: '1px solid var(--border)',
        }}>
          {/* The panel title */}
          <h2 style={{
            // The heading font
            fontFamily: 'Syne, sans-serif',
            // The text size
            fontSize: '15px',
            // Bold text
            fontWeight: 700,
            // The main text color
            color: 'var(--text-1)',
            // Space below the title
            marginBottom: '4px',
          }}>
            Chat History
          </h2>
          {/* How many sessions there are */}
          <p style={{
            // The code-style font
            fontFamily: 'JetBrains Mono, monospace',
            // A small text size
            fontSize: '10px',
            // The faintest text color
            color: 'var(--text-3)',
            // Space between letters
            letterSpacing: '0.1em',
          }}>
            {/* Add an "S" unless there is exactly one session */}
            {sessions.length} SESSION{sessions.length !== 1 ? 'S' : ''}
          </p>
        </div>

        {/* List */}
        {/* The scrolling list of sessions */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {/* Show a loading message while we wait for the list */}
          {loading && (
            <p style={{
              // Space around the text
              padding: '32px 20px',
              // Center it
              textAlign: 'center',
              // A small text size
              fontSize: '12px',
              // The faintest text color
              color: 'var(--text-3)',
              // The code-style font
              fontFamily: 'JetBrains Mono, monospace',
              // Space between letters
              letterSpacing: '0.1em',
            }}>
              LOADING…
            </p>
          )}

          {/* Show an empty state if the list is loaded but has nothing */}
          {!loading && sessions.length === 0 && (
            <div style={{ padding: '40px 20px', textAlign: 'center' }}>
              {/* The empty message */}
              <p style={{ fontSize: '13px', color: 'var(--text-2)', marginBottom: '16px' }}>
                No sessions yet
              </p>
              {/* A button that starts a new chat */}
              <button
                // Go to the chat page when clicked
                onClick={() => navigate('/chat')}
                style={{
                  // A faint green background
                  background: 'var(--accent-glow)',
                  // A faint green border
                  border: '1px solid rgba(0,230,118,0.22)',
                  // Rounded corners
                  borderRadius: '8px',
                  // Green text
                  color: 'var(--accent)',
                  // A small text size
                  fontSize: '12px',
                  // The text font
                  fontFamily: 'Outfit, sans-serif',
                  // Space inside the button
                  padding: '8px 16px',
                  // A hand cursor
                  cursor: 'pointer',
                  // Make the background change smoothly
                  transition: 'background 0.15s',
                }}
                // When the mouse enters: brighten the background
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,230,118,0.18)'; }}
                // When the mouse leaves: go back to normal
                onMouseLeave={e => { e.currentTarget.style.background = 'var(--accent-glow)'; }}
              >
                Start a chat →
              </button>
            </div>
          )}

          {/* Make one row for each session */}
          {sessions.map(s => {
            // True if this row is the one currently open
            const active = selectedSession?.id === s.id;
            return (
              <button
                // React needs a unique key for each item in a list
                key={s.id}
                // Load this session's messages when clicked
                onClick={() => loadMessages(s)}
                style={{
                  // Fill the full width
                  width: '100%',
                  // Left-align the text
                  textAlign: 'left',
                  // Space inside the row
                  padding: '14px 20px',
                  // A faint green background if this row is open
                  background: active ? 'rgba(0,230,118,0.06)' : 'transparent',
                  // A line below the row
                  borderBottom: '1px solid var(--border)',
                  // A green marker on the left if this row is open
                  borderLeft: active ? '2px solid var(--accent)' : '2px solid transparent',
                  // A hand cursor
                  cursor: 'pointer',
                  // Make the changes smooth
                  transition: 'all 0.15s',
                }}
                // When the mouse enters: highlight it (only if it is not already open)
                onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; }}
                // When the mouse leaves: go back to normal (only if it is not already open)
                onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; }}
              >
                {/* The session's title, or a fallback made from its id */}
                <p style={{
                  // The text size
                  fontSize: '13px',
                  // The main text color
                  color: 'var(--text-1)',
                  // Medium weight
                  fontWeight: 500,
                  // Space below the title
                  marginBottom: '4px',
                  // Cut a long title and show "..." at the end
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}>
                  {s.title || `Session ${s.id.slice(0, 8)}`}
                </p>
                {/* The date the session was created */}
                <p style={{
                  // The code-style font
                  fontFamily: 'JetBrains Mono, monospace',
                  // A small text size
                  fontSize: '10px',
                  // The faintest text color
                  color: 'var(--text-3)',
                  // Space between letters
                  letterSpacing: '0.06em',
                }}>
                  {s.createdAt ? formatDate(s.createdAt) : ''}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Message detail panel ───────────────────── */}
      {/* The right side that shows the messages of the open session */}
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>

        {/* Show a hint message when no session is open yet */}
        {!selectedSession && (
          <div style={{
            // Fill the space and center the content
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            // Space between the icon and the text
            gap: '14px',
          }}>
            {/* The icon box */}
            <div style={{
              // The size of the icon box
              width: '48px',
              height: '48px',
              // Rounded corners
              borderRadius: '14px',
              // The card color
              background: 'var(--card)',
              // A thin border
              border: '1px solid var(--border)',
              // Center the symbol
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              // The symbol size
              fontSize: '20px',
              // The faintest text color
              color: 'var(--text-3)',
            }}>
              ◉
            </div>
            {/* The hint text */}
            <p style={{ fontSize: '14px', color: 'var(--text-2)' }}>
              Select a session to view messages
            </p>
          </div>
        )}

        {/* Show the messages once a session is open */}
        {selectedSession && (
          <>
            {/* Session header */}
            {/* The bar showing which session is open */}
            <div style={{
              // Space inside the bar
              padding: '18px 28px',
              // A line below the bar
              borderBottom: '1px solid var(--border)',
              // The bar's background color
              background: 'var(--surface)',
              // Don't let the bar shrink
              flexShrink: 0,
            }}>
              {/* The session's title */}
              <h3 style={{
                // The heading font
                fontFamily: 'Syne, sans-serif',
                // Medium-bold text
                fontWeight: 600,
                // The text size
                fontSize: '15px',
                // The main text color
                color: 'var(--text-1)',
                // Space below the title
                marginBottom: '3px',
              }}>
                {selectedSession.title || `Session ${selectedSession.id.slice(0, 8)}`}
              </h3>
              {/* Show the date only if we have one */}
              {selectedSession.createdAt && (
                <p style={{
                  // The code-style font
                  fontFamily: 'JetBrains Mono, monospace',
                  // A small text size
                  fontSize: '10px',
                  // The faintest text color
                  color: 'var(--text-3)',
                  // Space between letters
                  letterSpacing: '0.08em',
                }}>
                  {formatDate(selectedSession.createdAt)}
                </p>
              )}
            </div>

            {/* Messages */}
            {/* The scrolling area with the messages */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '28px' }}>
              {/* Show a loading message while messages are being fetched */}
              {msgLoading && (
                <p style={{
                  // Center it
                  textAlign: 'center',
                  // A small text size
                  fontSize: '12px',
                  // The faintest text color
                  color: 'var(--text-3)',
                  // Space above the text
                  paddingTop: '40px',
                  // The code-style font
                  fontFamily: 'JetBrains Mono, monospace',
                  // Space between letters
                  letterSpacing: '0.1em',
                }}>
                  LOADING MESSAGES…
                </p>
              )}

              {/* Show the messages once they are loaded */}
              {messages && !msgLoading && (
                <div style={{
                  // Keep the messages from getting too wide
                  maxWidth: '680px',
                  // Stack the messages from top to bottom
                  display: 'flex',
                  flexDirection: 'column',
                  // Space between messages
                  gap: '16px',
                }}>
                  {/* Make one bubble for each message */}
                  {messages.map((msg, i) => (
                    <div
                      // React needs a unique key for each item in a list
                      key={msg.id || i}
                      // Adds a small fade-up animation when the message appears
                      className="msg-enter"
                      style={{
                        // Put the row items side by side
                        display: 'flex',
                        // User messages align right, AI messages align left
                        justifyContent: msg.role === 'USER' ? 'flex-end' : 'flex-start',
                        // Space between the avatar and the bubble
                        gap: '10px',
                        // Line up the avatar with the bottom of the bubble
                        alignItems: 'flex-end',
                      }}
                    >
                      {/* Only show the AI avatar on assistant messages */}
                      {msg.role === 'ASSISTANT' && (
                        <div style={{
                          // The size of the avatar
                          width: '26px',
                          height: '26px',
                          // Rounded corners
                          borderRadius: '7px',
                          // A faint green background
                          background: 'var(--accent-glow)',
                          // A faint green border
                          border: '1px solid rgba(0,230,118,0.2)',
                          // Center the text
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          // A small text size
                          fontSize: '9px',
                          // The green accent color
                          color: 'var(--accent)',
                          // Don't let the avatar shrink
                          flexShrink: 0,
                          // The heading font
                          fontFamily: 'Syne, sans-serif',
                          // Very bold text
                          fontWeight: 800,
                        }}>
                          AI
                        </div>
                      )}

                      {/* The message bubble */}
                      <div style={{
                        // Never take up more than 78% of the row width
                        maxWidth: '78%',
                        // Space inside the bubble
                        padding: '11px 15px',
                        // Round the corner nearest the avatar less, to point toward it
                        borderRadius: msg.role === 'USER'
                          ? '14px 14px 4px 14px'
                          : '14px 14px 14px 4px',
                        // Blue gradient for the user, the card color for the AI
                        background: msg.role === 'USER'
                          ? 'linear-gradient(135deg, #0f3460 0%, #16213e 100%)'
                          : 'var(--card)',
                        // A matching border for each case
                        border: msg.role === 'USER'
                          ? '1px solid rgba(30,90,180,0.35)'
                          : '1px solid var(--border)',
                        // The text color
                        color: 'var(--text-1)',
                        // The text size
                        fontSize: '13px',
                        // Comfortable space between lines
                        lineHeight: 1.7,
                        // Keep line breaks, and wrap long lines
                        whiteSpace: 'pre-wrap',
                        // Break very long words instead of overflowing
                        wordBreak: 'break-word',
                      }}>
                        {/* The message text */}
                        {msg.content}
                        {/* Show how many tokens the message used, if we know */}
                        {msg.tokenCount > 0 && (
                          <div style={{
                            // Space above the token count
                            marginTop: '6px',
                            // The code-style font
                            fontFamily: 'JetBrains Mono, monospace',
                            // A tiny text size
                            fontSize: '9px',
                            // The faintest text color
                            color: 'var(--text-3)',
                            // Space between letters
                            letterSpacing: '0.06em',
                          }}>
                            {msg.tokenCount} tokens
                          </div>
                        )}
                      </div>

                      {/* Only show the user avatar on user messages */}
                      {msg.role === 'USER' && (
                        <div style={{
                          // The size of the avatar
                          width: '26px',
                          height: '26px',
                          // Rounded corners
                          borderRadius: '7px',
                          // A blue gradient background
                          background: 'linear-gradient(135deg, #1a3a5c, #0f2a45)',
                          // A blue border
                          border: '1px solid rgba(30,90,180,0.35)',
                          // Center the letter
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          // A small text size
                          fontSize: '10px',
                          // A light blue color
                          color: '#7ab3e0',
                          // Don't let the avatar shrink
                          flexShrink: 0,
                          // The heading font
                          fontFamily: 'Syne, sans-serif',
                          // Very bold text
                          fontWeight: 800,
                        }}>
                          U
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Show a floating error box in the corner if something failed */}
      {error && (
        <div style={{
          // Float over the page, in the bottom-right corner
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          // A faint red background
          background: 'rgba(255,82,82,0.1)',
          // A red border
          border: '1px solid rgba(255,82,82,0.28)',
          // Rounded corners
          borderRadius: '10px',
          // Space inside the box
          padding: '12px 16px',
          // Red text
          color: 'var(--error)',
          // The text size
          fontSize: '13px',
          // Stay above everything else
          zIndex: 100,
        }}>
          {error}
        </div>
      )}
    </div>
  );
}
