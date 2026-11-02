import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import { CheckCircle2, ExternalLink, FlaskConical, MailCheck, XCircle } from "lucide-react";
import { toast } from "react-toastify";
import AuthShell from "@/components/Auth/AuthShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Spinner from "@/components/ui/spinner";
import { apiRequest } from "@/utils/api";

// Email verification pages. The link comes by email; without a mail server the emails go to an
// Ethereal test inbox, so the page shows a link to open the email.

const RESEND_SECONDS = 60;

// "Open the test email" box, only when the backend uses the test inbox
const TestInboxLink = ({ previewUrl }) =>
  previewUrl ? (
    <div className="mt-5 rounded-2xl border border-primary/25 bg-primary/5 p-4 text-left text-sm">
      <p className="flex items-center gap-2 font-semibold"><FlaskConical className="h-4 w-4 text-primary" /> Demo test inbox</p>
      <p className="mt-1 text-muted-foreground">
        This demo doesn&apos;t send real emails. Open the email in the Ethereal test inbox and click the button inside it.
      </p>
      <a href={previewUrl} target="_blank" rel="noreferrer">
        <Button size="sm" className="mt-3"><ExternalLink className="h-4 w-4" /> Open the email</Button>
      </a>
    </div>
  ) : null;

const ResultIcon = ({ ok }) => (
  <span className={`mx-auto grid h-16 w-16 place-items-center rounded-2xl ${ok ? "bg-success/15 text-success" : "bg-destructive/10 text-destructive"}`}>
    {ok ? <CheckCircle2 className="h-8 w-8" /> : <XCircle className="h-8 w-8" />}
  </span>
);

// countdown so "send again" can't be spammed (the server limits it too)
const useCooldown = () => {
  const [left, setLeft] = useState(0);
  useEffect(() => {
    if (left <= 0) return;
    const timer = setTimeout(() => setLeft(value => value - 1), 1000);
    return () => clearTimeout(timer);
  }, [left]);
  return [left, () => setLeft(RESEND_SECONDS)];
};

export function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";
  const [state, setState] = useState(token ? "verifying" : "failed"); // "verifying" | "done" | "failed"
  const [message, setMessage] = useState(token ? "" : "This link is incomplete.");
  const sentRef = useRef(false);

  useEffect(() => {
    // StrictMode runs effects twice in development, but the link only works once
    if (!token || sentRef.current) return;
    sentRef.current = true;
    apiRequest("/auth/verify-email", { method: "POST", body: { token } })
      .then(result => {
        setMessage(result.message);
        setState("done");
      })
      .catch(error => {
        setMessage(error.message);
        setState("failed");
      });
  }, [token]);

  return (
    <AuthShell title={state === "done" ? "Email verified" : state === "failed" ? "Link not valid" : "Verifying your email…"} subtitle="One last step to secure your account.">
      <div className="text-center">
        {state === "verifying" ? (
          <div className="flex justify-center py-6"><Spinner className="h-10 w-10 border-4" /></div>
        ) : (
          <>
            <ResultIcon ok={state === "done"} />
            <p className="mt-4 text-sm text-muted-foreground">{message}</p>
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              <Link to="/login"><Button>Go to login</Button></Link>
              {state === "failed" && <Link to="/check-email"><Button variant="outline">Send a new link</Button></Link>}
            </div>
          </>
        )}
      </div>
    </AuthShell>
  );
}

// after signing up, or when logging in before verifying: resend the verification email
export function CheckEmail() {
  const { state } = useLocation();
  const [email, setEmail] = useState(state?.email || "");
  const [previewUrl, setPreviewUrl] = useState(state?.previewUrl);
  const [loading, setLoading] = useState(false);
  const [cooldown, startCooldown] = useCooldown();

  const resend = async event => {
    event?.preventDefault();
    setLoading(true);
    try {
      const result = await apiRequest("/auth/resend-verification", { method: "POST", body: { email: email.trim() } });
      toast.success(result.message);
      setPreviewUrl(result.data?.previewUrl);
      startCooldown();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Verify your email"
      subtitle={state?.reason === "unverified" ? "Your account isn't verified yet." : "We sent you a link to confirm your email address."}
    >
      <div className="text-center">
        <span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-primary/10 text-primary"><MailCheck className="h-8 w-8" /></span>
        <p className="mt-4 text-sm text-muted-foreground">Click the link in the email to activate your account. It expires in 24 hours.</p>
        <TestInboxLink previewUrl={previewUrl} />
      </div>
      <form onSubmit={resend} className="mt-6 space-y-3">
        <label htmlFor="verify-email" className="form_label">Didn&apos;t get it? Send a new link to</label>
        <Input id="verify-email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required />
        <Button type="submit" variant="outline" className="w-full" disabled={loading || cooldown > 0}>
          {loading ? <Spinner /> : cooldown > 0 ? `Send again in ${cooldown}s` : "Send a new link"}
        </Button>
        <p className="text-center text-sm text-muted-foreground">
          Already verified? <Link to="/login" className="font-semibold text-primary hover:underline">Log in</Link>
        </p>
      </form>
    </AuthShell>
  );
}
