import { useContext, useState } from "react";
import { toast } from "react-toastify";
import { Reply } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import Spinner from "@/components/ui/spinner";
import { authContext } from "@/context/AuthContext";
import { apiRequest } from "@/utils/api";

// the doctor's public answer under a review (shown on their profile; the patient is told)
const ReviewReply = ({ review }) => {
  const { token } = useContext(authContext);
  const [reply, setReply] = useState(review.reply || null);
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(review.reply?.text || "");
  const [busy, setBusy] = useState(false);

  const save = async value => {
    setBusy(true);
    try {
      const result = await apiRequest(`/reviews/${review._id}/reply`, { token, method: "PUT", body: { text: value } });
      setReply(result.data);
      setText(result.data?.text || "");
      setEditing(false);
      toast.success(result.message);
    } catch (error) {
      toast.error(error.message);
    }
    setBusy(false);
  };

  if (editing) {
    return (
      <div className="mt-3 space-y-2">
        <Textarea rows={2} maxLength={500} value={text} onChange={event => setText(event.target.value)} placeholder="Thank the patient or answer their point. It's public: don't mention health details." />
        <div className="flex flex-wrap gap-2">
          <Button size="sm" onClick={() => save(text)} disabled={busy || text.trim().length < 2}>{busy ? <Spinner className="h-4 w-4 text-primary-foreground" /> : "Publish reply"}</Button>
          <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>Cancel</Button>
          {reply?.text && <Button size="sm" variant="ghost" className="text-destructive hover:bg-destructive/10" onClick={() => save("")} disabled={busy}>Remove reply</Button>}
        </div>
      </div>
    );
  }
  return reply?.text ? (
    <div className="mt-3 rounded-xl border-l-4 border-primary/50 bg-muted/60 px-4 py-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold text-primary">Your reply</p>
        <button type="button" onClick={() => setEditing(true)} className="text-xs font-semibold text-muted-foreground hover:text-primary">Edit</button>
      </div>
      <p className="mt-1 text-sm">{reply.text}</p>
    </div>
  ) : (
    <button type="button" onClick={() => setEditing(true)} className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline">
      <Reply className="h-3.5 w-3.5" /> Reply publicly
    </button>
  );
};

export default ReviewReply;
