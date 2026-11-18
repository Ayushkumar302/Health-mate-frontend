import { useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import DashboardNav from '@/components/Dashboard/DashboardNav'
import { CalendarClock, CalendarDays, Crown, FileText, LayoutDashboard, LogOut, MessageSquare, Star, Trash2, UserCog, Users, Wallet } from 'lucide-react'
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
  { id: 'schedule', label: 'Schedule', icon: CalendarClock },
  { id: 'patients', label: 'Patients', icon: Users },
  { id: 'earnings', label: 'Earnings', icon: Wallet },
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

// sidebar on desktop; on phones the same menu shows as a grid so every section is visible
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
    <aside className="min-w-0 lg:sticky lg:top-24 lg:h-fit">
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

        <div className="mt-4 hidden md:block lg:mt-6">
          <DashboardNav
            items={items}
            tab={tab}
            onChange={setTab}
            layoutId="doctor-sidebar"
            links={[
              { to: '/messages', label: 'Messages', icon: MessageSquare, count: unread },
              { to: '/reports', label: 'Reports', icon: FileText },
              { to: '/plans', label: 'Medora Pro', icon: Crown, highlight: true },
            ]}
          />
        </div>

        <div className={`mt-4 grid gap-2 border-t border-border pt-4 lg:mt-6 lg:grid-cols-1 lg:pt-5 ${DEMO_MODE ? "hidden lg:grid" : ""}`}>
          <Button variant="outline" onClick={handleLogout} className="hidden lg:inline-flex">
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
