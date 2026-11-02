import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Lock, Send, X } from "lucide-react";

const formatTime = time => new Date(time).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" });

// chat panel inside the video call; messages are plain text (React escapes them, no HTML is ever rendered)
function CallChat({ messages, role, otherName, limits, onSend, onClose }) {
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [remaining, setRemaining] = useState(null);
  const listRef = useRef(null);
  const inputRef = useRef(null);

  const maxLength = limits?.maxLength || 500;
  const trimmed = draft.trim();
  const tooLong = trimmed.length > maxLength;

  // keep the newest message in view
  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const send = async () => {
    if (!trimmed || tooLong || sending) return;
    setSending(true);
    const result = await onSend(trimmed);
    setSending(false);
    if (result.ok) {
      setDraft("");
      setError("");
      setRemaining(result.remaining);
    } else {
      setError(result.message);
    }
  };

  const handleKeyDown = e => {
    // Enter sends, Shift+Enter adds a new line
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <motion.aside
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 24 }}
      className="fixed inset-x-0 bottom-0 z-50 flex h-[70vh] flex-col rounded-t-3xl border border-border bg-card shadow-panelShadow lg:static lg:h-auto lg:rounded-3xl"
    >
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <div>
          <p className="font-bold">Chat</p>
          <p className="flex items-center gap-1 text-xs text-muted-foreground">
            <Lock className="h-3 w-3" /> Only you and {otherName}, cleared after the call
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="grid h-9 w-9 place-items-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
          aria-label="Close chat"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {messages.length === 0 && (
          <p className="mt-10 text-center text-sm text-muted-foreground">
            No messages yet. Share links, symptoms or anything you want to note down.
          </p>
        )}
        {messages.map(message => {
          const mine = message.senderRole === role;
          return (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex flex-col ${mine ? "items-end" : "items-start"}`}
            >
              <div
                className={`max-w-[85%] whitespace-pre-wrap break-words rounded-2xl px-4 py-2.5 text-sm leading-6 ${
                  mine ? "rounded-br-md bg-primary text-primary-foreground" : "rounded-bl-md bg-muted text-foreground"
                }`}
              >
                {message.text}
              </div>
              <span className="mt-1 px-1 text-[11px] text-muted-foreground">
                {mine ? "You" : message.senderName} · {formatTime(message.sentAt)}
              </span>
            </motion.div>
          );
        })}
      </div>

      <div className="border-t border-border p-3">
        {error && <p className="mb-2 px-1 text-xs font-medium text-destructive">{error}</p>}
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={draft}
            onChange={e => {
              setDraft(e.target.value);
              if (error) setError("");
            }}
            onKeyDown={handleKeyDown}
            rows={1}
            placeholder="Type a message…"
            aria-label="Message"
            className="max-h-32 min-h-[44px] flex-1 resize-none rounded-2xl border border-input bg-background/60 px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/15"
          />
          <button
            type="button"
            onClick={send}
            disabled={!trimmed || tooLong || sending}
            className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground transition-all hover:bg-primary/90 active:scale-95 disabled:opacity-40"
            aria-label="Send message"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-1.5 flex justify-between px-1 text-[11px] text-muted-foreground">
          <span>{remaining !== null && remaining <= 10 ? `${remaining} messages left in this call` : "Enter to send · Shift+Enter for a new line"}</span>
          <span className={tooLong ? "font-semibold text-destructive" : ""}>
            {trimmed.length}/{maxLength}
          </span>
        </div>
      </div>
    </motion.aside>
  );
}

export default CallChat;
