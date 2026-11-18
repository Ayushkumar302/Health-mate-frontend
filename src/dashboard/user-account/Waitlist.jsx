import { useContext, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import { BellRing, CalendarCheck2, X } from "lucide-react";
import Avatar from "@/components/ui/avatar";
import { SectionCard } from "@/components/Dashboard/DashboardUI";
import { authContext } from "@/context/AuthContext";
import { apiRequest } from "@/utils/api";
import { formatDay } from "@/utils/health";

// days the patient is waiting for a slot on (Plus and Plus Family); hidden when there are none
const Waitlist = () => {
  const { token } = useContext(authContext);
  const [entries, setEntries] = useState([]);

  useEffect(() => {
    apiRequest("/bookings/waitlist/mine", { token }).then(result => setEntries(result.data)).catch(() => {});
  }, [token]);

  const leave = async entry => {
    try {
      const result = await apiRequest(`/bookings/waitlist/${entry._id}`, { token, method: "DELETE" });
      setEntries(list => list.filter(item => item._id !== entry._id));
      toast.success(result.message);
    } catch (error) {
      toast.error(error.message);
    }
  };

  if (!entries.length) return null;
  return (
    <SectionCard icon={BellRing} title="Waitlist" subtitle="We tell you as soon as a slot opens on these days" bodyClassName="divide-y divide-border px-5">
      {entries.map(entry => (
        <div key={entry._id} className="flex items-center gap-3 py-3">
          <Avatar src={entry.doctor.photo} name={entry.doctor.name} className="h-9 w-9" textClassName="text-xs" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{entry.doctor.name}</p>
            <p className="text-xs text-muted-foreground">{formatDay(entry.date)}</p>
          </div>
          {entry.notifiedAt ? (
            <Link to={`/doctors/${entry.doctor._id}`} className="inline-flex items-center gap-1 rounded-full bg-success/15 px-3 py-1 text-xs font-semibold text-success">
              <CalendarCheck2 className="h-3.5 w-3.5" /> Slot opened, book now
            </Link>
          ) : (
            <span className="rounded-full bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground">Waiting</span>
          )}
          <button type="button" onClick={() => leave(entry)} className="grid h-8 w-8 place-items-center rounded-full text-muted-foreground hover:bg-muted hover:text-destructive" aria-label="Leave the waitlist">
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </SectionCard>
  );
};

export default Waitlist;
