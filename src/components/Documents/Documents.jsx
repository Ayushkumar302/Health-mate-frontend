import { useContext, useRef, useState } from "react";
import { Eye, FileImage, FileText, Lock, Trash2, UploadCloud } from "lucide-react";
import { toast } from "react-toastify";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Spinner from "@/components/ui/spinner";
import { authContext } from "@/context/AuthContext";
import { useConfirm } from "@/context/ConfirmContext";
import { apiRequest } from "@/utils/api";
import { CATEGORY_LABELS, formatSize, openDocument, uploadDocument } from "@/utils/documents";
import { formatDay } from "@/utils/health";

const MAX_BYTES = 5 * 1024 * 1024;
const ACCEPT = "application/pdf,image/png,image/jpeg";

// list of uploaded files with View (and Delete for the owner)
export const DocumentList = ({ documents, onDeleted, canDelete = false, empty = "No files yet" }) => {
  const { token } = useContext(authContext);
  const [busyId, setBusyId] = useState(null);
  const confirm = useConfirm();

  const view = async document => {
    try {
      await openDocument(token, document._id);
    } catch (error) {
      toast.error(error.message);
    }
  };

  const remove = async document => {
    if (!(await confirm({ title: "Delete this file?", message: `"${document.title}" will be removed for good.`, confirmText: "Delete", tone: "danger" }))) return;
    setBusyId(document._id);
    try {
      await apiRequest(`/documents/${document._id}`, { token, method: "DELETE" });
      toast.success("File deleted");
      onDeleted?.(document._id);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setBusyId(null);
    }
  };

  if (!documents?.length) return <p className="text-sm text-muted-foreground">{empty}</p>;

  return (
    <ul className="divide-y divide-border">
      {documents.map(document => {
        const Icon = document.mimeType === "application/pdf" ? FileText : FileImage;
        return (
          <li key={document._id} className="flex items-center gap-3 py-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
              <Icon className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{document.title}</p>
              <p className="truncate text-xs text-muted-foreground">
                {CATEGORY_LABELS[document.category]} · {document.reportDate ? formatDay(document.reportDate) : new Date(document.createdAt).toLocaleDateString("en-IN")} · {formatSize(document.size)}
              </p>
            </div>
            <Button size="sm" variant="outline" onClick={() => view(document)}><Eye className="h-4 w-4" /> View</Button>
            {canDelete && (
              document.locked ? (
                <span className="grid h-9 w-9 place-items-center text-muted-foreground" title="Sample file, kept in the demo"><Lock className="h-4 w-4" /></span>
              ) : (
                <Button size="icon" variant="ghost" className="h-9 w-9 text-muted-foreground hover:text-destructive" disabled={busyId === document._id} onClick={() => remove(document)} aria-label={`Delete ${document.title}`}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              )
            )}
          </li>
        );
      })}
    </ul>
  );
};

// drop zone + type/title/date, uploads one PDF/JPG/PNG up to 5 MB
export const UploadDocument = ({ categories, withDate = false, onUploaded }) => {
  const { token } = useContext(authContext);
  const inputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [category, setCategory] = useState(categories[0]);
  const [title, setTitle] = useState("");
  const [reportDate, setReportDate] = useState("");
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);

  const pick = picked => {
    if (!picked) return;
    if (!ACCEPT.split(",").includes(picked.type)) return toast.error("Only PDF, JPG and PNG files are allowed");
    if (picked.size > MAX_BYTES) return toast.error("Files can be at most 5 MB");
    setFile(picked);
    if (!title) setTitle(picked.name.replace(/\.[^.]+$/, "").slice(0, 80));
  };

  const reset = () => {
    setFile(null);
    setTitle("");
    setReportDate("");
    if (inputRef.current) inputRef.current.value = "";
  };

  const submit = async event => {
    event.preventDefault();
    if (!file) return;
    setUploading(true);
    try {
      const document = await uploadDocument(token, { file, category, title: title.trim(), reportDate });
      toast.success("Uploaded");
      onUploaded?.(document);
      reset();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-3">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={event => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={event => {
          event.preventDefault();
          setDragging(false);
          pick(event.dataTransfer.files?.[0]);
        }}
        className={`flex w-full flex-col items-center gap-2 rounded-2xl border-2 border-dashed px-4 py-6 text-center transition-colors ${
          dragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
        }`}
      >
        <UploadCloud className="h-7 w-7 text-primary" />
        {file ? (
          <span className="text-sm font-semibold">{file.name} <span className="font-normal text-muted-foreground">· {formatSize(file.size)}</span></span>
        ) : (
          <span className="text-sm"><span className="font-semibold text-primary">Choose a file</span> or drag it here</span>
        )}
        <span className="text-xs text-muted-foreground">PDF, JPG or PNG, up to 5 MB</span>
      </button>
      <input ref={inputRef} type="file" accept={ACCEPT} className="hidden" onChange={event => pick(event.target.files?.[0])} />

      {file && (
        <div className={`grid gap-3 ${withDate ? "sm:grid-cols-[1fr_1fr_160px]" : "sm:grid-cols-2"}`}>
          <select
            value={category}
            onChange={event => setCategory(event.target.value)}
            className="h-11 rounded-xl border border-input bg-background/60 px-3 text-sm focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/15"
            aria-label="Document type"
          >
            {categories.map(item => <option key={item} value={item}>{CATEGORY_LABELS[item]}</option>)}
          </select>
          <Input value={title} maxLength={80} onChange={event => setTitle(event.target.value)} placeholder="Title, e.g. Thyroid profile" aria-label="Title" />
          {withDate && (
            <Input type="date" max={new Date().toLocaleDateString("en-CA")} value={reportDate} onChange={event => setReportDate(event.target.value)} aria-label="Report date" />
          )}
        </div>
      )}
      {file && (
        <div className="flex gap-2">
          <Button type="submit" size="sm" disabled={uploading}>
            {uploading ? <Spinner className="h-4 w-4 text-primary-foreground" /> : <><UploadCloud className="h-4 w-4" /> Upload</>}
          </Button>
          <Button type="button" size="sm" variant="ghost" onClick={reset} disabled={uploading}>Cancel</Button>
        </div>
      )}
    </form>
  );
};
