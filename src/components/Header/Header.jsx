import { useContext, useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { LayoutDashboard, LogOut, Menu, MessageSquare, X } from 'lucide-react';
import { useMessages } from '../../context/MessagesContext.jsx';
import { dashboardPathFor } from '@/brand';
import { authContext } from '../../context/AuthContext.jsx';
import Logo from '../Brand/Logo';
import ThemeToggle from '../Theme/ThemeToggle';
import Avatar from '../ui/avatar';
import { Button } from '../ui/button';

const navLinks = [
  { path: '/', display: 'Home' },
  { path: '/doctors', display: 'Find a Doctor' },
  { path: '/services', display: 'Services' },
  { path: '/contact', display: 'Contact' },
];

// "/" should also be active on the /home alias, other links match their own section
// the doctor dashboard (/doctors/profile/me) is not part of "Find a Doctor"
const isLinkActive = (path, pathname) => {
  if (path === '/') return pathname === '/' || pathname === '/home';
  if (pathname === '/doctors/profile/me') return false;
  return pathname === path || pathname.startsWith(`${path}/`);
};

function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const accountRef = useRef(null);
  const { user, role, token, dispatch } = useContext(authContext);
  const location = useLocation();
  const { pathname } = location;
  // after logging in, come back to the page the visitor was on
  const loginState = ['/login', '/register'].includes(pathname) ? undefined : { from: location };
  const navigate = useNavigate();

  const dashboardPath = dashboardPathFor(role);
  const { unread } = useMessages();
  const canMessage = role === 'patient' || role === 'doctor';

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // close menus when the page changes
  useEffect(() => {
    setMenuOpen(false);
    setAccountOpen(false);
  }, [pathname]);

  // close the account dropdown when clicking outside it
  useEffect(() => {
    if (!accountOpen) return;
    const onClick = e => {
      if (accountRef.current && !accountRef.current.contains(e.target)) setAccountOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [accountOpen]);

  const handleLogout = () => {
    dispatch({ type: 'LOGOUT' });
    navigate('/');
  };

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        isScrolled ? 'glass border-x-0 border-t-0 shadow-soft' : 'border-b border-transparent bg-transparent'
      }`}
    >
      <div className="container flex h-[72px] items-center justify-between gap-4">
        <Logo />

        {/* desktop navigation with a sliding active pill */}
        <nav className="hidden md:block">
          <ul className="flex items-center gap-1 rounded-full border border-border/70 bg-card/50 p-1 backdrop-blur">
            {navLinks.map(link => {
              const active = isLinkActive(link.path, pathname);
              return (
                <li key={link.path} className="relative">
                  <NavLink
                    to={link.path}
                    className={`relative z-10 block rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                      active ? 'text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {link.display}
                  </NavLink>
                  {active && (
                    <motion.span
                      layoutId="nav-pill"
                      className="absolute inset-0 rounded-full bg-primary shadow-sm"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <ThemeToggle />

          {token && canMessage && (
            <Link
              to="/messages"
              className="relative grid h-10 w-10 place-items-center rounded-full border border-border bg-card/70 text-foreground transition-colors hover:border-primary/50 hover:text-primary"
              aria-label={unread ? `Messages, ${unread} unread` : 'Messages'}
              title="Messages"
            >
              <MessageSquare className="h-[18px] w-[18px]" />
              {unread > 0 && (
                <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full border-2 border-background bg-primary px-1 text-[10px] font-bold text-primary-foreground">
                  {unread > 9 ? '9+' : unread}
                </span>
              )}
            </Link>
          )}

          {token && user ? (
            <div className="relative" ref={accountRef}>
              <button
                type="button"
                onClick={() => setAccountOpen(open => !open)}
                className="flex items-center gap-2 rounded-full border border-border bg-card/70 p-1 pr-3 backdrop-blur transition-colors hover:border-primary/50"
                aria-expanded={accountOpen}
              >
                <Avatar src={user?.photo} name={user?.name} className="h-8 w-8" textClassName="text-xs" />
                <span className="hidden max-w-[120px] truncate text-sm font-semibold sm:block">
                  {role === 'admin' ? 'Admin' : user?.name?.replace(/^dr\.?\s*/i, '').split(' ')[0]}
                </span>
              </button>

              <AnimatePresence>
                {accountOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.96 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 mt-2 w-56 origin-top-right rounded-2xl border border-border bg-popover p-2 shadow-panelShadow"
                  >
                    <div className="px-3 py-2">
                      <p className="truncate text-sm font-semibold">{user?.name}</p>
                      <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
                    </div>
                    <div className="my-1 h-px bg-border" />
                    <Link
                      to={dashboardPath}
                      className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium hover:bg-muted"
                    >
                      <LayoutDashboard className="h-4 w-4 text-primary" /> My dashboard
                    </Link>
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-destructive hover:bg-destructive/10"
                    >
                      <LogOut className="h-4 w-4" /> Log out
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <Link to="/login" state={loginState} className="hidden sm:block">
              <Button size="sm" className="h-10 px-5">Log in</Button>
            </Link>
          )}

          <button
            type="button"
            className="grid h-10 w-10 place-items-center rounded-full border border-border bg-card/70 md:hidden"
            onClick={() => setMenuOpen(open => !open)}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* mobile menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.nav
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="overflow-hidden border-t border-border bg-background/95 backdrop-blur-xl md:hidden"
          >
            <ul className="container flex flex-col gap-1 py-4">
              {navLinks.map((link, index) => (
                <motion.li
                  key={link.path}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <NavLink
                    to={link.path}
                    className={`block rounded-xl px-4 py-3 text-base font-semibold ${
                      isLinkActive(link.path, pathname) ? 'bg-primary/10 text-primary' : 'text-foreground hover:bg-muted'
                    }`}
                  >
                    {link.display}
                  </NavLink>
                </motion.li>
              ))}
              {!token && (
                <li className="pt-2">
                  <Link to="/login" state={loginState}>
                    <Button className="w-full">Log in</Button>
                  </Link>
                </li>
              )}
            </ul>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}

export default Header;
