import { useContext } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { authContext } from "@/context/AuthContext";
import Plus from "@/dashboard/user-account/Plus";
import Plan from "@/dashboard/doctor-account/Plan";

// plans have their own page: Medora Plus for patients, Medora Pro for doctors.
// Stripe sends people back here after paying (?plus=done / ?pro=done).
const Plans = () => {
  const { role } = useContext(authContext);
  const doctor = role === "doctor";
  return (
    <section className="pt-8">
      <div className="container max-w-6xl space-y-6">
        <div>
          <Link
            to={doctor ? "/doctors/profile/me" : "/users/profile/me"}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-primary"
          >
            <ArrowLeft className="h-4 w-4" /> Back to dashboard
          </Link>
          <h1 className="mt-3 text-2xl font-extrabold tracking-tight sm:text-3xl">{doctor ? "Medora Pro" : "Medora Plus"}</h1>
          <p className="mt-1 text-muted-foreground">Choose a plan or manage the one you have.</p>
        </div>
        {doctor ? <Plan /> : <Plus />}
      </div>
    </section>
  );
};

export default Plans;
