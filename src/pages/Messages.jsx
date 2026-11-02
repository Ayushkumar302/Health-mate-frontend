import { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, Check, CheckCheck, ClipboardList, Lock, MessageSquarePlus, MessagesSquare, Search, SendHorizontal, Stethoscope } from "lucide-react";
import { toast } from "react-toastify";
import { authContext } from "@/context/AuthContext";
import { useMessages } from "@/context/MessagesContext";
import { apiRequest } from "@/utils/api";
import Avatar from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import Spinner from "@/components/ui/spinner";
import Modal from "@/components/ui/modal";
import { EmptyState } from "@/components/Dashboard/DashboardUI";
import PatientRecordModal from "@/components/Records/PatientRecordModal";

const sameDay = (a, b) => new Date(a).toDateString() === new Date(b).toDateString();

const dayLabel = date => {
  const today = new Date();
  const yesterday = new Date(Date.now() - 86400000);
  if (sameDay(date, today)) return "Today";
  if (sameDay(date, yesterday)) return "Yesterday";
  return new Date(date).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
};

const timeLabel = date => new Date(date).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" });

// short time for the conversation list: "4:30 pm", "Yesterday", "12 Oct"
const listTime = date => {
  if (!date) return "";
  if (sameDay(date, new Date())) return timeLabel(date);
  if (sameDay(date, new Date(Date.now() - 86400000))) return "Yesterday";
  return new Date(date).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
};

const otherLabel = other => (other.role === "doctor" ? other.specialization || "Doctor" : "Patient");

const ConversationRow = ({ conversation, active, myRole }) => {
  const { other, lastMessage, unread } = conversation;
  return (
    <Link
      to={`/messages/${conversation._id}`}
      className={`flex items-center gap-3 rounded-2xl px-3 py-3 transition-colors ${active ? "bg-primary/10" : "hover:bg-muted"}`}
    >
      <Avatar src={other.photo} name={other.name} className="h-11 w-11" textClassName="text-xs" />
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <p className={`truncate text-sm ${unread ? "font-bold" : "font-semibold"}`}>{other.name}</p>
          <span className="shrink-0 text-[11px] text-muted-foreground">{listTime(lastMessage?.at)}</span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <p className={`truncate text-xs ${unread ? "font-medium text-foreground" : "text-muted-foreground"}`}>
            {lastMessage ? `${lastMessage.senderRole === myRole ? "You: " : ""}${lastMessage.text}` : <span className="capitalize">{otherLabel(other)}</span>}
          </p>
          {unread > 0 && (
            <span className="grid h-5 min-w-5 shrink-0 place-items-center rounded-full bg-primary px-1.5 text-[11px] font-bold text-primary-foreground">
              {unread}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
};

// pick a doctor (or patient) to start a conversation with
const NewMessagePicker = ({ open, onClose, onPick, role }) => {
  const { token } = useContext(authContext);
  const [contacts, setContacts] = useState(null);

  useEffect(() => {
    if (!open) return;
    apiRequest("/messages/contacts", { token })
      .then(result => setContacts(result.data))
      .catch(error => toast.error(error.message));
  }, [open, token]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="sm"
      icon={MessageSquarePlus}
      title="New message"
      subtitle={role === "doctor" ? "Your patients" : "Doctors you have booked"}
    >
      {!contacts && <div className="flex justify-center py-8"><Spinner /></div>}
      {contacts?.length === 0 && (
        <EmptyState
          icon={Stethoscope}
          title={role === "doctor" ? "No patients yet" : "No doctors yet"}
          text={role === "doctor" ? "Patients who book you will show up here." : "Book an appointment first, then you can message that doctor."}
        />
      )}
      <ul className="space-y-1">
        {contacts?.map(contact => (
          <li key={contact._id}>
            <button
              type="button"
              onClick={() => onPick(contact._id)}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left hover:bg-muted"
            >
              <Avatar src={contact.photo} name={contact.name} className="h-10 w-10" textClassName="text-xs" />
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold">{contact.name}</span>
                <span className="block truncate text-xs capitalize text-muted-foreground">{contact.specialization || "Patient"}</span>
              </span>
            </button>
          </li>
        ))}
      </ul>
    </Modal>
  );
};

const Thread = ({ conversation, myRole, onBack }) => {
  const { token } = useContext(authContext);
  const { subscribe, sendTyping } = useMessages();
  const [messages, setMessages] = useState([]);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [maxLength, setMaxLength] = useState(1000);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [typing, setTyping] = useState(false);
  const [recordOpen, setRecordOpen] = useState(false);
  const listRef = useRef(null);
  const stickToBottomRef = useRef(true);
  const typingTimerRef = useRef(null);
  const { other } = conversation;
  const id = conversation._id;

  const scrollToBottom = () => {
    const list = listRef.current;
    if (list) list.scrollTop = list.scrollHeight;
  };

  const markRead = useCallback(
    () => apiRequest(`/messages/conversations/${id}/read`, { token, method: "PUT" }).catch(() => {}),
    [id, token]
  );

  const addMessage = message =>
    setMessages(list => (list.some(item => item._id === message._id) ? list : [...list, message]));

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    apiRequest(`/messages/conversations/${id}/messages`, { token })
      .then(result => {
        if (cancelled) return;
        setMessages(result.data.messages);
        setHasMore(result.data.hasMore);
        setMaxLength(result.data.limits.maxLength);
        stickToBottomRef.current = true;
        markRead();
      })
      .catch(error => toast.error(error.message))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [id, token, markRead]);

  // live updates for this conversation
  useEffect(
    () =>
      subscribe((event, payload) => {
        if (payload.conversationId !== id) return;
        if (event === "dm:new") {
          stickToBottomRef.current = true;
          addMessage(payload.message);
          if (payload.message.senderRole !== myRole) {
            setTyping(false);
            markRead();
          }
        }
        if (event === "dm:read" && payload.readBy !== myRole) {
          setMessages(list => list.map(item => (item.senderRole === myRole && !item.readAt ? { ...item, readAt: payload.readAt } : item)));
        }
        if (event === "dm:typing") {
          setTyping(true);
          clearTimeout(typingTimerRef.current);
          typingTimerRef.current = setTimeout(() => setTyping(false), 3500);
        }
      }),
    [subscribe, id, myRole, markRead]
  );

  useEffect(() => () => clearTimeout(typingTimerRef.current), []);

  useEffect(() => {
    if (stickToBottomRef.current) scrollToBottom();
  }, [messages, typing]);

  const loadOlder = async () => {
    if (!messages[0]) return;
    setLoadingOlder(true);
    const list = listRef.current;
    const previousHeight = list.scrollHeight;
    try {
      const result = await apiRequest(`/messages/conversations/${id}/messages?before=${encodeURIComponent(messages[0].createdAt)}`, { token });
      stickToBottomRef.current = false;
      setMessages(current => [...result.data.messages, ...current]);
      setHasMore(result.data.hasMore);
      // keep the view where it was instead of jumping
      requestAnimationFrame(() => {
        list.scrollTop = list.scrollHeight - previousHeight;
      });
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoadingOlder(false);
    }
  };

  const send = async event => {
    event?.preventDefault();
    const body = text.trim();
    if (!body || sending) return;
    setSending(true);
    try {
      const result = await apiRequest(`/messages/conversations/${id}/messages`, { token, method: "POST", body: { text: body } });
      stickToBottomRef.current = true;
      addMessage(result.data);
      setText("");
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSending(false);
    }
  };

  const onKeyDown = event => {
    // Enter sends, Shift+Enter adds a new line
    if (event.key === "Enter" && !event.shiftKey) send(event);
  };

  const onChange = event => {
    setText(event.target.value);
    sendTyping(id);
  };

  const lastMine = [...messages].reverse().find(item => item.senderRole === myRole);
  const nearLimit = text.length > maxLength * 0.8;

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* header */}
      <div className="flex items-center gap-3 border-b border-border px-4 py-3">
        <button type="button" onClick={onBack} className="grid h-9 w-9 place-items-center rounded-full hover:bg-muted lg:hidden" aria-label="Back to conversations">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <Avatar src={other.photo} name={other.name} className="h-10 w-10" textClassName="text-xs" />
        <div className="min-w-0 flex-1">
          <p className="truncate font-bold">{other.name}</p>
          <p className="truncate text-xs capitalize text-muted-foreground">
            {typing ? <span className="font-semibold normal-case text-highlight">typing…</span> : otherLabel(other)}
          </p>
        </div>
        {myRole === "doctor" ? (
          <Button size="sm" variant="outline" onClick={() => setRecordOpen(true)}>
            <ClipboardList className="h-4 w-4" /> <span className="hidden sm:inline">Health record</span>
          </Button>
        ) : (
          <Link to={`/doctors/${other._id}`}>
            <Button size="sm" variant="outline"><Stethoscope className="h-4 w-4" /> <span className="hidden sm:inline">Book again</span></Button>
          </Link>
        )}
      </div>

      {/* messages */}
      <div
        ref={listRef}
        onScroll={event => {
          const list = event.currentTarget;
          stickToBottomRef.current = list.scrollHeight - list.scrollTop - list.clientHeight < 80;
        }}
        className="flex-1 space-y-1 overflow-y-auto bg-muted/30 px-4 py-4"
      >
        <p className="mx-auto mb-4 flex max-w-md items-start gap-2 rounded-xl bg-card px-3 py-2 text-center text-xs text-muted-foreground">
          <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-highlight" />
          Only you and {other.name} can read these messages. For emergencies call 112, don&apos;t wait for a reply.
        </p>
        {loading && <div className="flex justify-center py-10"><Spinner /></div>}
        {!loading && hasMore && (
          <div className="flex justify-center pb-2">
            <Button size="sm" variant="ghost" disabled={loadingOlder} onClick={loadOlder}>
              {loadingOlder ? <Spinner className="h-4 w-4" /> : "Load earlier messages"}
            </Button>
          </div>
        )}
        {!loading && messages.length === 0 && (
          <EmptyState icon={MessagesSquare} title="Say hello" text={`Ask ${other.name} a question about your treatment, reports or next visit.`} />
        )}
        {messages.map((message, index) => {
          const mine = message.senderRole === myRole;
          const previous = messages[index - 1];
          const newDay = !previous || !sameDay(previous.createdAt, message.createdAt);
          const grouped = previous && !newDay && previous.senderRole === message.senderRole;
          return (
            <div key={message._id}>
              {newDay && (
                <p className="my-3 text-center text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{dayLabel(message.createdAt)}</p>
              )}
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${mine ? "justify-end" : "justify-start"} ${grouped ? "mt-0.5" : "mt-2"}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-sm shadow-sm sm:max-w-[65%] ${
                    mine ? "rounded-br-md bg-primary text-primary-foreground" : "rounded-bl-md bg-card text-foreground"
                  }`}
                >
                  <p className="whitespace-pre-wrap break-words">{message.text}</p>
                  <p className={`mt-1 flex items-center justify-end gap-1 text-[10px] ${mine ? "text-primary-foreground/75" : "text-muted-foreground"}`}>
                    {timeLabel(message.createdAt)}
                    {mine && (message.readAt ? <CheckCheck className="h-3.5 w-3.5" /> : <Check className="h-3.5 w-3.5" />)}
                  </p>
                </div>
              </motion.div>
              {mine && message._id === lastMine?._id && message.readAt && (
                <p className="mt-0.5 text-right text-[10px] text-muted-foreground">Seen {timeLabel(message.readAt)}</p>
              )}
            </div>
          );
        })}
        <AnimatePresence>
          {typing && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mt-2 flex">
              <span className="flex gap-1 rounded-2xl rounded-bl-md bg-card px-3.5 py-3 shadow-sm">
                {[0, 1, 2].map(dot => (
                  <motion.span
                    key={dot}
                    className="h-1.5 w-1.5 rounded-full bg-muted-foreground"
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 1, repeat: Infinity, delay: dot * 0.2 }}
                  />
                ))}
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* composer */}
      <form onSubmit={send} className="border-t border-border p-3">
        <div className="flex items-end gap-2">
          <textarea
            value={text}
            onChange={onChange}
            onKeyDown={onKeyDown}
            maxLength={maxLength}
            rows={Math.min(4, text.split("\n").length)}
            placeholder={`Message ${other.name}`}
            className="max-h-32 min-h-[44px] flex-1 resize-none rounded-2xl border border-input bg-background px-4 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/15"
            aria-label="Message"
          />
          <Button type="submit" size="icon" className="h-11 w-11 shrink-0 rounded-full" disabled={!text.trim() || sending} aria-label="Send">
            {sending ? <Spinner className="h-4 w-4 text-primary-foreground" /> : <SendHorizontal className="h-5 w-5" />}
          </Button>
        </div>
        <p className="mt-1.5 flex justify-between px-2 text-[11px] text-muted-foreground">
          <span>Enter to send · Shift + Enter for a new line</span>
          {nearLimit && <span className={text.length >= maxLength ? "font-semibold text-destructive" : ""}>{text.length}/{maxLength}</span>}
        </p>
      </form>

      {myRole === "doctor" && (
        <PatientRecordModal open={recordOpen} onClose={() => setRecordOpen(false)} patientId={other._id} patientName={other.name} />
      )}
    </div>
  );
};

function Messages() {
  const { conversationId } = useParams();
  const [searchParams] = useSearchParams();
  const { token, role } = useContext(authContext);
  const { subscribe } = useMessages();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [search, setSearch] = useState("");
  const myRole = role === "doctor" ? "doctor" : "patient";
  const activeIdRef = useRef(conversationId);
  activeIdRef.current = conversationId;

  const loadConversations = useCallback(
    () =>
      apiRequest("/messages/conversations", { token })
        .then(result => setConversations(result.data))
        .catch(error => {
          toast.error(error.message);
          setConversations([]);
        }),
    [token]
  );

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // open (or start) a conversation with someone, e.g. from a "Message" button: /messages?with=<id>
  const openWith = useCallback(
    async participantId => {
      try {
        const result = await apiRequest("/messages/conversations", { token, method: "POST", body: { participantId } });
        setConversations(list => (list?.some(item => item._id === result.data._id) ? list : [result.data, ...(list || [])]));
        navigate(`/messages/${result.data._id}`, { replace: true });
      } catch (error) {
        toast.error(error.message);
        navigate("/messages", { replace: true });
      }
    },
    [token, navigate]
  );

  useEffect(() => {
    const participantId = searchParams.get("with");
    if (participantId) openWith(participantId);
  }, [searchParams, openWith]);

  // keep the list fresh: newest conversation on top, unread counts
  useEffect(
    () =>
      subscribe((event, payload) => {
        if (event === "dm:new") {
          setConversations(list => {
            if (!list) return list;
            const existing = list.find(item => item._id === payload.conversationId);
            if (!existing) {
              loadConversations();
              return list;
            }
            const updated = {
              ...existing,
              lastMessage: payload.lastMessage,
              unread: payload.conversationId === activeIdRef.current ? 0 : payload.unread,
            };
            return [updated, ...list.filter(item => item._id !== payload.conversationId)];
          });
        }
        if (event === "dm:read" && payload.readBy === myRole) {
          setConversations(list => list?.map(item => (item._id === payload.conversationId ? { ...item, unread: 0 } : item)));
        }
      }),
    [subscribe, loadConversations, myRole]
  );

  const active = conversations?.find(item => item._id === conversationId);
  const filtered = useMemo(
    () => (conversations || []).filter(item => item.other.name.toLowerCase().includes(search.trim().toLowerCase())),
    [conversations, search]
  );

  return (
    <section className="py-6 sm:py-8">
      <div className="container">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Messages</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {role === "doctor" ? "Follow up with your patients between visits." : "Ask your doctors about reports, medicines or your next visit."}
            </p>
          </div>
          <Button onClick={() => setPickerOpen(true)}>
            <MessageSquarePlus className="h-4 w-4" /> New message
          </Button>
        </div>

        <div className="card-surface grid h-[calc(100vh-220px)] min-h-[520px] overflow-hidden lg:grid-cols-[340px_1fr]">
          {/* conversation list */}
          <aside className={`flex min-h-0 flex-col border-border lg:border-r ${conversationId ? "hidden lg:flex" : "flex"}`}>
            <div className="border-b border-border p-3">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  value={search}
                  onChange={event => setSearch(event.target.value)}
                  placeholder="Search conversations"
                  className="h-10 w-full rounded-xl border border-input bg-background/60 pl-9 pr-3 text-sm focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/15"
                />
              </div>
            </div>
            <div className="flex-1 space-y-1 overflow-y-auto p-2">
              {!conversations && Array.from({ length: 4 }, (_, index) => <div key={index} className="skeleton m-1 h-14 rounded-2xl" />)}
              {conversations?.length === 0 && (
                <EmptyState
                  icon={MessagesSquare}
                  title="No conversations yet"
                  text={role === "doctor" ? "Start one with any of your patients." : "You can message any doctor you have booked."}
                  action={<Button size="sm" variant="soft" onClick={() => setPickerOpen(true)}>New message</Button>}
                />
              )}
              {filtered.map(conversation => (
                <ConversationRow key={conversation._id} conversation={conversation} active={conversation._id === conversationId} myRole={myRole} />
              ))}
            </div>
          </aside>

          {/* thread */}
          <div className={`min-h-0 ${conversationId ? "block" : "hidden lg:block"}`}>
            {active ? (
              <Thread key={active._id} conversation={active} myRole={myRole} onBack={() => navigate("/messages")} />
            ) : conversationId && !conversations ? (
              <div className="flex h-full items-center justify-center"><Spinner /></div>
            ) : (
              <div className="flex h-full items-center justify-center">
                <EmptyState
                  icon={MessagesSquare}
                  title={conversationId ? "Conversation not found" : "Select a conversation"}
                  text="Messages are saved, so you can pick up where you left off on any device."
                />
              </div>
            )}
          </div>
        </div>
      </div>

      <NewMessagePicker
        open={pickerOpen}
        role={role}
        onClose={() => setPickerOpen(false)}
        onPick={participantId => {
          setPickerOpen(false);
          openWith(participantId);
        }}
      />
    </section>
  );
}

export default Messages;
