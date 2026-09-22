import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { streamSSE } from '../api/client';
import Icon from '../components/ui/Icon';
import Chip from '../components/ui/Chip';
import Textarea from '../components/ui/Textarea';
import ChatBubble from '../components/ui/ChatBubble';
import CornerFrame from '../components/ui/CornerFrame';

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
    <div className="flex flex-col h-full overflow-hidden">

      {/* Top bar */}
      <div className="flex items-center gap-3 px-6 py-2.5 border-b border-hairline bg-surface shrink-0">
        <span className="font-mono text-[10px] text-ink-3 tracking-micro">
          {sessionId ? `SESSION · ${sessionId.slice(0, 8).toUpperCase()}` : 'NEW SESSION'}
        </span>

        <Chip onClick={newSession} label="Clear" icon="clear" />

        <div className="ml-auto">
          <Chip
            onClick={() => setShowCode(v => !v)}
            label={showCode ? 'Code context' : 'Code context'}
            icon={showCode ? 'checkmark' : 'code-context'}
            active={showCode}
          />
        </div>
      </div>

      {/* Code context panel */}
      {showCode && (
        <div className="px-6 py-3 border-b border-hairline bg-surface shrink-0">
          <Textarea
            value={codeContext}
            onChange={e => setCode(e.target.value)}
            placeholder="Paste your code here for context…"
            rows={5}
          />
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-8">
        <div className="max-w-[720px] mx-auto flex flex-col gap-6">

          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center text-center gap-4 py-20 px-5">
              <CornerFrame>
                <div className="w-[52px] h-[52px] bg-surface border border-hairline flex items-center justify-center text-accent">
                  <Icon name="chat" size={22} />
                </div>
              </CornerFrame>
              <div>
                <p className="font-display text-[22px] font-bold text-ink mb-2.5">
                  Ask anything about your code
                </p>
                <p className="text-sm text-ink-2 max-w-[360px] leading-relaxed">
                  I can explain, debug, refactor, and analyze. Paste a snippet
                  using the Code context button for inline help.
                </p>
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <ChatBubble
              key={i}
              role={msg.role}
              text={msg.text}
              userInitial={user?.email?.[0]}
              error={msg.error}
              cursor={msg.role === 'assistant' && streaming && i === messages.length - 1}
            />
          ))}

          <div ref={bottomRef} />
        </div>
      </div>

      {/* Input bar */}
      <div className="shrink-0 px-6 pt-4 pb-5 border-t border-hairline bg-surface">
        <form onSubmit={sendMessage} className="max-w-[720px] mx-auto flex gap-2.5 items-center">
          <input
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            disabled={streaming}
            placeholder={streaming ? 'Agent is thinking…' : 'Ask a question about your code…'}
            className="flex-1 bg-card border border-hairline px-[18px] py-3 text-sm text-ink font-sans
              outline-none focus-visible:border-accent placeholder:text-ink-3 disabled:opacity-60"
          />

          <button
            type="submit"
            disabled={!canSend}
            className={`flex items-center justify-center px-4 py-3 border shrink-0 transition-colors duration-150
              ${canSend
                ? 'bg-accent border-accent text-bg cursor-pointer hover:opacity-90'
                : 'bg-card border-hairline text-ink-3 cursor-not-allowed'}`}
          >
            <Icon name={streaming ? 'spinner' : 'arrow-up'} size={16} className={streaming ? 'spin' : ''} />
          </button>
        </form>

        <p className="text-center font-mono text-[10px] text-ink-3 tracking-micro mt-2">
          Powered by Gemini · Conversations are saved automatically
        </p>
      </div>
    </div>
  );
}
