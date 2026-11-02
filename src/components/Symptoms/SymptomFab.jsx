import { useContext } from "react";
import { Link, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { authContext } from "@/context/AuthContext";
import { useCall } from "@/context/CallContext";

// pages where a floating button would be in the way (the checker itself, calls, chat with its send box)
const HIDDEN_ON = ["/symptom-checker", "/consultation", "/messages", "/login", "/register"];

// shortcut to the symptom checker in the bottom-right corner of every other page;
// only for visitors and patients, the checker is a patient feature
function SymptomFab() {
  const { role } = useContext(authContext);
  const { call } = useCall();
  const { pathname } = useLocation();

  // during a call the mini player takes this corner
  const visible = !call && (!role || role === "patient") && !HIDDEN_ON.some(path => pathname.startsWith(path));

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed bottom-4 right-4 z-40 sm:bottom-6 sm:right-6"
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 20 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
        >
          <Link
            to="/symptom-checker"
            aria-label="Check your symptoms with AI"
            title="Check your symptoms with AI"
            className="group flex items-center gap-2 rounded-full bg-primary p-3.5 font-semibold text-primary-foreground shadow-lg shadow-primary/30 transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:px-5 sm:py-3"
          >
            <Sparkles className="h-5 w-5 shrink-0 transition-transform group-hover:rotate-12" />
            <span className="hidden text-sm sm:inline">Check symptoms</span>
          </Link>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default SymptomFab;
