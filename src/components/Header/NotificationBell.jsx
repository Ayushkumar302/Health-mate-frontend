import { useContext, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { AlarmClock, Bell, BellOff, CalendarCheck2, CalendarClock, CheckCheck, Crown, Gift, ShieldCheck, Sparkles, Star } from 'lucide-react';
import { toast } from 'react-toastify';
import { authContext } from '@/context/AuthContext';
import { useMessages } from '@/context/MessagesContext';
import { apiRequest } from '@/utils/api';
import Spinner from '@/components/ui/spinner';

const ICONS = { booking: CalendarClock, plan: Crown, plus: Sparkles, account: ShieldCheck, offer: Gift, review: Star, reminder: AlarmClock, waitlist: CalendarCheck2 };

// "just now", "5 min ago", "3 h ago", "2 d ago", then the date
const ago = date => {
  const minutes = Math.floor((Date.now() - new Date(date)) / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes} min ago`;
  if (minutes < 24 * 60) return `${Math.floor(minutes / 60)} h ago`;
  if (minutes < 7 * 24 * 60) return `${Math.floor(minutes / 1440)} d ago`;
  return new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
};

// the bell in the header: booking updates, plan renewals and reminders, kept for 60 days
const NotificationBell = () => {
  const { token } = useContext(authContext);
  const { notificationsUnread, setNotificationsUnread, subscribe } = useMessages();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState(null);
  // "Offers and tips": upgrade suggestions, at most one every 15 days
  const [offers, setOffers] = useState(null);
  const ref = useRef(null);
  const navigate = useNavigate();

  // load the list each time the bell is opened
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    apiRequest('/notifications', { token })
      .then(result => {
        if (cancelled) return;
        setItems(result.data.items);
        setNotificationsUnread(result.data.unread);
        setOffers(result.data.offers);
      })
      .catch(() => !cancelled && setItems(current => current || []));
    return () => {
      cancelled = true;
    };
  }, [open, token, setNotificationsUnread]);

  // new ones arrive live while the list is open
  useEffect(
    () =>
      subscribe((event, payload) => {
        if (event === 'notification:new') setItems(current => (current ? [payload, ...current.filter(item => item._id !== payload._id)] : current));
      }),
    [subscribe]
  );

  // close when clicking outside
  useEffect(() => {
    if (!open) return;
    const onClick = event => {
      if (ref.current && !ref.current.contains(event.target)) setOpen(false);
    };
    const onKey = event => event.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const markAllRead = async () => {
    setItems(current => current?.map(item => ({ ...item, readAt: item.readAt || new Date().toISOString() })));
    setNotificationsUnread(0);
    await apiRequest('/notifications/read', { token, method: 'PUT' }).catch(() => {});
  };

  const toggleOffers = async () => {
    const on = !offers;
    setOffers(on);
    try {
      const result = await apiRequest('/notifications/offers', { token, method: 'PUT', body: { on } });
      toast.success(result.message);
    } catch (error) {
      setOffers(!on);
      toast.error(error.message);
    }
  };

  const openItem = item => {
    if (!item.readAt) {
      setItems(current => current.map(entry => (entry._id === item._id ? { ...entry, readAt: new Date().toISOString() } : entry)));
      setNotificationsUnread(count => Math.max(0, count - 1));
      apiRequest(`/notifications/${item._id}/read`, { token, method: 'PUT' }).catch(() => {});
    }
    setOpen(false);
    if (item.link) navigate(item.link);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(value => !value)}
        className="relative grid h-10 w-10 place-items-center rounded-full border border-border bg-card/70 text-foreground transition-colors hover:border-primary/50 hover:text-primary"
        aria-label={notificationsUnread ? `Notifications, ${notificationsUnread} unread` : 'Notifications'}
        aria-expanded={open}
        title="Notifications"
      >
        <Bell className="h-[18px] w-[18px]" />
        {notificationsUnread > 0 && (
          <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full border-2 border-background bg-destructive px-1 text-[10px] font-bold text-white">
            {notificationsUnread > 9 ? '9+' : notificationsUnread}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-x-4 top-[72px] z-50 origin-top rounded-2xl border border-border bg-popover shadow-panelShadow sm:absolute sm:inset-x-auto sm:right-0 sm:top-auto sm:mt-2 sm:w-96 sm:origin-top-right"
          >
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <p className="font-bold">Notifications</p>
              {items?.some(item => !item.readAt) && (
                <button type="button" onClick={markAllRead} className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline">
                  <CheckCheck className="h-3.5 w-3.5" /> Mark all read
                </button>
              )}
            </div>
            <div className="max-h-[min(28rem,70vh)] overflow-y-auto p-1.5">
              {!items && <div className="grid place-items-center py-10"><Spinner /></div>}
              {items?.length === 0 && (
                <div className="flex flex-col items-center gap-2 px-6 py-10 text-center text-sm text-muted-foreground">
                  <BellOff className="h-6 w-6" />
                  You&apos;re all caught up. Booking updates and plan reminders show up here.
                </div>
              )}
              {items?.map(item => {
                const Icon = ICONS[item.kind] || Bell;
                return (
                  <button
                    key={item._id}
                    type="button"
                    onClick={() => openItem(item)}
                    className={`flex w-full items-start gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-muted ${item.readAt ? '' : 'bg-primary/5'}`}
                  >
                    <span className={`mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full ${item.readAt ? 'bg-muted text-muted-foreground' : 'bg-primary/15 text-primary'}`}>
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className={`block text-sm ${item.readAt ? 'font-medium' : 'font-bold'}`}>{item.title}</span>
                      {item.text && <span className="line-clamp-2 block text-xs text-muted-foreground">{item.text}</span>}
                      <span className="mt-0.5 block text-[11px] text-muted-foreground">{ago(item.createdAt)}</span>
                    </span>
                    {!item.readAt && <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-primary" aria-label="Unread" />}
                  </button>
                );
              })}
            </div>
            {offers !== null && (
              <div className="flex items-center justify-between gap-3 border-t border-border px-4 py-2.5 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5"><Gift className="h-3.5 w-3.5" /> Offers and tips {offers ? '(at most one every 15 days)' : 'are off'}</span>
                <button type="button" onClick={toggleOffers} className="shrink-0 font-semibold text-primary hover:underline">
                  {offers ? 'Turn off' : 'Turn on'}
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationBell;
