import { useContext, useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  CalendarClock, CalendarDays, ClipboardList, CreditCard, Crown, FileText, HeartPulse, House, LogOut, Menu, MessageSquare, MessageSquareText, Search,
  Settings, Sparkles, Star, UserCog, Users, Wallet, X,
} from "lucide-react";
import { authContext } from "@/context/AuthContext";
import { useMessages } from "@/context/MessagesContext";

const PATIENT_HOME = "/users/profile/me";
const DOCTOR_HOME = "/doctors/profile/me";

// the four main places for each role; everything else is under "More"
const MAIN = {
  patient: [
    { key: "home", label: "Home", icon: House, to: PATIENT_HOME },
    { key: "appointments", label: "Visits", icon: CalendarClock, to: `${PATIENT_HOME}?appointments` },
    { key: "find", label: "Find", icon: Search, to: "/doctors" },
    { key: "messages", label: "Messages", icon: MessageSquare, to: "/messages" },
  ],
  doctor: [
    { key: "home", label: "Home", icon: House, to: DOCTOR_HOME },
    { key: "appointments", label: "Visits", icon: CalendarDays, to: `${DOCTOR_HOME}?appointments` },
    { key: "schedule", label: "Schedule", icon: CalendarClock, to: `${DOCTOR_HOME}?schedule` },
    { key: "messages", label: "Messages", icon: MessageSquare, to: "/messages" },
  ],
};

const MORE = {
  patient: [
    { key: "book", label: "Book with AI", icon: MessageSquareText, to: "/book" },
    { key: "prescriptions", label: "Prescriptions", icon: FileText, to: `${PATIENT_HOME}?prescriptions` },
    { key: "health", label: "Health record", icon: HeartPulse, to: `${PATIENT_HOME}?health` },
    { key: "payments", label: "Payments", icon: CreditCard, to: `${PATIENT_HOME}?payments` },
    { key: "family", label: "Family", icon: Users, to: `${PATIENT_HOME}?family` },
    { key: "settings", label: "Settings", icon: Settings, to: `${PATIENT_HOME}?settings` },
    { key: "plans", label: "Plans", icon: Sparkles, to: "/plans" },
    { key: "symptoms", label: "Check symptoms", icon: Sparkles, to: "/symptom-checker" },
  ],
  doctor: [
    { key: "patients", label: "Patients", icon: Users, to: `${DOCTOR_HOME}?patients` },
    { key: "reports", label: "Reports", icon: ClipboardList, to: "/reports" },
    { key: "earnings", label: "Earnings", icon: Wallet, to: `${DOCTOR_HOME}?earnings` },
    { key: "reviews", label: "Reviews", icon: Star, to: `${DOCTOR_HOME}?reviews` },
    { key: "profile", label: "Profile", icon: UserCog, to: `${DOCTOR_HOME}?profile` },
    { key: "plans", label: "Medora Pro", icon: Crown, to: "/plans" },
  ],
};

// pages with their own controls along the bottom edge (chat box, call buttons)
const HIDDEN_ON = ["/messages", "/consultation"];

// which entry matches the page that is open
const activeKey = (role, pathname, search) => {
  const home = role === "doctor" ? DOCTOR_HOME : PATIENT_HOME;
  if (pathname === home) {
    const section = [...new URLSearchParams(search).keys()][0];
    return !section || section === "overview" ? "home" : section;
  }
  if (pathname.startsWith("/messages")) return "messages";
  if (pathname === "/plans") return "plans";
  if (pathname === "/book") return "book";
  if (pathname === "/reports") return "reports";
  if (pathname.startsWith("/symptom-checker")) return "symptoms";
  if (role === "patient" && pathname.startsWith("/doctors")) return "find";
  return "";
};

// app-style bar along the bottom of the screen on phones, for patients and doctors
function BottomNav() {
  const { role, token, dispatch } = useContext(authContext);
  const { unread } = useMessages();
  const { pathname, search } = useLocation();
  const navigate = useNavigate();
  const [moreOpen, setMoreOpen] = useState(false);

  useEffect(() => setMoreOpen(false), [pathname, search]);
  // the sheet closes with Escape like the other pop-ups
  useEffect(() => {
    if (!moreOpen) return;
    const onKey = event => event.key === "Escape" && setMoreOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [moreOpen]);

  if (!token || !MAIN[role] || HIDDEN_ON.some(path => pathname.startsWith(path))) return null;

  const active = activeKey(role, pathname, search);
  const moreActive = MORE[role].some(item => item.key === active);
  const logout = () => {
    dispatch({ type: "LOGOUT" });
    navigate("/");
  };

  return (
    <>
      {/* keeps the footer clear of the bar */}
      <div className="h-[76px] md:hidden" aria-hidden />

      <AnimatePresence>
        {moreOpen && (
          <>
            <motion.button
              type="button"
              aria-label="Close menu"
              className="fixed inset-0 z-[55] bg-slate-950/40 backdrop-blur-[2px] md:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMoreOpen(false)}
            />
            <motion.div
              role="dialog"
              aria-label="More"
              className="fixed inset-x-0 bottom-0 z-[56] rounded-t-3xl border-t border-border bg-popover px-4 pb-[calc(88px+env(safe-area-inset-bottom))] pt-3 shadow-panelShadow md:hidden"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%", transition: { duration: 0.18, ease: "easeIn" } }}
              transition={{ type: "spring", stiffness: 380, damping: 36 }}
            >
              <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-border" />
              <div className="grid grid-cols-3 gap-2">
                {MORE[role].map(({ key, label, icon: Icon, to }) => (
                  <Link
                    key={key}
                    to={to}
                    aria-current={active === key ? "page" : undefined}
                    className={`flex flex-col items-center gap-1.5 rounded-2xl px-2 py-3 text-center text-xs font-semibold transition-colors ${
                      active === key ? "bg-primary/10 text-primary" : "bg-muted/60 text-foreground hover:bg-muted"
                    }`}
                  >
                    <Icon className="h-5 w-5" /> {label}
                  </Link>
                ))}
                <button
                  type="button"
                  onClick={logout}
                  className="flex flex-col items-center gap-1.5 rounded-2xl bg-destructive/10 px-2 py-3 text-xs font-semibold text-destructive"
                >
                  <LogOut className="h-5 w-5" /> Log out
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <nav
        aria-label="Main"
        className="fixed inset-x-0 bottom-0 z-[57] border-t border-border bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl md:hidden print:hidden"
      >
        <ul className="mx-auto grid max-w-md grid-cols-5">
          {MAIN[role].map(({ key, label, icon: Icon, to }) => {
            const on = active === key && !moreOpen;
            return (
              <li key={key}>
                <Link
                  to={to}
                  aria-current={on ? "page" : undefined}
                  className={`relative flex h-16 flex-col items-center justify-center gap-1 text-[11px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring ${
                    on ? "text-primary" : "text-muted-foreground"
                  }`}
                >
                  {on && <motion.span layoutId="bottom-nav" className="absolute top-0 h-0.5 w-8 rounded-full bg-primary" />}
                  <span className="relative">
                    <Icon className="h-5 w-5" />
                    {key === "messages" && unread > 0 && (
                      <span className="absolute -right-2.5 -top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
                        {unread > 9 ? "9+" : unread}
                      </span>
                    )}
                  </span>
                  {label}
                </Link>
              </li>
            );
          })}
          <li>
            <button
              type="button"
              onClick={() => setMoreOpen(open => !open)}
              aria-expanded={moreOpen}
              className={`relative flex h-16 w-full flex-col items-center justify-center gap-1 text-[11px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring ${
                moreOpen || moreActive ? "text-primary" : "text-muted-foreground"
              }`}
            >
              {moreActive && !moreOpen && <motion.span layoutId="bottom-nav" className="absolute top-0 h-0.5 w-8 rounded-full bg-primary" />}
              {moreOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              More
            </button>
          </li>
        </ul>
      </nav>
    </>
  );
}

export default BottomNav;
