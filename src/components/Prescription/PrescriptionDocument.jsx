import { HeartPulse } from "lucide-react";
import { BRAND } from "@/brand";
import ConvertTime from "@/utils/convertTime";
import { formatDay, patientSummary } from "@/utils/health";

const Heading = ({ children }) => (
  <h3 className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">{children}</h3>
);

// the prescription as a printable sheet of paper (always light, also in dark mode)
const PrescriptionDocument = ({ prescription }) => {
  const { doctor, user: patient, booking } = prescription;
  const degrees = (doctor.qualifications || []).map(item => item.degree).filter(Boolean).join(", ");
  const hospital = doctor.experiences?.[0]?.hospital;

  return (
    <article className="rx-paper mx-auto w-full max-w-3xl rounded-2xl bg-white p-6 text-slate-900 shadow-panelShadow ring-1 ring-slate-200 sm:p-10 print:max-w-none print:rounded-none print:p-0 print:shadow-none print:ring-0">
      {/* letterhead */}
      <header className="flex flex-col justify-between gap-4 border-b-2 border-[#3674AB] pb-5 sm:flex-row">
        <div>
          <p className="text-xl font-extrabold">{doctor.name}</p>
          <p className="text-sm capitalize text-slate-600">
            {[degrees, doctor.specialization].filter(Boolean).join(" · ")}
          </p>
          {hospital && <p className="text-sm text-slate-600">{hospital}</p>}
          {doctor.registrationNumber && <p className="mt-1 text-xs text-slate-500">Reg. no. {doctor.registrationNumber}</p>}
        </div>
        <div className="sm:text-right">
          <p className="flex items-center gap-1.5 text-lg font-extrabold text-[#3674AB] sm:justify-end">
            <HeartPulse className="h-5 w-5" /> {BRAND.name}
          </p>
          <p className="text-xs text-slate-500">e-Prescription</p>
          <p className="text-xs text-slate-500">{BRAND.email}</p>
        </div>
      </header>

      {/* patient + visit */}
      <section className="grid gap-4 border-b border-slate-200 py-5 text-sm sm:grid-cols-3">
        <div>
          <Heading>Patient</Heading>
          <p className="mt-1 font-semibold">{patient.name}</p>
          <p className="text-slate-600">{patientSummary(patient) || "—"}</p>
        </div>
        <div>
          <Heading>Consultation</Heading>
          <p className="mt-1 font-semibold">{formatDay(booking.appointmentDate)}</p>
          <p className="text-slate-600">{ConvertTime(booking.appointmentTime)} · video consultation</p>
        </div>
        <div>
          <Heading>Prescription id</Heading>
          <p className="mt-1 font-mono text-xs text-slate-600">{String(prescription._id).slice(-10).toUpperCase()}</p>
          <p className="text-xs text-slate-500">Updated {new Date(prescription.updatedAt).toLocaleDateString("en-IN")}</p>
        </div>
      </section>

      <section className="space-y-5 py-5 text-sm">
        <div>
          <Heading>Diagnosis</Heading>
          <p className="mt-1 text-base font-bold">{prescription.diagnosis}</p>
          {prescription.symptoms && <p className="mt-1 text-slate-600">Complaints: {prescription.symptoms}</p>}
        </div>

        <div>
          <p className="font-serif text-3xl font-bold italic text-[#3674AB]">℞</p>
          {prescription.medicines.length === 0 ? (
            <p className="mt-1 text-slate-600">No medicines prescribed.</p>
          ) : (
            <div className="mt-2 overflow-x-auto">
              <table className="w-full min-w-[520px] text-left">
                <thead className="border-y border-slate-200 bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-3 py-2">#</th>
                    <th className="px-3 py-2">Medicine</th>
                    <th className="px-3 py-2">When</th>
                    <th className="px-3 py-2">For</th>
                    <th className="px-3 py-2">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {prescription.medicines.map((medicine, index) => (
                    <tr key={index} className="border-b border-slate-100 align-top">
                      <td className="px-3 py-2.5 text-slate-500">{index + 1}</td>
                      <td className="px-3 py-2.5">
                        <span className="font-semibold">{medicine.name}</span>
                        {medicine.dosage && <span className="text-slate-600"> {medicine.dosage}</span>}
                      </td>
                      <td className="px-3 py-2.5">{medicine.frequency || "—"}</td>
                      <td className="px-3 py-2.5">{medicine.duration || "—"}</td>
                      <td className="px-3 py-2.5 text-slate-600">{medicine.instructions || ""}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {prescription.tests?.length > 0 && (
          <div>
            <Heading>Tests advised</Heading>
            <ul className="mt-1 list-inside list-disc text-slate-700">
              {prescription.tests.map(test => <li key={test}>{test}</li>)}
            </ul>
          </div>
        )}

        {prescription.advice && (
          <div>
            <Heading>Advice</Heading>
            <p className="mt-1 whitespace-pre-line leading-6 text-slate-700">{prescription.advice}</p>
          </div>
        )}

        {prescription.followUpDate && (
          <p className="rounded-xl bg-[#3674AB]/10 px-4 py-3 font-semibold text-[#2b5c8a]">
            Follow-up on {formatDay(prescription.followUpDate)}
          </p>
        )}
      </section>

      <footer className="flex items-end justify-between gap-6 border-t border-slate-200 pt-5 text-xs text-slate-500">
        <p className="max-w-sm">
          Issued after an online consultation on {BRAND.name}. demo: not a valid medical prescription.
        </p>
        <div className="text-right">
          <p className="font-serif text-lg italic text-slate-700">{doctor.name}</p>
          <p className="border-t border-slate-300 pt-1">Digitally signed</p>
        </div>
      </footer>
    </article>
  );
};

export default PrescriptionDocument;
