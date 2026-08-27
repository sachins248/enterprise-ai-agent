import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { streamSSE } from '../api/client';

export default function Chat() {
  const { token, user } = useAuth();

  const [messages, setMessages]   = useState([]);
  const [input, setInput]         = useState('');
  const [codeContext, setCode]    = useState('');
  const [sessionId, setSessionId] = useState(null);
  const [streaming, setStreaming] = useState(false);
  const [showCode, setShowCode]   = useState(false);

  const bottomRef = useRef(null);
  const inputRef  = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function sendMessage(e) {
    e.preventDefault();
    if (!input.trim() || streaming) return;

    const userMessage = input.trim();
    setInput('');
    setStreaming(true);

    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setMessages(prev => [...prev, { role: 'assistant', text: '' }]);

    await streamSSE(
      '/agent/chat',
      { userId: user.userId, sessionId, prompt: userMessage, codeContext: codeContext || null },
      token,
      (chunk) => {
        setMessages(prev => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            role: 'assistant',
            text: updated[updated.length - 1].text + chunk,
          };
          return updated;
        });
      },
      () => setStreaming(false),
      (err) => {
        setMessages(prev => {
          const updated = [...prev];
          updated[updated.length - 1] = { role: 'assistant', text: `Error: ${err}`, error: true };
          return updated;
        });
        setStreaming(false);
      }
    );
  }

  function newSession() {
    setSessionId(null);
    setMessages([]);
    setCode('');
    inputRef.current?.focus();
  }

  const canSend = !streaming && input.trim().length > 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>

      {/* Top bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '11px 24px',
        borderBottom: '1px solid var(--border)',
        background: 'var(--surface)',
        flexShrink: 0,
      }}>
        <span style={{
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: '10px',
          color: 'var(--text-3)',
          letterSpacing: '0.12em',
        }}>
          {sessionId ? `SESSION · ${sessionId.slice(0, 8).toUpperCase()}` : 'NEW SESSION'}
        </span>

        <Chip onClick={newSession} label="Clear" />

        <div style={{ marginLeft: 'auto' }}>
          <Chip
            onClick={() => setShowCode(v => !v)}
            label={showCode ? '⌗ Code context ✓' : '⌗ Code context'}
            active={showCode}
          />
        </div>
      </div>

      {/* Code context panel */}
      {showCode && (
        <div style={{
          padding: '12px 24px',
          borderBottom: '1px solid var(--border)',
          background: 'var(--surface)',
          flexShrink: 0,
        }}>
          <textarea
            value={codeContext}
            onChange={e => setCode(e.target.value)}
            placeholder="Paste your code here for context…"
            rows={5}
            style={{
              width: '100%',
              padding: '12px 16px',
              background: 'var(--card)',
              border: '1px solid var(--border)',
              borderRadius: '10px',
              color: 'var(--text-1)',
              fontSize: '12px',
              fontFamily: 'JetBrains Mono, monospace',
              resize: 'vertical',
              outline: 'none',
              lineHeight: 1.6,
            }}
          />
        </div>
      )}

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '32px 24px' }}>
        <div style={{
          maxWidth: '720px',
          margin: '0 auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '24px',
        }}>

          {messages.length === 0 && (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '80px 20px',
              textAlign: 'center',
              gap: '16px',
            }}>
              <div style={{
                width: '52px',
                height: '52px',
                borderRadius: '16px',
                background: 'var(--accent-glow)',
                border: '1px solid rgba(0,230,118,0.22)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '22px',
                color: 'var(--accent)',
                fontFamily: 'Syne, sans-serif',
                fontWeight: 800,
              }}>
                ◈
              </div>
              <div>
                <p style={{
                  fontFamily: 'Syne, sans-serif',
                  fontSize: '22px',
                  fontWeight: 700,
                  color: 'var(--text-1)',
                  marginBottom: '10px',
                }}>
                  Ask anything about your code
                </p>
                <p style={{ fontSize: '14px', color: 'var(--text-2)', maxWidth: '360px', lineHeight: 1.65 }}>
                  I can explain, debug, refactor, and analyze. Paste a snippet
                  using the Code context button for inline help.
                </p>
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <div
              key={i}
              className="msg-enter"
              style={{
                display: 'flex',
                justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                gap: '10px',
                alignItems: 'flex-end',
              }}
            >
              {/* AI avatar */}
              {msg.role === 'assistant' && (
                <div style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '8px',
                  background: 'var(--accent-glow)',
                  border: '1px solid rgba(0,230,118,0.22)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '10px',
                  color: 'var(--accent)',
                  flexShrink: 0,
                  fontFamily: 'Syne, sans-serif',
                  fontWeight: 800,
                }}>
                  AI
                </div>
              )}

              {/* Bubble */}
              <div style={{
                maxWidth: '78%',
                padding: '13px 17px',
                borderRadius: msg.role === 'user'
                  ? '16px 16px 4px 16px'
                  : '16px 16px 16px 4px',
                background: msg.role === 'user'
                  ? 'linear-gradient(135deg, #0f3460 0%, #16213e 100%)'
                  : msg.error
                    ? 'rgba(255,82,82,0.07)'
                    : 'var(--card)',
                border: msg.role === 'user'
                  ? '1px solid rgba(30,90,180,0.35)'
                  : msg.error
                    ? '1px solid rgba(255,82,82,0.2)'
                    : '1px solid var(--border)',
                color: msg.error ? 'var(--error)' : 'var(--text-1)',
                fontSize: '14px',
                lineHeight: 1.75,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
              }}>
                {msg.text}
                {msg.role === 'assistant' && streaming && i === messages.length - 1 && (
                  <span className="cursor-blink" />
                )}
              </div>

              {/* User avatar */}
              {msg.role === 'user' && (
                <div style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '8px',
                  background: 'linear-gradient(135deg, #1a3a5c, #0f2a45)',
                  border: '1px solid rgba(30,90,180,0.35)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '11px',
                  color: '#7ab3e0',
                  flexShrink: 0,
                  fontFamily: 'Syne, sans-serif',
                  fontWeight: 800,
                }}>
                  {user?.email?.[0]?.toUpperCase() ?? 'U'}
                </div>
              )}
            </div>
          ))}

          <div ref={bottomRef} />
        </div>
      </div>

      {/* Input bar */}
      <div style={{
        flexShrink: 0,
        padding: '16px 24px 20px',
        borderTop: '1px solid var(--border)',
        background: 'var(--surface)',
      }}>
        <form
          onSubmit={sendMessage}
          style={{
            maxWidth: '720px',
            margin: '0 auto',
            display: 'flex',
            gap: '10px',
            alignItems: 'center',
          }}
        >
          <input
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            disabled={streaming}
            placeholder={streaming ? 'Agent is thinking…' : 'Ask a question about your code…'}
            style={{
              flex: 1,
              padding: '13px 18px',
              background: 'var(--card)',
              border: `1px solid ${streaming ? 'rgba(0,230,118,0.18)' : 'var(--border)'}`,
              borderRadius: '12px',
              color: 'var(--text-1)',
              fontSize: '14px',
              fontFamily: 'Outfit, sans-serif',
              outline: 'none',
              transition: 'border-color 0.15s, box-shadow 0.15s',
            }}
            onFocus={e => { e.target.style.borderColor = 'rgba(0,230,118,0.38)'; e.target.style.boxShadow = '0 0 0 3px rgba(0,230,118,0.06)'; }}
            onBlur={e =>  { e.target.style.borderColor = streaming ? 'rgba(0,230,118,0.18)' : 'var(--border)'; e.target.style.boxShadow = 'none'; }}
          />

          <button
            type="submit"
            disabled={!canSend}
            style={{
              padding: '13px 20px',
              background: canSend ? 'var(--accent)' : 'var(--card)',
              border: `1px solid ${canSend ? 'transparent' : 'var(--border)'}`,
              borderRadius: '12px',
              color: canSend ? '#07080e' : 'var(--text-3)',
              fontSize: '16px',
              fontWeight: 700,
              cursor: canSend ? 'pointer' : 'not-allowed',
              transition: 'all 0.15s',
              flexShrink: 0,
              lineHeight: 1,
            }}
            onMouseEnter={e => { if (canSend) e.currentTarget.style.background = '#1aff88'; }}
            onMouseLeave={e => { if (canSend) e.currentTarget.style.background = 'var(--accent)'; }}
          >
            {streaming ? '…' : '↑'}
          </button>
        </form>

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

function Chip({ onClick, label, active }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: active ? 'var(--accent-glow)' : 'transparent',
        border: `1px solid ${active ? 'rgba(0,230,118,0.28)' : 'var(--border)'}`,
        borderRadius: '5px',
        color: active ? 'var(--accent)' : 'var(--text-2)',
        fontSize: '11px',
        fontFamily: 'Outfit, sans-serif',
        padding: '3px 10px',
        cursor: 'pointer',
        transition: 'all 0.15s',
        whiteSpace: 'nowrap',
      }}
      onMouseEnter={e => { if (!active) { e.currentTarget.style.borderColor = 'var(--border-hi)'; e.currentTarget.style.color = 'var(--text-1)'; }}}
      onMouseLeave={e => { if (!active) { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-2)'; }}}
    >
      {label}
    </button>
  );
}
