import { useEffect, useState } from "react";
import { Lightbulb, X } from "lucide-react";

const key = (id: string) => `pvault_hint_${id}`;

/**
 * A one-time tip shown the first time someone lands on a page.
 * Dismissed forever once closed, so the app never nags.
 */
export function PageHint({ id, children }: { id: string; children: React.ReactNode }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    try {
      setShow(localStorage.getItem(key(id)) !== "1");
    } catch {
      setShow(false);
    }
  }, [id]);

  if (!show) return null;

  const dismiss = () => {
    try {
      localStorage.setItem(key(id), "1");
    } catch {
      /* storage unavailable */
    }
    setShow(false);
  };

  return (
    <div className="mb-4 flex items-start gap-2.5 rounded-lg border border-border bg-secondary/60 px-3 py-2.5">
      <Lightbulb className="h-4 w-4 shrink-0 text-primary mt-0.5" />
      <p className="flex-1 text-xs leading-relaxed text-muted-foreground">{children}</p>
      <button
        onClick={dismiss}
        aria-label="Dismiss tip"
        className="shrink-0 text-muted-foreground transition-colors hover:text-foreground"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
