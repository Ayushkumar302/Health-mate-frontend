import { Link } from "react-router-dom";
import { CalendarCheck, FileText, FlaskConical, MessageSquare, Pill } from "lucide-react";
import { Button } from "@/components/ui/button";
import Avatar from "@/components/ui/avatar";
import { EmptyState } from "@/components/Dashboard/DashboardUI";
import { formatDay } from "@/utils/health";

// the patient's prescriptions, newest visit first
const PrescriptionsList = ({ prescriptions }) => {
  if (!prescriptions) {
    return <div className="space-y-4">{[0, 1].map(index => <div key={index} className="skeleton h-40 rounded-2xl" />)}</div>;
  }
  if (prescriptions.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border">
        <EmptyState icon={FileText} title="No prescriptions yet" text="After a consultation, your doctor's prescription shows up here and can be downloaded as a PDF." />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {prescriptions.map(item => (
        <article key={item._id} className="card-surface p-5 transition-colors hover:border-primary/30">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <Avatar src={item.doctor.photo} name={item.doctor.name} className="h-12 w-12" />
              <div>
                <p className="font-bold">{item.diagnosis}</p>
                <p className="text-sm capitalize text-muted-foreground">{item.doctor.name} · {item.doctor.specialization}</p>
              </div>
            </div>
            <span className="rounded-full bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground">{formatDay(item.booking.appointmentDate)}</span>
          </div>

          {item.medicines.length > 0 && (
            <ul className="mt-4 grid gap-2 sm:grid-cols-2">
              {item.medicines.map((medicine, index) => (
                <li key={index} className="flex items-start gap-2 rounded-xl bg-muted/60 px-3 py-2 text-sm">
                  <Pill className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <span>
                    <span className="font-semibold">{medicine.name}</span> {medicine.dosage}
                    <span className="block text-xs text-muted-foreground">{[medicine.frequency, medicine.duration].filter(Boolean).join(" · ")}</span>
                  </span>
                </li>
              ))}
            </ul>
          )}

          <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-muted-foreground">
            {item.tests?.length > 0 && (
              <span className="flex items-center gap-1.5"><FlaskConical className="h-3.5 w-3.5" /> {item.tests.length} test{item.tests.length > 1 ? "s" : ""} advised</span>
            )}
            {item.followUpDate && (
              <span className="flex items-center gap-1.5 font-semibold text-highlight"><CalendarCheck className="h-3.5 w-3.5" /> Follow-up {formatDay(item.followUpDate)}</span>
            )}
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <Link to={`/prescriptions/${item.booking._id}`}>
              <Button size="sm"><FileText className="h-4 w-4" /> View & download</Button>
            </Link>
            <Link to={`/messages?with=${item.doctor._id}`}>
              <Button size="sm" variant="outline"><MessageSquare className="h-4 w-4" /> Ask a question</Button>
            </Link>
            {item.followUpDate && (
              <Link to={`/doctors/${item.doctor._id}`}>
                <Button size="sm" variant="soft"><CalendarCheck className="h-4 w-4" /> Book follow-up</Button>
              </Link>
            )}
          </div>
        </article>
      ))}
    </div>
  );
};

export default PrescriptionsList;
