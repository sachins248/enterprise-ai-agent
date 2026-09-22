import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../api/client';
import Icon from '../components/ui/Icon';
import Button from '../components/ui/Button';
import Empty from '../components/ui/Empty';
import ChatBubble from '../components/ui/ChatBubble';
import Toast from '../components/ui/Toast';

export default function Sessions() {
  const { token, user } = useAuth();
  const navigate = useNavigate();

  const [sessions, setSessions] = useState([]);
  const [messages, setMessages] = useState(null);
  const [selectedSession, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [msgLoading, setMsgLoading] = useState(false);
  const [error, setError] = useState('');

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
    <div className="flex h-full overflow-hidden">

      {/* Session list panel */}
      <div className="w-[280px] min-w-[280px] border-r border-hairline flex flex-col bg-surface overflow-hidden">
        <div className="px-5 pt-5 pb-4 border-b border-hairline">
          <h2 className="font-display text-[15px] font-bold text-ink mb-1">Chat History</h2>
          <p className="font-mono text-[10px] text-ink-3 tracking-micro">
            {sessions.length} SESSION{sessions.length !== 1 ? 'S' : ''}
          </p>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading && (
            <p className="px-5 py-8 text-center font-mono text-[12px] text-ink-3 tracking-micro">LOADING…</p>
          )}

          {!loading && sessions.length === 0 && (
            <div className="px-5 py-10 text-center">
              <p className="text-[13px] text-ink-2 mb-4">No sessions yet</p>
              <Button variant="secondary" size="sm" onClick={() => navigate('/chat')} icon="arrow-right">
                Start a chat
              </Button>
            </div>
          )}

          {sessions.map(s => {
            const active = selectedSession?.id === s.id;
            return (
              <button
                key={s.id}
                onClick={() => loadMessages(s)}
                className={`w-full text-left px-5 py-3.5 border-b border-hairline border-l-2 transition-colors duration-150
                  ${active ? 'border-l-accent bg-card' : 'border-l-transparent hover:bg-card'}`}
              >
                <p className="text-[13px] text-ink font-medium mb-1 truncate">
                  {s.title || `Session ${s.id.slice(0, 8)}`}
                </p>
                <p className="font-mono text-[10px] text-ink-3 tracking-micro">
                  {s.createdAt ? formatDate(s.createdAt) : ''}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Message detail panel */}
      <div className="flex-1 overflow-hidden flex flex-col">

        {!selectedSession && (
          <div className="flex-1 flex flex-col items-center justify-center gap-3.5">
            <div className="w-12 h-12 bg-card border border-hairline flex items-center justify-center text-ink-3">
              <Icon name="history" size={20} />
            </div>
            <p className="text-sm text-ink-2">Select a session to view messages</p>
          </div>
        )}

        {selectedSession && (
          <>
            <div className="px-7 py-4 border-b border-hairline bg-surface shrink-0">
              <h3 className="font-display font-semibold text-[15px] text-ink mb-0.5">
                {selectedSession.title || `Session ${selectedSession.id.slice(0, 8)}`}
              </h3>
              {selectedSession.createdAt && (
                <p className="font-mono text-[10px] text-ink-3 tracking-micro">
                  {formatDate(selectedSession.createdAt)}
                </p>
              )}
            </div>

            <div className="flex-1 overflow-y-auto p-7">
              {msgLoading && (
                <p className="text-center font-mono text-[12px] text-ink-3 tracking-micro pt-10">
                  LOADING MESSAGES…
                </p>
              )}

              {messages && !msgLoading && (
                messages.length === 0 ? <Empty label="NO MESSAGES" /> : (
                  <div className="max-w-[680px] flex flex-col gap-4">
                    {messages.map((msg, i) => (
                      <ChatBubble
                        key={msg.id || i}
                        role={msg.role}
                        text={msg.content}
                        tokenCount={msg.tokenCount}
                      />
                    ))}
                  </div>
                )
              )}
            </div>
          </>
        )}
      </div>

      <Toast tone="error" message={error} />
    </div>
  );
}
