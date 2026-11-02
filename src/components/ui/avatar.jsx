import { useState } from "react";
import { cn } from "@/lib/utils";

// calm blue / mint tones for initials avatars
const GRADIENTS = [
  "from-sky-500 to-blue-600",
  "from-teal-400 to-emerald-500",
  "from-indigo-400 to-blue-500",
  "from-cyan-500 to-sky-600",
  "from-emerald-400 to-teal-500",
  "from-blue-400 to-indigo-500",
];

const initialsOf = (name = "") =>
  name
    .replace(/^dr\.?\s+/i, "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0].toUpperCase())
    .join("") || "?";

// same name always gets the same color
const gradientFor = (name = "") => {
  const hash = [...name].reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return GRADIENTS[hash % GRADIENTS.length];
};

// shows the photo, or colorful initials when there is no photo or it fails to load
function Avatar({ src, name, className, textClassName }) {
  const [failed, setFailed] = useState(false);

  if (src && !failed) {
    return (
      <img
        src={src}
        alt={name || ""}
        onError={() => setFailed(true)}
        className={cn("h-12 w-12 shrink-0 rounded-full object-cover", className)}
      />
    );
  }

  return (
    <div
      aria-label={name}
      className={cn(
        "grid h-12 w-12 shrink-0 place-items-center rounded-full bg-gradient-to-br font-bold text-white",
        gradientFor(name),
        className
      )}
    >
      <span className={cn("text-sm", textClassName)}>{initialsOf(name)}</span>
    </div>
  );
}

export default Avatar;
