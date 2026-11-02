import { cn } from "@/lib/utils";

// themed loading spinner, inherits the text color (text-primary by default)
function Spinner({ className }) {
  return (
    <span
      role="status"
      aria-label="Loading"
      className={cn(
        "inline-block h-5 w-5 animate-spin rounded-full border-2 border-current border-r-transparent text-primary",
        className
      )}
    />
  );
}

export default Spinner;
