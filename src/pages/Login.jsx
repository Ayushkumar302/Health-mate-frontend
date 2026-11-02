import { useContext, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import { ArrowRight, Clock, Eye, EyeOff, Lock, Mail, ShieldCheck, Sparkles, Stethoscope, UserRound } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Spinner from '@/components/ui/spinner'
import AuthShell from '@/components/Auth/AuthShell'
import { BASE_URL } from '../config'
import { authContext } from '../context/AuthContext.jsx'
import { DEMO_ACCOUNTS, DEMO_MODE, DEMO_PASSWORD, DEMO_TESTING_DOCTORS, dashboardPathFor } from '@/brand'

// pages only some roles may open, used to avoid sending someone back to a page they can't see
const allowedOn = [
  { prefix: '/users/profile/me', roles: ['patient'] },
  { prefix: '/doctors/profile/me', roles: ['doctor'] },
  { prefix: '/admin', roles: ['admin'] },
  { prefix: '/messages', roles: ['patient', 'doctor'] },
  { prefix: '/prescriptions', roles: ['patient', 'doctor'] },
  { prefix: '/consultation', roles: ['patient', 'doctor'] },
  { prefix: '/symptom-checker', roles: ['patient'] },
]

// a doctor's page, where a patient was about to book
const isDoctorPage = path => /^\/doctors\/[^/]+$/.test(path) && path !== '/doctors/profile/me'

// where to go after login: back to the page that needed it (a doctor's booking page, a call,
// a prescription link...), otherwise straight to the dashboard of that role
const getRedirect = (from, role) => {
  const path = from?.pathname
  // only plain paths on this site: "//other.site" or backslashes could be read as a jump to another website
  if (!path || path.startsWith('//') || /\\/.test(path)) return dashboardPathFor(role)
  const rule = allowedOn.find(item => path.startsWith(item.prefix))
  const usable = path && ((rule && rule.roles.includes(role)) || (role === 'patient' && isDoctorPage(path)))
  return usable ? `${path}${from.search || ''}` : dashboardPathFor(role)
}

function Login() {
  const [formData, setFormData] = useState({ email: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const { dispatch } = useContext(authContext)
  const navigate = useNavigate()
  const location = useLocation()

  const handleInputChange = e => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  // shared by the form and the one-click demo buttons
  const login = async (credentials) => {
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(credentials),
      });
      const result = await res.json();

      if (!res.ok) {
        // signed up but never clicked the email link
        if (result.code === 'EMAIL_NOT_VERIFIED') {
          setLoading(false);
          toast.info(result.message);
          return navigate('/check-email', { state: { email: credentials.email, reason: 'unverified' } });
        }
        throw new Error(result.message);
      }
      dispatch({type: 'LOGIN_SUCCESS',
        payload:{
          user:result.data,
          token:result.token,
          role:result.role,
        }
      })

      setLoading(false);
      // one login for everyone: the backend knows the role from the email
      const firstName = result.data?.name?.replace(/^dr\.?\s*/i, '').split(' ')[0]
      toast.success(firstName ? `Welcome back, ${firstName}!` : result.message);
      navigate(getRedirect(location.state?.from, result.role), { replace: true });
    } catch (err) {
      toast.error(err.message);
      setLoading(false);
    }
  };

  const submitHandler = event => {
    event.preventDefault();
    login(formData);
  };

  // logs in directly without filling the password box, so the browser doesn't treat it as a typed
  // password (no "save password" or "password found in a data breach" pop-ups)
  const loginAsDemo = account => {
    login({ email: account.email, password: account.password });
  };

  return (
    <AuthShell
      title={<>Welcome back <span className="inline-block animate-[float_3s_ease-in-out_infinite]">👋</span></>}
      subtitle="Log in to manage your appointments."
    >
      {DEMO_MODE && (
        <div className="mb-6 rounded-2xl border border-primary/25 bg-primary/5 p-4">
          <p className="flex items-center gap-2 text-sm font-semibold">
            <Sparkles className="h-4 w-4 text-primary" /> Portfolio demo: log in with one click
          </p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {DEMO_ACCOUNTS.map(account => {
              const Icon = { doctor: Stethoscope, admin: ShieldCheck }[account.role] || UserRound
              return (
                <button
                  key={account.role}
                  type="button"
                  disabled={loading}
                  onClick={() => loginAsDemo(account)}
                  className={`group flex items-start gap-3 rounded-xl border border-border bg-card p-3 text-left transition-all hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-soft disabled:opacity-60 ${account.role === 'admin' ? 'sm:col-span-2' : ''}`}
                >
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="h-[18px] w-[18px]" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-1 text-sm font-bold">
                      {account.label}
                      <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                    </span>
                    <span className="block text-xs text-muted-foreground">{account.description}</span>
                  </span>
                </button>
              )
            })}
          </div>
          <div className="mt-3 rounded-xl border border-dashed border-border bg-card/60 p-3">
            <p className="flex items-center gap-1.5 text-xs font-semibold">
              <Clock className="h-3.5 w-3.5 text-primary" /> Testing doctors, open 24/7 in 15 min slots
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Book one as the patient, accept it as the doctor in another browser, and join the video call in minutes.
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {DEMO_TESTING_DOCTORS.map(doctor => (
                <button
                  key={doctor.email}
                  type="button"
                  disabled={loading}
                  onClick={() => loginAsDemo({ email: doctor.email, password: DEMO_PASSWORD })}
                  title={doctor.email}
                  className="flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-semibold transition-colors hover:border-primary/50 hover:text-primary disabled:opacity-60"
                >
                  <Stethoscope className="h-3.5 w-3.5" /> {doctor.name}
                  <span className="font-normal text-muted-foreground">· {doctor.specialty}</span>
                </button>
              ))}
            </div>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Or type them in: {DEMO_ACCOUNTS.map(a => a.email).join(' / ')} · password <span className="font-semibold text-foreground">{DEMO_PASSWORD}</span> for all
          </p>
        </div>
      )}

      <form onSubmit={submitHandler} className="space-y-5">

        <div>
          <label htmlFor="email" className="form_label">Email</label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className="pl-11"
              autoComplete="email"
              required
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between">
            <label htmlFor="password" className="form_label">Password</label>
            {/* the shared demo accounts can't have their password reset */}
            <span className="mb-2 text-xs text-muted-foreground">Forgot password? Reset is off in the demo</span>
          </div>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Your password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              className="px-11"
              autoComplete="current-password"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(show => !show)}
              className="absolute right-3 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full text-muted-foreground hover:text-foreground"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <Button disabled={loading} type="submit" size="lg" className="w-full">
          {loading ? <Spinner className="text-primary-foreground" /> : 'Log in'}
        </Button>

        {!DEMO_MODE && (
          <p className="text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{' '}
            <Link to="/register" className="font-semibold text-primary hover:underline">Create one</Link>
          </p>
        )}

        {/* doctors use the same form, this just reassures them */}
        <p className="flex items-center justify-center gap-2 rounded-xl bg-muted/60 px-4 py-3 text-center text-xs text-muted-foreground">
          <Stethoscope className="h-4 w-4 shrink-0 text-primary" />
          Patients, doctors and admins share this login, you&apos;ll land on your own dashboard.
        </p>
      </form>
    </AuthShell>
  )
}

export default Login
