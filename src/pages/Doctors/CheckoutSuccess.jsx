import { useContext, useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import Spinner from "@/components/ui/spinner";
import Aurora from "@/components/Home/Aurora";
import { BASE_URL } from "@/config";
import { authContext } from "@/context/AuthContext";

// circle + check mark that draw themselves
const AnimatedIcon = ({ success }) => (
  <svg viewBox="0 0 120 120" className="h-28 w-28" aria-hidden="true">
    <motion.circle
      cx="60"
      cy="60"
      r="52"
      fill="none"
      stroke={success ? "hsl(var(--success))" : "hsl(var(--destructive))"}
      strokeWidth="6"
      strokeLinecap="round"
      initial={{ pathLength: 0 }}
      animate={{ pathLength: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    />
    <motion.path
      d={success ? "M38 62 L54 77 L84 45" : "M44 44 L76 76 M76 44 L44 76"}
      fill="none"
      stroke={success ? "hsl(var(--success))" : "hsl(var(--destructive))"}
      strokeWidth="7"
      strokeLinecap="round"
      strokeLinejoin="round"
      initial={{ pathLength: 0 }}
      animate={{ pathLength: 1 }}
      transition={{ duration: 0.45, delay: 0.5, ease: "easeOut" }}
    />
  </svg>
);

// little colored dots bursting out behind the success icon
const Confetti = () => (
  <div className="pointer-events-none absolute inset-0" aria-hidden="true">
    {Array.from({ length: 14 }, (_, index) => {
      const angle = (index / 14) * Math.PI * 2;
      const colors = ["bg-primary", "bg-brand-cyan", "bg-brand-violet", "bg-brand-amber", "bg-brand-rose"];
      return (
        <motion.span
          key={index}
          className={`absolute left-1/2 top-1/2 h-2.5 w-2.5 rounded-full ${colors[index % colors.length]}`}
          initial={{ x: 0, y: 0, opacity: 1, scale: 0 }}
          animate={{ x: Math.cos(angle) * 110, y: Math.sin(angle) * 110, opacity: 0, scale: 1 }}
          transition={{ duration: 1.1, delay: 0.7, ease: "easeOut" }}
        />
      );
    })}
  </div>
);

const CheckoutSuccess = () => {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const { token } = useContext(authContext);
  // "verifying" | "paid" | "failed"
  const [status, setStatus] = useState("verifying");
  const [message, setMessage] = useState("");

  // confirm with the backend (which asks Stripe) that the payment really went through
  useEffect(() => {
    if (!sessionId || !token) {
      setStatus("failed");
      setMessage("No payment information found.");
      return;
    }
    const verifyPayment = async () => {
      try {
        const res = await fetch(`${BASE_URL}/bookings/verify-session/${sessionId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const result = await res.json();
        if (!res.ok) {
          throw new Error(result.message);
        }
        setStatus("paid");
      } catch (err) {
        setStatus("failed");
        setMessage(err.message);
      }
    };
    verifyPayment();
  }, [sessionId, token]);

  return (
    <section className="relative isolate grid min-h-[75vh] place-items-center overflow-hidden">
      <Aurora />
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          className="glass mx-auto max-w-lg rounded-3xl p-8 text-center shadow-panelShadow sm:p-10"
        >
          {status === "verifying" && (
            <div className="flex flex-col items-center gap-5 py-6">
              <Spinner className="h-12 w-12 border-4" />
              <p className="text-lg font-semibold">Confirming your payment…</p>
              <p className="text-sm text-muted-foreground">This only takes a moment.</p>
            </div>
          )}

          {status !== "verifying" && (
            <>
              <div className="relative mx-auto grid h-28 w-28 place-items-center">
                {status === "paid" && <Confetti />}
                <AnimatedIcon success={status === "paid"} />
              </div>
              <h1 className="mt-6 text-3xl font-extrabold tracking-tight">
                {status === "paid" ? "You're all set!" : "Payment not confirmed"}
              </h1>
              <p className="mt-3 text-muted-foreground">
                {status === "paid"
                  ? "Your payment was successful and your appointment is booked. You can find it under My Bookings."
                  : `${message || "We could not confirm your payment."} If you were charged, please contact support.`}
              </p>
              <div className="mt-8 flex flex-wrap justify-center gap-3">
                {status === "paid" ? (
                  <>
                    <Link to="/users/profile/me">
                      <Button>View my bookings</Button>
                    </Link>
                    <Link to="/">
                      <Button variant="outline">Back to home</Button>
                    </Link>
                  </>
                ) : (
                  <Link to="/doctors">
                    <Button>Back to doctors</Button>
                  </Link>
                )}
              </div>
            </>
          )}
        </motion.div>
      </div>
    </section>
  );
};

export default CheckoutSuccess;
