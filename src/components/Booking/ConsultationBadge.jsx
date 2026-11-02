/* eslint-disable react-refresh/only-export-components */
import { Hospital, PhoneCall, Video } from "lucide-react";
import { CONSULTATION_TYPES, typeOf } from "@/utils/appointment";

export const TYPE_ICONS = { clinic: Hospital, video: Video, "quick-call": PhoneCall };

const TYPE_STYLES = {
  clinic: "bg-brand-violet/10 text-brand-violet",
  video: "bg-primary/10 text-primary",
  "quick-call": "bg-highlight/15 text-highlight",
};

// small pill: Clinic / Video / Quick call
const ConsultationBadge = ({ booking, className = "" }) => {
  const type = typeOf(booking);
  const Icon = TYPE_ICONS[type];
  return (
    <span className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold ${TYPE_STYLES[type]} ${className}`}>
      <Icon className="h-3.5 w-3.5" /> {CONSULTATION_TYPES[type].short}
    </span>
  );
};

export default ConsultationBadge;
