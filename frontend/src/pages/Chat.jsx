// React tools: state, a way to reference DOM elements, and a way to run code on changes
import { useState, useRef, useEffect } from 'react';
// Lets us read the token and the current user
import { useAuth } from '../context/AuthContext';
// Our helper that streams the AI's answer piece by piece
import { streamSSE } from '../api/client';

// The chat page
export default function Chat() {
  // The token (to prove who we are) and the user (for the avatar)
  const { token, user } = useAuth();

  // The list of chat messages shown on screen
  const [messages, setMessages]   = useState([]);
  // What the user is typing right now
  const [input, setInput]         = useState('');
  // Optional code pasted in for context
  const [codeContext, setCode]    = useState('');
  // The current chat session id (null means a new session will be made)
  const [sessionId, setSessionId] = useState(null);
  // True while the AI is still sending its answer
  const [streaming, setStreaming] = useState(false);
  // Whether the code context box is open
  const [showCode, setShowCode]   = useState(false);

  // A marker at the bottom of the messages, used to scroll down
  const bottomRef = useRef(null);
  // A reference to the text input, used to focus it
  const inputRef  = useRef(null);

  // Every time the messages change, scroll down to the newest one
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Runs when the user sends a message
  async function sendMessage(e) {
    // Stop the browser from reloading the page
    e.preventDefault();
    // Do nothing if the box is empty or the AI is still answering
    if (!input.trim() || streaming) return;

    // Remove extra spaces from the message
    const userMessage = input.trim();
    // Clear the input box
    setInput('');
    // Show that we are waiting for the AI
    setStreaming(true);

    // Add the user's message to the list
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    // Add an empty assistant message that we will fill in as chunks arrive
    setMessages(prev => [...prev, { role: 'assistant', text: '' }]);

    // Start streaming the AI's answer
    await streamSSE(
      // The chat endpoint
      '/agent/chat',
      // The data to send
      { userId: user.userId, sessionId, prompt: userMessage, codeContext: codeContext || null },
      // Our token, so the server knows who we are
      token,
      // Runs for each piece of the answer as it arrives
      (chunk) => {
        // Update the messages list
        setMessages(prev => {
          // Copy the list so React notices the change
          const updated = [...prev];
          // Add the new piece to the last (assistant) message
          updated[updated.length - 1] = {
            role: 'assistant',
            text: updated[updated.length - 1].text + chunk,
          };
          // Give back the updated list
          return updated;
        });
      },
      // Runs when the answer is finished
      () => setStreaming(false),
      // Runs if something goes wrong
      (err) => {
        // Replace the last message with an error message
        setMessages(prev => {
          // Copy the list so React notices the change
          const updated = [...prev];
          // Show the error where the answer would have been
          updated[updated.length - 1] = { role: 'assistant', text: `Error: ${err}`, error: true };
          // Give back the updated list
          return updated;
        });
        // We are no longer waiting
        setStreaming(false);
      }
    );
  }

  // Starts a brand-new, empty chat
  function newSession() {
    // Forget the old session id
    setSessionId(null);
    // Clear the messages
    setMessages([]);
    // Clear any pasted code
    setCode('');
    // Put the cursor back in the text box
    inputRef.current?.focus();
  }

  // The send button only works when not streaming and there is text to send
  const canSend = !streaming && input.trim().length > 0;

  return (
    // The whole chat area: header, messages and input bar stacked vertically
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>

      {/* Top bar */}
      {/* The header row above the messages */}
      <div style={{
        // Put items in a row
        display: 'flex',
        alignItems: 'center',
        // Space between items
        gap: '12px',
        // Space inside the bar
        padding: '11px 24px',
        // A line below the bar
        borderBottom: '1px solid var(--border)',
        // The bar's background color
        background: 'var(--surface)',
        // Don't let the bar shrink
        flexShrink: 0,
      }}>
        {/* Shows the session id, or "NEW SESSION" if there isn't one yet */}
        <span style={{
          // The code-style font
          fontFamily: 'JetBrains Mono, monospace',
          // A small text size
          fontSize: '10px',
          // The faintest text color
          color: 'var(--text-3)',
          // Space between letters
          letterSpacing: '0.12em',
        }}>
          {sessionId ? `SESSION · ${sessionId.slice(0, 8).toUpperCase()}` : 'NEW SESSION'}
        </span>

        {/* The button that clears the chat */}
        <Chip onClick={newSession} label="Clear" />

        {/* Push the next item to the far right */}
        <div style={{ marginLeft: 'auto' }}>
          {/* The button that shows or hides the code context box */}
          <Chip
            // Flip the showCode value when clicked
            onClick={() => setShowCode(v => !v)}
            // Show a checkmark when the box is open
            label={showCode ? '⌗ Code context ✓' : '⌗ Code context'}
            active={showCode}
          />
        </div>
      </div>

      {/* Code context panel */}
      {/* Only show this box when the user turned it on */}
      {showCode && (
        <div style={{
          // Space inside the panel
          padding: '12px 24px',
          // A line below the panel
          borderBottom: '1px solid var(--border)',
          // The panel's background color
          background: 'var(--surface)',
          // Don't let the panel shrink
          flexShrink: 0,
        }}>
          <textarea
            // Show what is in our codeContext state
            value={codeContext}
            // Update the state every time the user types
            onChange={e => setCode(e.target.value)}
            // The gray hint text
            placeholder="Paste your code here for context…"
            // Start with 5 visible lines
            rows={5}
            style={{
              // Fill the full width
              width: '100%',
              // Space inside the box
              padding: '12px 16px',
              // The box color
              background: 'var(--card)',
              // A thin border
              border: '1px solid var(--border)',
              // Rounded corners
              borderRadius: '10px',
              // The text color
              color: 'var(--text-1)',
              // A small text size
              fontSize: '12px',
              // The code-style font
              fontFamily: 'JetBrains Mono, monospace',
              // Let the user resize the height, but not the width
              resize: 'vertical',
              // Remove the browser's default outline
              outline: 'none',
              // Comfortable space between lines
              lineHeight: 1.6,
            }}
          />
        </div>
      )}

      {/* Messages */}
      {/* The scrolling area that holds all the chat messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '32px 24px' }}>
        {/* Keep the messages centered and not too wide */}
        <div style={{
          maxWidth: '720px',
          margin: '0 auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '24px',
        }}>

          {/* Show a welcome message only when there are no messages yet */}
          {messages.length === 0 && (
            <div style={{
              // Stack the icon and text, centered
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              // Space around the whole block
              padding: '80px 20px',
              textAlign: 'center',
              // Space between the icon and the text
              gap: '16px',
            }}>
              {/* The rounded icon box */}
              <div style={{
                // The size of the icon box
                width: '52px',
                height: '52px',
                // Rounded corners
                borderRadius: '16px',
                // A faint green background
                background: 'var(--accent-glow)',
                // A faint green border
                border: '1px solid rgba(0,230,118,0.22)',
                // Center the symbol
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                // The symbol size
                fontSize: '22px',
                // The green accent color
                color: 'var(--accent)',
                // The heading font
                fontFamily: 'Syne, sans-serif',
                // Very bold text
                fontWeight: 800,
              }}>
                ◈
              </div>
              <div>
                {/* The welcome title */}
                <p style={{
                  // The heading font
                  fontFamily: 'Syne, sans-serif',
                  // The text size
                  fontSize: '22px',
                  // Bold text
                  fontWeight: 700,
                  // The main text color
                  color: 'var(--text-1)',
                  // Space below the title
                  marginBottom: '10px',
                }}>
                  Ask anything about your code
                </p>
                {/* The short description under the title */}
                <p style={{ fontSize: '14px', color: 'var(--text-2)', maxWidth: '360px', lineHeight: 1.65 }}>
                  I can explain, debug, refactor, and analyze. Paste a snippet
                  using the Code context button for inline help.
                </p>
              </div>
            </div>
          )}

          {/* Make one bubble for each message */}
          {messages.map((msg, i) => (
            <div
              // React needs a unique key for each item in a list
              key={i}
              // Adds a small fade-up animation when the message appears
              className="msg-enter"
              style={{
                // Put the row items side by side
                display: 'flex',
                // User messages align right, AI messages align left
                justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                // Space between the avatar and the bubble
                gap: '10px',
                // Line up the avatar with the bottom of the bubble
                alignItems: 'flex-end',
              }}
            >
              {/* AI avatar */}
              {/* Only show the AI avatar on assistant messages */}
              {msg.role === 'assistant' && (
                <div style={{
                  // The size of the avatar
                  width: '28px',
                  height: '28px',
                  // Rounded corners
                  borderRadius: '8px',
                  // A faint green background
                  background: 'var(--accent-glow)',
                  // A faint green border
                  border: '1px solid rgba(0,230,118,0.22)',
                  // Center the text
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  // A small text size
                  fontSize: '10px',
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

              {/* Bubble */}
              {/* The message bubble itself */}
              <div style={{
                // Never take up more than 78% of the row width
                maxWidth: '78%',
                // Space inside the bubble
                padding: '13px 17px',
                // Round the corner nearest the avatar less, to point toward it
                borderRadius: msg.role === 'user'
                  ? '16px 16px 4px 16px'
                  : '16px 16px 16px 4px',
                // Blue gradient for the user, red for errors, the card color for normal AI replies
                background: msg.role === 'user'
                  ? 'linear-gradient(135deg, #0f3460 0%, #16213e 100%)'
                  : msg.error
                    ? 'rgba(255,82,82,0.07)'
                    : 'var(--card)',
                // A matching border for each of the three cases above
                border: msg.role === 'user'
                  ? '1px solid rgba(30,90,180,0.35)'
                  : msg.error
                    ? '1px solid rgba(255,82,82,0.2)'
                    : '1px solid var(--border)',
                // Red text for errors, normal text color otherwise
                color: msg.error ? 'var(--error)' : 'var(--text-1)',
                // The text size
                fontSize: '14px',
                // Comfortable space between lines
                lineHeight: 1.75,
                // Keep line breaks the AI sent, and wrap long lines
                whiteSpace: 'pre-wrap',
                // Break very long words instead of overflowing
                wordBreak: 'break-word',
              }}>
                {/* The message text */}
                {msg.text}
                {/* Show a blinking cursor only on the assistant message that is still streaming */}
                {msg.role === 'assistant' && streaming && i === messages.length - 1 && (
                  <span className="cursor-blink" />
                )}
              </div>

              {/* User avatar */}
              {/* Only show the user avatar on user messages */}
              {msg.role === 'user' && (
                <div style={{
                  // The size of the avatar
                  width: '28px',
                  height: '28px',
                  // Rounded corners
                  borderRadius: '8px',
                  // A blue gradient background
                  background: 'linear-gradient(135deg, #1a3a5c, #0f2a45)',
                  // A blue border
                  border: '1px solid rgba(30,90,180,0.35)',
                  // Center the letter
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  // A small text size
                  fontSize: '11px',
                  // A light blue color
                  color: '#7ab3e0',
                  // Don't let the avatar shrink
                  flexShrink: 0,
                  // The heading font
                  fontFamily: 'Syne, sans-serif',
                  // Very bold text
                  fontWeight: 800,
                }}>
                  {/* The first letter of the user's email, or "U" if unknown */}
                  {user?.email?.[0]?.toUpperCase() ?? 'U'}
                </div>
              )}
            </div>
          ))}

          {/* An empty marker at the bottom so we can scroll to it */}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* Input bar */}
      {/* The bar at the bottom where the user types */}
      <div style={{
        // Don't let the bar shrink
        flexShrink: 0,
        // Space inside the bar
        padding: '16px 24px 20px',
        // A line above the bar
        borderTop: '1px solid var(--border)',
        // The bar's background color
        background: 'var(--surface)',
      }}>
        <form
          // Send the message when the form is submitted
          onSubmit={sendMessage}
          style={{
            // Keep it centered and not too wide, like the messages
            maxWidth: '720px',
            margin: '0 auto',
            // Put the input and button side by side
            display: 'flex',
            gap: '10px',
            alignItems: 'center',
          }}
        >
          <input
            // Lets us focus this box from code
            ref={inputRef}
            // Show what is in our input state
            value={input}
            // Update the state every time the user types
            onChange={e => setInput(e.target.value)}
            // Can't type while the AI is answering
            disabled={streaming}
            // Different hint text depending on whether we are waiting
            placeholder={streaming ? 'Agent is thinking…' : 'Ask a question about your code…'}
            style={{
              // Take up all the space the button leaves
              flex: 1,
              // Space inside the box
              padding: '13px 18px',
              // The box color
              background: 'var(--card)',
              // A faint green border while streaming, normal border otherwise
              border: `1px solid ${streaming ? 'rgba(0,230,118,0.18)' : 'var(--border)'}`,
              // Rounded corners
              borderRadius: '12px',
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
            }}
            // When the box is clicked: show a green border and glow
            onFocus={e => { e.target.style.borderColor = 'rgba(0,230,118,0.38)'; e.target.style.boxShadow = '0 0 0 3px rgba(0,230,118,0.06)'; }}
            // When the box is left: go back to the normal border (or the streaming border) and remove the glow
            onBlur={e =>  { e.target.style.borderColor = streaming ? 'rgba(0,230,118,0.18)' : 'var(--border)'; e.target.style.boxShadow = 'none'; }}
          />

          <button
            // Clicking it submits the form
            type="submit"
            // Can't click unless there is something to send
            disabled={!canSend}
            style={{
              // Space inside the button
              padding: '13px 20px',
              // Green background when ready to send, the card color otherwise
              background: canSend ? 'var(--accent)' : 'var(--card)',
              // No border when ready, a normal border otherwise
              border: `1px solid ${canSend ? 'transparent' : 'var(--border)'}`,
              // Rounded corners
              borderRadius: '12px',
              // Dark text when ready, faint text otherwise
              color: canSend ? '#07080e' : 'var(--text-3)',
              // The arrow size
              fontSize: '16px',
              // Bold text
              fontWeight: 700,
              // A hand cursor when ready, "not allowed" otherwise
              cursor: canSend ? 'pointer' : 'not-allowed',
              // Make the changes smooth
              transition: 'all 0.15s',
              // Don't let the button shrink
              flexShrink: 0,
              // No extra line space
              lineHeight: 1,
            }}
            // When the mouse enters: use a brighter green (only if ready to send)
            onMouseEnter={e => { if (canSend) e.currentTarget.style.background = '#1aff88'; }}
            // When the mouse leaves: go back to the normal green (only if ready to send)
            onMouseLeave={e => { if (canSend) e.currentTarget.style.background = 'var(--accent)'; }}
          >
            {/* Show "…" while streaming, otherwise an up arrow */}
            {streaming ? '…' : '↑'}
          </button>
        </form>

        {/* The small helper text under the input bar */}
        <p style={{
          textAlign: 'center',
          fontSize: '10px',
          color: 'var(--text-3)',
          marginTop: '8px',
          fontFamily: 'JetBrains Mono, monospace',
          letterSpacing: '0.07em',
        }}>
          Powered by Gemini · Conversations are saved automatically
        </p>
      </div>
    </div>
  );
}

// A small pill-shaped button used for "Clear" and "Code context"
function Chip({ onClick, label, active }) {
  return (
    <button
      // Run the given function when clicked
      onClick={onClick}
      style={{
        // A faint green background when active, none otherwise
        background: active ? 'var(--accent-glow)' : 'transparent',
        // A green border when active, a normal border otherwise
        border: `1px solid ${active ? 'rgba(0,230,118,0.28)' : 'var(--border)'}`,
        // Slightly rounded corners
        borderRadius: '5px',
        // Green text when active, softer text otherwise
        color: active ? 'var(--accent)' : 'var(--text-2)',
        // A small text size
        fontSize: '11px',
        // The text font
        fontFamily: 'Outfit, sans-serif',
        // Space inside the chip
        padding: '3px 10px',
        // A hand cursor
        cursor: 'pointer',
        // Make the changes smooth
        transition: 'all 0.15s',
        // Never wrap the text onto a second line
        whiteSpace: 'nowrap',
      }}
      // When the mouse enters: brighten it slightly (only if not already active)
      onMouseEnter={e => { if (!active) { e.currentTarget.style.borderColor = 'var(--border-hi)'; e.currentTarget.style.color = 'var(--text-1)'; }}}
      // When the mouse leaves: go back to normal (only if not already active)
      onMouseLeave={e => { if (!active) { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-2)'; }}}
    >
      {/* The chip text */}
      {label}
    </button>
  );
}
