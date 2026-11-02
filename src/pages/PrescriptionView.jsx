import { useContext, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, FileX, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import Spinner from "@/components/ui/spinner";
import PrescriptionDocument from "@/components/Prescription/PrescriptionDocument";
import PrescriptionExplainer from "@/components/Prescription/PrescriptionExplainer";
import { EmptyState } from "@/components/Dashboard/DashboardUI";
import { authContext } from "@/context/AuthContext";
import { apiRequest } from "@/utils/api";

// full-page prescription that can be printed or saved as a PDF (browser print dialog)
function PrescriptionView() {
  const { bookingId } = useParams();
  const { token, role } = useContext(authContext);
  const navigate = useNavigate();
  const [prescription, setPrescription] = useState(undefined);
  const [error, setError] = useState("");

  useEffect(() => {
    apiRequest(`/prescriptions/booking/${bookingId}`, { token })
      .then(result => setPrescription(result.data))
      .catch(err => setError(err.message));
  }, [bookingId, token]);

  const dashboardPath = role === "doctor" ? "/doctors/profile/me" : "/users/profile/me";

  return (
    <section className="py-8 print:py-0">
      <div className="container print:max-w-none print:px-0">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 print:hidden">
          <button
            type="button"
            onClick={() => (window.history.length > 1 ? navigate(-1) : navigate(dashboardPath))}
            className="flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
          {prescription && (
            <Button onClick={() => window.print()}>
              <Printer className="h-4 w-4" /> Print / save as PDF
            </Button>
          )}
        </div>

        {prescription === undefined && !error && <div className="flex justify-center py-24"><Spinner /></div>}
        {(error || prescription === null) && (
          <div className="card-surface mx-auto max-w-lg">
            <EmptyState
              icon={FileX}
              title={error ? "Can't open this prescription" : "No prescription yet"}
              text={error || "The doctor hasn't written a prescription for this consultation yet."}
              action={<Link to={dashboardPath}><Button size="sm">Back to dashboard</Button></Link>}
            />
          </div>
        )}
        {prescription && role === "patient" && <PrescriptionExplainer prescription={prescription} />}
        {prescription && <PrescriptionDocument prescription={prescription} />}
      </div>
    </section>
  );
}

export default PrescriptionView;
