import Avatar from './Avatar';

/**
 * ChatBubble — one message in a conversation, shared by Chat.jsx and
 * Sessions.jsx (they used to duplicate ~120 lines of near-identical
 * bubble markup between them).
 *
 * `role`: 'user' | 'assistant' (Chat.jsx's shape) or 'USER' | 'ASSISTANT'
 * (Sessions.jsx's shape, from the stored message entity) — normalized here.
 * `userInitial`: shown on the user avatar.
 * `tokenCount`: optional, shown as a small footnote under assistant text.
 * `streaming` / `cursor`: show the blinking cursor after the text.
 * `error`: renders in the error tone instead of the normal card tone.
 */
export default function ChatBubble({ role, text, userInitial, tokenCount, cursor = false, error = false }) {
  const isUser = role === 'user' || role === 'USER';

  return (
    <div className={`msg-enter flex items-end gap-2.5 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && <Avatar kind="ai" initial="AI" size={26} />}

      <div
        className={`max-w-[78%] px-4 py-3 text-[13px] leading-relaxed whitespace-pre-wrap break-words
          bg-card border border-l-[3px]
          ${error
            ? 'border-error text-error'
            : isUser
              ? 'border-hairline border-l-accent text-ink'
              : 'border-hairline border-l-accent-ink text-ink'
          }`}
      >
        {text}
        {tokenCount > 0 && (
          <div className="mt-1.5 font-mono text-[9px] tracking-micro text-ink-3">
            {tokenCount} tokens
          </div>
        )}
        {cursor && <span className="cursor-blink" />}
      </div>

      {isUser && <Avatar kind="user" initial={userInitial ?? 'U'} size={26} />}
    </div>
  );
}
