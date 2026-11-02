import { useState } from "react";
import { Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";

const tones = {
  default: "bg-muted text-foreground",
  danger: "bg-destructive/10 text-destructive",
  primary: "bg-primary/10 text-primary",
};

// list of short entries (allergies, lab tests...) typed one at a time, Enter or comma adds one
const ChipInput = ({ id, value = [], onChange, placeholder, max = 20, maxLength = 60, tone = "default", suggestions = [] }) => {
  const [draft, setDraft] = useState("");

  const add = text => {
    const entry = text.trim().slice(0, maxLength);
    if (!entry || value.length >= max) return;
    if (value.some(item => item.toLowerCase() === entry.toLowerCase())) return setDraft("");
    onChange([...value, entry]);
    setDraft("");
  };

  const onKeyDown = event => {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      add(draft);
    } else if (event.key === "Backspace" && !draft && value.length) {
      onChange(value.slice(0, -1));
    }
  };

  const unused = suggestions.filter(item => !value.some(entry => entry.toLowerCase() === item.toLowerCase()));

  return (
    <div>
      <div className="flex min-h-11 flex-wrap items-center gap-1.5 rounded-xl border border-input bg-background/60 px-2 py-1.5 focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/15">
        {value.map(item => (
          <span key={item} className={cn("flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold", tones[tone])}>
            {item}
            <button type="button" onClick={() => onChange(value.filter(entry => entry !== item))} aria-label={`Remove ${item}`}>
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
        <input
          id={id}
          value={draft}
          onChange={event => setDraft(event.target.value)}
          onKeyDown={onKeyDown}
          onBlur={() => add(draft)}
          maxLength={maxLength}
          placeholder={value.length >= max ? `Up to ${max}` : placeholder}
          disabled={value.length >= max}
          className="min-w-[120px] flex-1 bg-transparent px-1 py-1 text-sm focus:outline-none"
        />
      </div>
      {unused.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {unused.slice(0, 6).map(item => (
            <button
              key={item}
              type="button"
              onClick={() => add(item)}
              className="flex items-center gap-1 rounded-full border border-dashed border-border px-2.5 py-1 text-xs text-muted-foreground hover:border-primary/50 hover:text-primary"
            >
              <Plus className="h-3 w-3" /> {item}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ChipInput;
