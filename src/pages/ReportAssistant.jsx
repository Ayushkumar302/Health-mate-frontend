import { useContext, useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import { AlertTriangle, CalendarDays, FileDown, FileText, FolderOpen, HeartPulse, MessageSquarePlus, Pill, Sparkles, Stethoscope } from "lucide-react";
import { authContext } from "@/context/AuthContext";
import { apiRequest } from "@/utils/api";
import { downloadPdf } from "@/utils/calendar";
import { chatKey, clearChat, loadChat, newId, saveChat } from "@/utils/chatStorage";
import { BotMessage, BotText, ChatLog, ChatPanel, Composer, MyMessage, Note, Suggestions } from "@/components/Assistant/Chat";
import { Button } from "@/components/ui/button";
import Spinner from "@/components/ui/spinner";

const EXAMPLES = ["Full report for my latest patient", "Prescriptions from the last 3 months", "Lab reports and allergies, last month"];
// follow-ups that change the report just shown
const FOLLOW_UPS = ["Only prescriptions", "Only uploaded reports", "Last 3 months", "Full history"];
const PREVIEW = 3;

const shortDay = date =>
  date ? new Date(`${date}T00:00:00Z`).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }) : "Undated";
const list = items => (items?.length ? items.join(", ") : "None recorded");

const Part = ({ icon: Icon, title, count, children }) => (
  <div className="border-t border-border pt-3">
    <p className="flex items-center gap-2 text-sm font-bold">
      <Icon className="h-4 w-4 text-primary" /> {title}
      {count != null && <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">{count}</span>}
    </p>
    <div className="mt-2 space-y-1.5 text-sm">{children}</div>
  </div>
);

const More = ({ total }) =>
  total > PREVIEW ? <p className="text-xs text-muted-foreground">and {total - PREVIEW} more in the PDF</p> : null;

const Empty = ({ children }) => <p className="text-xs text-muted-foreground">{children}</p>;

// the report as a card: summary first, then the parts asked for, and the PDF download
const ReportCard = ({ data, token }) => {
  const { report, pdf } = data;
  const sections = new Set(report.sections);
  const { patient } = report;
  const [downloading, setDownloading] = useState(false);
  const download = async () => {
    setDownloading(true);
    try {
      await downloadPdf(token, pdf.path, pdf.fileName);
    } catch (error) {
      toast.error(error.message);
    }
    setDownloading(false);
  };
  return (
    <article className="space-y-3 rounded-2xl border border-border bg-card p-4" aria-label={`Report for ${patient.name}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-lg font-bold">{patient.name}</p>
          <p className="text-xs text-muted-foreground">
            {[patient.relation && `${patient.relation} of ${patient.bookedBy}`, patient.age != null && `${patient.age} years`, patient.gender, patient.bloodType && `blood ${patient.bloodType}`]
              .filter(Boolean)
              .join(" · ") || "Basic details not filled in"}
          </p>
          <p className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-primary"><CalendarDays className="h-3.5 w-3.5" /> {report.period}</p>
        </div>
        <Button size="sm" onClick={download} disabled={downloading}>
          {downloading ? <Spinner className="h-4 w-4 text-primary-foreground" /> : <><FileDown className="h-4 w-4" /> Download PDF</>}
        </Button>
      </div>

      {report.summary && (
        <div className="rounded-xl bg-primary/5 p-3">
          <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-primary">
            <Sparkles className="h-3.5 w-3.5" /> {report.summarySource === "ai" ? "AI summary · check against the record" : "Summary from the record"}
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
            {report.summary.lines.map(line => <li key={line}>{line}</li>)}
          </ul>
          {report.summary.watchOuts?.length > 0 && (
            <p className="mt-2 flex items-start gap-1.5 text-xs font-semibold text-brand-amber">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" /> {report.summary.watchOuts.join(" · ")}
            </p>
          )}
        </div>
      )}

      {sections.has("health") && (
        <Part icon={HeartPulse} title="Health details">
          <p><span className="text-muted-foreground">Allergies:</span> {list(patient.allergies)}</p>
          <p><span className="text-muted-foreground">Conditions:</span> {list(patient.conditions)}</p>
          <p><span className="text-muted-foreground">Medicines:</span> {list(patient.medications)}</p>
        </Part>
      )}
      {sections.has("visits") && (
        <Part icon={Stethoscope} title="Visits with you" count={report.visits.length}>
          {report.visits.length === 0 && <Empty>No visits in this period.</Empty>}
          {report.visits.slice(0, PREVIEW).map(visit => (
            <p key={`${visit.date}-${visit.time}`}>
              <span className="font-semibold">{shortDay(visit.date)}</span> · {visit.type} · {visit.status}
              {visit.complaint && <span className="text-muted-foreground"> · {visit.complaint}</span>}
            </p>
          ))}
          <More total={report.visits.length} />
        </Part>
      )}
      {sections.has("prescriptions") && (
        <Part icon={Pill} title="Prescriptions you wrote" count={report.prescriptions.length}>
          {report.prescriptions.length === 0 && <Empty>No prescriptions in this period.</Empty>}
          {report.prescriptions.slice(0, PREVIEW).map(item => (
            <p key={`${item.date}-${item.diagnosis}`}>
              <span className="font-semibold">{shortDay(item.date)}</span> · {item.diagnosis}
              {item.medicines.length > 0 && <span className="text-muted-foreground"> · {item.medicines.map(medicine => medicine.name).join(", ")}</span>}
            </p>
          ))}
          <More total={report.prescriptions.length} />
        </Part>
      )}
      {sections.has("reports") && (
        <Part icon={FolderOpen} title="Reports the patient uploaded" count={report.reports.length}>
          {report.reports.length === 0 && <Empty>No reports uploaded in this period.</Empty>}
          {report.reports.slice(0, PREVIEW).map(item => (
            <p key={`${item.date}-${item.title}`}>
              <span className="font-semibold">{shortDay(item.date)}</span> · {item.title} <span className="text-muted-foreground">({item.category})</span>
            </p>
          ))}
          <More total={report.reports.length} />
        </Part>
      )}
      {sections.has("symptoms") && (
        <Part icon={FileText} title="Saved symptom checks" count={report.symptomChecks.length}>
          {report.symptomChecks.length === 0 && <Empty>{patient.relation ? "Kept for the account holder only." : "None in this period."}</Empty>}
          {report.symptomChecks.slice(0, PREVIEW).map(item => (
            <p key={`${item.date}-${item.described}`}>
              <span className="font-semibold">{shortDay(item.date)}</span> · {item.described}
            </p>
          ))}
          <More total={report.symptomChecks.length} />
        </Part>
      )}
    </article>
  );
};

// Report assistant (doctors): ask for a patient's report in plain words and download it as a PDF
function ReportAssistant() {
  const { token, user } = useContext(authContext);
  const key = chatKey("reports", user?._id);
  const saved = loadChat(key);
  const [messages, setMessages] = useState(saved?.messages || []);
  // the report being talked about, so "only prescriptions" changes just that
  const [current, setCurrent] = useState(saved?.current || null);
  const [left, setLeft] = useState(saved?.left ?? null);
  const [busy, setBusy] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    // reports hold health data: only the last few are kept, in this tab
    saveChat(key, { messages: messages.slice(-12), current, left });
  }, [key, messages, current, left]);

  const add = message => setMessages(items => [...items, { id: newId(), ...message }]);

  const ask = async (text, patient) => {
    add({ from: "me", text });
    setBusy(true);
    try {
      const body = patient ? { patient, ...(current && { current }) } : { message: text, ...(current && { current }) };
      const { data } = await apiRequest("/prescriptions/report-assistant", { token, method: "POST", body });
      if (data.request) setCurrent(data.request);
      if (data.left != null) setLeft(data.left);
      add({ from: "bot", data });
    } catch (error) {
      if (error.code === "chat-limit") setLeft(0);
      add({ from: "bot", data: { kind: "error", text: error.message } });
    }
    setBusy(false);
  };

  const restart = () => {
    setMessages([]);
    setCurrent(null);
    clearChat(key);
    inputRef.current?.focus();
  };

  const lastReportId = [...messages].reverse().find(message => message.data?.kind === "report")?.id;

  const renderBot = (data, id) => {
    if (data.kind === "error") return <BotText error>{data.text}</BotText>;
    return (
      <>
        <BotText>{data.text}</BotText>
        {data.note && <Note>{data.note}</Note>}
        {data.kind === "report" && <ReportCard data={data} token={token} />}
        {data.choices && (
          <Suggestions
            label="Patients"
            items={data.choices}
            disabled={busy || left === 0}
            onPick={choice => ask(choice.label, choice.patient)}
          />
        )}
        {data.kind === "report" && id === lastReportId && <Suggestions label="Change the report" items={FOLLOW_UPS} onPick={ask} disabled={busy || left === 0} />}
      </>
    );
  };

  return (
    <section className="container max-w-3xl py-4 sm:py-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            <Sparkles className="h-3.5 w-3.5" /> AI report assistant
          </p>
          <h1 className="mt-3 text-2xl font-extrabold tracking-tight sm:text-3xl">Patient reports</h1>
          <p className="mt-1 text-sm text-muted-foreground">Ask for a report on any of your patients, then download it as a PDF.</p>
        </div>
        {messages.length > 0 && (
          <Button variant="outline" size="sm" onClick={restart} className="shrink-0">
            <MessageSquarePlus className="h-4 w-4" /> New chat
          </Button>
        )}
      </div>

      <div className="mt-5">
        <ChatPanel
          footer={
            <Composer onSend={ask} busy={busy} left={left} inputRef={inputRef} label="Message the report assistant" placeholder="e.g. full report for Rahul, last 3 months" />
          }
        >
          <ChatLog label="Report assistant conversation" count={messages.length} busy={busy}>
            <BotMessage>
              <BotText>Which patient would you like a report on? Say the name, and what you need: a full report, prescriptions, uploaded reports, a period.</BotText>
              {messages.length === 0 && <Suggestions items={EXAMPLES} onPick={ask} disabled={busy} label="Examples" />}
            </BotMessage>
            {messages.map(message =>
              message.from === "me" ? (
                <MyMessage key={message.id}>{message.text}</MyMessage>
              ) : (
                <BotMessage key={message.id}>{renderBot(message.data, message.id)}</BotMessage>
              )
            )}
          </ChatLog>
        </ChatPanel>
        <p className="mt-3 text-center text-[11px] text-muted-foreground">
          Only your own patients. The AI reads your message and writes the summary; the rest comes straight from the record.
        </p>
      </div>
    </section>
  );
}

export default ReportAssistant;
