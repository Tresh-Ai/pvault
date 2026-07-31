import { useEffect, useLayoutEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

const TOUR_KEY = "pvault_tour_completed_v1";

interface Step {
  selector: string;
  title: string;
  body: string;
}

const STEPS: Step[] = [
  {
    selector: '[data-tour="projects-heading"]',
    title: "Projects are your vaults",
    body: "Each project keeps its prompts, tools and workflows together in one place.",
  },
  {
    selector: '[data-tour="search"]',
    title: "Find anything fast",
    body: "Search by name, description or tag — instantly, fully offline.",
  },
  {
    selector: '[data-tour="fab"]',
    title: "Create a project",
    body: "Tap here to start a new vault. Inside it you'll get Prompts, Tools and Flows tabs.",
  },
  {
    selector: '[data-tour="settings"]',
    title: "Settings & changelog",
    body: "Theme, autosave frequency, backups and the changelog all live here.",
  },
];

export function hasSeenTour() {
  return localStorage.getItem(TOUR_KEY) === "1";
}

interface Rect { top: number; left: number; width: number; height: number }

export function ProductTour({ onFinish }: { onFinish?: () => void }) {
  const [i, setI] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);
  const [done, setDone] = useState(false);

  const step = STEPS[i];

  const measure = () => {
    const el = document.querySelector(step?.selector || "") as HTMLElement | null;
    if (!el) return setRect(null);
    const r = el.getBoundingClientRect();
    setRect({ top: r.top, left: r.left, width: r.width, height: r.height });
  };

  useLayoutEffect(() => {
    measure();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [i]);

  useEffect(() => {
    const onResize = () => measure();
    window.addEventListener("resize", onResize);
    window.addEventListener("scroll", onResize, true);
    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onResize, true);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [i]);

  const finish = () => {
    localStorage.setItem(TOUR_KEY, "1");
    setDone(true);
    onFinish?.();
  };

  if (done || !step) return null;

  const pad = 8;
  const spotlight = rect
    ? {
        top: rect.top - pad,
        left: rect.left - pad,
        width: rect.width + pad * 2,
        height: rect.height + pad * 2,
      }
    : null;

  // Place the card below the target when there's room, otherwise above.
  const placeBelow = spotlight ? spotlight.top + spotlight.height + 180 < window.innerHeight : true;
  const cardTop = spotlight
    ? placeBelow
      ? spotlight.top + spotlight.height + 14
      : Math.max(12, spotlight.top - 14 - 170)
    : window.innerHeight / 2 - 85;

  return (
    <div className="fixed inset-0 z-[100]" role="dialog" aria-label="Product tour">
      {/* Dim + spotlight cutout */}
      <div
        className="absolute inset-0 bg-foreground/60 transition-all duration-300"
        style={
          spotlight
            ? {
                clipPath: `polygon(0 0, 100% 0, 100% 100%, 0 100%, 0 0, ${spotlight.left}px ${spotlight.top}px, ${spotlight.left}px ${spotlight.top + spotlight.height}px, ${spotlight.left + spotlight.width}px ${spotlight.top + spotlight.height}px, ${spotlight.left + spotlight.width}px ${spotlight.top}px, ${spotlight.left}px ${spotlight.top}px)`,
              }
            : undefined
        }
        onClick={finish}
      />

      {spotlight && (
        <div
          className="absolute rounded-2xl border-2 border-primary pointer-events-none transition-all duration-300"
          style={spotlight}
        />
      )}

      {/* Callout card with arrow */}
      <div
        className="absolute left-1/2 -translate-x-1/2 w-[min(340px,calc(100vw-32px))] transition-all duration-300"
        style={{ top: cardTop }}
      >
        <div className="relative rounded-2xl bg-background border border-border shadow-xl p-4">
          {/* arrow */}
          <span
            className={cn(
              "absolute left-1/2 -translate-x-1/2 w-3 h-3 rotate-45 bg-background border-border",
              placeBelow ? "-top-1.5 border-l border-t" : "-bottom-1.5 border-r border-b"
            )}
          />
          <div className="flex items-start justify-between gap-2 mb-1.5">
            <p className="text-[10px] font-medium tracking-widest uppercase text-muted-foreground">
              {i + 1} / {STEPS.length}
            </p>
            <button
              onClick={finish}
              aria-label="Skip tour"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <h3 className="text-base font-semibold tracking-tight mb-1">{step.title}</h3>
          <p className="text-sm text-muted-foreground leading-relaxed mb-4">{step.body}</p>
          <div className="flex items-center gap-2">
            {i > 0 && (
              <Button variant="outline" size="sm" className="rounded-full" onClick={() => setI(i - 1)}>
                Back
              </Button>
            )}
            <Button
              size="sm"
              className="rounded-full flex-1"
              onClick={() => (i === STEPS.length - 1 ? finish() : setI(i + 1))}
            >
              {i === STEPS.length - 1 ? "Got it" : "Next"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
