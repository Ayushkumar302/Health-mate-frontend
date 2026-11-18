/* eslint-disable react-refresh/only-export-components */
import { useEffect, useState } from "react";
import { Languages } from "lucide-react";

// Languages the AI answers patients in (the server keeps the same list: utils/ai/language.js)
export const AI_LANGUAGES = [
  { id: "en", label: "English" },
  { id: "hi", label: "हिन्दी (Hindi)" },
  { id: "bn", label: "বাংলা (Bengali)" },
  { id: "mr", label: "मराठी (Marathi)" },
  { id: "ta", label: "தமிழ் (Tamil)" },
  { id: "te", label: "తెలుగు (Telugu)" },
  { id: "gu", label: "ગુજરાતી (Gujarati)" },
  { id: "kn", label: "ಕನ್ನಡ (Kannada)" },
];

const KEY = "medora-ai-language";
const read = () => {
  try {
    const saved = localStorage.getItem(KEY);
    return AI_LANGUAGES.some(item => item.id === saved) ? saved : "en";
  } catch {
    return "en";
  }
};

const listeners = new Set();

// the language chosen last time, remembered in this browser and shared by every AI feature on the page
export const useAiLanguage = () => {
  const [lang, setLang] = useState(read);
  useEffect(() => {
    listeners.add(setLang);
    return () => listeners.delete(setLang);
  }, []);
  const change = value => {
    try {
      localStorage.setItem(KEY, value);
    } catch {
      // private window: only this page remembers it
    }
    listeners.forEach(listener => listener(value));
  };
  return [lang, change];
};

const LanguagePicker = ({ className = "" }) => {
  const [lang, setLang] = useAiLanguage();
  return (
    <label className={`inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground ${className}`}>
      <Languages className="h-4 w-4 text-primary" />
      <span className="sr-only sm:not-sr-only">Answer in</span>
      <select
        value={lang}
        onChange={event => setLang(event.target.value)}
        aria-label="Language of the AI's answer"
        className="h-8 rounded-lg border border-input bg-background/60 px-2 text-xs font-semibold text-foreground focus:border-primary focus:outline-none"
      >
        {AI_LANGUAGES.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}
      </select>
    </label>
  );
};

export default LanguagePicker;
