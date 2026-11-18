import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, ArrowUp, Info, Sparkles } from "lucide-react";
import Spinner from "@/components/ui/spinner";

// The pieces both assistants are built from (booking for patients, reports for doctors):
// the conversation, a message from either side, suggestions and the box to type in.

// The chat window: messages scroll inside it and the typing box stays at its bottom, so the page itself
// doesn't scroll under the header. Sized to the screen (and above the bottom menu bar on phones).
export const ChatPanel = ({ children, footer }) => (
  <div className="flex h-[calc(100dvh-19rem)] min-h-[420px] flex-col overflow-hidden rounded-3xl border border-border bg-card/70 shadow-soft md:h-[min(760px,calc(100dvh-14rem))]">
    {children}
    <div className="border-t border-border bg-background/80 p-3 backdrop-blur">{footer}</div>
  </div>
);

// newest message at the bottom; screen readers read new messages out as they arrive.
// A new answer is shown from its start (long answers are read from the top).
// `version` changes when a message grows after it arrived (e.g. a booking's status loads), to scroll again.
export const ChatLog = ({ label, count, busy, version, children }) => {
  const box = useRef(null);
  const opened = useRef(false);
  useEffect(() => {
    const element = box.current;
    if (!element || count === 0) return;
    // a conversation kept from before opens at its end
    if (!opened.current) {
      opened.current = true;
      element.scrollTop = element.scrollHeight;
      return;
    }
    const messages = element.querySelectorAll(":scope > [data-message]");
    const last = messages[messages.length - 1];
    const top = busy || !last ? element.scrollHeight : last.offsetTop - 16;
    element.scrollTo({ top, behavior: "smooth" });
  }, [count, busy, version]);
  return (
    <div ref={box} role="log" aria-live="polite" aria-label={label} tabIndex={0} className="relative flex-1 space-y-5 overflow-y-auto overscroll-contain p-4 focus-visible:outline-none sm:p-6">
      {children}
      {busy && (
        <BotMessage>
          <p className="inline-flex items-center gap-2 rounded-2xl rounded-tl-md bg-muted/70 px-4 py-3 text-sm text-muted-foreground">
            <Spinner className="h-4 w-4" /> Thinking…
          </p>
        </BotMessage>
      )}
    </div>
  );
};

export const MyMessage = ({ children }) => (
  <motion.div data-message initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="flex justify-end">
    <p className="max-w-[85%] whitespace-pre-wrap break-words rounded-2xl rounded-br-md bg-primary px-4 py-2.5 text-sm text-primary-foreground">{children}</p>
  </motion.div>
);

export const BotMessage = ({ children }) => (
  <motion.div data-message initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="flex items-start gap-2.5">
    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary/10 text-primary" aria-hidden>
      <Sparkles className="h-4 w-4" />
    </span>
    <div className="min-w-0 flex-1 space-y-3">{children}</div>
  </motion.div>
);

export const BotText = ({ children, error }) => (
  <p
    className={`w-fit max-w-full whitespace-pre-wrap break-words rounded-2xl rounded-tl-md px-4 py-2.5 text-sm ${
      error ? "bg-destructive/10 text-destructive" : "bg-muted/70"
    }`}
  >
    {error && <AlertTriangle className="mr-1.5 inline h-4 w-4 align-[-3px]" />}
    {children}
  </p>
);

// small print under an answer (why the rules answered, who the visit is for)
export const Note = ({ children }) => (
  <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
    <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" /> <span>{children}</span>
  </p>
);

export const Suggestions = ({ items, onPick, disabled, label = "Suggestions" }) =>
  items?.length ? (
    <div className="flex flex-wrap gap-2" role="group" aria-label={label}>
      {items.map(item => {
        const text = typeof item === "string" ? item : item.label;
        return (
          <button
            key={text}
            type="button"
            disabled={disabled}
            onClick={() => onPick(item)}
            className="rounded-full border border-border bg-card px-3 py-1.5 text-left text-xs font-semibold text-foreground transition-colors hover:border-primary/50 hover:text-primary disabled:opacity-50"
          >
            {text}
            {item.hint && <span className="ml-1 font-normal text-muted-foreground">· {item.hint}</span>}
          </button>
        );
      })}
    </div>
  ) : null;

// the box to type in (at the bottom of the chat window)
export const Composer = ({ onSend, busy, placeholder, label, left, inputRef }) => {
  const [text, setText] = useState("");
  const submit = event => {
    event.preventDefault();
    const value = text.trim();
    if (!value || busy || left === 0) return;
    onSend(value);
    setText("");
  };
  return (
    <form onSubmit={submit} className="rounded-2xl border border-input bg-background focus-within:border-primary/60 focus-within:ring-2 focus-within:ring-ring/30">
      <div className="flex items-center gap-2">
        <input
          ref={inputRef}
          value={text}
          onChange={event => setText(event.target.value)}
          maxLength={200}
          placeholder={left === 0 ? "No messages left today" : placeholder}
          aria-label={label}
          disabled={left === 0}
          className="h-11 min-w-0 flex-1 rounded-xl bg-transparent px-3 text-sm placeholder:text-muted-foreground focus:outline-none disabled:cursor-not-allowed"
        />
        <button
          type="submit"
          disabled={busy || !text.trim() || left === 0}
          aria-label="Send"
          className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground transition-opacity hover:bg-primary/90 disabled:opacity-40"
        >
          {busy ? <Spinner className="h-4 w-4 text-primary-foreground" /> : <ArrowUp className="h-5 w-5" />}
        </button>
      </div>
      {left != null && (
        <p className="px-3 pb-1 pt-1.5 text-[11px] text-muted-foreground">
          {left === 0 ? "You've used today's messages. They start again tomorrow." : `${left} message${left === 1 ? "" : "s"} left today`}
        </p>
      )}
    </form>
  );
};
