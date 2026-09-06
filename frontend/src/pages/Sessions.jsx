import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../api/client';

export default function Sessions() {
  const { token, user } = useAuth();
  const navigate = useNavigate();

  const [sessions, setSessions]        = useState([]);
  const [messages, setMessages]        = useState(null);
  const [selectedSession, setSelected] = useState(null);
  const [loading, setLoading]          = useState(true);
  const [msgLoading, setMsgLoading]    = useState(false);
  const [error, setError]              = useState('');

  useEffect(() => {
    async function load() {
      try {
        const res = await apiFetch(`/agent/sessions/${user.userId}`, {}, token);
        setSessions(await res.json());
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [user.userId, token]);

  async function loadMessages(session) {
    setSelected(session);
    setMsgLoading(true);
    try {
      const res = await apiFetch(`/agent/sessions/${session.id}/messages`, {}, token);
      setMessages(await res.json());
    } catch (err) {
      setError(err.message);
    } finally {
      setMsgLoading(false);
    }
  }

  function formatDate(iso) {
    return new Date(iso).toLocaleString(undefined, {
      month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  }

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>

      {/* ── Session list panel ─────────────────────── */}
      <div style={{
        width: '280px',
        minWidth: '280px',
        borderRight: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--surface)',
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          padding: '20px 20px 16px',
          borderBottom: '1px solid var(--border)',
        }}>
          <h2 style={{
            fontFamily: 'Syne, sans-serif',
            fontSize: '15px',
            fontWeight: 700,
            color: 'var(--text-1)',
            marginBottom: '4px',
          }}>
            Chat History
          </h2>
          <p style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: '10px',
            color: 'var(--text-3)',
            letterSpacing: '0.1em',
          }}>
            {sessions.length} SESSION{sessions.length !== 1 ? 'S' : ''}
          </p>
        </div>

        {/* List */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {loading && (
            <p style={{
              padding: '32px 20px',
              textAlign: 'center',
              fontSize: '12px',
              color: 'var(--text-3)',
              fontFamily: 'JetBrains Mono, monospace',
              letterSpacing: '0.1em',
            }}>
              LOADING…
            </p>
          )}

          {!loading && sessions.length === 0 && (
            <div style={{ padding: '40px 20px', textAlign: 'center' }}>
              <p style={{ fontSize: '13px', color: 'var(--text-2)', marginBottom: '16px' }}>
                No sessions yet
              </p>
              <button
                onClick={() => navigate('/chat')}
                style={{
                  background: 'var(--accent-glow)',
                  border: '1px solid rgba(0,230,118,0.22)',
                  borderRadius: '8px',
                  color: 'var(--accent)',
                  fontSize: '12px',
                  fontFamily: 'Outfit, sans-serif',
                  padding: '8px 16px',
                  cursor: 'pointer',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,230,118,0.18)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'var(--accent-glow)'; }}
              >
                Start a chat →
              </button>
            </div>
          )}

          {sessions.map(s => {
            const active = selectedSession?.id === s.id;
            return (
              <button
                key={s.id}
                onClick={() => loadMessages(s)}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  padding: '14px 20px',
                  background: active ? 'rgba(0,230,118,0.06)' : 'transparent',
                  borderBottom: '1px solid var(--border)',
                  borderLeft: active ? '2px solid var(--accent)' : '2px solid transparent',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
                onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; }}
                onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; }}
              >
                <p style={{
                  fontSize: '13px',
                  color: 'var(--text-1)',
                  fontWeight: 500,
                  marginBottom: '4px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}>
                  {s.title || `Session ${s.id.slice(0, 8)}`}
                </p>
                <p style={{
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: '10px',
                  color: 'var(--text-3)',
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
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>

        {!selectedSession && (
          <div style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            gap: '14px',
          }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '14px',
              background: 'var(--card)',
              border: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '20px',
              color: 'var(--text-3)',
            }}>
              ◉
            </div>
            <p style={{ fontSize: '14px', color: 'var(--text-2)' }}>
              Select a session to view messages
            </p>
          </div>
        )}

        {selectedSession && (
          <>
            {/* Session header */}
            <div style={{
              padding: '18px 28px',
              borderBottom: '1px solid var(--border)',
              background: 'var(--surface)',
              flexShrink: 0,
            }}>
              <h3 style={{
                fontFamily: 'Syne, sans-serif',
                fontWeight: 600,
                fontSize: '15px',
                color: 'var(--text-1)',
                marginBottom: '3px',
              }}>
                {selectedSession.title || `Session ${selectedSession.id.slice(0, 8)}`}
              </h3>
              {selectedSession.createdAt && (
                <p style={{
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: '10px',
                  color: 'var(--text-3)',
                  letterSpacing: '0.08em',
                }}>
                  {formatDate(selectedSession.createdAt)}
                </p>
              )}
            </div>

            {/* Messages */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '28px' }}>
              {msgLoading && (
                <p style={{
                  textAlign: 'center',
                  fontSize: '12px',
                  color: 'var(--text-3)',
                  paddingTop: '40px',
                  fontFamily: 'JetBrains Mono, monospace',
                  letterSpacing: '0.1em',
                }}>
                  LOADING MESSAGES…
                </p>
              )}

              {messages && !msgLoading && (
                <div style={{
                  maxWidth: '680px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px',
                }}>
                  {messages.map((msg, i) => (
                    <div
                      key={msg.id || i}
                      className="msg-enter"
                      style={{
                        display: 'flex',
                        justifyContent: msg.role === 'USER' ? 'flex-end' : 'flex-start',
                        gap: '10px',
                        alignItems: 'flex-end',
                      }}
                    >
                      {msg.role === 'ASSISTANT' && (
                        <div style={{
                          width: '26px',
                          height: '26px',
                          borderRadius: '7px',
                          background: 'var(--accent-glow)',
                          border: '1px solid rgba(0,230,118,0.2)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '9px',
                          color: 'var(--accent)',
                          flexShrink: 0,
                          fontFamily: 'Syne, sans-serif',
                          fontWeight: 800,
                        }}>
                          AI
                        </div>
                      )}

                      <div style={{
                        maxWidth: '78%',
                        padding: '11px 15px',
                        borderRadius: msg.role === 'USER'
                          ? '14px 14px 4px 14px'
                          : '14px 14px 14px 4px',
                        background: msg.role === 'USER'
                          ? 'linear-gradient(135deg, #0f3460 0%, #16213e 100%)'
                          : 'var(--card)',
                        border: msg.role === 'USER'
                          ? '1px solid rgba(30,90,180,0.35)'
                          : '1px solid var(--border)',
                        color: 'var(--text-1)',
                        fontSize: '13px',
                        lineHeight: 1.7,
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word',
                      }}>
                        {msg.content}
                        {msg.tokenCount > 0 && (
                          <div style={{
                            marginTop: '6px',
                            fontFamily: 'JetBrains Mono, monospace',
                            fontSize: '9px',
                            color: 'var(--text-3)',
                            letterSpacing: '0.06em',
                          }}>
                            {msg.tokenCount} tokens
                          </div>
                        )}
                      </div>

                      {msg.role === 'USER' && (
                        <div style={{
                          width: '26px',
                          height: '26px',
                          borderRadius: '7px',
                          background: 'linear-gradient(135deg, #1a3a5c, #0f2a45)',
                          border: '1px solid rgba(30,90,180,0.35)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '10px',
                          color: '#7ab3e0',
                          flexShrink: 0,
                          fontFamily: 'Syne, sans-serif',
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

      {error && (
        <div style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          background: 'rgba(255,82,82,0.1)',
          border: '1px solid rgba(255,82,82,0.28)',
          borderRadius: '10px',
          padding: '12px 16px',
          color: 'var(--error)',
          fontSize: '13px',
          zIndex: 100,
        }}>
          {error}
        </div>
      )}
    </div>
  );
}
