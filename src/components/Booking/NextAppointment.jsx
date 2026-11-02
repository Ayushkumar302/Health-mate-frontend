import { useContext } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { CalendarClock, Video } from "lucide-react";
import { authContext } from "@/context/AuthContext";
import { BASE_URL } from "@/config";
import useFetchData from "@/hooks/useFetchData";
import { useBookingsChanged } from "@/context/MessagesContext";
import Avatar from "../ui/avatar";
import { Button } from "../ui/button";
import { appointmentStart, canJoinVideo, formatAppointment, getAppointmentStatus, useNow } from "@/utils/appointment";

// greeting + the patient's next (or live) appointment, shown on Find a Doctor after login
function NextAppointment() {
  const { user, role, token } = useContext(authContext);
  const isPatient = Boolean(token) && role === "patient";
  const { data, refetch } = useFetchData(isPatient ? `${BASE_URL}/users/appointments/my-appointments` : null);
  useBookingsChanged(refetch);
  const now = useNow();

  if (!isPatient) return null;

  const next = (Array.isArray(data) ? data : [])
    .filter(booking => ["ongoing", "upcoming", "requested"].includes(getAppointmentStatus(booking, now)) && appointmentStart(booking))
    .sort((a, b) => appointmentStart(a) - appointmentStart(b))[0];
  const firstName = user?.name?.split(" ")[0];
  const live = next && getAppointmentStatus(next, now) === "ongoing";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={`card-surface mb-8 flex flex-col gap-4 p-5 sm:flex-row sm:items-center ${live ? "border-highlight/50 ring-4 ring-highlight/10" : ""}`}
    >
      {next ? (
        <>
          <div className="flex flex-1 items-center gap-4">
            <Avatar src={next.doctor?.photo} name={next.doctor?.name} className="h-12 w-12" />
            <div className="min-w-0">
              <p className="text-sm text-muted-foreground">
                Welcome back{firstName ? `, ${firstName}` : ""} 👋 {live ? "Your consultation is live" : "Your next appointment"}
              </p>
              <p className="truncate font-bold">{next.doctor?.name}</p>
              <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <CalendarClock className="h-4 w-4 text-primary" /> {formatAppointment(next)}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            {canJoinVideo(next, now) && (
              <Link to={`/consultation/${next._id}`}>
                <Button size="sm"><Video className="h-4 w-4" /> Join video call</Button>
              </Link>
            )}
            <Link to="/users/profile/me">
              <Button size="sm" variant="outline">My bookings</Button>
            </Link>
          </div>
        </>
      ) : (
        <p className="text-sm text-muted-foreground">
          Welcome back{firstName ? `, ${firstName}` : ""} 👋 Find a doctor below and book your next visit in under a minute.
        </p>
      )}
    </motion.div>
  );
}

export default NextAppointment;
