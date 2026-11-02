import { useContext, useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { ArrowRight, Sparkles } from "lucide-react";
import { authContext } from "@/context/AuthContext";
import { DEMO_MODE } from "@/brand";
import { apiRequest } from "@/utils/api";
import { formatSpan, useNow } from "@/utils/appointment";

// slim bar for visitors explaining how to try the demo, and when it resets if it does
function DemoBanner() {
  const { token } = useContext(authContext);
  const { pathname } = useLocation();
  const [resetAt, setResetAt] = useState(null);
  const now = useNow(60000);

  useEffect(() => {
    if (!DEMO_MODE) return;
    apiRequest("/config")
      .then(result => setResetAt(result.data.demoResetAt || null))
      .catch(() => {});
  }, []);

  if (!DEMO_MODE || pathname === "/login") return null;
  const resetText = resetAt && resetAt > now.getTime() ? ` Demo data resets in ${formatSpan(resetAt - now.getTime())}.` : "";
  if (token && !resetText) return null;

  return (
    <div className="bg-[hsl(var(--primary-deep))] px-4 py-2 text-center text-xs font-medium text-white sm:text-sm">
      <Sparkles className="mr-1.5 inline h-3.5 w-3.5 -translate-y-px" />
      {token ? (
        <>{resetText}</>
      ) : (
        <>
          demo: sign-ups are closed.{resetText}{" "}
          <Link to="/login" className="inline-flex items-center gap-1 font-semibold underline-offset-4 hover:underline">
            Try it with a demo patient or doctor account to test <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </>
      )}
    </div>
  );
}

export default DemoBanner;
