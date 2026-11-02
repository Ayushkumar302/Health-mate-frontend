import { useContext } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { CalendarDays, LayoutDashboard, LogOut, MessageSquare, Star, Trash2, UserCog, Users } from 'lucide-react'
import { toast } from 'react-toastify'
import { Button } from '@/components/ui/button'
import Avatar from '@/components/ui/avatar'
import { authContext } from '@/context/AuthContext'
import { BASE_URL } from '@/config'
import { DEMO_MODE } from '@/brand'
import { useConfirm } from '@/context/ConfirmContext'

const items = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'appointments', label: 'Appointments', icon: CalendarDays },
  { id: 'patients', label: 'Patients', icon: Users },
  { id: 'reviews', label: 'Reviews', icon: Star },
  { id: 'profile', label: 'Profile', icon: UserCog },
]

const statusBadge = {
  approved: 'bg-success/15 text-success',
  pending: 'bg-brand-amber/15 text-brand-amber',
  rejected: 'bg-destructive/10 text-destructive',
  suspended: 'bg-destructive/10 text-destructive',
  cancelled: 'bg-destructive/10 text-destructive',
}

const statusLabel = { approved: 'Verified', pending: 'Pending review', rejected: 'Not verified', suspended: 'Suspended', cancelled: 'Suspended' }

// sidebar on desktop, horizontal tab bar on mobile
const Tabs = ({ tab, setTab, doctor, unread = 0 }) => {
    const {dispatch, user, token} = useContext(authContext);
    const navigate = useNavigate();
    const confirm = useConfirm();
    const handleLogout = () => {
      dispatch({type: 'LOGOUT'});
      navigate('/');
    }

    const handleDeleteAccount = async () => {
      if (!(await confirm({ title: 'Delete your account?', message: 'Your profile, schedule and history are removed for good. This cannot be undone.', confirmText: 'Delete account', tone: 'danger' }))) return;
      try {
        const res = await fetch(`${BASE_URL}/doctors/${user._id}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        });
        const result = await res.json();
        if (!res.ok) {
          throw new Error(result.message);
        }
        toast.success(result.message);
        handleLogout();
      } catch (error) {
        toast.error(error.message);
      }
    }

  return (
    <aside className="lg:sticky lg:top-24 lg:h-fit">
      <div className="card-surface p-4 lg:p-5">
        {/* doctor summary */}
        <div className="flex items-center gap-3 lg:flex-col lg:text-center">
          <Avatar src={doctor?.photo} name={doctor?.name} className="h-12 w-12 lg:h-20 lg:w-20" textClassName="lg:text-xl" />
          <div className="min-w-0 flex-1">
            <p className="truncate font-bold">{doctor?.name}</p>
            <p className="truncate text-sm capitalize text-muted-foreground">{doctor?.specialization || 'Add your specialty'}</p>
            {doctor?.isApproved && (
              <span className={`mt-2 inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusBadge[doctor.isApproved]}`}>
                {statusLabel[doctor.isApproved]}
              </span>
            )}
          </div>
        </div>

        <nav className="no-scrollbar -mx-1 mt-4 flex gap-1 overflow-x-auto px-1 lg:mt-6 lg:flex-col">
          {items.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`relative flex shrink-0 items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors ${
                tab === id ? 'text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              {tab === id && (
                <motion.span
                  layoutId="doctor-sidebar"
                  className="absolute inset-0 rounded-xl bg-primary/10"
                  transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                />
              )}
              <Icon className="relative h-4 w-4" />
              <span className="relative">{label}</span>
            </button>
          ))}
          <Link
            to="/messages"
            className="relative flex shrink-0 items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <MessageSquare className="h-4 w-4" />
            <span>Messages</span>
            {unread > 0 && (
              <span className="ml-auto grid h-5 min-w-5 place-items-center rounded-full bg-primary px-1.5 text-[11px] font-bold text-primary-foreground">{unread}</span>
            )}
          </Link>
        </nav>

        <div className={`mt-4 grid gap-2 border-t border-border pt-4 lg:mt-6 lg:grid-cols-1 lg:pt-5 ${DEMO_MODE ? "" : "grid-cols-2"}`}>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="h-4 w-4" /> Log out
          </Button>
          {!DEMO_MODE && (
            <Button variant="ghost" onClick={handleDeleteAccount} className="text-destructive hover:bg-destructive/10">
              <Trash2 className="h-4 w-4" /> Delete account
            </Button>
          )}
        </div>
      </div>
    </aside>
  )
}

export default Tabs
